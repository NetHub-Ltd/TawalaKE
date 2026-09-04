"""Near-realtime dashboard updates via Redis pub/sub → WebSocket."""
from __future__ import annotations

import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from loguru import logger

from app.core.config import settings
from app.core.redis_client import redis_manager
from app.core.session import AsyncSessionLocal
from app.services.analytics_rollup import REDIS_CHANNEL_PREFIX
from sqlmodel import select
from app.models.models import Staff, StaffBusinessAssignment

router = APIRouter()


async def _staff_from_token(token: str) -> Staff | None:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            audience=settings.audience,
            issuer=settings.issuer,
        )
        sub = payload.get("sub")
        if not sub:
            return None
        async with AsyncSessionLocal() as db:
            staff = (
                await db.exec(select(Staff).where(Staff.id == UUID(str(sub))))
            ).one_or_none()
            return staff
    except (JWTError, ValueError, Exception) as e:
        logger.debug("ws auth failed: {}", e)
        return None


async def _can_access_business(staff: Staff, business_id: UUID) -> bool:
    if not staff:
        return False
    # Owners/managers often see all org businesses; assignment check is minimum
    async with AsyncSessionLocal() as db:
        row = (
            await db.exec(
                select(StaffBusinessAssignment).where(
                    StaffBusinessAssignment.staff_id == staff.id,
                    StaffBusinessAssignment.business_id == business_id,
                )
            )
        ).first()
        if row:
            return True
        # Fallback: same org + elevated role
        from app.models.models import StaffRole
        role = getattr(staff, "role", None)
        role_val = getattr(role, "value", str(role or "")).upper()
        if role_val in ("OWNER", "ADMIN", "MANAGER") and staff.organization_id:
            from app.models.models import Business
            biz = (
                await db.exec(select(Business).where(Business.id == business_id))
            ).one_or_none()
            if biz and biz.organization_id == staff.organization_id:
                return True
        return False


@router.websocket("/ws/business/{business_id}/dashboard")
async def dashboard_ws(websocket: WebSocket, business_id: UUID):
    """
    Subscribe to analytics.rollup.updated events for a business.

    Client connects with `?token=<access_jwt>`.
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    staff = await _staff_from_token(token)
    if not staff or not await _can_access_business(staff, business_id):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    channel = f"{REDIS_CHANNEL_PREFIX}{business_id}"
    redis = redis_manager.get_async_client()
    pubsub = redis.pubsub()
    await pubsub.subscribe(channel)

    try:
        await websocket.send_json(
            {
                "type": "analytics.subscribed",
                "business_id": str(business_id),
                "channel": channel,
            }
        )
        while True:
            # Parallel: detect client disconnect + redis messages
            message = await pubsub.get_message(
                ignore_subscribe_messages=True, timeout=1.0
            )
            if message and message.get("type") == "message":
                data = message.get("data")
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                try:
                    payload = json.loads(data) if isinstance(data, str) else data
                except json.JSONDecodeError:
                    payload = {"raw": data}
                await websocket.send_json(payload)

            # Ping client disconnect via receive with short timeout
            try:
                client_msg = await asyncio.wait_for(
                    websocket.receive_text(), timeout=0.01
                )
                if client_msg == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                pass
            except WebSocketDisconnect:
                break
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning("dashboard ws error business={}: {}", business_id, e)
    finally:
        try:
            await pubsub.unsubscribe(channel)
            await pubsub.close()
        except Exception:
            pass
