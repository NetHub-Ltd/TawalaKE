"""Baseline schema from SQLModel.metadata (single source of truth).

Revision ID: 20260920_0001
Revises:
Create Date: 2026-09-20

Tables are created exclusively via ``SQLModel.metadata.create_all`` so the
migration matches ``app.models`` with no hand-written ``sa.Column`` DDL.
RLS policies (not expressible on SQLModel fields) are applied afterward.
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
from sqlmodel import SQLModel

from app import models  # noqa: F401 — register all table models on metadata

revision: str = "20260920_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Business-scoped tables that carry business_id (M12 RLS).
_TENANT_TABLES = (
    "memberships",
    "roles",
    "branches",
    "locations",
    "party_business_links",
    "categories",
    "products",
    "services",
    "business_configs",
    "audit_records",
    "domain_events",
)


def upgrade() -> None:
    bind = op.get_bind()
    SQLModel.metadata.create_all(bind=bind)

    for table in _TENANT_TABLES:
        if table == "memberships":
            using = """(
                current_setting('app.rls_bypass', true) = 'on'
                OR (
                    current_setting('app.current_business_id', true) <> ''
                    AND business_id = NULLIF(current_setting('app.current_business_id', true), '')::uuid
                )
                OR (
                    current_setting('app.current_user_id', true) <> ''
                    AND user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
                )
            )"""
        else:
            using = """(
                current_setting('app.rls_bypass', true) = 'on'
                OR (
                    current_setting('app.current_business_id', true) <> ''
                    AND business_id = NULLIF(current_setting('app.current_business_id', true), '')::uuid
                )
            )"""
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
        op.execute(
            f"""
            CREATE POLICY tenant_isolation ON {table}
                FOR ALL
                USING {using}
                WITH CHECK {using}
            """
        )


def downgrade() -> None:
    for table in reversed(_TENANT_TABLES):
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {table}")
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")
    bind = op.get_bind()
    SQLModel.metadata.drop_all(bind=bind)
