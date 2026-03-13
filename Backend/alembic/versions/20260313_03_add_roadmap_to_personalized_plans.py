"""add roadmap to personalized plans

Revision ID: 20260313_03
Revises: 20260313_02
Create Date: 2026-03-13 00:15:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260313_03"
down_revision = "20260313_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "personalized_plans",
        sa.Column("roadmap", sa.Text(), nullable=False, server_default="[]"),
    )


def downgrade() -> None:
    op.drop_column("personalized_plans", "roadmap")
