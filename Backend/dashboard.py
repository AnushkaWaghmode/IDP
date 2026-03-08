import json

from fastapi import APIRouter, Depends, HTTPException
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
        "scorecard": assessment.score,
        "missing_skills": json.loads(assessment.missing_skills),
        "strong_skills": json.loads(assessment.strong_skills),
        "category_scores": json.loads(detail.category_scores),
        "language_scores": json.loads(detail.language_scores),
        "tech_scores": json.loads(detail.tech_scores),
        "timeline": json.loads(detail.timeline),
        "recommended_courses": json.loads(plan.recommended_courses),
        "learning_areas": json.loads(plan.learning_areas),
        "report": plan.report,
    }


@router.get("/latest")
def latest_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    latest = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(Assessment.created_at.desc())
        .first()
    )
    if latest is None:
        raise HTTPException(status_code=404, detail="No assessments found")
    return get_report(latest.id, current_user, db)

