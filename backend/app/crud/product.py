from typing import Type, List, Optional, Dict, Any, Tuple, Sequence
from uuid import UUID
from datetime import datetime
from sqlmodel import col

from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.base import BaseCRUD
from app.models.models import Product
from app.schemas.schemas import ProductCreate, ProductUpdate

# Note: Keeping CategoryCreate and CategoryResponse imports safe if needed by the module
from app.schemas.schemas import CategoryCreate, CategoryResponse


class ProductCrud(BaseCRUD[Product, ProductCreate, ProductUpdate]):
    def __init__(self, model: Type[Product]):
        super().__init__(model)

    async def fetch_poducts(
        self, 
        db: AsyncSession, 
        *,
        limit: int = 50, 
        skip: int = 0,
        sort_by: Optional[str] = None,
        sort_order: str = "desc",
        business_id: Optional[str] = None
    ) -> Tuple[Sequence[Product], int]:
        """
        Retrieves products using the base class batch engine.
        Automatically leverages dynamic column sorting, total counts, and structured logging.
        Note: Method name retains the historical typo 'fetch_poducts' to maintain zero breaking changes.
        """
        # Build dynamic clauses to ensure data multi-tenancy isolation by business
        where_clauses = []
        if business_id:
            where_clauses.append(col(self.model.business_id) == business_id)

        # Forward parameters safely into the base paginated engine
        items, total = await self.get_multi_paginated(
            db, 
            skip=skip, 
            limit=limit, 
            where_clauses=where_clauses,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        return items, total

    async def delete_product(self, product_id: UUID, db: AsyncSession) -> bool:
        """
        Removes a product cleanly by its primary key.
        Maintains transactional boundary by committing inside the wrapper as per production constraints.
        """
        prod = await self.get(db=db, id=product_id)
        if prod is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Product not found"
            )
        
        await self.remove(db, id=product_id)
        try:
            await db.commit()
            return True
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error("Failed to commit product deletion for ID {}: {}", product_id, str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not finalize product deletion transaction."
            )

    async def update_product(self, product_id: UUID, payload: ProductUpdate, db: AsyncSession) -> Product:
        """
        Modifies an existing product utilizing the runtime validation pipeline.
        Maintains structural production constraints and commits cleanly.
        """
        prod_obj = await self.get(db=db, id=product_id)
        if prod_obj is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Product not found"
            )
        
        updated = await self.update(db=db, db_obj=prod_obj, obj_in=payload)
        try:
            await db.commit()
            return updated
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error("Failed to commit product updates for ID {}: {}", product_id, str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not finalize product updates transaction."
            )

    async def fetch_business_products(
        self, 
        business_id: UUID, 
        db: AsyncSession, 
        limit: int = 50,
        skip: int = 0
    ) -> Sequence[Product]:
        """
        Fetches products scoped entirely to a business identifier.
        Uses the base type-validation engine and enforces latest-first order.
        """
        return await self.get_by_attributes(
            db,
            filters={"business_id": business_id},
            skip=skip,
            limit=limit,
            descending=True,
            sort_field="created_at"  # Explicitly enforces latest first sorting safely
        )

    async def search_products(
        self,
        db: AsyncSession,
        *,
        search_query: str,
        business_id: Optional[UUID] = None,
        tenant_id: Optional[UUID] = None,
        organization_id: Optional[UUID] = None,
        category: Optional[str] = None,
        active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[Sequence[Product], int]:
        """
        Advanced, multi-tenant paginated search implementation for the product domain.
        Executes real-time database-level ILIKE lookups across text boundaries while
        enforcing strict context boundaries (Tenant, Org, Business, Category).
        
        Returns:
            Tuple[Sequence[Product], int]: (matching_records, total_count_before_pagination)
        """
        # 1. Dynamically build the context filter dictionary
        filters: Dict[str, Any] = {}
        
        if business_id is not None:
            filters["business_id"] = business_id
        if tenant_id is not None:
            filters["tenant_id"] = tenant_id
        if organization_id is not None:
            filters["organization_id"] = organization_id
        if category is not None:
            filters["category"] = category
        if active is not None:
            filters["active"] = active

        # 2. Map textual lookups strictly to indexed fields
        search_fields = ["label", "category"]

        # 3. Hand off execution directly to the high-performance BaseCRUD search engine
        return await self.search(
            db=db,
            search_query=search_query,
            search_fields=search_fields,
            filters=filters,
            skip=skip,
            limit=limit,
            order_by="created_at",
            descending=True
        )


# Singleton instantiation maintaining compatibility with existing imports
product_crud = ProductCrud(Product)