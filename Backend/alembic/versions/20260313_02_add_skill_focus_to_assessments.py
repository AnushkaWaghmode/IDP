"""add skill focus column to assessments

Revision ID: 20260313_02
Revises: 20260308_01
Create Date: 2026-03-13 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260313_02"
down_revision = "20260308_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "assessments",
        sa.Column("skill_focus", sa.String(), nullable=False, server_default="overall"),
    )
    op.create_index("ix_assessments_skill_focus", "assessments", ["skill_focus"])


def downgrade() -> None:
    op.drop_index("ix_assessments_skill_focus", table_name="assessments")
    op.drop_column("assessments", "skill_focus")
