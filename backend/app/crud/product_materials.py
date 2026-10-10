"""Service material recipe helpers (Phase B/C)."""
from __future__ import annotations

from typing import List, Optional, Sequence, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import ItemType, Product, ProductMaterial


def _normalize_item_type(raw: Optional[str]) -> ItemType:
    if raw is None:
        return ItemType.PRODUCT
    s = str(raw).strip().upper()
    if s in ("SERVICE", "SERVICES"):
        return ItemType.SERVICE
    return ItemType.PRODUCT


def _unpack_material_row(row: object) -> Tuple[ProductMaterial, Optional[Product]]:
    """
    SQLAlchemy/SQLModel may return Row, tuple, or a single entity depending on version.
    Always return (ProductMaterial, Optional[Product]).

    Bug fixed: Row is not a tuple subclass, so treating the whole Row as ProductMaterial
    caused AttributeError: material_id on PATCH /products/{id}.
    """
    if isinstance(row, ProductMaterial):
        return row, None
    if isinstance(row, (tuple, list)):
        binding = row[0]
        mat = row[1] if len(row) > 1 else None
        return binding, mat  # type: ignore[return-value]
    # SQLAlchemy Row: supports __getitem__/__len__ but is not a tuple
    try:
        binding = row[0]  # type: ignore[index]
        mat = row[1] if len(row) > 1 else None  # type: ignore[arg-type]
        if isinstance(binding, ProductMaterial):
            return binding, mat if (mat is None or isinstance(mat, Product)) else None
    except (TypeError, KeyError, IndexError, AttributeError):
        pass
    raise TypeError(f"Unexpected material row type: {type(row)!r}")


async def list_materials(
    db: AsyncSession, service_id: UUID
) -> List[Tuple[ProductMaterial, Optional[Product]]]:
    stmt = (
        select(ProductMaterial, Product)
        .where(
            ProductMaterial.service_id == service_id,
            ProductMaterial.deleted_at.is_(None),  # type: ignore[attr-defined]
        )
        .outerjoin(Product, Product.id == ProductMaterial.material_id)
        .order_by(ProductMaterial.created_at)
    )
    rows = list(await db.exec(stmt))
    return [_unpack_material_row(row) for row in rows]


async def materials_payload(
    db: AsyncSession, service_id: UUID
) -> List[dict]:
    pairs = await list_materials(db, service_id)
    result = []
    for binding, mat in pairs:
        result.append(
            {
                "material_id": binding.material_id,
                "quantity": float(binding.quantity or 0),
                "material_label": mat.label if mat is not None else None,
            }
        )
    return result


async def replace_materials(
    db: AsyncSession,
    *,
    service: Product,
    materials: Sequence[dict],
    organization_id: Optional[UUID],
) -> None:
    """Replace full recipe. materials items: material_id, quantity."""
    if service.item_type != ItemType.SERVICE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Material bindings are only allowed on services. Convert this item to a service first.",
        )

    # Soft-delete existing bindings
    existing = (
        await db.exec(
            select(ProductMaterial).where(
                ProductMaterial.service_id == service.id,
                ProductMaterial.deleted_at.is_(None),  # type: ignore[attr-defined]
            )
        )
    ).all()
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    for row in existing:
        row.deleted_at = now
        db.add(row)

    seen = set()
    for raw in materials:
        mid = raw.get("material_id") if isinstance(raw, dict) else getattr(raw, "material_id", None)
        qty = raw.get("quantity") if isinstance(raw, dict) else getattr(raw, "quantity", 1.0)
        if mid is None:
            continue
        mid = mid if isinstance(mid, UUID) else UUID(str(mid))
        qty_f = float(qty or 0)
        if qty_f <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Material quantity must be greater than zero.",
            )
        if mid in seen:
            continue
        seen.add(mid)
        if mid == service.id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A service cannot consume itself as a material.",
            )
        mat = await db.get(Product, mid)
        if mat is None or mat.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Material product {mid} not found.",
            )
        if mat.business_id != service.business_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Material '{mat.label}' belongs to a different business.",
            )
        if mat.item_type == ItemType.SERVICE:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"'{mat.label}' is a service. Materials must be products (separate SKUs for size/colour).",
            )
        db.add(
            ProductMaterial(
                organization_id=organization_id or service.organization_id,
                business_id=service.business_id,
                service_id=service.id,
                material_id=mid,
                quantity=qty_f,
            )
        )


async def recipe_unit_cogs(db: AsyncSession, service_id: UUID) -> Optional[float]:
    """Sum(material.cost_price × qty). None if any material lacks cost."""
    pairs = await list_materials(db, service_id)
    if not pairs:
        return None
    total = 0.0
    for binding, mat in pairs:
        if mat is None or mat.cost_price is None:
            return None
        total += float(mat.cost_price) * float(binding.quantity)
    return round(total, 4)


async def check_material_stock(
    db: AsyncSession,
    *,
    service: Product,
    service_qty: float,
) -> None:
    """Raise 409 if any tracked material is short for service_qty units of service."""
    pairs = await list_materials(db, service.id)
    for binding, mat in pairs:
        if mat is None:
            continue
        if not mat.track_stock:
            continue
        need = float(binding.quantity) * float(service_qty)
        avail = float(mat.stock or 0)
        if avail < need:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Insufficient stock for material '{mat.label}' "
                    f"(needed for service '{service.label}'): "
                    f"available {avail}, required {need}."
                ),
            )


async def deduct_materials_for_sale(
    db: AsyncSession,
    *,
    service: Product,
    service_qty: float,
    business_id: UUID,
    performed_by: Optional[UUID],
    sale_id: UUID,
    commit: bool = False,
) -> None:
    from app.crud.stock import stock_crud

    pairs = await list_materials(db, service.id)
    for binding, mat in pairs:
        if mat is None:
            continue
        # Reload with lock
        locked = (
            await db.exec(
                select(Product).where(Product.id == mat.id).with_for_update()
            )
        ).one_or_none()
        if locked is None:
            continue
        need = float(binding.quantity) * float(service_qty)
        if not locked.track_stock:
            continue
        await stock_crud.apply_sale_item_deduction(
            db,
            product=locked,
            quantity=need,
            business_id=business_id,
            performed_by=performed_by,
            unit_price=None,
            notes=f"Material for service '{service.label}' (sale {sale_id})",
            commit=commit,
        )
