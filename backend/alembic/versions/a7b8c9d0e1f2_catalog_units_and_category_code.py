"""catalog units_of_measure + category.code

Revision ID: a7b8c9d0e1f2
Revises: d4e5f6a7b8c9
Create Date: 2026-09-23 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "units_of_measure",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("organization_id", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_units_of_measure_code", "units_of_measure", ["code"])
    op.create_index("ix_units_of_measure_active", "units_of_measure", ["active"])
    op.create_index("ix_units_of_measure_organization_id", "units_of_measure", ["organization_id"])

    # category.code (additive; table may already exist)
    conn = op.get_bind()
    insp = sa.inspect(conn)
    if "categories" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("categories")}
        if "code" not in cols:
            op.add_column("categories", sa.Column("code", sa.String(length=64), nullable=True))
            op.create_index("ix_categories_code", "categories", ["code"])


def downgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    if "categories" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("categories")}
        if "code" in cols:
            op.drop_index("ix_categories_code", table_name="categories")
            op.drop_column("categories", "code")
    op.drop_index("ix_units_of_measure_organization_id", table_name="units_of_measure")
    op.drop_index("ix_units_of_measure_active", table_name="units_of_measure")
    op.drop_index("ix_units_of_measure_code", table_name="units_of_measure")
    op.drop_table("units_of_measure")
