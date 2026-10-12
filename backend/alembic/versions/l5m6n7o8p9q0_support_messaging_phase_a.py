"""support & messaging tables (Phase A)

Revision ID: l5m6n7o8p9q0
Revises: k4l5m6n7o8p9
Create Date: 2026-10-12

Additive only. Text-only messages; three channels; AI-ready fields.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "l5m6n7o8p9q0"
down_revision: Union[str, Sequence[str], None] = "k4l5m6n7o8p9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    messaging_channel = sa.Enum(
        "PUBLIC_SUPPORT",
        "ORG_SUPPORT",
        "ORG_INTERNAL",
        name="messaging_channel_enum",
    )
    conversation_status = sa.Enum(
        "OPEN",
        "AI_ACTIVE",
        "WAITING_ON_USER",
        "ESCALATED",
        "HUMAN_ACTIVE",
        "RESOLVED",
        "CLOSED",
        name="conversation_status_enum",
    )
    assignee_type = sa.Enum("NONE", "AI", "HUMAN", name="assignee_type_enum")
    visibility_scope = sa.Enum(
        "ORG_WIDE", "PARTICIPANTS_ONLY", name="visibility_scope_enum"
    )
    message_author_type = sa.Enum(
        "PUBLIC_CONTACT",
        "ORG_STAFF",
        "PLATFORM_USER",
        "AI_AGENT",
        "SYSTEM",
        name="message_author_type_enum",
    )

    messaging_channel.create(op.get_bind(), checkfirst=True)
    conversation_status.create(op.get_bind(), checkfirst=True)
    assignee_type.create(op.get_bind(), checkfirst=True)
    visibility_scope.create(op.get_bind(), checkfirst=True)
    message_author_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "support_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("channel", messaging_channel, nullable=False),
        sa.Column("status", conversation_status, nullable=False),
        sa.Column("assignee_type", assignee_type, nullable=False),
        sa.Column("visibility_scope", visibility_scope, nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("subject", sa.String(length=200), nullable=True),
        sa.Column("public_name", sa.String(length=120), nullable=True),
        sa.Column("public_email", sa.String(length=255), nullable=True),
        sa.Column("public_access_token_hash", sa.String(length=128), nullable=True),
        sa.Column("initiated_by_staff_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("assigned_platform_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("ai_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("escalation_reason", sa.String(length=80), nullable=True),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.ForeignKeyConstraint(["initiated_by_staff_id"], ["staff.id"]),
        sa.ForeignKeyConstraint(["assigned_platform_user_id"], ["platform_users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_support_conversations_channel", "support_conversations", ["channel"])
    op.create_index("ix_support_conversations_status", "support_conversations", ["status"])
    op.create_index("ix_support_conversations_organization_id", "support_conversations", ["organization_id"])
    op.create_index("ix_support_conversations_public_email", "support_conversations", ["public_email"])
    op.create_index("ix_support_conversations_public_access_token_hash", "support_conversations", ["public_access_token_hash"])
    op.create_index("ix_support_conv_channel_status", "support_conversations", ["channel", "status"])
    op.create_index("ix_support_conv_org_channel", "support_conversations", ["organization_id", "channel"])
    op.create_index("ix_support_conv_updated", "support_conversations", ["updated_at"])
    op.create_index("ix_support_conversations_last_message_at", "support_conversations", ["last_message_at"])

    op.create_table(
        "support_conversation_participants",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("staff_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["support_conversations.id"]),
        sa.ForeignKeyConstraint(["staff_id"], ["staff.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("conversation_id", "staff_id", name="uq_support_conv_participant"),
    )
    op.create_index("ix_support_conversation_participants_conversation_id", "support_conversation_participants", ["conversation_id"])
    op.create_index("ix_support_conversation_participants_staff_id", "support_conversation_participants", ["staff_id"])

    op.create_table(
        "support_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("author_type", message_author_type, nullable=False),
        sa.Column("author_staff_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("author_platform_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("author_display_name", sa.String(length=120), nullable=True),
        sa.Column("author_email", sa.String(length=255), nullable=True),
        sa.Column("is_internal", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("ai_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["conversation_id"], ["support_conversations.id"]),
        sa.ForeignKeyConstraint(["author_staff_id"], ["staff.id"]),
        sa.ForeignKeyConstraint(["author_platform_user_id"], ["platform_users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_support_messages_conversation_id", "support_messages", ["conversation_id"])
    op.create_index("ix_support_messages_author_type", "support_messages", ["author_type"])
    op.create_index("ix_support_msg_conversation_created", "support_messages", ["conversation_id", "created_at"])


def downgrade() -> None:
    op.drop_table("support_messages")
    op.drop_table("support_conversation_participants")
    op.drop_table("support_conversations")
    sa.Enum(name="message_author_type_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="visibility_scope_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="assignee_type_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="conversation_status_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="messaging_channel_enum").drop(op.get_bind(), checkfirst=True)
