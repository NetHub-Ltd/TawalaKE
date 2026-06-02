"""adds a relation between product and inventory transaction

Revision ID: dade008f7999
Revises: f827c4e67f78
Create Date: 2026-05-28 13:32:54.795322

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'dade008f7999'
down_revision: Union[str, Sequence[str], None] = 'f827c4e67f78'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
