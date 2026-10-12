"""Support & messaging APIs (Phase A).

Channels:
- PUBLIC_SUPPORT (public, email back)
- ORG_SUPPORT (org staff ↔ platform, in-app)
- ORG_INTERNAL (staff ↔ staff, participants-only, in-app)
"""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlalchemy import nullslast
from sqlmodel import col, select

from app.api.deps import SessionDep
from app.api.platform_deps import require_platform_permissions
from app.api.rbac_deps import require_permissions
from app.core.platform_rbac import PlatformPermission
from app.core.rbac import Permission
from app.core.redis_client import limiter
from app.models.models import (
    AssigneeType,
    ConversationStatus,
    MessageAuthorType,
    MessagingChannel,
    Staff,
    SupportConversation,
    SupportConversationParticipant,
    SupportMessage,
    VisibilityScope,
)
from app.schemas.messaging import (
    ConversationDetail,
    ConversationListResponse,
    ConversationRead,
    ConversationStatusUpdate,
    InternalConversationCreate,
    MessageCreate,
    MessageRead,
    OrgSupportCreate,
    PlatformReplyCreate,
    PublicConversationCreated,
    PublicSupportCreate,
)
from app.services.messaging import (
    add_participants,
    append_message,
    conversation_to_dict,
    hash_public_token,
    new_public_access_token,
    notify_public_received,
    notify_public_reply,
    participant_ids,
)
from app.utils.logging import logger

router = APIRouter()


def _msg_read(m: SupportMessage) -> MessageRead:
    return MessageRead.model_validate(m)


async def _conv_read(db, conv: SupportConversation) -> ConversationRead:
    pids = await participant_ids(db, conv.id)
    return ConversationRead.model_validate(conversation_to_dict(conv, pids))


# ---------------------------------------------------------------------------
# Public channel
# ---------------------------------------------------------------------------


@router.post(
    "/public/support",
    response_model=PublicConversationCreated,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("8/minute")
async def create_public_support(
    request: Request,
    body: PublicSupportCreate,
    background_tasks: BackgroundTasks,
    db: SessionDep,
) -> PublicConversationCreated:
    token = new_public_access_token()
    conv = SupportConversation(
        channel=MessagingChannel.PUBLIC_SUPPORT,
        status=ConversationStatus.OPEN,
        assignee_type=AssigneeType.NONE,
        visibility_scope=VisibilityScope.PARTICIPANTS_ONLY,
        subject=(body.subject or "").strip() or None,
        public_name=body.name.strip(),
        public_email=str(body.email).lower().strip(),
        public_access_token_hash=hash_public_token(token),
        ai_enabled=True,
        organization_id=None,
    )
    db.add(conv)
    await db.flush()
    await append_message(
        db,
        conversation=conv,
        body=body.message,
        author_type=MessageAuthorType.PUBLIC_CONTACT,
        author_display_name=conv.public_name,
        author_email=conv.public_email,
    )
    await db.commit()
    background_tasks.add_task(
        notify_public_received,
        conv.public_email,
        conv.public_name or "there",
        token,
        conv.subject,
    )
    return PublicConversationCreated(id=conv.id, status=conv.status)


@router.get("/public/support/{token}", response_model=ConversationDetail)
@limiter.limit("30/minute")
async def get_public_support_thread(
    request: Request,
    token: str,
    db: SessionDep,
) -> ConversationDetail:
    conv = await _public_conv_by_token(db, token)
    messages = await _list_messages(db, conv.id, include_internal=False)
    base = await _conv_read(db, conv)
    return ConversationDetail(**base.model_dump(), messages=messages)


@router.post("/public/support/{token}/messages", response_model=MessageRead, status_code=201)
@limiter.limit("20/minute")
async def reply_public_support(
    request: Request,
    token: str,
    body: MessageCreate,
    db: SessionDep,
) -> MessageRead:
    conv = await _public_conv_by_token(db, token)
    if conv.status in (ConversationStatus.CLOSED, ConversationStatus.RESOLVED):
        conv.status = ConversationStatus.OPEN
    msg = await append_message(
        db,
        conversation=conv,
        body=body.body,
        author_type=MessageAuthorType.PUBLIC_CONTACT,
        author_display_name=conv.public_name,
        author_email=conv.public_email,
    )
    await db.commit()
    await db.refresh(msg)
    return _msg_read(msg)


async def _public_conv_by_token(db, token: str) -> SupportConversation:
    th = hash_public_token(token)
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
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


async def _list_messages(db, conversation_id: UUID, include_internal: bool) -> List[MessageRead]:
    q = select(SupportMessage).where(
        SupportMessage.conversation_id == conversation_id,
        SupportMessage.deleted_at.is_(None),
    )
    if not include_internal:
        q = q.where(SupportMessage.is_internal.is_(False))
    q = q.order_by(col(SupportMessage.created_at).asc())
    rows = list(await db.exec(q))
    return [_msg_read(m) for m in rows]


# ---------------------------------------------------------------------------
# Org support (channel 2)
# ---------------------------------------------------------------------------


@router.post("/org/support", response_model=ConversationRead, status_code=201)
async def create_org_support(
    body: OrgSupportCreate,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.SUPPORT_INITIATE)),
) -> ConversationRead:
    if not user.organization_id:
        raise HTTPException(status_code=400, detail="Staff has no organization")
    conv = SupportConversation(
        channel=MessagingChannel.ORG_SUPPORT,
        status=ConversationStatus.OPEN,
        assignee_type=AssigneeType.NONE,
        visibility_scope=VisibilityScope.ORG_WIDE,
        organization_id=user.organization_id,
        subject=(body.subject or "").strip() or None,
        initiated_by_staff_id=user.id,
        ai_enabled=True,
    )
    db.add(conv)
    await db.flush()
    await add_participants(db, conv.id, [user.id])
    await append_message(
        db,
        conversation=conv,
        body=body.message,
        author_type=MessageAuthorType.ORG_STAFF,
        author_staff_id=user.id,
        author_display_name=getattr(user, "full_name", None) or user.email,
        author_email=user.email,
    )
    await db.commit()
    await db.refresh(conv)
    return await _conv_read(db, conv)


@router.get("/org/support", response_model=ConversationListResponse)
async def list_org_support(
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.SUPPORT_PARTICIPATE)),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> ConversationListResponse:
    if not user.organization_id:
        return ConversationListResponse(items=[], total=0)
    q = (
        select(SupportConversation)
        .where(
            SupportConversation.organization_id == user.organization_id,
            SupportConversation.channel == MessagingChannel.ORG_SUPPORT,
            SupportConversation.deleted_at.is_(None),
        )
        .order_by(col(SupportConversation.last_message_at).desc())
        .offset(offset)
        .limit(limit)
    )
    rows = list(await db.exec(q))
    items = [await _conv_read(db, c) for c in rows]
    return ConversationListResponse(items=items, total=len(items))


@router.get("/org/support/{conversation_id}", response_model=ConversationDetail)
async def get_org_support(
    conversation_id: UUID,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.SUPPORT_PARTICIPATE)),
) -> ConversationDetail:
    conv = await _get_org_support_conv(db, conversation_id, user.organization_id)
    messages = await _list_messages(db, conv.id, include_internal=False)
    base = await _conv_read(db, conv)
    return ConversationDetail(**base.model_dump(), messages=messages)


@router.post("/org/support/{conversation_id}/messages", response_model=MessageRead, status_code=201)
async def reply_org_support(
    conversation_id: UUID,
    body: MessageCreate,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.SUPPORT_PARTICIPATE)),
) -> MessageRead:
    conv = await _get_org_support_conv(db, conversation_id, user.organization_id)
    if conv.status in (ConversationStatus.CLOSED, ConversationStatus.RESOLVED):
        conv.status = ConversationStatus.OPEN
    msg = await append_message(
        db,
        conversation=conv,
        body=body.body,
        author_type=MessageAuthorType.ORG_STAFF,
        author_staff_id=user.id,
        author_display_name=getattr(user, "full_name", None) or user.email,
        author_email=user.email,
    )
    await db.commit()
    await db.refresh(msg)
    return _msg_read(msg)


async def _get_org_support_conv(db, conversation_id: UUID, organization_id: Optional[UUID]) -> SupportConversation:
    if not organization_id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv = (
        await db.exec(
            select(SupportConversation).where(
                SupportConversation.id == conversation_id,
                SupportConversation.organization_id == organization_id,
                SupportConversation.channel == MessagingChannel.ORG_SUPPORT,
                SupportConversation.deleted_at.is_(None),
            )
        )
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


# ---------------------------------------------------------------------------
# Org internal (channel 3)
# ---------------------------------------------------------------------------


@router.post("/org/messages", response_model=ConversationRead, status_code=201)
async def create_internal_message(
    body: InternalConversationCreate,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.ORG_MESSAGING)),
) -> ConversationRead:
    if not user.organization_id:
        raise HTTPException(status_code=400, detail="Staff has no organization")
    # Validate participants belong to same org
    from app.models.models import Staff as StaffModel

    ids = list({*body.participant_staff_ids, user.id})
    staff_rows = list(
        await db.exec(
            select(StaffModel).where(
                StaffModel.id.in_(ids),
                StaffModel.organization_id == user.organization_id,
                StaffModel.deleted_at.is_(None),
            )
        )
    )
    if len(staff_rows) != len(ids):
        raise HTTPException(status_code=400, detail="All participants must be active staff in your organization")
    conv = SupportConversation(
        channel=MessagingChannel.ORG_INTERNAL,
        status=ConversationStatus.OPEN,
        assignee_type=AssigneeType.NONE,
        visibility_scope=VisibilityScope.PARTICIPANTS_ONLY,
        organization_id=user.organization_id,
        subject=(body.subject or "").strip() or None,
        initiated_by_staff_id=user.id,
        ai_enabled=False,
    )
    db.add(conv)
    await db.flush()
    await add_participants(db, conv.id, ids)
    await append_message(
        db,
        conversation=conv,
        body=body.message,
        author_type=MessageAuthorType.ORG_STAFF,
        author_staff_id=user.id,
        author_display_name=getattr(user, "full_name", None) or user.email,
        author_email=user.email,
    )
    await db.commit()
    await db.refresh(conv)
    return await _conv_read(db, conv)


@router.get("/org/messages", response_model=ConversationListResponse)
async def list_internal_messages(
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.ORG_MESSAGING)),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> ConversationListResponse:
    if not user.organization_id:
        return ConversationListResponse(items=[], total=0)
    # Participants-only: conversations where user is a participant
    part_q = select(SupportConversationParticipant.conversation_id).where(
        SupportConversationParticipant.staff_id == user.id,
        SupportConversationParticipant.deleted_at.is_(None),
    )
    q = (
        select(SupportConversation)
        .where(
            SupportConversation.organization_id == user.organization_id,
            SupportConversation.channel == MessagingChannel.ORG_INTERNAL,
            SupportConversation.deleted_at.is_(None),
            col(SupportConversation.id).in_(part_q),
        )
        .order_by(col(SupportConversation.last_message_at).desc())
        .offset(offset)
        .limit(limit)
    )
    rows = list(await db.exec(q))
    items = [await _conv_read(db, c) for c in rows]
    return ConversationListResponse(items=items, total=len(items))


@router.get("/org/messages/{conversation_id}", response_model=ConversationDetail)
async def get_internal_message(
    conversation_id: UUID,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.ORG_MESSAGING)),
) -> ConversationDetail:
    conv = await _get_internal_conv_for_participant(db, conversation_id, user)
    messages = await _list_messages(db, conv.id, include_internal=False)
    base = await _conv_read(db, conv)
    return ConversationDetail(**base.model_dump(), messages=messages)


@router.post("/org/messages/{conversation_id}/messages", response_model=MessageRead, status_code=201)
async def reply_internal_message(
    conversation_id: UUID,
    body: MessageCreate,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.ORG_MESSAGING)),
) -> MessageRead:
    conv = await _get_internal_conv_for_participant(db, conversation_id, user)
    msg = await append_message(
        db,
        conversation=conv,
        body=body.body,
        author_type=MessageAuthorType.ORG_STAFF,
        author_staff_id=user.id,
        author_display_name=getattr(user, "full_name", None) or user.email,
        author_email=user.email,
    )
    await db.commit()
    await db.refresh(msg)
    return _msg_read(msg)


async def _get_internal_conv_for_participant(db, conversation_id: UUID, user: Staff) -> SupportConversation:
    if not user.organization_id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv = (
        await db.exec(
            select(SupportConversation).where(
                SupportConversation.id == conversation_id,
                SupportConversation.organization_id == user.organization_id,
                SupportConversation.channel == MessagingChannel.ORG_INTERNAL,
                SupportConversation.deleted_at.is_(None),
            )
        )
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    pids = await participant_ids(db, conv.id)
    if user.id not in pids:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


# ---------------------------------------------------------------------------
# Platform inbox (PUBLIC + ORG_SUPPORT only)
# ---------------------------------------------------------------------------


@router.get("/platform/support", response_model=ConversationListResponse)
async def platform_list_support(
    db: SessionDep,
    user = Depends(
        require_platform_permissions(PlatformPermission.SUPPORT_INBOX_READ)
    ),
    channel: Optional[MessagingChannel] = None,
    status_filter: Optional[ConversationStatus] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> ConversationListResponse:
    q = select(SupportConversation).where(
        SupportConversation.deleted_at.is_(None),
        SupportConversation.channel.in_(
            [MessagingChannel.PUBLIC_SUPPORT, MessagingChannel.ORG_SUPPORT]
        ),
    )
    if channel in (MessagingChannel.PUBLIC_SUPPORT, MessagingChannel.ORG_SUPPORT):
        q = q.where(SupportConversation.channel == channel)
    if status_filter:
        q = q.where(SupportConversation.status == status_filter)
    q = q.order_by(col(SupportConversation.last_message_at).desc()).offset(offset).limit(limit)
    rows = list(await db.exec(q))
    items = [await _conv_read(db, c) for c in rows]
    return ConversationListResponse(items=items, total=len(items))


@router.get("/platform/support/{conversation_id}", response_model=ConversationDetail)
async def platform_get_support(
    conversation_id: UUID,
    db: SessionDep,
    user = Depends(
        require_platform_permissions(PlatformPermission.SUPPORT_INBOX_READ)
    ),
) -> ConversationDetail:
    conv = await _platform_support_conv(db, conversation_id)
    messages = await _list_messages(db, conv.id, include_internal=True)
    base = await _conv_read(db, conv)
    return ConversationDetail(**base.model_dump(), messages=messages)


@router.post("/platform/support/{conversation_id}/messages", response_model=MessageRead, status_code=201)
async def platform_reply_support(
    conversation_id: UUID,
    body: PlatformReplyCreate,
    background_tasks: BackgroundTasks,
    db: SessionDep,
    user = Depends(
        require_platform_permissions(PlatformPermission.SUPPORT_INBOX_WRITE)
    ),
) -> MessageRead:
    conv = await _platform_support_conv(db, conversation_id)
    if body.claim:
        conv.assignee_type = AssigneeType.HUMAN
        conv.assigned_platform_user_id = user.id
        conv.status = ConversationStatus.HUMAN_ACTIVE
        conv.ai_enabled = False
    msg = await append_message(
        db,
        conversation=conv,
        body=body.body,
        author_type=MessageAuthorType.PLATFORM_USER,
        author_platform_user_id=user.id,
        author_display_name=getattr(user, "full_name", None) or user.email,
        author_email=user.email,
    )
    await db.commit()
    await db.refresh(msg)

    # Email only for public channel — need raw token which we don't store; skip link regeneration
    # Store plaintext token only once at create. For reply email use support page fallback.
    if conv.channel == MessagingChannel.PUBLIC_SUPPORT and conv.public_email:
        # Cannot reconstruct signed token from hash; email without deep link or with generic support URL
        from app.core.config import settings

        def _send():
            try:
                base = (getattr(settings, "frontend_url", None) or "https://tawala.nethub.co.ke").rstrip("/")
                name = conv.public_name or "there"
                html = f"""
                <h2>New reply from Tawala support</h2>
                <p>Hi {name},</p>
                <p>{body.body[:400]}</p>
                <p>Use the link from your original confirmation email to continue the conversation,
                or contact us via <a href="{base}/support">{base}/support</a>.</p>
                """
                mailer_send = __import__("app.core.mailer", fromlist=["mailer"]).mailer
                mailer_send.send_transactional_email(
                    sender=getattr(settings, "email_from_tawala", "Tawala System <tawala@nethub.co.ke>"),
                    to_addresses=[conv.public_email],
                    subject="[Tawala Support] New reply",
                    html_content=html,
                )
            except Exception as e:
                logger.error(f"platform public reply email failed: {e}")

        background_tasks.add_task(_send)

    return _msg_read(msg)


@router.patch("/platform/support/{conversation_id}", response_model=ConversationRead)
async def platform_update_support_status(
    conversation_id: UUID,
    body: ConversationStatusUpdate,
    db: SessionDep,
    user = Depends(
        require_platform_permissions(PlatformPermission.SUPPORT_INBOX_WRITE)
    ),
) -> ConversationRead:
    conv = await _platform_support_conv(db, conversation_id)
    conv.status = body.status
    if body.status == ConversationStatus.HUMAN_ACTIVE:
        conv.assignee_type = AssigneeType.HUMAN
        conv.assigned_platform_user_id = user.id
        conv.ai_enabled = False
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return await _conv_read(db, conv)


async def _platform_support_conv(db, conversation_id: UUID) -> SupportConversation:
    conv = (
        await db.exec(
            select(SupportConversation).where(
                SupportConversation.id == conversation_id,
                SupportConversation.deleted_at.is_(None),
                SupportConversation.channel.in_(
                    [MessagingChannel.PUBLIC_SUPPORT, MessagingChannel.ORG_SUPPORT]
                ),
            )
        )
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv
