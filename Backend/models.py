from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base


class UserRole(str, enum.Enum):
    STUDENT = "student"
    EMPLOYEE = "employee"


class AspiringRole(str, enum.Enum):
    DEVELOPER = "developer"
    MANAGER = "manager"
    DATA_SCIENTIST = "data_scientist"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    assessments = relationship("Assessment", back_populates="user")
    intake_entries = relationship("UserIntake", back_populates="user")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    current_role = Column(String, nullable=True)
    aspiring_role = Column(Enum(AspiringRole), nullable=False)
    academic_details = Column(Text, nullable=False)

    user = relationship("User", back_populates="profile")


class UserIntake(Base):
    __tablename__ = "user_intakes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    full_name = Column(String, nullable=False)
    education_level = Column(String, nullable=False)
    institution = Column(String, nullable=False)
    graduation_year = Column(String, nullable=False)
    target_role = Column(String, nullable=False)
    preferred_language = Column(String, nullable=False)
    weekly_hours = Column(Integer, nullable=False)
    experience_years = Column(Float, nullable=False, default=0)
    technical_skills = Column(Text, nullable=False)
    resume_filename = Column(String, nullable=True)
    resume_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="intake_entries")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Float, nullable=False)
    missing_skills = Column(Text, nullable=False)
    strong_skills = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="assessments")
    plan = relationship("PersonalizedPlan", back_populates="assessment", uselist=False)
    detail = relationship("AssessmentDetail", back_populates="assessment", uselist=False)


class AssessmentDetail(Base):
    __tablename__ = "assessment_details"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    category_scores = Column(Text, nullable=False)
    language_scores = Column(Text, nullable=False)
    tech_scores = Column(Text, nullable=False)
    timeline = Column(Text, nullable=False)

    assessment = relationship("Assessment", back_populates="detail")


class PersonalizedPlan(Base):
    __tablename__ = "personalized_plans"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    recommended_courses = Column(Text, nullable=False)
    learning_areas = Column(Text, nullable=False)
    report = Column(Text, nullable=False)

    assessment = relationship("Assessment", back_populates="plan")

