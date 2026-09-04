"""Archive pipeline foundation.

Prepare-now: job records, builder protocol, feature flag.
Implement later: object storage, signed URLs, email, scheduled purge.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Protocol
from uuid import UUID

from loguru import logger
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.models import DataArchiveJob
from app.services.retention import resolve_retention_months


ARCHIVE_SCHEMA_VERSION = "1"


@dataclass
class ArchiveArtifact:
    """In-memory result of an archive build (before object storage)."""

    organization_id: UUID
    manifest: Dict[str, Any] = field(default_factory=dict)
    payload_bytes: bytes = b""
    object_key: Optional[str] = None


class ArchiveBuilder(Protocol):
    async def build(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        business_id: Optional[UUID] = None,
        entity_scope: str = "soft_deleted_catalog",
    ) -> ArchiveArtifact:
        ...


class StubArchiveBuilder:
    """
    No-op / dry-run builder used while ARCHIVE_ENABLED is false.
    Produces an empty package and a deterministic object key for job records.
    """

    async def build(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        business_id: Optional[UUID] = None,
        entity_scope: str = "soft_deleted_catalog",
    ) -> ArchiveArtifact:
        key = f"archives/{organization_id}/stub-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.jsonl"
        manifest = {
            "schema_version": ARCHIVE_SCHEMA_VERSION,
            "organization_id": str(organization_id),
            "business_id": str(business_id) if business_id else None,
            "entity_scope": entity_scope,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "entities": {},
            "stub": True,
        }
        logger.info(
            "archive stub build org={} scope={} key={}",
            organization_id,
            entity_scope,
            key,
        )
        return ArchiveArtifact(
            organization_id=organization_id,
            manifest=manifest,
            payload_bytes=b"",
            object_key=key,
        )


def get_archive_builder() -> ArchiveBuilder:
    # Future: return S3ArchiveBuilder when settings.archive_enabled and storage configured
    return StubArchiveBuilder()


async def enqueue_archive_job(
    db: AsyncSession,
    *,
    organization_id: UUID,
    business_id: Optional[UUID] = None,
    entity_scope: str = "soft_deleted_catalog",
) -> DataArchiveJob:
    """Create a PENDING archive job with retention snapshot from the org plan."""
    months = await resolve_retention_months(db, organization_id)
    job = DataArchiveJob(
        organization_id=organization_id,
        business_id=business_id,
        status="PENDING",
        retention_months=months,
        entity_scope=entity_scope,
        schema_version=ARCHIVE_SCHEMA_VERSION,
        manifest={},
    )
    db.add(job)
    await db.flush()
    await db.refresh(job)
    return job


def archive_pipeline_enabled() -> bool:
    """Gate for storage upload, email, and purge. Default off."""
    return bool(getattr(settings, "archive_enabled", False))
