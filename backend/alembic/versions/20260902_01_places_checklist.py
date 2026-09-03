"""Add place popularity ranking, per-trip place checklist, and place-scoped trail reports.

Revision ID: 20260902_01
Revises: 20260901_01
Create Date: 2026-09-02
"""

from alembic import op
import sqlalchemy as sa


revision = "20260902_01"
down_revision = "20260901_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("places", sa.Column("popularity_rank", sa.Integer(), nullable=True))

    op.add_column("trail_reports", sa.Column("place_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_trail_reports_place_id", "trail_reports", "places", ["place_id"], ["id"]
    )
    op.create_index("ix_trail_reports_place_id", "trail_reports", ["place_id"])

    op.create_table(
        "trip_places",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("trip_id", sa.Integer(), sa.ForeignKey("trips.id"), nullable=False),
        sa.Column("place_id", sa.Integer(), sa.ForeignKey("places.id"), nullable=False),
        sa.Column("visited", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("visited_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("trip_id", "place_id", name="uq_trip_places_trip_place"),
    )
    op.create_index("ix_trip_places_trip_id", "trip_places", ["trip_id"])
    op.create_index("ix_trip_places_place_id", "trip_places", ["place_id"])


def downgrade() -> None:
    op.drop_index("ix_trip_places_place_id", table_name="trip_places")
    op.drop_index("ix_trip_places_trip_id", table_name="trip_places")
    op.drop_table("trip_places")

    op.drop_index("ix_trail_reports_place_id", table_name="trail_reports")
    op.drop_constraint("fk_trail_reports_place_id", "trail_reports", type_="foreignkey")
    op.drop_column("trail_reports", "place_id")

    op.drop_column("places", "popularity_rank")
