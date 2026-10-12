"""Phase B: Gemini first-response for PUBLIC_SUPPORT and ORG_SUPPORT.

Every AI reply is persisted (SupportMessage author_type=AI_AGENT) for monitoring.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, List, Optional
from uuid import UUID

import httpx
from sqlmodel import col, select

from app.core.config import settings
from app.core.session import AsyncSessionLocal
from app.models.models import (
    AssigneeType,
    ConversationStatus,
    MessageAuthorType,
    MessagingChannel,
    SupportConversation,
    SupportMessage,
)
from app.services.messaging import append_message, notify_public_reply
from app.utils.logging import logger

# User phrases that force human handoff
_ESCALATE_PATTERNS = [
    r"\b(human|agent|person|representative|someone real)\b",
    r"\b(speak|talk)\s+to\s+(a\s+)?(human|agent|person)\b",
    r"\b(billing|refund|chargeback|invoice dispute)\b",
    r"\b(delete my (account|data)|gdpr|lawyer|legal)\b",
    r"\b(security breach|hacked|unauthorized access)\b",
]

_ESCALATE_RE = re.compile("|".join(_ESCALATE_PATTERNS), re.IGNORECASE)

_SYSTEM = """You are Tawala support assistant for a multi-tenant retail/POS platform used in Kenya and similar markets.
Be concise, practical, and polite. Use plain language.
You do NOT have access to the customer's live POS, stock, or payment data.
If you are unsure, or the user needs account-specific changes, billing disputes, refunds, data deletion, or security issues, say you are escalating to a human agent and keep the reply short.
Do not invent product features. Prefer pointing them to in-app Help or waiting for a human when needed.
Reply in the same language the user is using when practical (English or Swahili mix is fine).
"""


def should_run_ai(conv: SupportConversation) -> bool:
    if conv.channel not in (
        MessagingChannel.PUBLIC_SUPPORT,
        MessagingChannel.ORG_SUPPORT,
    ):
        return False
    if not conv.ai_enabled:
        return False
    if conv.assignee_type == AssigneeType.HUMAN:
        return False
    if conv.status in (
        ConversationStatus.HUMAN_ACTIVE,
        ConversationStatus.CLOSED,
        ConversationStatus.RESOLVED,
    ):
        return False
    return True


def wants_human(text: str) -> bool:
    return bool(_ESCALATE_RE.search(text or ""))


async def generate_gemini_reply(
    *,
    history: List[dict[str, str]],
    channel: str,
    subject: Optional[str],
) -> tuple[Optional[str], dict[str, Any]]:
    """
    Call Gemini generateContent. Returns (text, metadata).
    text is None on failure.
    """
    api_key = (getattr(settings, "gemini_apikey", None) or "").strip()
    model = (getattr(settings, "gemini_model", None) or "gemini-2.0-flash").strip()
    meta: dict[str, Any] = {
        "model_id": model,
        "provider": "gemini",
    }
    if not api_key:
        meta["error"] = "missing_api_key"
        return None, meta

    contents: list[dict[str, Any]] = []
    for turn in history[-20:]:
        role = "user" if turn.get("role") == "user" else "model"
        contents.append(
            {"role": role, "parts": [{"text": turn.get("text") or ""}]}
        )

    if not contents:
        meta["error"] = "empty_history"
        return None, meta

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent"
    )
    payload = {
        "systemInstruction": {"parts": [{"text": _SYSTEM}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1024,
        },
    }
    # Channel hint as last user context (not a fake user message if we already have one)
    if subject:
        payload["systemInstruction"]["parts"][0]["text"] += (
            f"\nConversation subject: {subject}\nChannel: {channel}\n"
        )

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                url,
                params={"key": api_key},
                json=payload,
            )
        meta["http_status"] = resp.status_code
        if resp.status_code >= 400:
            meta["error"] = f"http_{resp.status_code}"
            try:
                meta["error_body"] = resp.text[:500]
            except Exception:
                pass
            logger.warning(
                "gemini support reply failed status=%s body=%s",
                resp.status_code,
                (resp.text or "")[:300],
            )
            return None, meta

        data = resp.json()
        candidates = data.get("candidates") or []
        text = None
        if candidates:
            parts = (candidates[0].get("content") or {}).get("parts") or []
            chunks = [p.get("text") or "" for p in parts if isinstance(p, dict)]
            text = "\n".join(c for c in chunks if c).strip() or None
        usage = data.get("usageMetadata") or {}
        if usage:
            meta["usage"] = usage
        if not text:
            meta["error"] = "empty_response"
            return None, meta
        return text, meta
    except Exception as e:
        meta["error"] = "exception"
        meta["error_message"] = str(e)[:300]
        logger.exception("gemini support reply exception")
        return None, meta


async def _load_history(db, conversation_id: UUID) -> List[dict[str, str]]:
    rows = list(
        await db.exec(
            select(SupportMessage)
            .where(
                SupportMessage.conversation_id == conversation_id,
                SupportMessage.deleted_at.is_(None),
                SupportMessage.is_internal.is_(False),
            )
            .order_by(col(SupportMessage.created_at).asc())
        )
    )
    history: List[dict[str, str]] = []
    for m in rows:
        if m.author_type in (
            MessageAuthorType.PUBLIC_CONTACT,
            MessageAuthorType.ORG_STAFF,
        ):
            history.append({"role": "user", "text": m.body})
        elif m.author_type in (
            MessageAuthorType.AI_AGENT,
            MessageAuthorType.PLATFORM_USER,
        ):
            history.append({"role": "model", "text": m.body})
    return history


async def run_support_ai_for_conversation(conversation_id: UUID) -> None:
    """Background entry: open session, maybe reply or escalate, always persist outcomes."""
    try:
        async with AsyncSessionLocal() as db:
            conv = (
                await db.exec(
                    select(SupportConversation).where(
                        SupportConversation.id == conversation_id,
                        SupportConversation.deleted_at.is_(None),
                    )
                )
            ).first()
            if not conv or not should_run_ai(conv):
                return

            history = await _load_history(db, conv.id)
            last_user = ""
            for turn in reversed(history):
                if turn["role"] == "user":
                    last_user = turn["text"]
                    break

            if wants_human(last_user):
                conv.status = ConversationStatus.ESCALATED
                conv.assignee_type = AssigneeType.NONE
                conv.escalation_reason = "USER_REQUEST"
                conv.ai_enabled = False
                db.add(conv)
                await append_message(
                    db,
                    conversation=conv,
                    body=(
                        "I'm connecting you with a human support agent. "
                        "They will continue on this conversation shortly."
                    ),
                    author_type=MessageAuthorType.AI_AGENT,
                    author_display_name="Tawala Assistant",
                    ai_metadata={
                        "model_id": "policy",
                        "provider": "policy",
                        "escalation": "USER_REQUEST",
                    },
                )
                await db.commit()
                return

            text, meta = await generate_gemini_reply(
                history=history,
                channel=str(
                    conv.channel.value if hasattr(conv.channel, "value") else conv.channel
                ),
                subject=conv.subject,
            )

            if text is None:
                conv.status = ConversationStatus.ESCALATED
                conv.escalation_reason = "AI_FAILURE"
                db.add(conv)
                await append_message(
                    db,
                    conversation=conv,
                    body=(
                        "Thanks — I've flagged this for a human agent because I couldn't "
                        "complete an automated reply. Someone will follow up here."
                    ),
                    author_type=MessageAuthorType.AI_AGENT,
                    author_display_name="Tawala Assistant",
                    ai_metadata={**meta, "escalation": "AI_FAILURE"},
                )
                await db.commit()
                return

            escalate = bool(
                re.search(
                    r"\b(escalat|human agent|support agent will)\b",
                    text,
                    re.IGNORECASE,
                )
            )
            conv.status = (
                ConversationStatus.ESCALATED
                if escalate
                else ConversationStatus.AI_ACTIVE
            )
            conv.assignee_type = AssigneeType.AI
            if escalate:
                conv.escalation_reason = conv.escalation_reason or "MODEL_HANDOFF"
                meta = {**meta, "escalation": "MODEL_HANDOFF"}
            db.add(conv)
            await append_message(
                db,
                conversation=conv,
                body=text,
                author_type=MessageAuthorType.AI_AGENT,
                author_display_name="Tawala Assistant",
                ai_metadata=meta,
            )
            await db.commit()

            if (
                conv.channel == MessagingChannel.PUBLIC_SUPPORT
                and conv.public_email
            ):
                try:
                    from app.core.mailer import mailer
                    from app.core.config import settings as app_settings

                    name = conv.public_name or "there"
                    base = (
                        getattr(app_settings, "frontend_url", None)
                        or "https://tawala.nethub.co.ke"
                    ).rstrip("/")
                    html = f"""
                    <h2>New reply from Tawala support</h2>
                    <p>Hi {name},</p>
                    <p>{text[:600]}</p>
                    <p>Use the link in your original confirmation email to continue the conversation,
                    or visit <a href="{base}/support">{base}/support</a>.</p>
                    """
                    mailer.send_transactional_email(
                        sender=getattr(
                            app_settings,
                            "email_from_tawala",
                            "Tawala System <tawala@nethub.co.ke>",
                        ),
                        to_addresses=[conv.public_email],
                        subject="[Tawala Support] New reply",
                        html_content=html,
                    )
                except Exception as e:
                    logger.error("AI public reply email failed: %s", e)
    except Exception:
        logger.exception(
            "run_support_ai_for_conversation failed conversation_id=%s",
            conversation_id,
        )


def schedule_support_ai(background_tasks, conversation_id: UUID) -> None:
    """Enqueue AI reply after response (FastAPI BackgroundTasks)."""
    background_tasks.add_task(run_support_ai_for_conversation, conversation_id)
