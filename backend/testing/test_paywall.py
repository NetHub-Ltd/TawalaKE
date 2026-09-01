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
