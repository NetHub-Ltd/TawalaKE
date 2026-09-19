"""CatalogService — product/service identity (no inventory) SPEC M8."""

from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core_platform.shared.types import DomainError, DomainErrorCode
from app.models.catalog import CatalogStatus, Product, Service
from app.models.security import Membership, MembershipStatus
from app.schemas.catalog import ProductCreate, ProductUpdate, ServiceCreate


class CatalogService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def _require_membership(self, user_id: UUID, business_id: UUID) -> Membership:
        m = await self._session.scalar(
            select(Membership).where(
                Membership.user_id == user_id,
                Membership.business_id == business_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.deleted_at.is_(None),  # type: ignore[attr-defined]
            )
        )
        if m is None:
            raise DomainError(
                DomainErrorCode.FORBIDDEN, "No active membership for this business"
            )
        return m

    async def create_product(
        self, data: ProductCreate, *, user_id: UUID, business_id: UUID
    ) -> Product:
        await self._require_membership(user_id, business_id)
        product = Product(
            id=uuid4(),
            business_id=business_id,
            name=data.name,
            sku=data.sku,
            barcode=data.barcode,
            category_id=data.category_id,
            unit=data.unit,
            status=CatalogStatus.ACTIVE,
        )
        self._session.add(product)
        await self._session.commit()
        await self._session.refresh(product)
        return product

    async def update_product(
        self, product_id: UUID, data: ProductUpdate, *, user_id: UUID, business_id: UUID
    ) -> Product:
        await self._require_membership(user_id, business_id)
        product = await self._session.get(Product, product_id)
        if (
            product is None
            or product.deleted_at is not None
            or product.business_id != business_id
        ):
            raise DomainError(DomainErrorCode.NOT_FOUND, "Product not found")
        if data.name is not None:
            product.name = data.name
        if data.sku is not None:
            product.sku = data.sku
        if data.barcode is not None:
            product.barcode = data.barcode
        if data.category_id is not None:
            product.category_id = data.category_id
        if data.unit is not None:
            product.unit = data.unit
        if data.status is not None:
            product.status = CatalogStatus(data.status)
        product.touch()
        self._session.add(product)
        await self._session.commit()
        await self._session.refresh(product)
        return product

    async def get_product(
        self, product_id: UUID, *, user_id: UUID, business_id: UUID
    ) -> Product:
        await self._require_membership(user_id, business_id)
        product = await self._session.get(Product, product_id)
        if (
            product is None
            or product.deleted_at is not None
            or product.business_id != business_id
        ):
            raise DomainError(DomainErrorCode.NOT_FOUND, "Product not found")
        return product

    async def list_products(
        self, *, user_id: UUID, business_id: UUID
    ) -> list[Product]:
        await self._require_membership(user_id, business_id)
        result = await self._session.scalars(
            select(Product).where(
                Product.business_id == business_id,
                Product.deleted_at.is_(None),  # type: ignore[attr-defined]
            )
        )
        return list(result.all())

    async def create_service(
        self, data: ServiceCreate, *, user_id: UUID, business_id: UUID
    ) -> Service:
        await self._require_membership(user_id, business_id)
        service = Service(
            id=uuid4(),
            business_id=business_id,
            name=data.name,
            code=data.code,
            status=CatalogStatus.ACTIVE,
        )
        self._session.add(service)
        await self._session.commit()
        await self._session.refresh(service)
        return service

    async def get_service(
        self, service_id: UUID, *, user_id: UUID, business_id: UUID
    ) -> Service:
        await self._require_membership(user_id, business_id)
        service = await self._session.get(Service, service_id)
        if (
            service is None
            or service.deleted_at is not None
            or service.business_id != business_id
        ):
            raise DomainError(DomainErrorCode.NOT_FOUND, "Service not found")
        return service
