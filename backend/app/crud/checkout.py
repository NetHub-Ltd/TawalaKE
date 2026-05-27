from app.models.models import Sale
from app.schemas.schemas import SaleCreate, SaleUpdate, SalePayload
from typing import Type
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.base import BaseCRUD
from app.models.models import SaleItem

class CRUDCheckout(BaseCRUD[Sale, SaleCreate, SaleUpdate]):
    def __init__(self, model: Type[Sale]):
        super().__init__(model)
    
    async def new_sale(self, payload: SalePayload, db: AsyncSession) -> Sale:
        sale = Sale(
            business_id=payload.business_id,
            cashier_id=payload.cashier_id,
            currency=payload.currency,
            status=payload.status,
            subtotal=payload.subtotal,
            tax_rate=payload.tax_rate,
            tax_amount=payload.tax_amount,
            discount_applied=payload.discount_applied,
            total_amount=payload.total_amount
        )
        sale_obj = await self.create(db=db, obj_in=sale)
        # now loop over the items and create SaleItem records before commiting
        for item in payload.sale_items:
            sale_item = SaleItem(
                sale_id=sale_obj.id,
                product_id=item.product_id,
                sku=item.sku,
                name=item.name,
                unit_price=item.unit_price,
                quantity=item.quantity,
                subtotal=item.subtotal
            )
            db.add(sale_item)

        await db.commit()
        await db.refresh(sale_obj)
        return sale_obj



sale_crud = CRUDCheckout(Sale)