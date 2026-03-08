import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from gemini_service import build_assessment_questions, generate_plan_and_courses
from models import Assessment, AssessmentDetail, PersonalizedPlan, User, UserIntake

router = APIRouter()


class AssessmentCreate(BaseModel):
    responses: dict[str, str]


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
def get_questions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    intake = _latest_intake(db, current_user.id)
    skills = json.loads(intake.technical_skills)

    questions = build_assessment_questions(
        role=current_user.role.value,
        target_role=intake.target_role,
        preferred_language=intake.preferred_language,
        technical_skills=skills,
    )
    return {"questions": questions}


@router.post("/submit")
def submit_assessment(
    assessment_data: AssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    responses = assessment_data.responses
    if not responses:
        raise HTTPException(status_code=400, detail="No responses received")

    intake = _latest_intake(db, current_user.id)

    weights = {"none": 0, "beginner": 1, "intermediate": 2, "advanced": 3}
    categories: dict[str, list[int]] = {"language": [], "technology": [], "problem_solving": [], "role_specific": []}

    missing_skills: list[str] = []
    strong_skills: list[str] = []

    for question_id, level in responses.items():
        score = weights.get(level, 0)
        category = question_id.split("__", 1)[0] if "__" in question_id else "technology"
        categories.setdefault(category, []).append(score)

        skill_slug = question_id.split("__", 1)[-1].replace("_", " ")
        if level == "none":
            missing_skills.append(skill_slug)
        elif level == "advanced":
            strong_skills.append(skill_slug)

    total_points = sum(sum(values) for values in categories.values())
    total_possible = sum(len(values) for values in categories.values()) * 3
    overall_score = round((total_points / total_possible) * 100, 2) if total_possible else 0

    category_scores = {
        key: round((sum(values) / (len(values) * 3)) * 100, 2) if values else 0
        for key, values in categories.items()
    }

    language_scores = {
        intake.preferred_language.lower(): category_scores.get("language", 0),
        "communication": max(0, round((category_scores.get("role_specific", 0) + category_scores.get("problem_solving", 0)) / 2, 2)),
    }

    tech_scores = {
        skill: max(0, round(category_scores.get("technology", 0) - (idx * 3), 2))
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
    )

    db_assessment = Assessment(
        user_id=current_user.id,
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

