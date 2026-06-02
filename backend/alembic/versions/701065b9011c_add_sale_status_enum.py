"""add_sale_status_enum

Revision ID: 701065b9011c
Revises: df275dd32cb6
Create Date: 2026-05-27 02:16:09.798824

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '701065b9011c'
down_revision: Union[str, Sequence[str], None] = 'df275dd32cb6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    # 1. Create the new enum type in PostgreSQL first
    op.execute(
        "CREATE TYPE business_sale_status_enum AS ENUM "
        "('PENDING_PAYMENT', 'COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED')"
    )
    
    # 2. Alter the column, using a CASE statement to cleanly translate old data values to new ones
    op.alter_column(
        'sales', 'status',
        existing_type=postgresql.ENUM('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED', name='sale_status_enum'),
        type_=sa.Enum('PENDING_PAYMENT', 'COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED', name='business_sale_status_enum'),
        existing_nullable=True,
        postgresql_using=(
            "CASE status::text "
            "  WHEN 'PENDING' THEN 'PENDING_PAYMENT'::business_sale_status_enum "
            "  WHEN 'CANCELLED' THEN 'DISPUTED'::business_sale_status_enum "
            "  ELSE status::text::business_sale_status_enum "
            "END"
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    # 1. Map values back to the old enum variants during a downgrade
    op.alter_column(
        'sales', 'status',
        existing_type=sa.Enum('PENDING_PAYMENT', 'COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED', name='business_sale_status_enum'),
        type_=postgresql.ENUM('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED', name='sale_status_enum'),
        existing_nullable=True,
        postgresql_using=(
            "CASE status::text "
            "  WHEN 'PENDING_PAYMENT' THEN 'PENDING'::sale_status_enum "
            "  WHEN 'PARTIALLY_REFUNDED' THEN 'REFUNDED'::sale_status_enum "
            "  WHEN 'DISPUTED' THEN 'CANCELLED'::sale_status_enum "
            "  ELSE status::text::sale_status_enum "
            "END"
        )
    )
    
    # 2. Drop the custom enum type cleanly from the database
    op.execute("DROP TYPE business_sale_status_enum")