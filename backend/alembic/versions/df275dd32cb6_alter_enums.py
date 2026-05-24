"""alter enums

Revision ID: df275dd32cb6
Revises: 81b701305abc
Create Date: 2026-05-24 23:43:03.484055

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'df275dd32cb6'
down_revision: Union[str, Sequence[str], None] = '81b701305abc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute(
        "ALTER TYPE tenant_tier_enum RENAME VALUE 'FREE' TO 'TRIAL';"
    )

def downgrade():
    op.execute(
        "ALTER TYPE tenant_tier_enum RENAME VALUE 'TRIAL' TO 'FREE';"
    )
