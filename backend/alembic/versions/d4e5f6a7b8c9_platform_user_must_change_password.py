"""Add platform_users.must_change_password (invite flow).

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-23

Additive nullable-safe boolean with server default false.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF to_regclass('public.platform_users') IS NOT NULL
               AND NOT EXISTS (
                   SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'platform_users'
                     AND column_name = 'must_change_password'
               ) THEN
                ALTER TABLE platform_users
                  ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT false;
            END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'platform_users'
                  AND column_name = 'must_change_password'
            ) THEN
                ALTER TABLE platform_users DROP COLUMN must_change_password;
            END IF;
        END
        $$;
        """
    )
