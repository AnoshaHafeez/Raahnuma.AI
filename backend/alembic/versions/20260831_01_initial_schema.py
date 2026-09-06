"""Initial schema: users, destinations, vendors, trips, and related tables.

Revision ID: 20260831_01
Revises:
Create Date: 2026-08-31
"""

from alembic import op
import sqlalchemy as sa


revision = "20260831_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(length=320), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("preferred_language", sa.String(length=8), nullable=False, server_default="en"),
        sa.Column("experience_level", sa.String(length=16), nullable=False, server_default="beginner"),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "destinations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("known_hazards", sa.Text(), nullable=False, server_default=""),
    )

    op.create_table(
        "vendors",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("destination_id", sa.Integer(), sa.ForeignKey("destinations.id"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("type", sa.String(length=30), nullable=False),
        sa.Column("contact_phone", sa.String(length=30), nullable=False, server_default=""),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("last_verified_on", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_vendors_destination_id", "vendors", ["destination_id"])

    op.create_table(
        "trips",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("destination_id", sa.Integer(), sa.ForeignKey("destinations.id"), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("traveler_profile", sa.JSON(), nullable=False),
        sa.Column("language", sa.String(length=5), nullable=False, server_default="en"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_trips_user_id", "trips", ["user_id"])
    op.create_index("ix_trips_destination_id", "trips", ["destination_id"])

    op.create_table(
        "advisories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("trip_id", sa.Integer(), sa.ForeignKey("trips.id"), nullable=False),
        sa.Column("packing_list", sa.JSON(), nullable=False),
        sa.Column("gear_checklist", sa.JSON(), nullable=False),
        sa.Column("safety_advisory_text", sa.Text(), nullable=False, server_default=""),
        sa.Column("safety_advisory_text_ur", sa.Text(), nullable=False, server_default=""),
        sa.Column("confidence", sa.String(length=10), nullable=False, server_default="low"),
        sa.Column("source_weather_snapshot", sa.JSON(), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_advisories_trip_id", "advisories", ["trip_id"])

    op.create_table(
        "emergency_contacts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("phone_number", sa.String(length=30), nullable=False),
    )
    op.create_index("ix_emergency_contacts_user_id", "emergency_contacts", ["user_id"])

    op.create_table(
        "sos_events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("trip_id", sa.Integer(), sa.ForeignKey("trips.id"), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_sos_events_user_id", "sos_events", ["user_id"])

    # place_id is added later by 20260902_01_places_checklist.py, once the
    # "places" table exists.
    op.create_table(
        "trail_reports",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("destination_id", sa.Integer(), sa.ForeignKey("destinations.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("report_text", sa.Text(), nullable=False),
        sa.Column("condition", sa.String(length=20), nullable=False, server_default="clear"),
        sa.Column("upvote_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_trail_reports_destination_id", "trail_reports", ["destination_id"])
    op.create_index("ix_trail_reports_user_id", "trail_reports", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_trail_reports_user_id", table_name="trail_reports")
    op.drop_index("ix_trail_reports_destination_id", table_name="trail_reports")
    op.drop_table("trail_reports")

    op.drop_index("ix_sos_events_user_id", table_name="sos_events")
    op.drop_table("sos_events")

    op.drop_index("ix_emergency_contacts_user_id", table_name="emergency_contacts")
    op.drop_table("emergency_contacts")

    op.drop_index("ix_advisories_trip_id", table_name="advisories")
    op.drop_table("advisories")

    op.drop_index("ix_trips_destination_id", table_name="trips")
    op.drop_index("ix_trips_user_id", table_name="trips")
    op.drop_table("trips")

    op.drop_index("ix_vendors_destination_id", table_name="vendors")
    op.drop_table("vendors")

    op.drop_table("destinations")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
