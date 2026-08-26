"""add INVOICE to payment_method_enum

Revision ID: c4f8a91b2e10
Revises: 1cd7948300ae
Create Date: 2026-08-26

Live payment_method_enum was created as CASH|MPESA|CARD|BANK (initial tables).
Application PaymentMethod includes INVOICE; writing it causes:
  InvalidTextRepresentationError: invalid input value for enum payment_method_enum: "INVOICE"

Additive, non-destructive.
"""
from typing import Sequence, Union

from alembic import op

revision: str = "c4f8a91b2e10"
down_revision: Union[str, Sequence[str], None] = "1cd7948300ae"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL cannot run ADD VALUE inside a transaction block on some versions;
    # Alembic usually autocommits DDL. IF NOT EXISTS keeps re-runs safe (PG 9.1+ / 15+).
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum'
            ) AND NOT EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = 'payment_method_enum'
                  AND e.enumlabel = 'INVOICE'
            ) THEN
                ALTER TYPE payment_method_enum ADD VALUE 'INVOICE';
            END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    # Enum value removal is unsafe when rows reference INVOICE; leave label in place.
    pass
