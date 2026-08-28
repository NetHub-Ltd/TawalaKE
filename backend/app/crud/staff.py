from app.models.models import Staff, StaffRole, Organization
from app.schemas.staff import StaffCreate, StaffUpdate, StaffOnboard
from app.crud.base import BaseCRUD
from sqlmodel.ext.asyncio.session import AsyncSession
from app.utils.logging import logger
from typing import Type
from sqlmodel import select
from fastapi import HTTPException
from sqlalchemy.orm import selectinload


class StaffCrud(BaseCRUD[Staff, StaffCreate, StaffUpdate]):
    def __init__(self, model: Type[Staff]):
        super().__init__(model)

    async def onboard_staff(self, db: AsyncSession, payload: StaffOnboard):
        # check if a staff with the email exist
        stmt = select(self.model).where(self.model.email == payload.email)
        result = (await db.exec(stmt)).first()

        if result:
            raise HTTPException(
                status_code=409, detail=f"A user with {payload.email} exist"
            )
        local_part = payload.email.split("@", 1)[0].strip().lower()

        org = Organization(
            name=f"{local_part}-workspace",
            email=payload.email,
        )
        db.add(org)
        await db.flush()
        await db.refresh(org)

        # Pending account: no password until email setup link is completed.
        # active=False prevents login until set-password activates the account.
        create_payload = {
            "email": payload.email,
            "full_name": payload.full_name,
            "tenant_id": org.id,
            "organization_id": org.id,
            "role": StaffRole.OWNER,
            "active": False,
            "hashed_password": None,
        }
        if getattr(payload, "phone", None):
            create_payload["phone"] = payload.phone

        staff = await self.create(db=db, obj_in=create_payload)
        await db.commit()

        # Re-load with relationships so response serialization never triggers
        # lazy IO (MissingGreenlet / ResponseValidationError on assigned_businesses).
        reload_stmt = (
            select(self.model)
            .where(self.model.id == staff.id)
            .options(selectinload(self.model.assigned_businesses))
        )
        staff = (await db.exec(reload_stmt)).first()
        if staff is not None and staff.assigned_businesses is None:
            staff.assigned_businesses = []

        logger.info(
            f"Created pending Staff: {staff.id} for Org: {staff.organization_id} (active=False)"
        )
        return staff


staff_crud = StaffCrud(Staff)
