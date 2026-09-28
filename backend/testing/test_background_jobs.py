"""Unit tests for durable background job tracking service."""
from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.services import background_jobs as mod


def test_safe_summary_strips_secrets_and_coerces():
    raw = {
        "sale_id": str(uuid4()),
        "password": "secret",
        "token": "abc",
        "api_key": "k",
        "SECRET": "x",
        "count": 3,
        "ok": True,
        "nested": {"a": 1},
        "none": None,
    }
    out = mod._safe_summary(raw)
    assert "password" not in out
    assert "token" not in out
    assert "api_key" not in out
    assert "SECRET" not in out
    assert out["count"] == 3
    assert out["ok"] is True
    assert out["none"] is None
    assert isinstance(out["nested"], str)
    assert out["sale_id"]


def test_safe_summary_empty():
    assert mod._safe_summary(None) == {}
    assert mod._safe_summary({}) == {}


def test_now_returns_aware_utc():
    n = mod._now()
    assert isinstance(n, datetime)
    assert n.tzinfo is not None


@pytest.mark.asyncio
async def test_publish_swallows_redis_errors():
    with patch(
        "app.core.redis_client.redis_manager.get_async_client",
        side_effect=RuntimeError("no redis"),
    ):
        await mod._publish({"type": "x"})  # must not raise


@pytest.mark.asyncio
async def test_publish_success():
    client = AsyncMock()
    client.publish = AsyncMock(return_value=1)
    fake_mgr = MagicMock()
    fake_mgr.get_async_client.return_value = client
    with patch("app.core.redis_client.redis_manager", fake_mgr):
        await mod._publish({"type": "job_updated", "job": {"id": "1"}})
    client.publish.assert_awaited()
    args = client.publish.await_args
    assert args[0][0] == mod.REDIS_JOBS_CHANNEL


@pytest.mark.asyncio
async def test_record_job_event_inserts_new_row():
    job_id = uuid4()

    session = AsyncMock()
    exec_result = MagicMock()
    exec_result.one_or_none.return_value = None
    session.exec = AsyncMock(return_value=exec_result)
    added = []

    def _add(obj):
        added.append(obj)
        if getattr(obj, "id", None) is None:
            object.__setattr__(obj, "id", job_id) if False else setattr(obj, "id", job_id)

    session.add = MagicMock(side_effect=_add)
    session.commit = AsyncMock()

    async def _refresh(obj):
        if getattr(obj, "id", None) is None:
            setattr(obj, "id", job_id)
        if not getattr(obj, "created_at", None):
            setattr(obj, "created_at", datetime.now(timezone.utc))

    session.refresh = AsyncMock(side_effect=_refresh)

    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=session)
    cm.__aexit__ = AsyncMock(return_value=None)

    with patch.object(mod, "AsyncSessionLocal", return_value=cm):
        with patch.object(mod, "_publish", new_callable=AsyncMock) as pub:
            result = await mod.record_job_event(
                celery_task_id="task-1",
                name="documents.generate_financial_document",
                status="STARTED",
                args_summary={"sale_id": "x", "password": "nope"},
            )
    assert result is not None  # model assigns its own UUID
    session.add.assert_called()
    session.commit.assert_awaited()
    pub.assert_awaited()
    assert added, "expected BackgroundJob instance added"
    assert "password" not in (getattr(added[0], "args_summary", None) or {})


@pytest.mark.asyncio
async def test_record_job_event_updates_existing():
    job_id = uuid4()
    existing = SimpleNamespace(
        id=job_id,
        celery_task_id="task-2",
        name="documents.generate_financial_document",
        status="PENDING",
        organization_id=None,
        business_id=None,
        sale_id=None,
        error_message=None,
        retries=0,
        started_at=None,
        finished_at=None,
        created_at=datetime.now(timezone.utc),
        triggered_by_email=None,
        triggered_by_role="SYSTEM",
        args_summary={"sale_id": "old"},
        result_preview=None,
    )
    session = AsyncMock()
    exec_result = MagicMock()
    exec_result.one_or_none.return_value = existing
    session.exec = AsyncMock(return_value=exec_result)
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()

    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=session)
    cm.__aexit__ = AsyncMock(return_value=None)

    org = uuid4()
    with patch.object(mod, "AsyncSessionLocal", return_value=cm):
        with patch.object(mod, "_publish", new_callable=AsyncMock):
            result = await mod.record_job_event(
                celery_task_id="task-2",
                name="documents.generate_financial_document",
                status="SUCCESS",
                organization_id=org,
                result_preview="ok",
                retries=1,
            )
    assert result == job_id
    assert existing.status == "SUCCESS"
    assert existing.organization_id == org
    assert existing.finished_at is not None
    assert existing.retries == 1


@pytest.mark.asyncio
async def test_record_job_event_failure_sets_error():
    job_id = uuid4()
    existing = SimpleNamespace(
        id=job_id,
        celery_task_id="task-3",
        name="dashboard.backfill_business_days",
        status="STARTED",
        organization_id=uuid4(),
        business_id=uuid4(),
        sale_id=None,
        error_message=None,
        retries=0,
        started_at=datetime.now(timezone.utc),
        finished_at=None,
        created_at=datetime.now(timezone.utc),
        triggered_by_email=None,
        triggered_by_role="SYSTEM",
        args_summary={},
        result_preview=None,
    )
    session = AsyncMock()
    exec_result = MagicMock()
    exec_result.one_or_none.return_value = existing
    session.exec = AsyncMock(return_value=exec_result)
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=session)
    cm.__aexit__ = AsyncMock(return_value=None)

    with patch.object(mod, "AsyncSessionLocal", return_value=cm):
        with patch.object(mod, "_publish", new_callable=AsyncMock):
            result = await mod.record_job_event(
                celery_task_id="task-3",
                name="dashboard.backfill_business_days",
                status="FAILURE",
                error_message="boom",
            )
    assert result == job_id
    assert existing.status == "FAILURE"
    assert existing.error_message == "boom"
    assert existing.finished_at is not None


@pytest.mark.asyncio
async def test_record_job_event_swallows_db_errors():
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(side_effect=RuntimeError("db down"))
    cm.__aexit__ = AsyncMock(return_value=None)
    with patch.object(mod, "AsyncSessionLocal", return_value=cm):
        result = await mod.record_job_event(
            celery_task_id="t",
            name="documents.generate_financial_document",
            status="PENDING",
        )
    assert result is None


def test_record_job_event_sync_returns_none_on_failure():
    with patch.object(mod, "record_job_event", side_effect=RuntimeError("fail")):
        # asyncio.run will raise; wrapper catches
        with patch("asyncio.run", side_effect=RuntimeError("fail")):
            assert mod.record_job_event_sync(name="x", status="PENDING", celery_task_id=None) is None


def test_record_job_event_sync_success():
    expected = uuid4()
    with patch("asyncio.run", return_value=expected):
        assert (
            mod.record_job_event_sync(
                celery_task_id="t",
                name="documents.generate_financial_document",
                status="PENDING",
            )
            == expected
        )


@pytest.mark.asyncio
async def test_record_job_event_update_fills_optional_ids_and_args():
    """Cover update branches: business_id, sale_id, args merge, retries, started_at already set."""
    job_id = uuid4()
    org = uuid4()
    biz = uuid4()
    sale = uuid4()
    existing = SimpleNamespace(
        id=job_id,
        celery_task_id="task-merge",
        name="documents.generate_financial_document",
        status="STARTED",
        organization_id=org,
        business_id=None,
        sale_id=None,
        error_message=None,
        retries=0,
        started_at=datetime.now(timezone.utc),  # already set — skip re-set
        finished_at=None,
        created_at=datetime.now(timezone.utc),
        triggered_by_email=None,
        triggered_by_role="SYSTEM",
        args_summary={"sale_id": "old"},
        result_preview=None,
    )
    session = AsyncMock()
    exec_result = MagicMock()
    exec_result.one_or_none.return_value = existing
    session.exec = AsyncMock(return_value=exec_result)
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=session)
    cm.__aexit__ = AsyncMock(return_value=None)

    with patch.object(mod, "AsyncSessionLocal", return_value=cm):
        with patch.object(mod, "_publish", new_callable=AsyncMock):
            result = await mod.record_job_event(
                celery_task_id="task-merge",
                name="documents.generate_financial_document",
                status="RETRY",
                business_id=biz,
                sale_id=sale,
                args_summary={"attempt": 2},
                retries=2,
            )
    assert result == job_id
    assert existing.business_id == biz
    assert existing.sale_id == sale
    assert existing.retries == 2
    assert existing.args_summary.get("attempt") == 2
    assert existing.args_summary.get("sale_id") == "old"
    assert existing.status == "RETRY"


@pytest.mark.asyncio
async def test_record_job_event_insert_success_sets_finished():
    """Insert with SUCCESS should set finished_at (and not require prior row)."""
    session = AsyncMock()
    exec_result = MagicMock()
    exec_result.one_or_none.return_value = None
    session.exec = AsyncMock(return_value=exec_result)
    added = []
    session.add = MagicMock(side_effect=lambda o: added.append(o))
    session.commit = AsyncMock()

    async def _refresh(obj):
        if getattr(obj, "id", None) is None:
            setattr(obj, "id", uuid4())
        if not getattr(obj, "created_at", None):
            setattr(obj, "created_at", datetime.now(timezone.utc))

    session.refresh = AsyncMock(side_effect=_refresh)
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=session)
    cm.__aexit__ = AsyncMock(return_value=None)

    with patch.object(mod, "AsyncSessionLocal", return_value=cm):
        with patch.object(mod, "_publish", new_callable=AsyncMock):
            result = await mod.record_job_event(
                celery_task_id="task-ok",
                name="dashboard.backfill_business_days",
                status="SUCCESS",
                result_preview="done",
            )
    assert result is not None
    assert added[0].status == "SUCCESS"
    assert added[0].finished_at is not None
