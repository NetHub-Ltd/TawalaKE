"""Add missing updated_at on credentials and sessions (BaseMixin parity).

Revision ID: 20260920_0010
Revises: 20260920_0009
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260920_0010"
down_revision: Union[str, None] = "20260920_0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 0002 created credentials/sessions without updated_at; 0004 only added soft-delete.
    op.add_column(
        "credentials",
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.add_column(
        "sessions",
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    # Drop server defaults after backfill so ORM owns the values.
    op.alter_column("credentials", "updated_at", server_default=None)
    op.alter_column("sessions", "updated_at", server_default=None)


def downgrade() -> None:
    op.drop_column("sessions", "updated_at")
    op.drop_column("credentials", "updated_at")
