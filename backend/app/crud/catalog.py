"""Catalog CRUD — units of measure and product categories."""
from __future__ import annotations

from typing import List, Optional, Sequence
from uuid import UUID

from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import Category, UnitOfMeasure
from app.schemas.schemas import (
    CategoryCreate,
    CategoryUpdate,
    UnitOfMeasureCreate,
    UnitOfMeasureUpdate,
)


DEFAULT_UNITS = [
    ("pcs", "Pieces (PCS)", 10),
    ("pair", "Pairs (PR)", 20),
    ("set", "Sets (SET)", 30),
    ("dozen", "Dozens (DZN)", 40),
    ("kg", "Kilograms (KG)", 50),
    ("g", "Grams (G)", 60),
    ("l", "Liters (L)", 70),
    ("ml", "Milliliters (ML)", 80),
    ("box", "Box", 90),
    ("pack", "Pack", 100),
    ("carton", "Carton", 110),
    ("bag", "Bag / Sack", 120),
    ("m", "Meters (M)", 130),
    ("unit", "Unit", 140),
    ("other", "Other Unit", 999),
]

DEFAULT_CATEGORIES = [
    ("beverages", "Beverages & Drinks", 10),
    ("packaged_foods", "Packaged Foods & Groceries", 20),
    ("fresh_produce", "Fresh Produce & Grains", 30),
    ("bakery", "Bakery & Confectionery", 40),
    ("household", "Household & Cleaning", 50),
    ("personal_care", "Personal Care & Toiletries", 60),
    ("pharmacy", "Pharmacy & Medications", 70),
    ("agrovet", "Agrovet & Farming Supplies", 80),
    ("hardware", "Hardware & Tools", 90),
    ("electrical", "Electrical & Electronics", 100),
    ("clothing", "Clothing & Apparel", 110),
    ("beauty", "Beauty & Cosmetics", 120),
    ("food_service", "Fast Food & Restaurant Supplies", 130),
    ("cooking_ingredients", "Cooking Ingredients & Spices", 140),
    ("services", "Services & Labor", 150),
    ("digital", "Digital Products & Airtime", 160),
    ("other", "Other / Miscellaneous", 999),
]


async def ensure_system_units(db: AsyncSession) -> int:
    """Idempotent seed of system units. Returns number inserted."""
    existing = (
        await db.exec(select(UnitOfMeasure.code).where(UnitOfMeasure.organization_id.is_(None)))
    ).all()
    have = {str(c) for c in existing}
    n = 0
    for code, label, sort_order in DEFAULT_UNITS:
        if code in have:
            continue
        db.add(
            UnitOfMeasure(
                code=code,
                label=label,
                sort_order=sort_order,
                active=True,
                organization_id=None,
            )
        )
        n += 1
    if n:
        await db.commit()
    return n


async def ensure_org_categories(db: AsyncSession, organization_id: UUID) -> int:
    """Idempotent seed of default categories for an organization."""
    existing = (
        await db.exec(
            select(Category.code).where(
                Category.organization_id == organization_id,
                Category.business_id.is_(None),
            )
        )
    ).all()
    have = {str(c) for c in existing if c}
    n = 0
    for code, name, sort_order in DEFAULT_CATEGORIES:
        if code in have:
            continue
        db.add(
            Category(
                organization_id=organization_id,
                business_id=None,
                name=name,
                code=code,
                sort_order=sort_order,
                active=True,
            )
        )
        n += 1
    if n:
        await db.commit()
    return n


async def list_units(
    db: AsyncSession,
    *,
    organization_id: Optional[UUID] = None,
    active_only: bool = True,
) -> Sequence[UnitOfMeasure]:
    stmt = select(UnitOfMeasure).where(UnitOfMeasure.deleted_at.is_(None))
    if active_only:
        stmt = stmt.where(UnitOfMeasure.active == True)  # noqa: E712
    # system units + optional org units
    if organization_id is not None:
        stmt = stmt.where(
            (UnitOfMeasure.organization_id.is_(None))
            | (UnitOfMeasure.organization_id == organization_id)
        )
    else:
        stmt = stmt.where(UnitOfMeasure.organization_id.is_(None))
    stmt = stmt.order_by(col(UnitOfMeasure.sort_order), col(UnitOfMeasure.label))
    return (await db.exec(stmt)).all()


async def create_unit(
    db: AsyncSession, payload: UnitOfMeasureCreate, *, organization_id: Optional[UUID] = None
) -> UnitOfMeasure:
    row = UnitOfMeasure(
        code=payload.code.strip().lower(),
        label=payload.label.strip(),
        sort_order=payload.sort_order,
        active=payload.active,
        organization_id=organization_id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def update_unit(
    db: AsyncSession, unit_id: UUID, payload: UnitOfMeasureUpdate
) -> UnitOfMeasure:
    row = await db.get(UnitOfMeasure, unit_id)
    if row is None or row.deleted_at is not None:
        from fastapi import HTTPException

        raise HTTPException(404, detail="Unit not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def list_categories(
    db: AsyncSession,
    *,
    organization_id: UUID,
    business_id: Optional[UUID] = None,
    active_only: bool = True,
) -> Sequence[Category]:
    await ensure_org_categories(db, organization_id)
    stmt = select(Category).where(
        Category.organization_id == organization_id,
        Category.deleted_at.is_(None),
    )
    if active_only:
        stmt = stmt.where(Category.active == True)  # noqa: E712
    if business_id is not None:
        stmt = stmt.where(
            (Category.business_id.is_(None)) | (Category.business_id == business_id)
        )
    else:
        stmt = stmt.where(Category.business_id.is_(None))
    stmt = stmt.order_by(col(Category.sort_order), col(Category.name))
    return (await db.exec(stmt)).all()


async def create_category(
    db: AsyncSession, organization_id: UUID, payload: CategoryCreate
) -> Category:
    row = Category(
        organization_id=organization_id,
        business_id=payload.business_id,
        name=payload.name.strip(),
        code=(payload.code or payload.name).strip().lower().replace(" ", "_")[:64],
        parent_id=payload.parent_id,
        sort_order=payload.sort_order,
        active=payload.active,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def update_category(
    db: AsyncSession, organization_id: UUID, category_id: UUID, payload: CategoryUpdate
) -> Category:
    row = await db.get(Category, category_id)
    if row is None or row.deleted_at is not None or row.organization_id != organization_id:
        from fastapi import HTTPException

        raise HTTPException(404, detail="Category not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row
