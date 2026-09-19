"""Party routes (SPEC F.5)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core_platform.parties.service import PartyService
from app.core_platform.shared.types import DomainError, DomainErrorCode
from app.db.session import get_session
from app.models.identity import User
from app.schemas.parties import PartyCreate, PartyLinkCreate, PartyLinkRead, PartyRead

router = APIRouter(prefix="/api/v1", tags=["parties"])


def _map(exc: DomainError) -> HTTPException:
    status = {
        DomainErrorCode.CONFLICT: 409,
        DomainErrorCode.UNAUTHORIZED: 401,
        DomainErrorCode.FORBIDDEN: 403,
        DomainErrorCode.NOT_FOUND: 404,
    }.get(exc.code, 400)
    return HTTPException(status_code=status, detail=exc.message)


@router.post("/parties", response_model=PartyRead, status_code=201)
async def create_party(
    body: PartyCreate,
    business_id: UUID = Query(..., description="Acting business context"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PartyRead:
    try:
        party = await PartyService(session).create_party(
            body, user_id=user.id, business_id=business_id
        )
    except DomainError as exc:
        raise _map(exc) from exc
    return PartyRead.model_validate(party)


@router.post("/parties/{party_id}/links", response_model=PartyLinkRead, status_code=201)
async def link_party(
    party_id: UUID,
    body: PartyLinkCreate,
    business_id: UUID = Query(...),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PartyLinkRead:
    try:
        link = await PartyService(session).link_party(
            party_id, body, user_id=user.id, business_id=business_id
        )
    except DomainError as exc:
        raise _map(exc) from exc
    return PartyLinkRead.model_validate(link)


@router.get("/parties/{party_id}", response_model=PartyRead)
async def get_party(
    party_id: UUID,
    business_id: UUID = Query(...),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PartyRead:
    try:
        party = await PartyService(session).get_party_for_business(
            party_id, user_id=user.id, business_id=business_id
        )
    except DomainError as exc:
        raise _map(exc) from exc
    return PartyRead.model_validate(party)


@router.get(
    "/businesses/{business_id}/parties",
    response_model=list[PartyLinkRead],
)
async def list_business_parties(
    business_id: UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[PartyLinkRead]:
    try:
        links = await PartyService(session).list_links_for_business(
            business_id, user_id=user.id
        )
    except DomainError as exc:
        raise _map(exc) from exc
    return [PartyLinkRead.model_validate(x) for x in links]
