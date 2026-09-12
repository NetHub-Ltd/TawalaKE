"""Unit tests for class-based PaywallService."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
import json

import pytest
from fastapi import HTTPException

from app.services.paywall import (
    LIMIT_BUSINESSES,
    Entitlements,
    PaywallService,
)


def _plan(*, code="BASIC", limits=None, features=None, trial_days=7):
    p = MagicMock()
    p.id = uuid4()
    p.code = code
    p.name = code.title()
    p.trial_days = trial_days
    p.limits = limits or {
        "max_businesses": 1,
        "max_staff": 3,
        "max_products": 300,
    }
    p.features = features or {
        "full_inventory": False,
        "api_access": False,
        "pos_and_sales": True,
        "basic_stock_tracking": True,
        "invoicing": True,
        "multi_business": False,
    }
    return p


def _sub(*, plan_id=None, active=True, end_offset_days=7):
    s = MagicMock()
    s.id = uuid4()
    s.organization_id = uuid4()
    s.plan_id = plan_id
    s.active = active
    s.current_usage = {}
    now = datetime.now(timezone.utc)
    s.start_date = now - timedelta(days=1)
    s.end_date = now + timedelta(days=end_offset_days) if end_offset_days is not None else None
    return s


@pytest.mark.asyncio
async def test_resolve_no_subscription():
    svc = PaywallService()
    db = AsyncMock()
    db.exec = AsyncMock(
        side_effect=[
            MagicMock(__iter__=lambda self: iter([])),
            MagicMock(one=lambda: 0),
            MagicMock(one=lambda: 0),
            MagicMock(one=lambda: 0),
        ]
    )
    ent = await svc.resolve_from_db(db, uuid4())
    assert ent.active is False
    assert ent.plan_code == "NONE"


@pytest.mark.asyncio
async def test_require_feature_denied():
    svc = PaywallService()
    plan = _plan(features={"full_inventory": False, "pos_and_sales": True})
    sub = _sub(plan_id=plan.id)
    db = AsyncMock()
    db.exec = AsyncMock(
        side_effect=[
            MagicMock(__iter__=lambda self: iter([sub])),
            MagicMock(one=lambda: 0),
            MagicMock(one=lambda: 0),
            MagicMock(one=lambda: 0),
        ]
    )
    db.get = AsyncMock(return_value=plan)
    ent = await svc.resolve_from_db(db, sub.organization_id)
    with pytest.raises(HTTPException) as exc:
        svc.require_feature(ent, "full_inventory")
    assert exc.value.status_code == 403
    assert exc.value.detail["code"] == "FEATURE_NOT_AVAILABLE"


@pytest.mark.asyncio
async def test_check_limit_blocks_at_cap():
    svc = PaywallService()
    plan = _plan(limits={"max_businesses": 1})
    sub = _sub(plan_id=plan.id)
    db = AsyncMock()
    db.exec = AsyncMock(
        side_effect=[
            MagicMock(__iter__=lambda self: iter([sub])),
            MagicMock(one=lambda: 1),
            MagicMock(one=lambda: 0),
            MagicMock(one=lambda: 0),
        ]
    )
    db.get = AsyncMock(return_value=plan)
    ent = await svc.resolve_from_db(db, sub.organization_id)
    with pytest.raises(HTTPException) as exc:
        svc.check_limit(ent, LIMIT_BUSINESSES, current=1)
    assert exc.value.status_code == 402
    assert exc.value.detail["code"] == "PLAN_LIMIT_REACHED"


def test_require_features_all():
    svc = PaywallService()
    ent = Entitlements(
        organization_id=str(uuid4()),
        subscription_id=None,
        plan_id=None,
        plan_code="NDOVU",
        plan_name="Ndovu",
        active=True,
        trial=True,
        start_date=None,
        end_date=None,
        limits={},
        features={
            "pos_and_sales": True,
            "basic_stock_tracking": True,
            "invoicing": True,
            "full_inventory": False,
        },
    )
    svc.require_features(ent, ("pos_and_sales", "basic_stock_tracking", "invoicing"))
    with pytest.raises(HTTPException):
        svc.require_features(ent, ("pos_and_sales", "full_inventory"))


def test_has_feature_grades():
    ent = Entitlements(
        organization_id=str(uuid4()),
        subscription_id=None,
        plan_id=None,
        plan_code="NDOVU",
        plan_name="Ndovu",
        active=True,
        trial=True,
        start_date=None,
        end_date=None,
        limits={},
        features={"api_access": "limited", "audit_trail": "basic", "sso": False},
    )
    assert ent.has_feature("api_access") is True
    assert ent.has_feature("audit_trail") is True
    assert ent.has_feature("sso") is False


@pytest.mark.asyncio
async def test_cache_roundtrip():
    svc = PaywallService()
    org_id = uuid4()
    ent = Entitlements(
        organization_id=str(org_id),
        subscription_id=str(uuid4()),
        plan_id=str(uuid4()),
        plan_code="BASIC",
        plan_name="Basic",
        active=True,
        trial=False,
        start_date=None,
        end_date=None,
        limits={"max_staff": 3},
        features={"pos_and_sales": True},
        usage={"max_staff": 1},
    )
    store = {}

    class FakeRedis:
        async def get(self, key):
            return store.get(key)

        async def set(self, key, value, ex=None):
            store[key] = value

        async def delete(self, *keys):
            for k in keys:
                store.pop(k, None)

        def pipeline(self):
            return self

        async def execute(self):
            return True

    redis = FakeRedis()
    store[svc._ent_key(org_id)] = json.dumps(ent.to_cache_dict())
    store[svc._valid_key(org_id)] = "1"
    loaded = await svc.get_cached(redis, org_id)
    assert loaded is not None
    assert loaded.plan_code == "BASIC"
    assert await svc.is_plan_valid_cached(redis, org_id) is True


# ---------------------------------------------------------------------------
# Extended coverage — enforcement, expiry, resolve edges, redis degrade
# ---------------------------------------------------------------------------


def _detail_code(exc: HTTPException) -> str:
    d = exc.detail
    if isinstance(d, dict):
        return str(d.get("code") or "")
    return str(d)


def _db_with_sub_plan(sub, plan, *, biz=0, staff=0, products=0):
    """resolve_from_db: load sub → live counts → get plan."""
    db = AsyncMock()
    db.exec = AsyncMock(
        side_effect=[
            MagicMock(__iter__=lambda self: iter([sub])),
            MagicMock(one=lambda: biz),
            MagicMock(one=lambda: staff),
            MagicMock(one=lambda: products),
        ]
    )
    db.get = AsyncMock(return_value=plan)
    db.add = MagicMock()
    db.flush = AsyncMock()
    return db


def test_require_active_expired():
    """Expired end_date on an otherwise active Entitlements (e.g. stale cache)."""
    svc = PaywallService()
    past = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    ent = Entitlements(
        organization_id=str(uuid4()),
        subscription_id=str(uuid4()),
        plan_id=str(uuid4()),
        plan_code="BASIC",
        plan_name="Basic",
        active=True,
        trial=False,
        start_date=None,
        end_date=past,
    )
    with pytest.raises(HTTPException) as exc:
        svc.require_active(ent)
    assert exc.value.status_code == 403
    assert _detail_code(exc.value) == "SUBSCRIPTION_EXPIRED"


def test_require_active_inactive_entitlements():
    svc = PaywallService()
    ent = Entitlements(
        organization_id=str(uuid4()),
        subscription_id=None,
        plan_id=None,
        plan_code="NONE",
        plan_name="No active plan",
        active=False,
        trial=False,
        start_date=None,
        end_date=None,
    )
    with pytest.raises(HTTPException) as exc:
        svc.require_active(ent)
    assert _detail_code(exc.value) == "SUBSCRIPTION_INACTIVE"


def test_check_limit_allows_under_cap():
    svc = PaywallService()
    ent = Entitlements(
        organization_id=str(uuid4()),
        subscription_id=str(uuid4()),
        plan_id=str(uuid4()),
        plan_code="BASIC",
        plan_name="Basic",
        active=True,
        trial=False,
        start_date=None,
        end_date=None,
        limits={LIMIT_BUSINESSES: 3},
        features={},
        usage={LIMIT_BUSINESSES: 1},
    )
    out = svc.check_limit(ent, LIMIT_BUSINESSES, current=1, increment=1)
    assert out is ent


def test_check_limit_unlimited_when_key_missing():
    svc = PaywallService()
    ent = Entitlements(
        organization_id=str(uuid4()),
        subscription_id=str(uuid4()),
        plan_id=str(uuid4()),
        plan_code="PRO",
        plan_name="Pro",
        active=True,
        trial=False,
        start_date=None,
        end_date=None,
        limits={},  # no cap
        features={},
        usage={},
    )
    out = svc.check_limit(ent, LIMIT_BUSINESSES, current=999, increment=1)
    assert out is ent


def test_require_features_any_mode():
    svc = PaywallService()
    ent = Entitlements(
        organization_id=str(uuid4()),
        subscription_id=str(uuid4()),
        plan_id=str(uuid4()),
        plan_code="BASIC",
        plan_name="Basic",
        active=True,
        trial=False,
        start_date=None,
        end_date=None,
        limits={},
        features={"pos_and_sales": True, "full_inventory": False},
        usage={},
    )
    # any: one present → ok
    svc.require_features(ent, ("full_inventory", "pos_and_sales"), mode="any")
    # any: none present → 403
    with pytest.raises(HTTPException) as exc:
        svc.require_features(ent, ("full_inventory", "api_access"), mode="any")
    assert _detail_code(exc.value) == "FEATURE_NOT_AVAILABLE"


@pytest.mark.asyncio
async def test_resolve_with_plan_and_trial():
    svc = PaywallService()
    plan = _plan(trial_days=14)
    sub = _sub(plan_id=plan.id, end_offset_days=10)
    # start was 1 day ago, end +10 → span ~11 days ≤ trial_days+1
    db = _db_with_sub_plan(sub, plan)
    ent = await svc.resolve_from_db(db, sub.organization_id)
    assert ent.active is True
    assert ent.plan_code == "BASIC"
    assert ent.trial is True
    assert ent.limits.get("max_businesses") == 1


@pytest.mark.asyncio
async def test_resolve_unknown_plan():
    svc = PaywallService()
    sub = _sub(plan_id=uuid4())
    db = AsyncMock()
    db.exec = AsyncMock(
        side_effect=[
            MagicMock(__iter__=lambda self: iter([sub])),
            MagicMock(one=lambda: 0),
            MagicMock(one=lambda: 0),
            MagicMock(one=lambda: 0),
        ]
    )
    db.get = AsyncMock(return_value=None)  # plan row missing
    ent = await svc.resolve_from_db(db, sub.organization_id)
    assert ent.active is True
    assert ent.plan_code == "UNKNOWN"
    assert ent.plan_name == "Unknown plan"


@pytest.mark.asyncio
async def test_enforce_create_product_blocks_at_cap():
    svc = PaywallService()
    plan = _plan(limits={"max_businesses": 5, "max_staff": 10, "max_products": 2})
    sub = _sub(plan_id=plan.id)
    # live product count already at cap
    db = _db_with_sub_plan(sub, plan, products=2)
    with pytest.raises(HTTPException) as exc:
        await svc.enforce_create_product(db, sub.organization_id)
    assert exc.value.status_code in (402, 403)
    assert _detail_code(exc.value) == "PLAN_LIMIT_REACHED"


@pytest.mark.asyncio
async def test_enforce_create_product_allows_under_cap():
    svc = PaywallService()
    plan = _plan(limits={"max_businesses": 5, "max_staff": 10, "max_products": 10})
    sub = _sub(plan_id=plan.id)
    db = _db_with_sub_plan(sub, plan, products=3)
    ent = await svc.enforce_create_product(db, sub.organization_id)
    assert ent.plan_code == "BASIC"


@pytest.mark.asyncio
async def test_bump_usage_persists_and_invalidates():
    svc = PaywallService()
    plan = _plan()
    sub = _sub(plan_id=plan.id)
    sub.current_usage = {}
    db = AsyncMock()
    call_n = {"i": 0}

    async def exec_side(stmt):
        call_n["i"] += 1
        if call_n["i"] <= 3:
            return MagicMock(one=lambda: 1)
        return MagicMock(__iter__=lambda self: iter([sub]))

    db.exec = AsyncMock(side_effect=exec_side)
    db.get = AsyncMock(return_value=plan)
    db.add = MagicMock()
    db.flush = AsyncMock()

    deleted = []

    class FakeRedis:
        async def delete(self, *keys):
            deleted.extend(keys)

    redis = FakeRedis()
    usage = await svc.bump_usage(
        db, sub.organization_id, LIMIT_BUSINESSES, delta=1, redis=redis
    )
    assert isinstance(usage, dict)
    db.add.assert_called()
    assert db.flush.await_count >= 1
    assert deleted, "expected cache invalidate via redis.delete"


@pytest.mark.asyncio
async def test_persist_usage_noop_without_sub():
    svc = PaywallService()
    db = AsyncMock()
    db.exec = AsyncMock(return_value=MagicMock(__iter__=lambda self: iter([])))
    await svc.persist_usage(db, uuid4(), {"max_staff": 1})
    db.add.assert_not_called()


@pytest.mark.asyncio
async def test_cache_redis_errors_degrade():
    svc = PaywallService()
    org_id = uuid4()

    class BrokenRedis:
        async def get(self, key):
            raise RuntimeError("redis down")

        async def set(self, key, value, ex=None):
            raise RuntimeError("redis down")

        async def delete(self, *keys):
            raise RuntimeError("redis down")

        def pipeline(self):
            raise RuntimeError("redis down")

    redis = BrokenRedis()
    assert await svc.get_cached(redis, org_id) is None
    assert await svc.is_plan_valid_cached(redis, org_id) is None
    # set_cached / invalidate should not raise
    ent = Entitlements(
        organization_id=str(org_id),
        subscription_id=None,
        plan_id=None,
        plan_code="NONE",
        plan_name="n",
        active=False,
        trial=False,
        start_date=None,
        end_date=None,
    )
    await svc.set_cached(redis, org_id, ent)
    await svc.invalidate(redis, org_id)


@pytest.mark.asyncio
async def test_module_wrappers_delegate():
    """Smoke: module-level helpers resolve via singleton (no active sub → inactive)."""
    from app.services import paywall as paywall_mod

    db = AsyncMock()
    db.exec = AsyncMock(
        side_effect=[
            MagicMock(__iter__=lambda self: iter([])),
            MagicMock(one=lambda: 0),
            MagicMock(one=lambda: 0),
            MagicMock(one=lambda: 0),
        ]
    )
    org = uuid4()
    snap = await paywall_mod.get_usage_snapshot(db, org)
    assert "usage" in snap or isinstance(snap, dict)

    with pytest.raises(HTTPException):
        await paywall_mod.require_active_subscription(db, org)


def test_entitlements_limit_helpers():
    ent = Entitlements(
        organization_id=str(uuid4()),
        subscription_id=None,
        plan_id=None,
        plan_code="NONE",
        plan_name="n",
        active=False,
        trial=False,
        start_date=None,
        end_date=None,
        limits={"max_staff": "5", "bad": "x"},
        features={"flag": "on", "off": "false"},
        usage={},
    )
    assert ent.limit("max_staff") == 5
    assert ent.limit("missing") is None
    assert ent.limit("bad") is None
    assert ent.has_feature("flag") is True
    assert ent.has_feature("off") is False
