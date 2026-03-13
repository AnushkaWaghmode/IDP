import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Assessment, AssessmentDetail, PersonalizedPlan, User

router = APIRouter()


@router.get("/assessments")
def get_assessments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assessments = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(Assessment.created_at.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "skill_focus": item.skill_focus,
            "score": item.score,
            "missing_skills": json.loads(item.missing_skills),
            "strong_skills": json.loads(item.strong_skills),
            "created_at": item.created_at.isoformat(),
        }
        for item in assessments
    ]


@router.get("/report/{assessment_id}")
def get_report(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessment = (
        db.query(Assessment)
        .filter(Assessment.id == assessment_id, Assessment.user_id == current_user.id)
        .first()
    )
    if assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")

    detail = db.query(AssessmentDetail).filter(AssessmentDetail.assessment_id == assessment.id).first()
    plan = db.query(PersonalizedPlan).filter(PersonalizedPlan.assessment_id == assessment.id).first()

    if detail is None or plan is None:
        raise HTTPException(status_code=404, detail="Assessment analytics not found")

    return {
        "assessment_id": assessment.id,
        "skill_focus": assessment.skill_focus,
        "scorecard": assessment.score,
        "missing_skills": json.loads(assessment.missing_skills),
        "strong_skills": json.loads(assessment.strong_skills),
        "category_scores": json.loads(detail.category_scores),
        "language_scores": json.loads(detail.language_scores),
        "tech_scores": json.loads(detail.tech_scores),
        "timeline": json.loads(detail.timeline),
        "recommended_courses": json.loads(plan.recommended_courses),
        "learning_areas": json.loads(plan.learning_areas),
        "roadmap": json.loads(plan.roadmap),
        "report": plan.report,
    }


@router.get("/latest")
def latest_report(
    skill: str | None = Query(None, description="Skill-focused assessment to surface"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Assessment).filter(Assessment.user_id == current_user.id)
    if skill:
        query = query.filter(Assessment.skill_focus == skill.lower())
    latest = query.order_by(Assessment.created_at.desc()).first()
    if latest is None:
        raise HTTPException(status_code=404, detail="No assessments found")
    return get_report(latest.id, current_user, db)


@router.get("/learning-paths")
def learning_paths(
    skill: str | None = Query(None, description="Skill to tailor the learning path"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Assessment).filter(Assessment.user_id == current_user.id)
    if skill:
        query = query.filter(Assessment.skill_focus == skill.lower())
    latest = query.order_by(Assessment.created_at.desc()).first()
    if latest is None:
        raise HTTPException(status_code=404, detail="No assessments found")

    detail = db.query(AssessmentDetail).filter(AssessmentDetail.assessment_id == latest.id).first()
    plan = db.query(PersonalizedPlan).filter(PersonalizedPlan.assessment_id == latest.id).first()
    if detail is None or plan is None:
        raise HTTPException(status_code=404, detail="Assessment analytics not found")

    missing_skills = json.loads(latest.missing_skills)
    learning_areas = json.loads(plan.learning_areas)

    # Curated quick resources by common skills.
    youtube_map = {
        "react": "https://www.youtube.com/watch?v=bMknfKXIFA8",
        "fastapi": "https://www.youtube.com/watch?v=7t2alSnE2-I",
        "sql": "https://www.youtube.com/watch?v=HXV3zeQKqGY",
        "python": "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
        "data structures": "https://www.youtube.com/watch?v=8hly31xKli0",
    }

    def map_resources(skill_name: str) -> list[dict[str, str]]:
        lower = skill_name.lower()
        resources: list[dict[str, str]] = []
        for key, url in youtube_map.items():
            if key in lower:
                resources.append(
                    {"title": f"{skill_name.title()} deep-dive", "type": "video", "provider": "YouTube", "url": url}
                )
        resources.append(
            {
                "title": f"{skill_name.title()} Essentials Course",
                "type": "course",
                "provider": "Coursera",
                "url": "https://www.coursera.org",
            }
        )
        return resources

    skill_paths = []
    target_skills = missing_skills or learning_areas
    for skill_name in target_skills:
        skill_paths.append(
            {
                "skill": skill_name,
                "resources": map_resources(skill_name),
            }
        )

    return {
        "skill_focus": skill or latest.skill_focus,
        "timeline": json.loads(detail.timeline),
        "learning_areas": learning_areas,
        "recommended_courses": json.loads(plan.recommended_courses),
        "skill_paths": skill_paths,
        "roadmap": json.loads(plan.roadmap),
    }

