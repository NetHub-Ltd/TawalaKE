"""Core baseline — empty revision; tables land with M4+ models.

Revision ID: 20260919_0001
Revises:
Create Date: 2026-09-19
"""

from __future__ import annotations

from typing import Sequence, Union

revision: str = "20260919_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No tables yet — identity models arrive in M4."""
    pass


def downgrade() -> None:
    pass
