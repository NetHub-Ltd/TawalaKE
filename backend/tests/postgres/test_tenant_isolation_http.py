"""M12: Real PostgreSQL + HTTP tenant isolation (no FakeSession)."""

from __future__ import annotations

from datetime import UTC, datetime
import pytest
from sqlalchemy import select

from app.db.session import set_tenant_guc
from app.models.security import Membership, MembershipStatus

pytestmark = pytest.mark.asyncio


async def test_user_a_can_access_business_a(client, two_tenants):
    t = two_tenants
    r = await client.get(
        f"/api/v1/businesses/{t['biz_a']}",
        headers={"Authorization": f"Bearer {t['token_a']}"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["id"] == str(t["biz_a"])


async def test_user_a_cannot_access_business_b(client, two_tenants):
    t = two_tenants
    r = await client.get(
        f"/api/v1/businesses/{t['biz_b']}",
        headers={"Authorization": f"Bearer {t['token_a']}"},
    )
    assert r.status_code in (403, 404), r.text


async def test_user_without_membership_cannot_access_business(client, two_tenants):
    t = two_tenants
    r = await client.get(
        f"/api/v1/businesses/{t['biz_a']}",
        headers={"Authorization": f"Bearer {t['token_none']}"},
    )
    assert r.status_code in (403, 404), r.text


async def test_idor_party_other_tenant(client, two_tenants):
    t = two_tenants
    # User A tries to read Party B (linked only to Business B)
    r = await client.get(
        f"/api/v1/parties/{t['party_b']}?business_id={t['biz_a']}",
        headers={"Authorization": f"Bearer {t['token_a']}"},
    )
    assert r.status_code in (403, 404), r.text


async def test_party_own_tenant_ok(client, two_tenants):
    t = two_tenants
    r = await client.get(
        f"/api/v1/parties/{t['party_a']}?business_id={t['biz_a']}",
        headers={"Authorization": f"Bearer {t['token_a']}"},
    )
    assert r.status_code == 200, r.text


async def test_membership_revocation_blocks_access(client, two_tenants, db_session):
    t = two_tenants
    await set_tenant_guc(db_session, None, bypass=True)
    mem = await db_session.get(Membership, t["mem_a"])
    assert mem is not None
    mem.status = MembershipStatus.REVOKED
    mem.revoked_at = datetime.now(UTC)
    await db_session.commit()

    r = await client.get(
        f"/api/v1/businesses/{t['biz_a']}",
        headers={"Authorization": f"Bearer {t['token_a']}"},
    )
    assert r.status_code in (403, 404), r.text


async def test_rls_hides_other_tenant_products(db_session, two_tenants):
    """Direct SQL with tenant GUC must not see other business products."""
    from app.models.catalog import Product

    t = two_tenants
    await set_tenant_guc(db_session, t["biz_a"], bypass=False)
    rows = (await db_session.scalars(select(Product))).all()
    ids = {p.id for p in rows}
    assert t["prod_a"] in ids
    assert t["prod_b"] not in ids
