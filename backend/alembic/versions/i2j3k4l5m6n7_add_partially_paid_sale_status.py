"""Add PARTIALLY_PAID to business_sale_status_enum.

Revision ID: i2j3k4l5m6n7
Revises: h1i2j3k4l5m6
Create Date: 2026-09-30

Distinguishes fully unpaid (PENDING_PAYMENT) from partially paid sales.
"""
from typing import Sequence, Union

from alembic import op

revision: str = "i2j3k4l5m6n7"
down_revision: Union[str, Sequence[str], None] = "h1i2j3k4l5m6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Additive only. PG cannot remove enum values safely on downgrade.
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = 'business_sale_status_enum'
                  AND e.enumlabel = 'PARTIALLY_PAID'
            ) THEN
                ALTER TYPE business_sale_status_enum ADD VALUE 'PARTIALLY_PAID';
            END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    pass
