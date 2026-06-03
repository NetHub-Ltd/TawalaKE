from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import SessionDep, AuthUser
from app.models.models import Tenant, Staff, StaffRole, Organization
from app.api.deps import SessionDep, AuthUser
from app.schemas.schemas import TenantResponse
from sqlmodel import select
from app.core.security import hash_password
from pydantic import EmailStr

router = APIRouter()

# route for Tawala admins and sysetm monitoring and management route

@router.get("/org")
async def get_organizations(db: SessionDep, user: AuthUser):
    stmt = select(Organization)
    orgs = (await db.exec(stmt)).all()
    return orgs


@router.patch("/patch-staff-password")
async def override_staff_password(db: SessionDep, user: AuthUser, staff_email: EmailStr, new_password: str):
    # if user.role != StaffRole.ADMIN:
    #     raise HTTPException(status_code=403, detail="Only admins can override passwords.")
    
    stmt = select(Staff).where(Staff.email == staff_email)
    staff_member = (await db.exec(stmt)).first()
    
    if not staff_member:
        raise HTTPException(status_code=404, detail="Staff member not found.")
    
    staff_member.hashed_password = hash_password(new_password)  # In a real application, ensure to hash the password
    db.add(staff_member)
    await db.commit()
    
    return {"message": "Password overridden successfully."}