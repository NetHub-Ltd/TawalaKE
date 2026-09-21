"""AccountingService — financial entry contract (minimal until Accounting Core)."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID, uuid4

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.accounting import FinancialEntry, FinancialEntryType
from app.models.base import utc_now


class AccountingService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def post_entry(
        self,
        *,
        business_id: UUID,
        entry_type: FinancialEntryType,
        amount: Decimal,
        source_type: str,
        source_id: UUID,
        currency: str = "KES",
        party_id: UUID | None = None,
        memo: str | None = None,
        commit: bool = False,
    ) -> FinancialEntry:
        row = FinancialEntry(
            id=uuid4(),
            business_id=business_id,
            entry_type=entry_type,
            amount=amount,
            currency=currency,
            source_type=source_type,
            source_id=source_id,
            party_id=party_id,
            memo=memo,
            occurred_at=utc_now(),
        )
        self._session.add(row)
        if commit:
            await self._session.commit()
            await self._session.refresh(row)
        else:
            await self._session.flush()
        return row
