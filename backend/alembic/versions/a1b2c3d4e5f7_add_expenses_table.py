"""Add expenses table and expense_category_enum.

Revision ID: a1b2c3d4e5f7
Revises: f3a4b5c6d7e8
Create Date: 2026-09-05

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f7"
down_revision: Union[str, Sequence[str], None] = "f3a4b5c6d7e8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_ENUM_VALUES = (
    "RENT",
    "UTILITIES",
    "SALARIES",
    "TRANSPORT",
    "SUPPLIES",
    "MARKETING",
    "MAINTENANCE",
    "TAXES",
    "OTHER",
)


def upgrade() -> None:
    # Create the PG type once. create_type=False on the column prevents
    # SQLAlchemy from issuing a second CREATE TYPE during create_table.
    expense_category = postgresql.ENUM(
        *_ENUM_VALUES,
        name="expense_category_enum",
        create_type=False,
    )
    expense_category.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "expenses",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("business_id", sa.Uuid(), nullable=False),
        sa.Column("recorded_by", sa.Uuid(), nullable=True),
        sa.Column(
            "category",
            expense_category,
            server_default="OTHER",
            nullable=False,
        ),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="KES", nullable=False),
        sa.Column("incurred_on", sa.DateTime(timezone=True), nullable=False),
        sa.Column("vendor", sa.String(length=150), nullable=True),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("reference", sa.String(length=100), nullable=True),
        sa.Column("deleted_by", sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recorded_by"], ["staff.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_expenses_business_id", "expenses", ["business_id"])
    op.create_index("ix_expenses_organization_id", "expenses", ["organization_id"])
    op.create_index("ix_expenses_recorded_by", "expenses", ["recorded_by"])
    op.create_index("ix_expenses_incurred_on", "expenses", ["incurred_on"])
    op.create_index("ix_expenses_reference", "expenses", ["reference"])
    op.create_index("ix_expenses_deleted_by", "expenses", ["deleted_by"])


def downgrade() -> None:
    op.drop_table("expenses")
    postgresql.ENUM(name="expense_category_enum").drop(op.get_bind(), checkfirst=True)
