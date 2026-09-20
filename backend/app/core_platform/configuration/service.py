"""ConfigService — per-business key/value configuration."""

from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core_platform.shared.types import DomainError, DomainErrorCode
from app.models.configuration import BusinessConfig


class ConfigService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, business_id: UUID, key: str) -> BusinessConfig | None:
        return await self._session.scalar(
            select(BusinessConfig).where(
                BusinessConfig.business_id == business_id,
                BusinessConfig.key == key,
                BusinessConfig.deleted_at.is_(None),  # type: ignore[attr-defined]
            )
        )

    async def set(
        self, business_id: UUID, key: str, value: dict[str, Any]
    ) -> BusinessConfig:
        existing = await self.get(business_id, key)
        if existing:
            existing.value = value
            existing.touch()
            self._session.add(existing)
            await self._session.commit()
            await self._session.refresh(existing)
            return existing
        row = BusinessConfig(
            id=uuid4(),
            business_id=business_id,
            key=key,
            value=value,
        )
        self._session.add(row)
        await self._session.commit()
        await self._session.refresh(row)
        return row

    async def require(self, business_id: UUID, key: str) -> BusinessConfig:
        row = await self.get(business_id, key)
        if row is None:
            raise DomainError(DomainErrorCode.NOT_FOUND, f"Config key not found: {key}")
        return row
