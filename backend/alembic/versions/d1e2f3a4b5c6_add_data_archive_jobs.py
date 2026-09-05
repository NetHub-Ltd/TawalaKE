"""Add data_archive_jobs table for soft-delete retention pipeline.

Revision ID: d1e2f3a4b5c6
Revises: c9e8f7a6b5d4
Create Date: 2026-09-05

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, Sequence[str], None] = "c9e8f7a6b5d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "data_archive_jobs",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("business_id", sa.Uuid(), nullable=True),
        sa.Column("status", sa.String(), server_default="PENDING", nullable=False),
        sa.Column("retention_months", sa.Integer(), server_default="6", nullable=False),
        sa.Column("entity_scope", sa.String(), server_default="soft_deleted_catalog", nullable=False),
        sa.Column("schema_version", sa.String(), server_default="1", nullable=False),
        sa.Column("archive_object_key", sa.String(length=512), nullable=True),
        sa.Column("archive_byte_size", sa.Integer(), nullable=True),
        sa.Column("download_url_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("purged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("manifest", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=True),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_data_archive_jobs_id"), "data_archive_jobs", ["id"], unique=False)
    op.create_index(op.f("ix_data_archive_jobs_organization_id"), "data_archive_jobs", ["organization_id"], unique=False)
    op.create_index(op.f("ix_data_archive_jobs_business_id"), "data_archive_jobs", ["business_id"], unique=False)
    op.create_index(op.f("ix_data_archive_jobs_status"), "data_archive_jobs", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_data_archive_jobs_status"), table_name="data_archive_jobs")
    op.drop_index(op.f("ix_data_archive_jobs_business_id"), table_name="data_archive_jobs")
    op.drop_index(op.f("ix_data_archive_jobs_organization_id"), table_name="data_archive_jobs")
    op.drop_index(op.f("ix_data_archive_jobs_id"), table_name="data_archive_jobs")
    op.drop_table("data_archive_jobs")
