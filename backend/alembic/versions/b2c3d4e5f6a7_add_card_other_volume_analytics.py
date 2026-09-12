"""Add card_volume and other_volume to sale_analytics_summaries.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f7
Create Date: 2026-09-10

Additive payment-mix columns for dashboard settled strip completeness.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sale_analytics_summaries",
        sa.Column("card_volume", sa.Float(), server_default="0", nullable=False),
    )
    op.add_column(
        "sale_analytics_summaries",
        sa.Column("other_volume", sa.Float(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("sale_analytics_summaries", "other_volume")
    op.drop_column("sale_analytics_summaries", "card_volume")
