"""Support & messaging helpers (Phase A)."""
from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timezone
from typing import Iterable, List, Optional, Sequence
from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.mailer import mailer
from app.models.models import (
    AssigneeType,
    ConversationStatus,
    MessageAuthorType,
    MessagingChannel,
    SupportConversation,
    SupportConversationParticipant,
    SupportMessage,
    VisibilityScope,
)
from app.utils.logging import logger


def hash_public_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def new_public_access_token() -> str:
    return secrets.token_urlsafe(32)


def public_thread_url(token: str) -> str:
    base = (getattr(settings, "frontend_url", None) or "https://tawala.nethub.co.ke").rstrip("/")
    return f"{base}/support/c/{token}"


async def add_participants(
    db: AsyncSession,
    conversation_id: UUID,
    staff_ids: Iterable[UUID],
) -> None:
    seen: set[UUID] = set()
    for sid in staff_ids:
        if sid in seen:
            continue
        seen.add(sid)
        db.add(
            SupportConversationParticipant(
                conversation_id=conversation_id,
                staff_id=sid,
            )
        )


async def participant_ids(db: AsyncSession, conversation_id: UUID) -> List[UUID]:
    rows = list(
        await db.exec(
            select(SupportConversationParticipant.staff_id).where(
                SupportConversationParticipant.conversation_id == conversation_id,
                SupportConversationParticipant.deleted_at.is_(None),
            )
        )
    )
    return list(rows)


async def append_message(
    db: AsyncSession,
    *,
    conversation: SupportConversation,
    body: str,
    author_type: MessageAuthorType,
    author_staff_id: Optional[UUID] = None,
    author_platform_user_id: Optional[UUID] = None,
    author_display_name: Optional[str] = None,
    author_email: Optional[str] = None,
    is_internal: bool = False,
) -> SupportMessage:
    msg = SupportMessage(
        conversation_id=conversation.id,
        body=body.strip(),
        author_type=author_type,
        author_staff_id=author_staff_id,
        author_platform_user_id=author_platform_user_id,
        author_display_name=author_display_name,
        author_email=author_email,
        is_internal=is_internal,
    )
    conversation.last_message_at = datetime.now(timezone.utc)
    conversation.updated_at = datetime.now(timezone.utc)
    db.add(msg)
    db.add(conversation)
    await db.flush()
    return msg


def notify_public_received(email: str, name: str, token: str, subject: Optional[str]) -> None:
    try:
        link = public_thread_url(token)
        subj = subject or "Your message to Tawala support"
        html = f"""
        <h2>We received your message</h2>
        <p>Hi {name},</p>
        <p>Thanks for contacting Tawala support. Our team will reply on this thread.</p>
        <p><a href="{link}">View or reply to your conversation</a></p>
        <p style="font-size:12px;color:#64748b">If you did not send this, you can ignore this email.</p>
        """
        mailer.send_transactional_email(
            sender=getattr(settings, "email_from_tawala", "Tawala System <tawala@nethub.co.ke>"),
            to_addresses=[email],
            subject=f"[Tawala Support] {subj}",
            html_content=html,
        )
    except Exception as e:
        logger.error(f"public support ack email failed: {e}")


def notify_public_reply(email: str, name: str, token: str, preview: str) -> None:
    try:
        link = public_thread_url(token)
        snippet = (preview or "")[:240]
        html = f"""
        <h2>New reply from Tawala support</h2>
        <p>Hi {name},</p>
        <p>{snippet}</p>
        <p><a href="{link}">Open the conversation</a></p>
        """
        mailer.send_transactional_email(
            sender=getattr(settings, "email_from_tawala", "Tawala System <tawala@nethub.co.ke>"),
            to_addresses=[email],
            subject="[Tawala Support] New reply",
            html_content=html,
        )
    except Exception as e:
        logger.error(f"public support reply email failed: {e}")


def conversation_to_dict(
    conv: SupportConversation,
    participant_staff_ids: Optional[Sequence[UUID]] = None,
) -> dict:
    return {
        "id": conv.id,
        "channel": conv.channel,
        "status": conv.status,
        "assignee_type": conv.assignee_type,
        "visibility_scope": conv.visibility_scope,
        "organization_id": conv.organization_id,
        "subject": conv.subject,
        "public_name": conv.public_name,
        "public_email": conv.public_email,
        "initiated_by_staff_id": conv.initiated_by_staff_id,
        "assigned_platform_user_id": conv.assigned_platform_user_id,
        "ai_enabled": conv.ai_enabled,
        "escalation_reason": conv.escalation_reason,
        "last_message_at": conv.last_message_at,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "participant_staff_ids": list(participant_staff_ids or []),
    }
