"""Merge alembic heads: dashboard daily + payment amount_given.

Revision ID: g7h8i9j0k1l2
Revises: a1b2c3d4e5f8, f6a7b8c9d0e1
Create Date: 2026-09-28

Fixes deploy: Multiple head revisions are present for argument 'head'.
"""
from typing import Sequence, Union

from alembic import op  # noqa: F401

# revision identifiers, used by Alembic.
revision: str = "g7h8i9j0k1l2"
down_revision: Union[str, Sequence[str], None] = ("a1b2c3d4e5f8", "f6a7b8c9d0e1")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Schema already applied on each branch — merge only.
    pass


def downgrade() -> None:
    pass
