from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict

import google.generativeai as genai
import os
from dotenv import load_dotenv

from database import get_db
from models import Assessment, PersonalizedPlan, User
from auth import get_current_user

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

router = APIRouter()

class AssessmentCreate(BaseModel):
    responses: Dict[str, str]  # e.g., {"skill1": "beginner", ...} based on role-specific questions

@router.post("/assessment")
def submit_assessment(assessment_data: AssessmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Simple scoring logic (extend with role-specific weights)
    score = sum(1 for v in assessment_data.responses.values() if v != "none") / len(assessment_data.responses) * 100
    
    missing_skills = [k for k, v in assessment_data.responses.items() if v == "none"]
    strong_skills = [k for k, v in assessment_data.responses.items() if v == "advanced"]
    
    db_assessment = Assessment(
        user_id=current_user.id,
        score=score,
        missing_skills=str(missing_skills),
        strong_skills=str(strong_skills)
    )
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)
    
    # Generate personalized plan with Gemini
    prompt = f"""
    User role: {current_user.role.value}, Aspiring role: {current_user.profile.aspiring_role.value if current_user.profile else 'N/A'}
    Score: {score}, Missing skills: {missing_skills}, Strong skills: {strong_skills}
    Generate a personalized development plan: Recommend 3-5 courses, learning areas, and a report summary.
    Output as JSON: {{"recommended_courses": [...], "learning_areas": [...], "report": "summary text"}}
    """
    response = model.generate_content(prompt)
    plan_data = eval(response.text)  # Parse JSON; use json.loads in prod
    
    db_plan = PersonalizedPlan(
        assessment_id=db_assessment.id,
        recommended_courses=str(plan_data.get("recommended_courses", [])),
        learning_areas=str(plan_data.get("learning_areas", [])),
        report=plan_data.get("report", "")
    )
    db.add(db_plan)
    db.commit()
    return {"assessment_id": db_assessment.id, "plan": db_plan}