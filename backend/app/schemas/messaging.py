"""Schemas for support & messaging (Phase A)."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.models import (
    AssigneeType,
    ConversationStatus,
    MessageAuthorType,
    MessagingChannel,
    VisibilityScope,
)


class PublicSupportCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    subject: Optional[str] = Field(default=None, max_length=200)
    message: str = Field(min_length=1, max_length=8000)


class OrgSupportCreate(BaseModel):
    subject: Optional[str] = Field(default=None, max_length=200)
    message: str = Field(min_length=1, max_length=8000)


class InternalConversationCreate(BaseModel):
    subject: Optional[str] = Field(default=None, max_length=200)
    message: str = Field(min_length=1, max_length=8000)
    participant_staff_ids: List[UUID] = Field(min_length=1)


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=8000)


class MessageRead(BaseModel):
    id: UUID
    conversation_id: UUID
    body: str
    author_type: MessageAuthorType
    author_staff_id: Optional[UUID] = None
    author_platform_user_id: Optional[UUID] = None
    author_display_name: Optional[str] = None
    author_email: Optional[str] = None
    is_internal: bool = False
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ConversationRead(BaseModel):
    id: UUID
    channel: MessagingChannel
    status: ConversationStatus
    assignee_type: AssigneeType
    visibility_scope: VisibilityScope
    organization_id: Optional[UUID] = None
    subject: Optional[str] = None
    public_name: Optional[str] = None
    public_email: Optional[str] = None
    initiated_by_staff_id: Optional[UUID] = None
    assigned_platform_user_id: Optional[UUID] = None
    ai_enabled: bool = True
    escalation_reason: Optional[str] = None
    last_message_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    participant_staff_ids: List[UUID] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ConversationDetail(ConversationRead):
    messages: List[MessageRead] = Field(default_factory=list)


class ConversationListResponse(BaseModel):
    items: List[ConversationRead]
    total: int


class PublicConversationCreated(BaseModel):
    id: UUID
    status: ConversationStatus
    message: str = "Message received. Check your email for a link to this conversation."


class ConversationStatusUpdate(BaseModel):
    status: ConversationStatus


class PlatformReplyCreate(BaseModel):
    body: str = Field(min_length=1, max_length=8000)
    claim: bool = True
