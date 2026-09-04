# app/crud/base.py
from datetime import datetime, timezone
from typing import Generic, Type, TypeVar, Optional, Sequence, Any, Dict, List, Tuple
from uuid import UUID
from pydantic import BaseModel, ValidationError, TypeAdapter
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import or_
from sqlmodel import SQLModel, select, col, func
from sqlmodel.ext.asyncio.session import AsyncSession
from fastapi import HTTPException, status
from loguru import logger

ModelType = TypeVar("ModelType", bound=SQLModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseCRUD(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model


    def _has_deleted_at(self) -> bool:
        return hasattr(self.model, "deleted_at")

    def _apply_not_deleted(self, stmt, *, include_deleted: bool = False):
        """Exclude soft-deleted rows unless include_deleted is True."""
        if include_deleted or not self._has_deleted_at():
            return stmt
        return stmt.where(col(self.model.deleted_at).is_(None))

    async def get(
        self,
        db: AsyncSession,
        id: UUID,
        *,
        include_deleted: bool = False,
    ) -> Optional[ModelType]:
        """
        Fetches a single record by primary key.
        Soft-deleted rows are hidden unless include_deleted=True.
        """
        try:
            stmt = select(self.model).where(col(self.model.id) == id)
            stmt = self._apply_not_deleted(stmt, include_deleted=include_deleted)
            result = await db.exec(stmt)
            return result.one_or_none()
        except SQLAlchemyError as e:
            logger.error("Database read error during get() on {}: {}", self.model.__name__, str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal database retrieval operation failed."
            )

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
    ) -> Sequence[ModelType]:
        """
        Retrieves multiple records. Defaults to latest-first sorting via 'created_at',
        falling back gracefully to 'id' if the attribute is absent.
        Soft-deleted rows are excluded by default.
        """
        try:
            stmt = select(self.model)
            stmt = self._apply_not_deleted(stmt, include_deleted=include_deleted)

            if hasattr(self.model, "created_at"):
                stmt = stmt.order_by(col(self.model.created_at).desc())
            else:
                stmt = stmt.order_by(col(self.model.id).desc())

            stmt = stmt.offset(skip).limit(limit)
            result = await db.exec(stmt)
            return result.all()
        except SQLAlchemyError as e:
            logger.error("Database read error during get_multi() on {}: {}", self.model.__name__, str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal database batch retrieval operation failed."
            )

    async def get_multi_paginated(
            self,
            db: AsyncSession,
            *,
            skip: int = 0,
            limit: int = 100,
            where_clauses: Optional[List[Any]] = None,
            sort_by: Optional[str] = None,
            sort_order: str = "desc",  # Accepts "asc" or "desc"
            include_deleted: bool = False,
    ) -> Tuple[Sequence[ModelType], int]:
        """
        Retrieves a window of records along with the total count matching the criteria.
        Supports dynamic column sorting with safe introspection fallback guards.
        """
        try:
            # 1. Build Base Statements
            data_stmt = select(self.model)
            count_stmt = select(func.count()).select_from(self.model)

            # 2. Apply dynamic filters if provided
            if where_clauses:
                for clause in where_clauses:
                    data_stmt = data_stmt.where(clause)
                    count_stmt = count_stmt.where(clause)

            data_stmt = self._apply_not_deleted(data_stmt, include_deleted=include_deleted)
            count_stmt = self._apply_not_deleted(count_stmt, include_deleted=include_deleted)

            # 3. Safe Dynamic Sort Inspection
            sort_column = None
            
            # Check if the requested column exists explicitly on the database model mapper
            if sort_by and sort_by in self.model.__mapper__.columns:
                sort_column = col(getattr(self.model, sort_by))
            # Fallback 1: Use created_at if it exists on the model
            elif hasattr(self.model, "created_at"):
                sort_column = col(getattr(self.model, "created_at"))
            # Fallback 2: Ultimate fallback to primary key id
            elif hasattr(self.model, "id"):
                sort_column = col(getattr(self.model, "id"))

            # Apply sorting direction safely if a column anchor was resolved
            if sort_column is not None:
                if sort_order.lower() == "asc":
                    data_stmt = data_stmt.order_by(sort_column.asc())
                else:
                    data_stmt = data_stmt.order_by(sort_column.desc())

            # 4. Apply pagination window constraints to data query only
            data_stmt = data_stmt.offset(skip).limit(limit)

            # 5. Execute both counts and windows within the identical transaction block
            count_result = await db.exec(count_stmt)
            total = count_result.one()

            data_result = await db.exec(data_stmt)
            items = data_result.all()

            return items, total

        except SQLAlchemyError as e:
            logger.error("Database read error during get_multi_paginated() on {}: {}", self.model.__name__, str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal database paginated batch retrieval operation failed."
            )

    async def get_by_attributes(
        self,
        db: AsyncSession,
        *,
        filters: Dict[str, Any],
        skip: int = 0,
        limit: int = 100,
        descending: bool = False,
        sort_field: Optional[str] = None
    ) -> Sequence[ModelType]:
        """
        Executes exact match filtering against attributes with full runtime Pydantic validation.
        """
        try:
            stmt = select(self.model)

            for field_name, value in filters.items():
                if not hasattr(self.model, field_name):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Field '{field_name}' invalid for model {self.model.__name__}",
                    )

                field_info = self.model.model_fields.get(field_name)
                if field_info and value is not None:
                    try:
                        TypeAdapter(field_info.annotation).validate_python(value)
                    except ValidationError:
                        raise HTTPException(
                            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail=f"Value '{value}' is invalid for field '{field_name}'",
                        )

                stmt = stmt.where(getattr(self.model, field_name) == value)

            stmt = self._apply_not_deleted(stmt, include_deleted=False)

            target_sort = sort_field if sort_field and hasattr(self.model, sort_field) else "id"
            
            if descending:
                stmt = stmt.order_by(col(getattr(self.model, target_sort)).desc())
            else:
                stmt = stmt.order_by(col(getattr(self.model, target_sort)).asc())

            result = await db.exec(stmt.offset(skip).limit(limit))
            return result.all()
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            logger.error("Database error during get_by_attributes() on {}: {}", self.model.__name__, str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Attribute filter execution failed internally."
            )

    async def search(
        self,
        db: AsyncSession,
        *,
        search_query: str,
        search_fields: List[str],
        filters: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 100,
        order_by: str = "created_at",
        descending: bool = True
    ) -> Tuple[Sequence[ModelType], int]:
        """
        Highly scalable, cross-module generic search engine. Performs database-level paginated 
        ILIKE lookups, strict relational filtering, and returns a (records, total_count) tuple.
        """
        try:
            if not search_query.strip():
                records = await self.get_multi(db, skip=skip, limit=limit, include_deleted=False)
                total_stmt = select(func.count()).select_from(self.model)
                total_stmt = self._apply_not_deleted(total_stmt, include_deleted=False)
                total_res = await db.exec(total_stmt)
                return records, (total_res.one() or 0)

            base_stmt = select(self.model)
            base_stmt = self._apply_not_deleted(base_stmt, include_deleted=False)

            if filters:
                for field_name, value in filters.items():
                    if hasattr(self.model, field_name) and value is not None:
                        base_stmt = base_stmt.where(getattr(self.model, field_name) == value)

            search_conditions = []
            for field in search_fields:
                if hasattr(self.model, field):
                    search_conditions.append(col(getattr(self.model, field)).ilike(f"%{search_query}%"))

            if search_conditions:
                base_stmt = base_stmt.where(or_(*search_conditions))

            count_stmt = select(func.count()).select_from(base_stmt.subquery())
            count_result = await db.exec(count_stmt)
            # FIX: Change .scalar_one() to .one() for ScalarResult compatibility
            total_count = count_result.one() or 0

            sort_attr = getattr(self.model, order_by) if hasattr(self.model, order_by) else self.model.id
            if descending:
                base_stmt = base_stmt.order_by(col(sort_attr).desc())
            else:
                base_stmt = base_stmt.order_by(col(sort_attr).asc())

            final_stmt = base_stmt.offset(skip).limit(limit)
            records_result = await db.exec(final_stmt)
            
            return records_result.all(), total_count

        except SQLAlchemyError as e:
            logger.error("Global search failed on model {}: {}", self.model.__name__, str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Generic search routine encountered a persistent error."
            )

    async def create(
        self, db: AsyncSession, *, obj_in: CreateSchemaType
    ) -> ModelType:
        """Validates incoming structural schema payloads and commits them to disk."""
        # db_obj = self.model.model_validate(obj_in)
        if isinstance(obj_in, BaseModel):
            obj_data = obj_in.model_dump()
        else:
            obj_data = obj_in
        db_obj = self.model(**obj_data)
        try:
            db.add(db_obj)
            await db.flush()
            await db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            await db.rollback()
            logger.error("Integrity Constraint Violation during create on {}: {}", self.model.__name__, str(e))
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Resource conflict occurred: uniqueness or relationship constraint violated."
            )
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error("Transaction rollback during create on {}: {}", self.model.__name__, str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Database transaction write failure."
            )

    async def update(
        self, db: AsyncSession, *, db_obj: ModelType, obj_in: UpdateSchemaType | Dict[str, Any]
    ) -> ModelType:
        """Executes safe partial data updates on an active in-memory record tracking reference."""
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        try:
            await db.flush()
            await db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            await db.rollback()
            logger.error("Integrity Constraint Violation during update on {}: {}", self.model.__name__, str(e))
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Modification breaks unique data rules or constraints."
            )
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error("Transaction rollback during update on {}: {}", self.model.__name__, str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Database write persistence failure during modification."
            )

    async def soft_delete(
        self,
        db: AsyncSession,
        *,
        id: UUID,
        actor_id: Optional[UUID] = None,
    ) -> Optional[ModelType]:
        """
        Soft-delete: set deleted_at (and deleted_by when the model supports it).
        Does not remove the row; stock history and FKs remain intact.
        """
        if not self._has_deleted_at():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"{self.model.__name__} does not support soft-delete (missing deleted_at).",
            )
        obj = await self.get(db, id, include_deleted=False)
        if not obj:
            return None
        try:
            obj.deleted_at = datetime.now(timezone.utc)
            if actor_id is not None and hasattr(obj, "deleted_by"):
                obj.deleted_by = actor_id
            if hasattr(obj, "active") and getattr(obj, "active", None) is True:
                obj.active = False
            db.add(obj)
            await db.flush()
            await db.refresh(obj)
            return obj
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error("Transaction rollback during soft_delete on {}: {}", self.model.__name__, str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database soft-delete operation failed.",
            )

    async def restore(self, db: AsyncSession, *, id: UUID) -> Optional[ModelType]:
        """Clear soft-delete markers. Caller must enforce authorization."""
        if not self._has_deleted_at():
            return None
        obj = await self.get(db, id, include_deleted=True)
        if not obj or getattr(obj, "deleted_at", None) is None:
            return obj
        try:
            obj.deleted_at = None
            if hasattr(obj, "deleted_by"):
                obj.deleted_by = None
            db.add(obj)
            await db.flush()
            await db.refresh(obj)
            return obj
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error("Transaction rollback during restore on {}: {}", self.model.__name__, str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database restore operation failed.",
            )

    async def hard_delete(self, db: AsyncSession, *, id: UUID) -> Optional[ModelType]:
        """
        Permanent removal. Intended for post-archive purge jobs only — not default API deletes.
        """
        obj = await self.get(db, id, include_deleted=True)
        if obj:
            try:
                await db.delete(obj)
                await db.flush()
            except SQLAlchemyError as e:
                await db.rollback()
                logger.error("Transaction rollback during hard_delete on {}: {}", self.model.__name__, str(e))
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database entity removal operation failed.",
                )
        return obj

    async def remove(self, db: AsyncSession, *, id: UUID) -> Optional[ModelType]:
        """
        Default delete path: soft-delete when the model supports deleted_at,
        otherwise hard-delete (legacy models without the column).
        """
        if self._has_deleted_at():
            return await self.soft_delete(db, id=id)
        return await self.hard_delete(db, id=id)