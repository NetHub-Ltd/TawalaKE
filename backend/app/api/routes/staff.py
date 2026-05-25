from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from uuid import UUID

from app.api.deps import SessionDep
from app.models.models import Staff, StaffRole
from app.schemas.schemas import StaffCreateIn
# Assuming you use pwd_context or passlib for hashing (adjust your import path accordingly)
# from app.utils.security import get_password_hash  

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def create_staff_member(payload: StaffCreateIn, db: SessionDep):
    """
    Asynchronously creates a new operational staff record under a tenant.
    """
    # 1. Verification Gate: Check if email is already taken globally
    stmt = select(Staff).where(Staff.email == payload.email)
    result = await db.exec(stmt)
    existing_staff = result.first()
    
    if existing_staff:
        raise HTTPException(
            status_code=400, 
            detail="A staff account with this email address already exists."
        )

    try:
        # 2. Hash plaintext password for storage safety
        # hashed_pwd = get_password_hash(payload.password)

        # 3. Initialize instance mapping to BaseMixin properties
        db_staff = Staff(
            tenant_id=payload.tenant_id,
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=payload.password,  # Replace with hashed_pwd in production
            role=payload.role,
            active=True
        )

        # 4. Stage record in memory (Remember: do NOT await db.add)
        db.add(db_staff)
        
        # 5. Flush over network wire to generate the auto-incrementing UUID id
        await db.flush()
        
        # 6. Commit transaction safely
        await db.commit()
        
        return db_staff
    except Exception as error:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to provision staff record. Pipeline rolled back safely. Logs: {str(error)}"
        )