"""Add amount_given, amount_due_at_payment, change_due on payments.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column("config", postgresql.JSONB(), nullable=True),
    )
    op.execute("UPDATE organizations SET config = '{}'::jsonb WHERE config IS NULL")
    op.add_column(
        "payments",
        sa.Column("amount_given", sa.Float(), nullable=True),
    )
    op.add_column(
        "payments",
        sa.Column("amount_due_at_payment", sa.Float(), nullable=True),
    )
    op.add_column(
        "payments",
        sa.Column("change_due", sa.Float(), nullable=True),
    )
    # Backfill: treat historical payments as full tender = applied amount
    op.execute(
        """
        UPDATE payments
        SET amount_given = amount,
            amount_due_at_payment = amount,
            change_due = 0
        WHERE amount_given IS NULL
        """
    )


def downgrade() -> None:
    op.drop_column("payments", "change_due")
    op.drop_column("payments", "amount_due_at_payment")
    op.drop_column("payments", "amount_given")
    op.drop_column("organizations", "config")
