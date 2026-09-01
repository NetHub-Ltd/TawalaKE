"""Add ADMIN to staff_role_enum (app roles include ADMIN; DB was missing it).

Revision ID: c9e8f7a6b5d4
Revises: a1b2c3d4e5f6
Create Date: 2026-08-31

"""
from typing import Sequence, Union

from alembic import op

revision: str = "c9e8f7a6b5d4"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Postgres: ADD VALUE cannot run inside a transaction block on older versions;
    # Alembic default is fine on PG 12+ for IF NOT EXISTS pattern via DO block.
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = 'staff_role_enum'
                  AND e.enumlabel = 'ADMIN'
            ) THEN
                ALTER TYPE staff_role_enum ADD VALUE 'ADMIN';
            END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    # Postgres cannot remove enum values safely without recreating the type.
    pass
