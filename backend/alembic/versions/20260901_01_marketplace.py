"""Add attractions, product listings, and COD orders.

Revision ID: 20260901_01
Revises:
Create Date: 2026-09-01
"""

from alembic import op
import sqlalchemy as sa


revision = "20260901_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "places",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("destination_id", sa.Integer(), sa.ForeignKey("destinations.id"), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("activity_tags", sa.JSON(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("community_rating", sa.Float(), nullable=True),
        sa.Column("review_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("community_review", sa.Text(), nullable=False, server_default=""),
        sa.Column("image_url", sa.String(length=1000), nullable=False, server_default=""),
    )
    op.create_index("ix_places_destination_id", "places", ["destination_id"])
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("vendor_id", sa.Integer(), sa.ForeignKey("vendors.id"), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("rent_price_per_day", sa.Integer(), nullable=False),
        sa.Column("buy_price", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("image_url", sa.String(length=1000), nullable=False, server_default=""),
        sa.Column("use_tags", sa.JSON(), nullable=False),
        sa.Column("stock_quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_products_vendor_id", "products", ["vendor_id"])
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("trip_id", sa.Integer(), sa.ForeignKey("trips.id"), nullable=True),
        sa.Column("recipient_name", sa.String(length=160), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=False),
        sa.Column("delivery_address", sa.Text(), nullable=False),
        sa.Column("payment_method", sa.String(length=30), nullable=False, server_default="cod"),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="placed"),
        sa.Column("total_amount", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"])
    op.create_index("ix_orders_trip_id", "orders", ["trip_id"])
    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("product_name", sa.String(length=160), nullable=False),
        sa.Column("mode", sa.String(length=10), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("rental_days", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("unit_price", sa.Integer(), nullable=False),
        sa.Column("line_total", sa.Integer(), nullable=False),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])


def downgrade() -> None:
    op.drop_index("ix_order_items_order_id", table_name="order_items")
    op.drop_table("order_items")
    op.drop_index("ix_orders_trip_id", table_name="orders")
    op.drop_index("ix_orders_user_id", table_name="orders")
    op.drop_table("orders")
    op.drop_index("ix_products_vendor_id", table_name="products")
    op.drop_table("products")
    op.drop_index("ix_places_destination_id", table_name="places")
    op.drop_table("places")
