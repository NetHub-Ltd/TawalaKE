"""trial consumed + subscription grace_end_date / is_trial

Revision ID: b1c2d3e4f5a6
Revises: a7b8c9d0e1f2
Create Date: 2026-09-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column("trial_consumed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "subscriptions",
        sa.Column("is_trial", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column(
        "subscriptions",
        sa.Column("grace_end_date", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("subscriptions", "grace_end_date")
    op.drop_column("subscriptions", "is_trial")
    op.drop_column("organizations", "trial_consumed_at")
