"""Add status column to trips (for cancel-trip support).

Revision ID: 20260906_01
Revises: 20260902_01
Create Date: 2026-09-06
"""

from alembic import op
import sqlalchemy as sa


revision = "20260906_01"
down_revision = "20260902_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "trips",
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
    )


def downgrade() -> None:
    op.drop_column("trips", "status")
