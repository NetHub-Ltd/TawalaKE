"""permission overrides org + staff

Revision ID: e5f6a7b8c9d0
Revises: c2d3e4f5a6b7
Create Date: 2026-09-26

Unique revision id (do not reuse d4e5f6a7b8c9 — already used by
platform_user_must_change_password).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "c2d3e4f5a6b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organization_permission_overrides",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("permission_code", sa.String(length=64), nullable=False),
        sa.Column("effect", sa.String(length=16), nullable=False, server_default="DENY"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_org_perm_override_unique",
        "organization_permission_overrides",
        ["organization_id", "permission_code"],
        unique=True,
    )
    op.create_index(
        "ix_organization_permission_overrides_organization_id",
        "organization_permission_overrides",
        ["organization_id"],
    )
    op.create_index(
        "ix_organization_permission_overrides_permission_code",
        "organization_permission_overrides",
        ["permission_code"],
    )

    op.create_table(
        "staff_permission_overrides",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("staff_id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("permission_code", sa.String(length=64), nullable=False),
        sa.Column("effect", sa.String(length=16), nullable=False),
        sa.ForeignKeyConstraint(["staff_id"], ["staff.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_staff_perm_override_unique",
        "staff_permission_overrides",
        ["staff_id", "permission_code"],
        unique=True,
    )
    op.create_index(
        "ix_staff_permission_overrides_staff_id",
        "staff_permission_overrides",
        ["staff_id"],
    )
    op.create_index(
        "ix_staff_permission_overrides_organization_id",
        "staff_permission_overrides",
        ["organization_id"],
    )


def downgrade() -> None:
    op.drop_table("staff_permission_overrides")
    op.drop_table("organization_permission_overrides")
