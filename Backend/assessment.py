import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from gemini_service import build_assessment_questions, generate_plan_and_courses
from models import Assessment, AssessmentDetail, PersonalizedPlan, User, UserIntake

router = APIRouter()
assessment_sessions: dict[tuple[int, str], list[dict]] = {}


class AssessmentCreate(BaseModel):
    responses: dict[str, str]
    skill: str | None = None


def _latest_intake(db: Session, user_id: int) -> UserIntake:
    intake = (
        db.query(UserIntake)
        .filter(UserIntake.user_id == user_id)
        .order_by(UserIntake.created_at.desc())
        .first()
    )
    if intake is None:
        raise HTTPException(status_code=400, detail="Complete profile intake before starting assessment")
    return intake


@router.get("/questions")
def get_questions(
    skill: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    intake = _latest_intake(db, current_user.id)
    skills = json.loads(intake.technical_skills)

    questions = build_assessment_questions(
        role=current_user.role.value,
        target_role=intake.target_role,
        preferred_language=intake.preferred_language,
        technical_skills=skills,
        skill_focus=skill,
    )
    session_key = (current_user.id, (skill or "overall").lower())
    assessment_sessions[session_key] = questions
    return {"questions": questions}


@router.post("/submit")
def submit_assessment(
    assessment_data: AssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    responses = assessment_data.responses
    skill_focus = (assessment_data.skill or "overall").strip() or "overall"
    if not responses:
        raise HTTPException(status_code=400, detail="No responses received")

    intake = _latest_intake(db, current_user.id)

    session_key = (current_user.id, skill_focus.lower())
    quiz_questions = assessment_sessions.pop(session_key, [])
    answer_lookup = {q["id"]: q for q in quiz_questions}

    categories: dict[str, dict[str, int]] = {}
    missing_skills: list[str] = []
    strong_skills: list[str] = []
    total_correct = 0

    for question_id, selected in responses.items():
        q = answer_lookup.get(question_id)
        category = question_id.split("__", 1)[0] if "__" in question_id else "technology"
        cat_entry = categories.setdefault(category, {"correct": 0, "total": 0})
        cat_entry["total"] += 1

        correct_option = (q or {}).get("correct_option")
        is_correct = bool(correct_option) and (selected or "").strip() == correct_option
        if is_correct:
            cat_entry["correct"] += 1
            total_correct += 1
            strong_skills.append((q or {}).get("text", question_id))
        else:
            missing_skills.append((q or {}).get("text", question_id))

    total_questions = sum(v["total"] for v in categories.values()) or 1
    overall_score = round((total_correct / total_questions) * 100, 2)

    category_scores = {
        key: round((entry["correct"] / entry["total"]) * 100, 2) if entry["total"] else 0
        for key, entry in categories.items()
    }

    language_scores = {
        intake.preferred_language.lower(): category_scores.get("language", 0),
        "communication": max(0, round((category_scores.get("role_specific", 0) + category_scores.get("problem_solving", 0)) / 2, 2)),
    }

    if skill_focus and skill_focus != "overall":
        tech_scores = {skill_focus: category_scores.get("technology", overall_score)}
    else:
        tech_scores = {
            skill: max(0, round(category_scores.get("technology", 0) - (idx * 2), 2))
            for idx, skill in enumerate(json.loads(intake.technical_skills)[:5])
        }

    timing_score = min(100, round((intake.weekly_hours / 15) * 100, 2))
    category_scores["timing"] = timing_score

    plan_data = generate_plan_and_courses(
        role=current_user.role.value,
        target_role=intake.target_role,
        overall_score=overall_score,
        category_scores=category_scores,
        missing_skills=missing_skills,
        preferred_language=intake.preferred_language,
        weekly_hours=intake.weekly_hours,
        skill_focus=skill_focus,
    )

    db_assessment = Assessment(
        user_id=current_user.id,
        skill_focus=skill_focus.lower(),
        score=overall_score,
        missing_skills=json.dumps(missing_skills),
        strong_skills=json.dumps(strong_skills),
    )
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)

    detail = AssessmentDetail(
        assessment_id=db_assessment.id,
        category_scores=json.dumps(category_scores),
        language_scores=json.dumps(language_scores),
        tech_scores=json.dumps(tech_scores),
        timeline=json.dumps(plan_data.get("timeline", [])),
    )
    db.add(detail)

    plan = PersonalizedPlan(
        assessment_id=db_assessment.id,
        recommended_courses=json.dumps(plan_data.get("recommended_courses", [])),
        learning_areas=json.dumps(plan_data.get("learning_areas", [])),
        roadmap=json.dumps(plan_data.get("roadmap", [])),
        report=plan_data.get("report_summary", "Personalized plan generated."),
    )
    db.add(plan)

    db.commit()

    return {
        "assessment_id": db_assessment.id,
        "score": db_assessment.score,
        "category_scores": category_scores,
        "report": plan.report,
    }

