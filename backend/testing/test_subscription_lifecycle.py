"""Trial / grace / one-trial-ever unit tests."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.crud import subscription as sub_crud


def _make_sub(
    *,
    is_trial=True,
    end_offset_days=7,
    grace_offset_days=None,
    active=True,
):
    s = MagicMock()
    s.id = uuid4()
    s.organization_id = uuid4()
    s.plan_id = uuid4()
    s.active = active
    s.is_trial = is_trial
    s.current_usage = {}
    now = datetime.now(timezone.utc)
    s.start_date = now - timedelta(days=1)
    s.end_date = now + timedelta(days=end_offset_days)
    if grace_offset_days is not None:
        s.grace_end_date = now + timedelta(days=grace_offset_days)
    else:
        s.grace_end_date = None
    return s


def test_access_phase_active_grace_locked():
    now = datetime.now(timezone.utc)
    assert sub_crud.access_phase_for(_make_sub(end_offset_days=3), now) == "active"
    assert (
        sub_crud.access_phase_for(
            _make_sub(end_offset_days=-1, is_trial=True, grace_offset_days=4), now
        )
        == "grace"
    )
    assert (
        sub_crud.access_phase_for(
            _make_sub(end_offset_days=-10, is_trial=True, grace_offset_days=-1), now
        )
        == "locked"
    )
    assert sub_crud.access_phase_for(None, now) == "none"
    inactive = _make_sub(active=False)
    assert sub_crud.access_phase_for(inactive, now) == "none"


def test_grace_end_defaults_for_trial():
    sub = _make_sub(end_offset_days=-1, is_trial=True)
    sub.grace_end_date = None
    g = sub_crud._grace_end_for(sub)
    assert g is not None
    assert g == sub.end_date + timedelta(days=sub_crud.GRACE_DAYS)


def test_grace_end_explicit_wins():
    sub = _make_sub(end_offset_days=-1, is_trial=True, grace_offset_days=10)
    g = sub_crud._grace_end_for(sub)
    assert g == sub.grace_end_date


def test_build_access_status_trial_eligible():
    status = sub_crud.build_access_status(None)
    assert status["access_phase"] == "none"
    assert status["trial_eligible"] is True
    assert status["trial_consumed"] is False


def test_build_access_status_grace_days():
    sub = _make_sub(end_offset_days=-1, is_trial=True, grace_offset_days=5)
    status = sub_crud.build_access_status(sub)
    assert status["access_phase"] == "grace"
    assert status["is_trial"] is True
    assert status["grace_days_remaining"] is not None


@pytest.mark.asyncio
async def test_org_has_consumed_trial_from_org_flag():
    org_id = uuid4()
    org = MagicMock()
    org.trial_consumed_at = datetime.now(timezone.utc)
    db = AsyncMock()
    db.get = AsyncMock(return_value=org)
    assert await sub_crud.org_has_consumed_trial(db, org_id) is True


@pytest.mark.asyncio
async def test_org_has_consumed_trial_from_is_trial_row():
    org_id = uuid4()
    org = MagicMock()
    org.trial_consumed_at = None
    sub = _make_sub(is_trial=True)
    db = AsyncMock()
    db.get = AsyncMock(return_value=org)
    db.exec = AsyncMock(return_value=MagicMock(first=lambda: sub))
    assert await sub_crud.org_has_consumed_trial(db, org_id) is True


@pytest.mark.asyncio
async def test_start_plan_trial_rejects_second_trial():
    org_id = uuid4()
    db = AsyncMock()
    with patch.object(sub_crud, "org_has_consumed_trial", AsyncMock(return_value=True)):
        with pytest.raises(HTTPException) as exc:
            await sub_crud.start_plan_trial(db, org_id, "NDOVU")
        assert exc.value.status_code == 400
        assert "already used" in str(exc.value.detail).lower()


@pytest.mark.asyncio
async def test_start_plan_trial_rejects_ineligible_plan():
    with pytest.raises(HTTPException) as exc:
        await sub_crud.start_plan_trial(AsyncMock(), uuid4(), "ENTERPRISE")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_extend_grace_period_requires_subscription():
    db = AsyncMock()
    with patch.object(sub_crud, "get_latest_subscription", AsyncMock(return_value=None)):
        with pytest.raises(HTTPException) as exc:
            await sub_crud.extend_grace_period(db, uuid4(), days=7)
        assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_extend_grace_period_updates_date():
    sub = _make_sub(end_offset_days=-5, is_trial=True, grace_offset_days=-1)
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    with patch.object(sub_crud, "get_latest_subscription", AsyncMock(return_value=sub)):
        with patch.object(sub_crud, "_invalidate_org", AsyncMock()):
            out = await sub_crud.extend_grace_period(db, sub.organization_id, days=7)
    assert out.grace_end_date is not None
    assert out.active is True
    db.add.assert_called()
    db.commit.assert_awaited()


@pytest.mark.asyncio
async def test_extend_grace_rejects_bad_days():
    with pytest.raises(HTTPException) as exc:
        await sub_crud.extend_grace_period(AsyncMock(), uuid4(), days=0)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_get_active_subscription_includes_grace():
    sub = _make_sub(end_offset_days=-1, is_trial=True, grace_offset_days=3)
    db = AsyncMock()
    db.exec = AsyncMock(return_value=MagicMock(__iter__=lambda self: iter([sub])))
    found = await sub_crud.get_active_subscription(db, sub.organization_id)
    assert found is sub


@pytest.mark.asyncio
async def test_get_active_subscription_skips_locked():
    sub = _make_sub(end_offset_days=-10, is_trial=True, grace_offset_days=-2)
    db = AsyncMock()
    db.exec = AsyncMock(return_value=MagicMock(__iter__=lambda self: iter([sub])))
    found = await sub_crud.get_active_subscription(db, sub.organization_id)
    assert found is None


def test_profile_looks_complete():
    org = MagicMock()
    org.name = "Acme Ltd"
    org.phone = "0700000000"
    org.address = "Nairobi"
    assert sub_crud.profile_looks_complete(org) is True
    org.name = "x-workspace"
    assert sub_crud.profile_looks_complete(org) is False


@pytest.mark.asyncio
async def test_list_orgs_in_grace_filters():
    grace_sub = _make_sub(end_offset_days=-1, is_trial=True, grace_offset_days=3)
    locked_sub = _make_sub(end_offset_days=-10, is_trial=True, grace_offset_days=-2)
    org = MagicMock()
    org.id = grace_sub.organization_id
    plan = MagicMock()
    db = AsyncMock()
    db.exec = AsyncMock(return_value=MagicMock(__iter__=lambda self: iter([grace_sub, locked_sub])))

    async def _get(model, oid):
        if oid == grace_sub.organization_id:
            return org
        if oid == grace_sub.plan_id:
            return plan
        return None

    db.get = AsyncMock(side_effect=_get)
    rows = await sub_crud.list_orgs_in_grace(db)
    assert len(rows) == 1
    assert rows[0][0] is grace_sub
