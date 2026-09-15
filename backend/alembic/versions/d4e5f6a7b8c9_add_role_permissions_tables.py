"""Add permission_definitions and role_permissions (RBAC phase 1).

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-16

Additive only. Seeds default matrix matching app.core.rbac.ROLE_PERMISSIONS.
Runtime continues to use in-code matrix until AUTH_RBAC_FROM_DB=true.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Mirror backend/app/core/rbac.py ROLE_PERMISSIONS at time of migration.
_PERMISSIONS = [
    ("org:read", "Read organization profile and settings"),
    ("org:write", "Update organization profile and settings"),
    ("org:billing", "Manage billing and subscription"),
    ("org:staff:manage", "Invite and manage staff"),
    ("catalog:read", "View products and catalog"),
    ("catalog:write", "Create and update products"),
    ("stock:read", "View stock levels"),
    ("stock:adjust", "Adjust stock quantities"),
    ("sales:write", "Create sales / checkout"),
    ("sales:read:own", "View own sales"),
    ("sales:read:business", "View business sales"),
    ("reports:read", "View reports"),
]

_ROLE_MATRIX = {
    "OWNER": [p[0] for p in _PERMISSIONS],
    "ADMIN": [
        "org:read",
        "org:write",
        "org:staff:manage",
        "catalog:read",
        "catalog:write",
        "stock:read",
        "stock:adjust",
        "sales:write",
        "sales:read:own",
        "sales:read:business",
        "reports:read",
    ],
    "MANAGER": [
        "org:read",
        "catalog:read",
        "catalog:write",
        "stock:read",
        "stock:adjust",
        "sales:write",
        "sales:read:own",
        "sales:read:business",
        "reports:read",
    ],
    "CASHIER": [
        "org:read",
        "catalog:read",
        "stock:read",
        "sales:write",
        "sales:read:own",
    ],
}


def upgrade() -> None:
    op.create_table(
        "permission_definitions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    op.create_index("ix_permission_definitions_code", "permission_definitions", ["code"], unique=True)
    op.create_index("ix_permission_definitions_active", "permission_definitions", ["active"])

    op.create_table(
        "role_permissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "role",
            postgresql.ENUM(
                "OWNER", "MANAGER", "CASHIER", "ADMIN",
                name="staff_role_enum",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("permission_code", sa.String(64), nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.UniqueConstraint("role", "permission_code", name="uq_role_permission"),
    )
    op.create_index("ix_role_permissions_permission_code", "role_permissions", ["permission_code"])
    op.create_index("ix_role_permissions_active", "role_permissions", ["active"])

    perm_table = sa.table(
        "permission_definitions",
        sa.column("code", sa.String),
        sa.column("description", sa.String),
        sa.column("active", sa.Boolean),
    )
    op.bulk_insert(
        perm_table,
        [{"code": c, "description": d, "active": True} for c, d in _PERMISSIONS],
    )

    rp_table = sa.table(
        "role_permissions",
        sa.column("role", sa.String),
        sa.column("permission_code", sa.String),
        sa.column("active", sa.Boolean),
    )
    rows = []
    for role, codes in _ROLE_MATRIX.items():
        for code in codes:
            rows.append({"role": role, "permission_code": code, "active": True})
    op.bulk_insert(rp_table, rows)


def downgrade() -> None:
    op.drop_table("role_permissions")
    op.drop_table("permission_definitions")
