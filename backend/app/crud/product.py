from typing import Type, List
from uuid import UUID

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.base import BaseCRUD
from app.models.models import Product
from app.schemas.schemas import ProductCreate, ProductUpdate, CategoryCreate, CategoryResponse


class ProductCrud(BaseCRUD[Product, ProductCreate, ProductUpdate]):
    def __init__(self, model: Type[Product]):
        super().__init__(model)

    async def delete_product(self, product_id: UUID, db: AsyncSession):
        prod = await self.get(db=db, id=product_id)
        if prod is None:
            raise HTTPException(status_code=404, detail="Product not found")
        await self.remove(db, id=product_id)
        await db.commit()
        return True

    async def update_product(self, product_id: UUID, payload: ProductUpdate, db: AsyncSession):
        prod_obj = await self.get(db=db, id=product_id)
        if prod_obj is None:
            raise HTTPException(status_code=404, detail="Product not found")
        updated = await self.update(db=db, db_obj=prod_obj, obj_in=payload)
        await db.commit()
        return updated

    # async def create_category(self, db_obj: CategoryCreate, db: AsyncSession):
    #     try:
    #         category = Category(
    #             name=db_obj.name,
    #             type=db_obj.type,
    #         )
    #
    #         db.add(category)
    #         await db.commit()
    #         await db.refresh(category)  # 🔥 critical
    #         return category
    #
    #     except IntegrityError as e:
    #         await db.rollback()
    #         logger.error(f"duplicate data: {e}")
    #         raise HTTPException(status_code=400, detail="Category with similar data already exists")
    #
    #     except SQLAlchemyError as e:
    #         await db.rollback()
    #         logger.error(f"database error: {e}")
    #         raise HTTPException(status_code=500,detail="Internal database error")

    # async def fetch_categories(self, db: AsyncSession) -> List[Category]:
    #     result = await db.exec(select(Category))
    #     categories = result.all()
    #     return categories


    async def fetch_business_products(self, business_id: UUID, db: AsyncSession) -> List[Product]:
        results = await db.exec(select(self.model).where(self.model.business_id == business_id))
        return list(results.all())


product_crud = ProductCrud(Product)