"""Phase B: Gemini first-response for PUBLIC_SUPPORT and ORG_SUPPORT.

Every AI reply is persisted (SupportMessage author_type=AI_AGENT) for monitoring.

Escalation policy:
- Do NOT escalate only because the user asked for a human.
- Escalate when the model cannot produce a reply (failure), or the topic is
  outside AI authorization (billing disputes, account deletion, security incidents).
- Knowledge base / docs grounding will refine answers later; structure is ready.
"""
from __future__ import annotations

import re
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
from app.services.messaging import append_message, publish_conversation_event
from app.utils.logging import logger

# Topics AI is not authorized to resolve — escalate (not mere "I want a human")
_UNAUTHORIZED_TOPIC_RE = re.compile(
    r"("
    r"\b(refund|chargeback|billing dispute|dispute (this |my )?charge)\b|"
    r"\b(delete my (account|data)|erase my data|gdpr (erasure|deletion))\b|"
    r"\b(security breach|hacked|unauthorized access|data leak)\b|"
    r"\b(lawyer|legal action|sue you)\b"
    r")",
    re.IGNORECASE,
)

_SYSTEM = """You are Tawala support assistant for a multi-tenant retail/POS platform used in Kenya and similar markets.
Be concise, practical, and polite. Use plain language.
You do NOT have access to the customer's live POS, stock, or payment data.
If the user asks to speak to a human, acknowledge the request, keep helping with what you can,
and explain that a human can join if the issue cannot be resolved here — do not stop assisting only because they asked.
Only when the issue is outside your authorization (billing disputes, refunds/chargebacks, account/data deletion, security incidents)
or you truly cannot help, say clearly that you are escalating to a human agent and keep that reply short.
Do not invent product features. Prefer in-app Help when relevant.
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


def is_unauthorized_topic(text: str) -> bool:
    """True when the user message is outside AI authorization."""
    return bool(_UNAUTHORIZED_TOPIC_RE.search(text or ""))


async def generate_gemini_reply(
    *,
    history: List[dict[str, str]],
    channel: str,
    subject: Optional[str],
) -> tuple[Optional[str], dict[str, Any]]:
    """Call Gemini generateContent. Returns (text, metadata). text is None on failure."""
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

    system_text = _SYSTEM
    if subject:
        system_text += f"\nConversation subject: {subject}\nChannel: {channel}\n"

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent"
    )
    payload = {
        "systemInstruction": {"parts": [{"text": system_text}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1024,
        },
    }

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


def _message_event_payload(msg: SupportMessage, conversation_id: UUID) -> dict:
    return {
        "type": "support.message",
        "conversation_id": str(conversation_id),
        "message": {
            "id": str(msg.id),
            "conversation_id": str(msg.conversation_id),
            "body": msg.body,
            "author_type": str(
                msg.author_type.value
                if hasattr(msg.author_type, "value")
                else msg.author_type
            ),
            "author_display_name": msg.author_display_name,
            "author_email": msg.author_email,
            "is_internal": bool(msg.is_internal),
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        },
    }


async def run_support_ai_for_conversation(conversation_id: UUID) -> None:
    """Background entry: reply or escalate only when unable / unauthorized."""
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

            # Unauthorized topics only (not "please get me a human")
            if is_unauthorized_topic(last_user):
                conv.status = ConversationStatus.ESCALATED
                conv.assignee_type = AssigneeType.NONE
                conv.escalation_reason = "UNAUTHORIZED_TOPIC"
                db.add(conv)
                msg = await append_message(
                    db,
                    conversation=conv,
                    body=(
                        "This request needs a human agent (billing dispute, account/data "
                        "deletion, or security). I've escalated it — someone will continue here."
                    ),
                    author_type=MessageAuthorType.AI_AGENT,
                    author_display_name="Tawala Assistant",
                    ai_metadata={
                        "model_id": "policy",
                        "provider": "policy",
                        "escalation": "UNAUTHORIZED_TOPIC",
                    },
                )
                await db.commit()
                await publish_conversation_event(
                    conversation_id, _message_event_payload(msg, conversation_id)
                )
                return

            text, meta = await generate_gemini_reply(
                history=history,
                channel=str(
                    conv.channel.value
                    if hasattr(conv.channel, "value")
                    else conv.channel
                ),
                subject=conv.subject,
            )

            if text is None:
                # Cannot solve / provider failure → human
                conv.status = ConversationStatus.ESCALATED
                conv.escalation_reason = "AI_FAILURE"
                db.add(conv)
                msg = await append_message(
                    db,
                    conversation=conv,
                    body=(
                        "I wasn't able to complete a reliable answer just now, so I've "
                        "flagged this for a human agent. They'll follow up on this thread."
                    ),
                    author_type=MessageAuthorType.AI_AGENT,
                    author_display_name="Tawala Assistant",
                    ai_metadata={**meta, "escalation": "AI_FAILURE"},
                )
                await db.commit()
                await publish_conversation_event(
                    conversation_id, _message_event_payload(msg, conversation_id)
                )
                return

            # Model may still choose to escalate unauthorized cases in wording
            model_escalated = bool(
                re.search(
                    r"\b(escalat(?:e|ing|ed)|hand(?:ing)?\s+off)\b.*\b(human|agent)\b|"
                    r"\b(human|agent)\b.*\b(will (continue|follow|contact)|take over)\b",
                    text,
                    re.IGNORECASE,
                )
            )
            if model_escalated:
                conv.status = ConversationStatus.ESCALATED
                conv.assignee_type = AssigneeType.NONE
                conv.escalation_reason = conv.escalation_reason or "MODEL_UNAUTHORIZED"
                meta = {**meta, "escalation": "MODEL_UNAUTHORIZED"}
            else:
                conv.status = ConversationStatus.AI_ACTIVE
                conv.assignee_type = AssigneeType.AI
            db.add(conv)
            msg = await append_message(
                db,
                conversation=conv,
                body=text,
                author_type=MessageAuthorType.AI_AGENT,
                author_display_name="Tawala Assistant",
                ai_metadata=meta,
            )
            await db.commit()
            await publish_conversation_event(
                conversation_id, _message_event_payload(msg, conversation_id)
            )

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
