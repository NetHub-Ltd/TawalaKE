from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.api.deps import SessionDep
from app.models.models import Tenant, Staff, StaffRole
from uuid import UUID
from sqlmodel import select
from app.schemas.tenants import TenantCreate, TenantResponse

router = APIRouter()





@router.post("/onboarding", response_model=TenantResponse)
async def create_tenant(db: SessionDep, tenant: TenantCreate):
    try:

        # -----------------------------------
        # STEP 1: GET OR CREATE TENANT
        # -----------------------------------
        stmt = select(Tenant).where(Tenant.email == tenant.email)

        existing_tenant = (await db.exec(stmt)).first()

        if existing_tenant:
            db_obj = existing_tenant

        else:
            db_obj = Tenant(
                name=tenant.full_name,
                email=tenant.email,
                active=tenant.active,
                id=tenant.tenant_id
            )

            db.add(db_obj)

            # flush gives us the ID before commit
            await db.flush()

        # -----------------------------------
        # STEP 2: ENSURE OWNER EXISTS
        # -----------------------------------
        owner_stmt = select(Staff).where(
            Staff.email == tenant.email,
            Staff.tenant_id == db_obj.id
        )

        existing_owner = (await db.exec(owner_stmt)).first()

        if not existing_owner:

            owner = Staff(
                full_name=tenant.full_name,
                email=tenant.email,
                hashed_password="TEMP_DISABLED",  # replace later
                role=StaffRole.OWNER,
                tenant_id=db_obj.id
            )

            db.add(owner)

        # -----------------------------------
        # STEP 3: COMMIT
        # -----------------------------------
        await db.commit()

        # optional but useful
        await db.refresh(db_obj)

        return db_obj

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/multi")
async def list_tenants(db: SessionDep):
    stmt = select(Tenant)
    tenants = (await db.exec(stmt)).all()
    return tenants

@router.get("/{tenant_id}")
async def get_tenant(tenant_id: UUID, db: SessionDep):
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    tenant = (await db.exec(stmt)).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.delete("/{tenant_id}")
async def delete_tenant(tenant_id: UUID, db: SessionDep):
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    tenant = (await db.exec(stmt)).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    await db.delete(tenant)
    await db.commit()
    return {"detail": "Tenant deleted successfully"}