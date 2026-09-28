"""add background_jobs table for durable Celery job history

Revision ID: h1i2j3k4l5m6
Revises: g7h8i9j0k1l2
Create Date: 2026-09-28

Expand-only: new table. Safe to deploy before code that writes to it.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "h1i2j3k4l5m6"
down_revision: Union[str, None] = "g7h8i9j0k1l2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "background_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("celery_task_id", sa.String(length=255), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="PENDING", nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("sale_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("triggered_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("triggered_by_role", sa.String(length=32), server_default="SYSTEM", nullable=False),
        sa.Column("triggered_by_email", sa.String(length=255), nullable=True),
        sa.Column("args_summary", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("result_preview", sa.String(length=512), nullable=True),
        sa.Column("retries", sa.Integer(), server_default="0", nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_background_jobs_id", "background_jobs", ["id"])
    op.create_index("ix_background_jobs_celery_task_id", "background_jobs", ["celery_task_id"])
    op.create_index("ix_background_jobs_name", "background_jobs", ["name"])
    op.create_index("ix_background_jobs_status", "background_jobs", ["status"])
    op.create_index("ix_background_jobs_organization_id", "background_jobs", ["organization_id"])
    op.create_index("ix_background_jobs_business_id", "background_jobs", ["business_id"])
    op.create_index("ix_background_jobs_sale_id", "background_jobs", ["sale_id"])
    op.create_index("ix_background_jobs_triggered_by_id", "background_jobs", ["triggered_by_id"])
    op.create_index(
        "ix_background_jobs_org_status_created",
        "background_jobs",
        ["organization_id", "status", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_background_jobs_org_status_created", table_name="background_jobs")
    op.drop_index("ix_background_jobs_triggered_by_id", table_name="background_jobs")
    op.drop_index("ix_background_jobs_sale_id", table_name="background_jobs")
    op.drop_index("ix_background_jobs_business_id", table_name="background_jobs")
    op.drop_index("ix_background_jobs_organization_id", table_name="background_jobs")
    op.drop_index("ix_background_jobs_status", table_name="background_jobs")
    op.drop_index("ix_background_jobs_name", table_name="background_jobs")
    op.drop_index("ix_background_jobs_celery_task_id", table_name="background_jobs")
    op.drop_index("ix_background_jobs_id", table_name="background_jobs")
    op.drop_table("background_jobs")
