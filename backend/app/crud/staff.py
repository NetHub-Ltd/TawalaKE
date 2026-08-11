from app.models.models import Staff, StaffRole, Organization
from app.schemas.staff import StaffCreate, StaffUpdate, StaffOnboard
from app.crud.base  import BaseCRUD
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlmodel.ext.asyncio.session import AsyncSession
from app.utils.logging import logger
from typing import Type
from sqlmodel import select
from fastapi import HTTPException


class StaffCrud(BaseCRUD[Staff, StaffCreate, StaffUpdate]):
    def __init__(self, model: Type[Staff]):
        super().__init__(model)

    
    async def onboard_staff(self, db: AsyncSession, payload: StaffOnboard):
        # check if a staff with the email exist
        stmt = select(self.model).where(self.model.email == payload.email)
        result = (await db.exec(stmt)).first()

        if result:
            raise HTTPException(status_code=409, detail=f"A user with {payload.email} exist")
        local_part = payload.email.split("@", 1)[0].strip().lower()

        org = Organization(
            name=f"{local_part}-workspace",
            email=payload.email
        )
        db.add(org)
        await db.flush()
        await db.refresh(org)

        payload = {
            "email": payload.email,
            "full_name": payload.full_name,
            "tenant_id": org.id,
            "organization_id": org.id,
            "role": StaffRole.OWNER

        }
        staff = await self.create(db=db, obj_in=payload)
        await db.commit()
        await db.refresh(staff)
        logger.info(f"Created Staff: {staff.id} for Org: {staff.organization_id}")
        return staff

staff_crud = StaffCrud(Staff) 