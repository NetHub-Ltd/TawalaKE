"""Unit tests for plan-based paywall enforcement."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services import paywall as paywall_service
from app.services.paywall import (
    LIMIT_BUSINESSES,
    LIMIT_PRODUCTS,
    LIMIT_STAFF,
    Entitlements,
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
    }
    return p


def _sub(*, plan_id=None, active=True, end_offset_days=7):
    s = MagicMock()
    s.id = uuid4()
    s.organization_id = uuid4()
    s.plan_id = plan_id
    s.active = active
    now = datetime.now(timezone.utc)
    s.start_date = now - timedelta(days=1)
    s.end_date = now + timedelta(days=end_offset_days) if end_offset_days is not None else None
    return s


@pytest.mark.asyncio
async def test_resolve_no_subscription():
    db = AsyncMock()
    db.exec = AsyncMock(return_value=MagicMock(all=lambda: [], __iter__=lambda self: iter([])))
    # list() on exec result
    result = MagicMock()
    result.__iter__ = lambda self: iter([])
    db.exec = AsyncMock(return_value=result)

    org_id = uuid4()
    ent = await paywall_service.resolve_entitlements(db, org_id)
    assert ent.active is False
    assert ent.plan_code == "NONE"
    assert ent.limits == {}


@pytest.mark.asyncio
async def test_resolve_with_plan():
    plan = _plan(code="NDOVU", limits={"max_staff": 25}, features={"full_inventory": True})
    sub = _sub(plan_id=plan.id)

    result = MagicMock()
    result.__iter__ = lambda self: iter([sub])
    db = AsyncMock()
    db.exec = AsyncMock(return_value=result)
    db.get = AsyncMock(return_value=plan)

    ent = await paywall_service.resolve_entitlements(db, sub.organization_id)
    assert ent.active is True
    assert ent.plan_code == "NDOVU"
    assert ent.limit(LIMIT_STAFF) == 25
    assert ent.has_feature("full_inventory") is True
    assert ent.has_feature("api_access") is False


@pytest.mark.asyncio
async def test_require_feature_denied():
    plan = _plan(features={"full_inventory": False})
    sub = _sub(plan_id=plan.id)
    result = MagicMock()
    result.__iter__ = lambda self: iter([sub])
    db = AsyncMock()
    db.exec = AsyncMock(return_value=result)
    db.get = AsyncMock(return_value=plan)

    with pytest.raises(HTTPException) as exc:
        await paywall_service.require_feature(db, sub.organization_id, "full_inventory")
    assert exc.value.status_code == 403
    assert exc.value.detail["code"] == "FEATURE_NOT_AVAILABLE"


@pytest.mark.asyncio
async def test_check_limit_allows_under_cap(monkeypatch):
    plan = _plan(limits={"max_products": 300})
    sub = _sub(plan_id=plan.id)
    result = MagicMock()
    result.__iter__ = lambda self: iter([sub])
    db = AsyncMock()
    db.exec = AsyncMock(return_value=result)
    db.get = AsyncMock(return_value=plan)

    async def _fake_count(db, org_id):
        return 10

    monkeypatch.setattr(paywall_service, "_count_products", _fake_count)
    ent = await paywall_service.check_limit(db, sub.organization_id, LIMIT_PRODUCTS)
    assert ent.plan_code == "BASIC"


@pytest.mark.asyncio
async def test_check_limit_blocks_at_cap(monkeypatch):
    plan = _plan(limits={"max_businesses": 1})
    sub = _sub(plan_id=plan.id)
    result = MagicMock()
    result.__iter__ = lambda self: iter([sub])
    db = AsyncMock()
    db.exec = AsyncMock(return_value=result)
    db.get = AsyncMock(return_value=plan)

    async def _fake_count(db, org_id):
        return 1

    monkeypatch.setattr(paywall_service, "_count_businesses", _fake_count)
    with pytest.raises(HTTPException) as exc:
        await paywall_service.check_limit(db, sub.organization_id, LIMIT_BUSINESSES)
    assert exc.value.status_code == 402
    assert exc.value.detail["code"] == "PLAN_LIMIT_REACHED"
    assert exc.value.detail["current"] == 1
    assert exc.value.detail["maximum"] == 1


@pytest.mark.asyncio
async def test_expired_subscription_treated_inactive():
    plan = _plan()
    sub = _sub(plan_id=plan.id, end_offset_days=-2)
    result = MagicMock()
    result.__iter__ = lambda self: iter([sub])
    db = AsyncMock()
    db.exec = AsyncMock(return_value=result)

    ent = await paywall_service.resolve_entitlements(db, sub.organization_id)
    assert ent.active is False


def test_has_feature_grades():
    ent = Entitlements(
        organization_id=uuid4(),
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
    assert ent.has_feature("missing") is False
