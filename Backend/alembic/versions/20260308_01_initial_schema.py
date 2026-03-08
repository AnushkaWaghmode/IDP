"""initial schema

Revision ID: 20260308_01
Revises:
Create Date: 2026-03-08 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260308_01"
down_revision = None
branch_labels = None
depends_on = None


user_role_enum = sa.Enum("student", "employee", name="userrole")
aspiring_role_enum = sa.Enum("developer", "manager", "data_scientist", name="aspiringrole")


def upgrade() -> None:
    bind = op.get_bind()
    user_role_enum.create(bind, checkfirst=True)
    aspiring_role_enum.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", user_role_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "user_profiles",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("current_role", sa.String(), nullable=True),
        sa.Column("aspiring_role", aspiring_role_enum, nullable=False),
        sa.Column("academic_details", sa.Text(), nullable=False),
    )
    op.create_index("ix_user_profiles_id", "user_profiles", ["id"], unique=False)

    op.create_table(
        "user_intakes",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("education_level", sa.String(), nullable=False),
        sa.Column("institution", sa.String(), nullable=False),
        sa.Column("graduation_year", sa.String(), nullable=False),
        sa.Column("target_role", sa.String(), nullable=False),
        sa.Column("preferred_language", sa.String(), nullable=False),
        sa.Column("weekly_hours", sa.Integer(), nullable=False),
        sa.Column("experience_years", sa.Float(), nullable=False, server_default="0"),
        sa.Column("technical_skills", sa.Text(), nullable=False),
        sa.Column("resume_filename", sa.String(), nullable=True),
        sa.Column("resume_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_user_intakes_id", "user_intakes", ["id"], unique=False)

    op.create_table(
        "assessments",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("missing_skills", sa.Text(), nullable=False),
        sa.Column("strong_skills", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_assessments_id", "assessments", ["id"], unique=False)

    op.create_table(
        "assessment_details",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("assessment_id", sa.Integer(), sa.ForeignKey("assessments.id"), nullable=False),
        sa.Column("category_scores", sa.Text(), nullable=False),
        sa.Column("language_scores", sa.Text(), nullable=False),
        sa.Column("tech_scores", sa.Text(), nullable=False),
        sa.Column("timeline", sa.Text(), nullable=False),
    )
    op.create_index("ix_assessment_details_id", "assessment_details", ["id"], unique=False)

    op.create_table(
        "personalized_plans",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("assessment_id", sa.Integer(), sa.ForeignKey("assessments.id"), nullable=False),
        sa.Column("recommended_courses", sa.Text(), nullable=False),
        sa.Column("learning_areas", sa.Text(), nullable=False),
        sa.Column("report", sa.Text(), nullable=False),
    )
    op.create_index("ix_personalized_plans_id", "personalized_plans", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_personalized_plans_id", table_name="personalized_plans")
    op.drop_table("personalized_plans")

    op.drop_index("ix_assessment_details_id", table_name="assessment_details")
    op.drop_table("assessment_details")

    op.drop_index("ix_assessments_id", table_name="assessments")
    op.drop_table("assessments")

    op.drop_index("ix_user_intakes_id", table_name="user_intakes")
    op.drop_table("user_intakes")

    op.drop_index("ix_user_profiles_id", table_name="user_profiles")
    op.drop_table("user_profiles")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    aspiring_role_enum.drop(bind, checkfirst=True)
    user_role_enum.drop(bind, checkfirst=True)
