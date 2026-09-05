"""Checkout analytics integrity: outbox + payment mix + missing cost counters.

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-09-05

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f3a4b5c6d7e8"
down_revision: Union[str, Sequence[str], None] = "e2f3a4b5c6d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sale_analytics_summaries",
        sa.Column("cash_volume", sa.Float(), server_default="0", nullable=False),
    )
    op.add_column(
        "sale_analytics_summaries",
        sa.Column("mpesa_volume", sa.Float(), server_default="0", nullable=False),
    )
    op.add_column(
        "sale_analytics_summaries",
        sa.Column("missing_cost_line_count", sa.Integer(), server_default="0", nullable=False),
    )
    op.create_table(
        "analytics_outbox",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sale_id", sa.Uuid(), nullable=False),
        sa.Column("business_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("status", sa.String(), server_default="PENDING", nullable=False),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sale_id", name="uq_analytics_outbox_sale"),
    )
    op.create_index("ix_analytics_outbox_sale_id", "analytics_outbox", ["sale_id"])
    op.create_index("ix_analytics_outbox_business_id", "analytics_outbox", ["business_id"])
    op.create_index("ix_analytics_outbox_status", "analytics_outbox", ["status"])


def downgrade() -> None:
    op.drop_table("analytics_outbox")
    op.drop_column("sale_analytics_summaries", "missing_cost_line_count")
    op.drop_column("sale_analytics_summaries", "mpesa_volume")
    op.drop_column("sale_analytics_summaries", "cash_volume")
