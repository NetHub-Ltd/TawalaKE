"""Add platform_users table and platform_role_enum (additive).

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-15

Platform-level identity plane separate from tenant Staff.
Idempotent: safe if enum/table already partially applied from older drafts.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enum first (idempotent)
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_role_enum') THEN
                CREATE TYPE platform_role_enum AS ENUM (
                    'SUPER_ADMIN', 'SUPPORT', 'BILLING', 'AUDITOR'
                );
            END IF;
        END
        $$;
        """
    )

    # Table (idempotent via to_regclass check)
    op.execute(
        """
        DO $$
        BEGIN
            IF to_regclass('public.platform_users') IS NULL THEN
                CREATE TABLE platform_users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    deleted_at TIMESTAMPTZ NULL,
                    email VARCHAR NOT NULL,
                    full_name VARCHAR(100) NOT NULL,
                    hashed_password VARCHAR NULL,
                    role platform_role_enum NOT NULL DEFAULT 'SUPPORT',
                    active BOOLEAN NOT NULL DEFAULT true,
                    last_login_at TIMESTAMPTZ NULL
                );
                CREATE UNIQUE INDEX ix_platform_users_email ON platform_users (email);
                CREATE INDEX ix_platform_users_id ON platform_users (id);
                CREATE INDEX ix_platform_users_active ON platform_users (active);
            END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS platform_users CASCADE;")
    op.execute("DROP TYPE IF EXISTS platform_role_enum;")
