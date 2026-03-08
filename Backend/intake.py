import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, UserIntake

router = APIRouter()


def _parse_resume_file(upload: UploadFile | None) -> tuple[str | None, str | None]:
    if upload is None:
        return None, None

    filename = upload.filename or "resume"
    ext = Path(filename).suffix.lower()
    content = upload.file.read()

    if not content:
        return filename, None

    if ext in {".txt", ".md", ".rtf"}:
        return filename, content.decode("utf-8", errors="ignore")

    if ext == ".pdf":
        try:
            from pypdf import PdfReader
            import io

            reader = PdfReader(io.BytesIO(content))
            text = "\n".join((page.extract_text() or "") for page in reader.pages)
            return filename, text.strip() or None
        except Exception:
            return filename, None

    if ext == ".docx":
        try:
            import docx
            import io

            doc = docx.Document(io.BytesIO(content))
            text = "\n".join(p.text for p in doc.paragraphs)
            return filename, text.strip() or None
        except Exception:
            return filename, None

    return filename, None


@router.post("/submit")
def submit_intake(
    full_name: str = Form(...),
    education_level: str = Form(...),
    institution: str = Form(...),
    graduation_year: str = Form(...),
    target_role: str = Form(...),
    preferred_language: str = Form(...),
    weekly_hours: int = Form(...),
    experience_years: float = Form(0),
    technical_skills: str = Form(...),
    resume: UploadFile | None = File(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if weekly_hours < 1 or weekly_hours > 80:
        raise HTTPException(status_code=400, detail="weekly_hours must be between 1 and 80")

    skills = [s.strip() for s in technical_skills.split(",") if s.strip()]
    if not skills:
        raise HTTPException(status_code=400, detail="Please provide at least one technical skill")

    resume_filename, resume_text = _parse_resume_file(resume)

    intake = UserIntake(
        user_id=current_user.id,
        full_name=full_name.strip(),
        education_level=education_level.strip(),
        institution=institution.strip(),
        graduation_year=graduation_year.strip(),
        target_role=target_role.strip().lower(),
        preferred_language=preferred_language.strip(),
        weekly_hours=weekly_hours,
        experience_years=experience_years,
        technical_skills=json.dumps(skills),
        resume_filename=resume_filename,
        resume_text=resume_text,
    )
    db.add(intake)
    db.commit()
    db.refresh(intake)

    return {
        "id": intake.id,
        "target_role": intake.target_role,
        "technical_skills": skills,
        "resume_uploaded": bool(resume_filename),
    }


@router.get("/latest")
def get_latest_intake(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    intake = (
        db.query(UserIntake)
        .filter(UserIntake.user_id == current_user.id)
        .order_by(UserIntake.created_at.desc())
        .first()
    )
    if intake is None:
        raise HTTPException(status_code=404, detail="Intake not found")

    return {
        "id": intake.id,
        "full_name": intake.full_name,
        "education_level": intake.education_level,
        "institution": intake.institution,
        "graduation_year": intake.graduation_year,
        "target_role": intake.target_role,
        "preferred_language": intake.preferred_language,
        "weekly_hours": intake.weekly_hours,
        "experience_years": intake.experience_years,
        "technical_skills": json.loads(intake.technical_skills),
        "resume_filename": intake.resume_filename,
    }

