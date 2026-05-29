"""adds some refs and changed some column types"

Revision ID: 76affd7b2201
Revises: dade008f7999
Create Date: 2026-05-28 13:49:14.274736

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '76affd7b2201'
down_revision: Union[str, Sequence[str], None] = 'dade008f7999'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
