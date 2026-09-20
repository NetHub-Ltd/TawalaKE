"""M12: PostgreSQL RLS tenant isolation on business-scoped tables.

Revision ID: 20260920_0009
Revises: 20260920_0008
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "20260920_0009"
down_revision: Union[str, None] = "20260920_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Tables with a business_id column — RLS enforces tenant isolation.
TENANT_TABLES = (
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


def _policy_sql(table: str) -> str:
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
    return f"""
    CREATE POLICY tenant_isolation ON {table}
        FOR ALL
        USING {using}
        WITH CHECK {using};
    """


def upgrade() -> None:
    for table in TENANT_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        # FORCE so table owner is also subject to policies (app role is typically owner).
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
        op.execute(_policy_sql(table))


def downgrade() -> None:
    for table in reversed(TENANT_TABLES):
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {table}")
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")
