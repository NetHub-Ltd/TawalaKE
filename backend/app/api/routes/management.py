from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import SessionDep, AuthUser
from app.models.models import Tenant, Staff, StaffRole, Organization
from app.api.deps import SessionDep, AuthUser
from app.schemas.schemas import TenantResponse
from sqlmodel import select

router = APIRouter()

# route for Tawala admins and sysetm monitoring and management route

@router.get("/org")
async def get_organizations(db: SessionDep, user: AuthUser):
    stmt = select(Organization)
    orgs = (await db.exec(stmt)).all()
    return orgs
