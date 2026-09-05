"""Reporting rollup tables: product/staff daily, hourly bars, COGS on business daily.

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-09-05

Linearized after soft-delete archive migration so a single Alembic head exists.

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e2f3a4b5c6d7"
down_revision: Union[str, Sequence[str], None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sale_analytics_summaries",
        sa.Column("cogs_volume", sa.Float(), server_default="0", nullable=False),
    )
    op.add_column(
        "sale_analytics_summaries",
        sa.Column("gross_profit", sa.Float(), server_default="0", nullable=False),
    )

    op.create_table(
        "product_sales_summaries",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("business_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("date_dimension", sa.DateTime(timezone=True), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("sku", sa.String(length=50), server_default="", nullable=False),
        sa.Column("name", sa.String(length=150), server_default="", nullable=False),
        sa.Column("quantity_sold", sa.Float(), server_default="0", nullable=False),
        sa.Column("revenue", sa.Float(), server_default="0", nullable=False),
        sa.Column("cogs", sa.Float(), server_default="0", nullable=False),
        sa.Column("gross_profit", sa.Float(), server_default="0", nullable=False),
        sa.Column("discount_amount", sa.Float(), server_default="0", nullable=False),
        sa.Column("line_count", sa.Integer(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "date_dimension", "product_id", name="uq_product_sales_day"),
    )
    op.create_index("ix_product_sales_summaries_business_id", "product_sales_summaries", ["business_id"])
    op.create_index("ix_product_sales_summaries_date_dimension", "product_sales_summaries", ["date_dimension"])
    op.create_index("ix_product_sales_summaries_product_id", "product_sales_summaries", ["product_id"])

    op.create_table(
        "staff_sales_summaries",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("business_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("date_dimension", sa.DateTime(timezone=True), nullable=False),
        sa.Column("staff_id", sa.Uuid(), nullable=False),
        sa.Column("orders_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("revenue", sa.Float(), server_default="0", nullable=False),
        sa.Column("cogs", sa.Float(), server_default="0", nullable=False),
        sa.Column("gross_profit", sa.Float(), server_default="0", nullable=False),
        sa.Column("discounts", sa.Float(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["staff_id"], ["staff.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "date_dimension", "staff_id", name="uq_staff_sales_day"),
    )
    op.create_index("ix_staff_sales_summaries_business_id", "staff_sales_summaries", ["business_id"])
    op.create_index("ix_staff_sales_summaries_date_dimension", "staff_sales_summaries", ["date_dimension"])
    op.create_index("ix_staff_sales_summaries_staff_id", "staff_sales_summaries", ["staff_id"])

    op.create_table(
        "business_sales_hourly",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("business_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("hour_dimension", sa.DateTime(timezone=True), nullable=False),
        sa.Column("gross_sales_volume", sa.Float(), server_default="0", nullable=False),
        sa.Column("net_revenue_collected", sa.Float(), server_default="0", nullable=False),
        sa.Column("cogs_volume", sa.Float(), server_default="0", nullable=False),
        sa.Column("gross_profit", sa.Float(), server_default="0", nullable=False),
        sa.Column("total_completed_orders_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_discounts_granted", sa.Float(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "hour_dimension", name="uq_business_sales_hour"),
    )
    op.create_index("ix_business_sales_hourly_business_id", "business_sales_hourly", ["business_id"])
    op.create_index("ix_business_sales_hourly_hour_dimension", "business_sales_hourly", ["hour_dimension"])


def downgrade() -> None:
    op.drop_table("business_sales_hourly")
    op.drop_table("staff_sales_summaries")
    op.drop_table("product_sales_summaries")
    op.drop_column("sale_analytics_summaries", "gross_profit")
    op.drop_column("sale_analytics_summaries", "cogs_volume")
