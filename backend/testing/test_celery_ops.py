"""Unit tests for Celery inspect/replay helpers."""
from __future__ import annotations

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from app.services import celery_ops as mod


def test_inspect_cluster_when_inspect_none():
    with patch.object(mod.celery_app.control, "inspect", return_value=None):
        data = mod.inspect_cluster()
    assert data["ok"] is False
    assert "unavailable" in data["error"].lower()
    assert "known_tasks" in data
    assert "tawala.documents" in data["queues"] or any(
        "documents" in q for q in data["queues"]
    )


def test_inspect_cluster_when_inspect_raises():
    insp = MagicMock()
    insp.active.side_effect = RuntimeError("broker down")
    with patch.object(mod.celery_app.control, "inspect", return_value=insp):
        data = mod.inspect_cluster()
    assert data["ok"] is False
    assert "broker down" in data["error"]


def test_inspect_cluster_success_flattens_active_reserved():
    insp = MagicMock()
    insp.active.return_value = {
        "w1": [
            {
                "id": "t1",
                "name": "documents.generate_financial_document",
                "args": ["s1"],
                "kwargs": {},
                "time_start": 1.0,
            }
        ]
    }
    insp.reserved.return_value = {
        "w1": [{"id": "t2", "name": "dashboard.backfill_business_days", "args": [], "kwargs": {}}]
    }
    insp.scheduled.return_value = {}
    insp.registered.return_value = {"w1": ["documents.generate_financial_document"]}
    insp.stats.return_value = {"w1": {"pool": {"max-concurrency": 2}, "total": {}}}
    insp.ping.return_value = {"w1": {"ok": "pong"}}
    with patch.object(mod.celery_app.control, "inspect", return_value=insp):
        data = mod.inspect_cluster()
    assert data["ok"] is True
    assert data["worker_count"] == 1
    assert data["workers"] == ["w1"]
    assert len(data["active"]) == 1
    assert data["active"][0]["id"] == "t1"
    assert len(data["reserved"]) == 1
    assert data["broker"] == "redis"


def test_replay_unknown_task():
    with pytest.raises(ValueError, match="Unknown"):
        mod.replay_task("not.a.task", {})


def test_replay_document_requires_sale_id():
    with pytest.raises(ValueError, match="sale_id"):
        mod.replay_task("documents.generate_financial_document", {})


def test_replay_document_success():
    sale_id = uuid4()
    async_result = MagicMock()
    async_result.id = "celery-doc-1"
    with patch.object(mod.celery_app, "send_task", return_value=async_result) as send:
        out = mod.replay_task(
            "documents.generate_financial_document", {"sale_id": str(sale_id)}
        )
    assert out["task_id"] == "celery-doc-1"
    assert out["sale_id"] == str(sale_id)
    send.assert_called_once()
    assert send.call_args.kwargs["queue"] == "tawala.documents"


def test_replay_dashboard_requires_business_id():
    with pytest.raises(ValueError, match="business_id"):
        mod.replay_task("dashboard.backfill_business_days", {})


def test_replay_dashboard_with_dates():
    biz = uuid4()
    async_result = MagicMock()
    async_result.id = "celery-dash-1"
    with patch.object(mod.celery_app, "send_task", return_value=async_result) as send:
        out = mod.replay_task(
            "dashboard.backfill_business_days",
            {
                "business_id": str(biz),
                "start_date": "2026-01-01",
                "end_date": "2026-01-31",
            },
        )
    assert out["task_id"] == "celery-dash-1"
    assert out["business_id"] == str(biz)
    args = send.call_args.kwargs.get("args") or send.call_args[1].get("args")
    if args is None:
        args = send.call_args[0][1] if len(send.call_args[0]) > 1 else send.call_args.kwargs["args"]
    # send_task(name, args=...)
    called_args = send.call_args.kwargs.get("args")
    assert called_args[0] == str(biz)
    assert "2026-01-01" in called_args


def test_job_to_dict_from_routes():
    from datetime import datetime, timezone
    from types import SimpleNamespace
    from uuid import uuid4
    from app.api.routes.jobs import _job_to_dict

    jid = uuid4()
    j = SimpleNamespace(
        id=jid,
        celery_task_id="c1",
        name="documents.generate_financial_document",
        status="SUCCESS",
        organization_id=uuid4(),
        business_id=None,
        sale_id=uuid4(),
        triggered_by_id=None,
        triggered_by_role="SYSTEM",
        triggered_by_email=None,
        args_summary={"sale_id": "x"},
        error_message=None,
        result_preview="ok",
        retries=0,
        started_at=datetime.now(timezone.utc),
        finished_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    d = _job_to_dict(j)
    assert d["id"] == str(jid)
    assert d["status"] == "SUCCESS"
    assert d["result_preview"] == "ok"
    assert d["organization_id"]
