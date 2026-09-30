"""Add sales.amount_paid and sales.balance_due with backfill.

Revision ID: j3k4l5m6n7o8
Revises: i2j3k4l5m6n7
Create Date: 2026-09-30

Additive only. Backfills from payments; COMPLETED → balance_due=0.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "j3k4l5m6n7o8"
down_revision: Union[str, Sequence[str], None] = "i2j3k4l5m6n7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sales",
        sa.Column("amount_paid", sa.Float(), nullable=False, server_default="0"),
    )
    op.add_column(
        "sales",
        sa.Column("balance_due", sa.Float(), nullable=False, server_default="0"),
    )

    # Backfill from payments; completed sales force balance_due=0
    op.execute(
        """
        UPDATE sales s
        SET
            amount_paid = COALESCE(p.paid, 0),
            balance_due = CASE
                WHEN s.status = 'COMPLETED' THEN 0
                ELSE GREATEST(0, ROUND(CAST(s.total_amount AS numeric) - COALESCE(p.paid, 0), 2))
            END
        FROM (
            SELECT sale_id, COALESCE(SUM(amount), 0) AS paid
            FROM payments
            GROUP BY sale_id
        ) p
        WHERE s.id = p.sale_id
        """
    )
    # Sales with no payment rows: unpaid → full balance (unless COMPLETED)
    op.execute(
        """
        UPDATE sales s
        SET
            amount_paid = 0,
            balance_due = CASE
                WHEN s.status = 'COMPLETED' THEN 0
                ELSE ROUND(CAST(s.total_amount AS numeric), 2)
            END
        WHERE NOT EXISTS (
            SELECT 1 FROM payments p WHERE p.sale_id = s.id
        )
        """
    )

    op.alter_column("sales", "amount_paid", server_default=None)
    op.alter_column("sales", "balance_due", server_default=None)


def downgrade() -> None:
    op.drop_column("sales", "balance_due")
    op.drop_column("sales", "amount_paid")
