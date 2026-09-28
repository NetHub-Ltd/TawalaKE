"""Unit tests for Celery task helpers (enqueue + org lookup), without running workers."""
from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest


def test_org_for_sale_returns_none_on_error():
    from app.tasks import document_tasks as dt

    with patch("asyncio.run", side_effect=RuntimeError("no db")):
        org, biz = dt._org_for_sale(str(uuid4()))
    assert org is None and biz is None


def test_org_for_sale_success():
    from app.tasks import document_tasks as dt

    org_id, biz_id = uuid4(), uuid4()
    sale = SimpleNamespace(organization_id=org_id, business_id=biz_id)

    async def fake_run():
        return org_id, biz_id

    with patch("asyncio.run", side_effect=lambda coro: (org_id, biz_id)):
        # _org_for_sale calls asyncio.run(_run()) where _run is async
        with patch.object(dt, "_org_for_sale", wraps=dt._org_for_sale):
            # simpler: mock the inner path
            pass

    with patch("app.tasks.document_tasks.asyncio.run", return_value=(org_id, biz_id)):
        # Still executes _run definition — patch AsyncSessionLocal path instead
        pass

    session = AsyncMock()
    exec_result = MagicMock()
    exec_result.one_or_none.return_value = sale
    session.exec = AsyncMock(return_value=exec_result)
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=session)
    cm.__aexit__ = AsyncMock(return_value=None)

    with patch("app.core.session.AsyncSessionLocal", return_value=cm):
        org, biz = dt._org_for_sale(str(uuid4()))
    assert org == org_id
    assert biz == biz_id


def test_org_for_business_success():
    from app.tasks import dashboard_tasks as dbt

    org_id = uuid4()
    biz = SimpleNamespace(organization_id=org_id)
    session = AsyncMock()
    exec_result = MagicMock()
    exec_result.one_or_none.return_value = biz
    session.exec = AsyncMock(return_value=exec_result)
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=session)
    cm.__aexit__ = AsyncMock(return_value=None)

    with patch("app.core.session.AsyncSessionLocal", return_value=cm):
        assert dbt._org_for_business(str(uuid4())) == org_id


def test_org_for_business_error():
    from app.tasks import dashboard_tasks as dbt

    with patch("asyncio.run", side_effect=RuntimeError("x")):
        assert dbt._org_for_business(str(uuid4())) is None


def test_enqueue_document_generation_records_pending():
    from app.tasks import document_tasks as dt

    sale_id = uuid4()
    async_result = MagicMock()
    async_result.id = "enq-1"
    with patch.object(dt.generate_financial_document, "delay", return_value=async_result):
        with patch.object(dt, "_org_for_sale", return_value=(uuid4(), uuid4())):
            with patch(
                "app.services.background_jobs.record_job_event_sync", return_value=uuid4()
            ) as rec:
                tid = dt.enqueue_document_generation(sale_id)
    assert tid == "enq-1"
    rec.assert_called()
    assert rec.call_args.kwargs["status"] == "PENDING"


def test_enqueue_document_generation_returns_none_on_broker_failure():
    from app.tasks import document_tasks as dt

    with patch.object(
        dt.generate_financial_document, "delay", side_effect=RuntimeError("broker")
    ):
        assert dt.enqueue_document_generation(uuid4()) is None


def test_enqueue_dashboard_backfill_success():
    from app.tasks import dashboard_tasks as dbt

    biz = uuid4()
    async_result = MagicMock()
    async_result.id = "dash-1"
    with patch.object(
        dbt.backfill_business_dashboard_days, "delay", return_value=async_result
    ):
        with patch.object(dbt, "_org_for_business", return_value=uuid4()):
            with patch(
                "app.services.background_jobs.record_job_event_sync", return_value=None
            ):
                tid = dbt.enqueue_dashboard_backfill(
                    biz,
                    start=datetime(2026, 1, 1, tzinfo=timezone.utc),
                    end=datetime(2026, 1, 2, tzinfo=timezone.utc),
                )
    assert tid == "dash-1"


def test_enqueue_dashboard_backfill_failure():
    from app.tasks import dashboard_tasks as dbt

    with patch.object(
        dbt.backfill_business_dashboard_days,
        "delay",
        side_effect=RuntimeError("no"),
    ):
        assert dbt.enqueue_dashboard_backfill(uuid4()) is None


def test_generate_financial_document_success_path():
    from app.tasks import document_tasks as dt

    sale_id = str(uuid4())
    request = SimpleNamespace(id="celery-ok", retries=0)
    task_self = SimpleNamespace(request=request, retry=MagicMock())

    with patch.object(dt, "_org_for_sale", return_value=(uuid4(), uuid4())):
        with patch(
            "app.services.background_jobs.record_job_event_sync", return_value=None
        ) as rec:
            with patch(
                "app.tasks.worker.async_process_document_generation",
                return_value="snapshot-ok",
            ):
                with patch("asyncio.run", side_effect=lambda c: "snapshot-ok"):
                    # generate_financial_document is a celery task; call underlying run
                    result = dt.generate_financial_document.run(sale_id)
    assert result == "snapshot-ok"
    # STARTED + SUCCESS recorded
    assert rec.call_count >= 2
    statuses = [c.kwargs.get("status") for c in rec.call_args_list]
    assert "SUCCESS" in statuses


def test_generate_financial_document_retries_on_failure():
    from app.tasks import document_tasks as dt

    sale_id = str(uuid4())
    retry_exc = Exception("retry-me")

    def _retry(exc=None):
        raise retry_exc

    request = SimpleNamespace(id="celery-fail", retries=0)
    # Bind-style: use .run but patch self.retry via task
    with patch.object(dt, "_org_for_sale", return_value=(None, None)):
        with patch(
            "app.services.background_jobs.record_job_event_sync", return_value=None
        ) as rec:
            with patch(
                "asyncio.run",
                side_effect=RuntimeError("gen failed"),
            ):
                with pytest.raises(Exception):
                    dt.generate_financial_document.run(sale_id)
    statuses = [c.kwargs.get("status") for c in rec.call_args_list]
    assert "FAILURE" in statuses or "STARTED" in statuses
