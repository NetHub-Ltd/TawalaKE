"""WebSocket delivery for support conversation messages (Redis pub/sub)."""
from __future__ import annotations

import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from sqlmodel import select

from app.core.config import settings
from app.core.redis_client import redis_manager
from app.core.session import AsyncSessionLocal
from app.models.models import (
    MessagingChannel,
    Staff,
    SupportConversation,
    SupportConversationParticipant,
)
from app.services.messaging import hash_public_token, support_channel
from app.utils.logging import logger

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
            return (
                await db.exec(select(Staff).where(Staff.id == UUID(str(sub))))
            ).one_or_none()
    except (JWTError, ValueError, Exception) as e:
        logger.debug("support ws staff auth failed: {}", e)
        return None


@router.websocket("/ws/support/public/{token}")
async def public_support_ws(websocket: WebSocket, token: str):
    """Public thread: auth by signed access token (same as HTTP thread link)."""
    th = hash_public_token(token)
    async with AsyncSessionLocal() as db:
        conv = (
            await db.exec(
                select(SupportConversation).where(
                    SupportConversation.public_access_token_hash == th,
                    SupportConversation.channel == MessagingChannel.PUBLIC_SUPPORT,
                    SupportConversation.deleted_at.is_(None),
                )
            )
        ).first()
        if not conv:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        conversation_id = conv.id

    await websocket.accept()
    await _relay(websocket, conversation_id)


@router.websocket("/ws/support/org/{conversation_id}")
async def org_support_ws(websocket: WebSocket, conversation_id: UUID):
    """Org support or internal: staff JWT in query ?token=."""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    staff = await _staff_from_token(token)
    if not staff or not staff.organization_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    async with AsyncSessionLocal() as db:
        conv = (
            await db.exec(
                select(SupportConversation).where(
                    SupportConversation.id == conversation_id,
                    SupportConversation.organization_id == staff.organization_id,
                    SupportConversation.deleted_at.is_(None),
                )
            )
        ).first()
        if not conv:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        if conv.channel == MessagingChannel.ORG_INTERNAL:
            part = (
                await db.exec(
                    select(SupportConversationParticipant).where(
                        SupportConversationParticipant.conversation_id == conversation_id,
                        SupportConversationParticipant.staff_id == staff.id,
                        SupportConversationParticipant.deleted_at.is_(None),
                    )
                )
            ).first()
            if not part:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        elif conv.channel != MessagingChannel.ORG_SUPPORT:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await websocket.accept()
    await _relay(websocket, conversation_id)




async def _platform_user_from_token(token: str):
    """Validate platform JWT (kind=platform). Returns PlatformUser or None."""
    try:
        from app.core.security import security
        from app.models.models import PlatformUser
        # verify_token is async and may need redis — decode claims only for WS
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            audience=settings.audience,
            issuer=settings.issuer,
        )
        if payload.get("kind") != "platform":
            return None
        sub = payload.get("sub")
        if not sub:
            return None
        async with AsyncSessionLocal() as db:
            user = (
                await db.exec(
                    select(PlatformUser).where(
                        PlatformUser.id == UUID(str(sub)),
                        PlatformUser.deleted_at.is_(None),
                    )
                )
            ).one_or_none()
            if not user or not user.active:
                return None
            return user
    except (JWTError, ValueError, Exception) as e:
        logger.debug("support ws platform auth failed: {}", e)
        return None


@router.websocket("/ws/support/platform/{conversation_id}")
async def platform_support_ws(websocket: WebSocket, conversation_id: UUID):
    """Platform operator: JWT ?token= with kind=platform; PUBLIC or ORG_SUPPORT only."""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    user = await _platform_user_from_token(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    async with AsyncSessionLocal() as db:
        conv = (
            await db.exec(
                select(SupportConversation).where(
                    SupportConversation.id == conversation_id,
                    SupportConversation.deleted_at.is_(None),
                    SupportConversation.channel.in_(
                        [
                            MessagingChannel.PUBLIC_SUPPORT,
                            MessagingChannel.ORG_SUPPORT,
                        ]
                    ),
                )
            )
        ).first()
        if not conv:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    await websocket.accept()
    await _relay(websocket, conversation_id)

async def _relay(websocket: WebSocket, conversation_id: UUID) -> None:
    channel = support_channel(conversation_id)
    client = redis_manager.get_async_client()
    pubsub = client.pubsub()
    await pubsub.subscribe(channel)
    try:
        await websocket.send_json(
            {
                "type": "support.subscribed",
                "conversation_id": str(conversation_id),
            }
        )
        while True:
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
            try:
                evt = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                if evt == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                pass
            except WebSocketDisconnect:
                break
    except WebSocketDisconnect:
        pass
    finally:
        try:
            await pubsub.unsubscribe(channel)
            await pubsub.close()
        except Exception:
            pass
