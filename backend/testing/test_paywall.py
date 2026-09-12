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
            MagicMock(one=lambda: 0),  # businesses
            MagicMock(one=lambda: 0),  # staff
            MagicMock(all=lambda: []),  # product biz ids
            MagicMock(one=lambda: 0),  # products
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
            MagicMock(all=lambda: []),
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
            MagicMock(all=lambda: []),
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


def _product_count_effects(products=0, biz_ids=None):
    """Two exec results for _count_products: business id list, then count."""
    ids = list(biz_ids) if biz_ids is not None else []
    return [
        MagicMock(all=lambda: ids),
        MagicMock(one=lambda: products),
    ]


def _db_with_sub_plan(sub, plan, *, biz=0, staff=0, products=0, extra_product_counts=0):
    """resolve_from_db: load sub → live counts → get plan.

    _live_usage exec order: businesses, staff, then _count_products (biz ids + count).
    enforce_create_product does another _count_products after resolve;
    pass extra_product_counts=1 (or more) for those follow-up pairs.
    """
    effects = [
        MagicMock(__iter__=lambda self: iter([sub])),
        MagicMock(one=lambda: biz),
        MagicMock(one=lambda: staff),
        *_product_count_effects(products),
    ]
    for _ in range(extra_product_counts):
        effects.extend(_product_count_effects(products))
    db = AsyncMock()
    db.exec = AsyncMock(side_effect=effects)
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
            MagicMock(all=lambda: []),
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
    db = _db_with_sub_plan(sub, plan, products=2, extra_product_counts=1)
    with pytest.raises(HTTPException) as exc:
        await svc.enforce_create_product(db, sub.organization_id)
    assert exc.value.status_code in (402, 403)
    assert _detail_code(exc.value) == "PLAN_LIMIT_REACHED"


@pytest.mark.asyncio
async def test_enforce_create_product_allows_under_cap():
    svc = PaywallService()
    plan = _plan(limits={"max_businesses": 5, "max_staff": 10, "max_products": 10})
    sub = _sub(plan_id=plan.id)
    db = _db_with_sub_plan(sub, plan, products=3, extra_product_counts=1)
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
        i = call_n["i"]
        # _live_usage: biz count, staff count, product biz ids, product count
        if i in (1, 2):
            return MagicMock(one=lambda: 1)
        if i == 3:
            return MagicMock(all=lambda: [])
        if i == 4:
            return MagicMock(one=lambda: 1)
        # persist_usage → _load_active_sub
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

    def _no_sub_exec(_stmt=None):
        # Alternating empty sub list vs count .one() — enough for many resolve calls
        return MagicMock(
            __iter__=lambda self: iter([]),
            one=lambda: 0,
        )

    db = AsyncMock()
    db.exec = AsyncMock(side_effect=lambda *a, **k: _no_sub_exec())
    org = uuid4()
    snap = await paywall_mod.get_usage_snapshot(db, org)
    assert isinstance(snap, dict)

    with pytest.raises(HTTPException) as exc:
        await paywall_mod.require_active_subscription(db, org)
    assert exc.value.status_code == 403


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


@pytest.mark.asyncio
async def test_count_products_includes_business_scoped():
    """Legacy products counted via business_id under the org."""
    svc = PaywallService()
    org = uuid4()
    bid = uuid4()
    db = AsyncMock()
    db.exec = AsyncMock(
        side_effect=[
            MagicMock(all=lambda: [bid]),
            MagicMock(one=lambda: 42),
        ]
    )
    n = await svc._count_products(db, org)
    assert n == 42
    assert db.exec.await_count == 2


@pytest.mark.asyncio
async def test_count_products_org_id_only_when_no_branches():
    svc = PaywallService()
    db = AsyncMock()
    db.exec = AsyncMock(
        side_effect=[
            MagicMock(all=lambda: []),
            MagicMock(one=lambda: 7),
        ]
    )
    n = await svc._count_products(db, uuid4())
    assert n == 7
