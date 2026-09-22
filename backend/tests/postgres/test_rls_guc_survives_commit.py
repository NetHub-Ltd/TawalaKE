"""RLS GUCs must survive intermediate session.commit() within one request (#292)."""

from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy import text
from sqlmodel import select

from app.db.session import set_tenant_guc
from app.models.catalog import Product


@pytest.mark.asyncio
async def test_rls_guc_survives_commit_then_second_query(db_session, two_tenants):
    """create product → commit → second query still tenant-scoped by RLS."""
    t = two_tenants
    biz_a = t["biz_a"]
    biz_b = t["biz_b"]

    await set_tenant_guc(db_session, biz_a, bypass=False)

    # Intermediate commit must not clear session-level GUCs
    prod = Product(
        id=uuid4(),
        business_id=biz_a,
        name=f"GUC-survive-{uuid4().hex[:8]}",
        sku=f"SKU-{uuid4().hex[:6]}",
        unit="ea",
    )
    db_session.add(prod)
    await db_session.commit()
    await db_session.refresh(prod)

    # GUC still set after commit
    row = (
        await db_session.execute(
            text("SELECT current_setting('app.current_business_id', true)")
        )
    ).scalar_one()
    assert row == str(biz_a)

    # Query still only sees tenant A products (not B)
    products = (await db_session.exec(select(Product))).all()
    ids = {p.business_id for p in products}
    assert biz_a in ids or any(p.id == prod.id for p in products)
    assert biz_b not in ids or all(p.business_id == biz_a for p in products if p.id == prod.id)
    # Stronger: no product from biz_b visible under GUC
    assert all(p.business_id == biz_a for p in products)


@pytest.mark.asyncio
async def test_rls_guc_session_level_flag(db_session, two_tenants):
    """After set_tenant_guc, is_local semantics leave GUC after COMMIT."""
    t = two_tenants
    await set_tenant_guc(db_session, t["biz_a"], bypass=False)
    await db_session.execute(text("SELECT 1"))
    await db_session.commit()
    val = (
        await db_session.execute(
            text("SELECT current_setting('app.current_business_id', true)")
        )
    ).scalar_one()
    assert val == str(t["biz_a"])
