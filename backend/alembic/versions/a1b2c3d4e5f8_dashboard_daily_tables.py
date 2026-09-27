"""Dedicated business/product dashboard day tables (no tax).

Revision ID: a1b2c3d4e5f8
Revises: e5f6a7b8c9d0
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f8"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "business_dashboard_days",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("business_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("day", sa.DateTime(timezone=True), nullable=False),
        sa.Column("orders_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("product_sales", sa.Float(), server_default="0", nullable=False),
        sa.Column("service_revenue", sa.Float(), server_default="0", nullable=False),
        sa.Column("discounts_granted", sa.Float(), server_default="0", nullable=False),
        sa.Column("cogs", sa.Float(), server_default="0", nullable=False),
        sa.Column("product_profit", sa.Float(), server_default="0", nullable=False),
        sa.Column("gross_profit", sa.Float(), server_default="0", nullable=False),
        sa.Column("amount_collected", sa.Float(), server_default="0", nullable=False),
        sa.Column("cash_collected", sa.Float(), server_default="0", nullable=False),
        sa.Column("mpesa_collected", sa.Float(), server_default="0", nullable=False),
        sa.Column("card_collected", sa.Float(), server_default="0", nullable=False),
        sa.Column("other_collected", sa.Float(), server_default="0", nullable=False),
        sa.Column("missing_cost_line_count", sa.Integer(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "day", name="uq_business_dashboard_day"),
    )
    op.create_index("ix_business_dashboard_days_business_id", "business_dashboard_days", ["business_id"])
    op.create_index("ix_business_dashboard_days_day", "business_dashboard_days", ["day"])
    op.create_index("ix_business_dashboard_days_organization_id", "business_dashboard_days", ["organization_id"])

    op.create_table(
        "product_dashboard_days",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("business_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("day", sa.DateTime(timezone=True), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("sku", sa.String(length=50), server_default="", nullable=False),
        sa.Column("name", sa.String(length=150), server_default="", nullable=False),
        sa.Column("quantity_sold", sa.Float(), server_default="0", nullable=False),
        sa.Column("product_sales", sa.Float(), server_default="0", nullable=False),
        sa.Column("cogs", sa.Float(), server_default="0", nullable=False),
        sa.Column("profit", sa.Float(), server_default="0", nullable=False),
        sa.Column("missing_cost", sa.Boolean(), server_default="false", nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "day", "product_id", name="uq_product_dashboard_day"),
    )
    op.create_index("ix_product_dashboard_days_business_id", "product_dashboard_days", ["business_id"])
    op.create_index("ix_product_dashboard_days_day", "product_dashboard_days", ["day"])
    op.create_index("ix_product_dashboard_days_product_id", "product_dashboard_days", ["product_id"])


def downgrade() -> None:
    op.drop_table("product_dashboard_days")
    op.drop_table("business_dashboard_days")
