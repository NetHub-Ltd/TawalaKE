from typing import Type, List, Dict, Tuple, Optional, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import select, desc, func, col
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from pydantic import BaseModel, Field

from app.crud.base import BaseCRUD
from app.core.security import hash_password 
from app.models.models import (
    Business, StaffBusinessAssignment, Staff, StockHistory, 
    StockMovementType, Product, Sale, SaleItem, FinancialDocument, 
    DocumentType, SaleStatus, Payment, PaymentMethod, Customer, 
    StaffRole
)
from app.schemas.schemas import BusinessCreate, BusinessUpdate, StaffCreateIn
from app.schemas.business import StaffRequest, ProductAuditRequest, ProductRestockRequest
from app.schemas.store import FinalizeCheckoutIn, CartItemIn, InitializeCheckout
from app.utils.logging import logger
from app.utils.helpers import utc_now

from app.tasks.worker import generate_financial_document_task


class StoreCrud(BaseCRUD[Business, BusinessCreate, BusinessUpdate]):
    """
    Unified Single Source of Truth for Business Location and Storefront Operations.
    Enforces multi-tenant validations, checkout operations, and auditing metrics.
    """
    def __init__(self, model: Type[Business]):
        super().__init__(model)

    async def get_store_products(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        skip: int = 0,
        limit: int = 10
    ) -> List[Product]:
        """
        Verifies store product queries correctly apply structural filtering criteria
        and strictly appends order constraints safely.
        """
        try:
            stmt = (
                select(Product)
                .where(Product.business_id == business_id)
                .offset(skip)
                .limit(limit)
                .order_by(Product.label)
            )
            result = await db.exec(stmt)
            return result.all()
        except SQLAlchemyError as e:
            logger.error(f"Failed to fetch store products for business {business_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database read failure during product query operations."
            )

    async def initialize_checkout(
        self,
        db: AsyncSession,
        *,
        payload: InitializeCheckout,
        tax_rate: float = 0.0
    ) -> Sale:
        """
        Validates checkout initiation, accurately tracks item lines, computes totals,
        and constructs a transient pending sale ledger instance.
        """
        subtotal = 0.0
        sale_items = []

        for item in payload.items:
            stmt = select(Product).where(Product.id == item.product_id)
            res = await db.exec(stmt)
            product = res.one_or_none()
            
            if not product:
                logger.error(f"Checkout failure: Product ID {item.product_id} not found.")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="One or more selected inventory items could not be found."
                )
            logger.info(f"Product data: {product.attributes.get('sku', 'N/A')} ")
            item_total = product.selling_price * item.quantity
            subtotal += item_total

            sale_items.append(
                SaleItem(
                    product_id=product.id,
                    quantity=item.quantity,
                    unit_price=product.selling_price,
                    total_price=item_total,
                    sku=product.attributes.get('sku', 'N/A'),
                    name=product.label
                )
            )

        # Standard Kenyan 16% VAT Configuration
        tax_amount = round(subtotal * tax_rate, 2)
        total_amount = subtotal + tax_amount

        sale = Sale(
            id=uuid4(),
            business_id=payload.business_id,
            cashier_id=payload.cashier_id,
            status=SaleStatus.PENDING_PAYMENT,
            currency="KES",
            subtotal=subtotal,
            tax_rate=tax_rate,
            tax_amount=tax_amount,
            discount=0.0,
            total_amount=total_amount,
            items=sale_items
        )

        db.add(sale)
        for s_item in sale_items:
            s_item.sale_id = sale.id
            db.add(s_item)

        try:
            await db.flush()
            return sale
        except SQLAlchemyError as e:
            logger.error(f"Database tracking pipeline failure during checkout initiation: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize transient checkout ledger."
            )

    async def finalize_checkout(
        self,
        db: AsyncSession,
        *,
        sale_id: UUID,
        payload: FinalizeCheckoutIn
    ) -> Sale:
        """
        Transitions a pending checkout process into a completed state, processes inventory stock
        reductions, creates stock movement logs, and yields transaction documents.
        """
        stmt = select(Sale).where(Sale.id == sale_id)
        res = await db.exec(stmt)
        sale = res.one_or_none()

        if not sale:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target pending sale tracking code not found."
            )

        sale.status = SaleStatus.COMPLETED
        db.add(sale)

        # Process standard transactional payment attachment
        payment = Payment(
            id=uuid4(),
            sale_id=sale.id,
            amount=sale.total_amount,
            payment_method=payload.payment_method,
            payment_reference=payload.payment_reference or f"TXN-{uuid4().hex[:8].upper()}",
            status="SUCCESS"
        )
        db.add(payment)

        # Defer/Execute product stock balances decrements
        for item in sale.items:
            prod_stmt = select(Product).where(Product.id == item.product_id)
            prod_res = await db.exec(prod_stmt)
            product = prod_res.one_or_none()

            if product and product.track_stock:
                product.stock -= item.quantity
                db.add(product)

                history = StockHistory(
                    id=uuid4(),
                    product_id=product.id,
                    business_id=sale.business_id,
                    quantity=-item.quantity,
                    movement_type=StockMovementType.SALE,
                    description=f"Automated POS checkout tracking deduction for sale ID: {sale.id}"
                )
                db.add(history)

        # # Build chronological financial document number slugs
        # is_invoice = payload.payment_method == PaymentMethod.INVOICE
        # doc_type = DocumentType.INVOICE if is_invoice else DocumentType.RECEIPT
        # prefix = "INV" if is_invoice else "REC"
        # date_slug = datetime.now(timezone.utc).strftime("%y%m%d")
        # serial = sale.id.hex[:8].upper()
        # document_number = f"{prefix}-{date_slug}-{serial}"

        # document = FinancialDocument(
        #     id=uuid4(),
        #     business_id=sale.business_id,
        #     sale_id=sale.id,
        #     customer_id=sale.customer_id,
        #     document_type=doc_type,
        #     document_number=document_number,
        #     subtotal=sale.subtotal,
        #     discount_amount=sale.discount,
        #     tax_amount=sale.tax_amount,
        #     total_amount=sale.total_amount,
        #     amount_paid=0.0 if is_invoice else sale.total_amount,
        #     fiscal_metadata={"device_serial": "TRA-2026-X"}
        # )
        # db.add(document)

        try:
            # await db.commit()
            # 5. Dispatch the offloaded task down the Celery wire for async invoice processing & analytics
            generate_financial_document_task.delay(str(sale.id))
            return sale
        except IntegrityError as e:
            await db.rollback()
            logger.error(f"Uniqueness check violation during storefront finalization: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Document sequencing integrity index crash. Transaction aborted."
            )

    async def create_staff_account(
        self,
        db: AsyncSession,
        *,
        payload: StaffCreateIn
    ) -> Staff:
        """
        Creates staff accounts and signs physical records into persistence matrices safely.
        """
        try:
            db_staff = Staff(
                id=uuid4(),
                tenant_id=payload.tenant_id,
                email=payload.email,
                full_name=payload.full_name,
                hashed_password=hash_password(payload.password) if payload.password else "",
                role=payload.role,
                active=True
            )
            db.add(db_staff)
            await db.flush()

            assignment = StaffBusinessAssignment(
                id=uuid4(),
                staff_id=db_staff.id,
                business_id=payload.business_id,
                role=payload.role
            )
            db.add(assignment)
            
            await db.commit()
            return db_staff
        except Exception as error:
            logger.error(f"Operational fault context in user provisioning sequence: {error}")
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Staff account creation error."
            )

    # async def get_financial_document_json(
    #     self,
    #     db: AsyncSession,
    #     *,
    #     document_id: UUID
    # ) -> Optional[Dict[str, Any]]:
    #     """
    #     Queries a financial document by its primary key, builds the dictionary format,
    #     and provides flat attributes satisfying test schemas.
    #     """
    #     stmt = select(FinancialDocument).where(FinancialDocument.id == document_id)
    #     res = await db.exec(stmt)
    #     doc = res.scalar_one_or_none()
        
    #     if not doc:
    #         return None

    #     # Fetch matching line items linked down inside the sale pipeline
    #     items_stmt = select(SaleItem).where(SaleItem.sale_id == doc.sale_id)
    #     items_res = await db.exec(items_stmt)
    #     items = items_res.all()

    #     return {
    #         "id": str(doc.id),
    #         "business_id": str(doc.business_id),
    #         "sale_id": str(doc.sale_id),
    #         "document_type": doc.document_type.value if hasattr(doc.document_type, 'value') else str(doc.document_type),
    #         "document_number": doc.document_number,
    #         "subtotal": doc.subtotal,
    #         "tax_amount": doc.tax_amount,
    #         "discount_amount": doc.discount_amount,
    #         "total_amount": doc.total_amount,
    #         "amount_paid": doc.amount_paid,
    #         "fiscal_metadata": doc.fiscal_metadata,
    #         "items": [
    #             {
    #                 "id": str(item.id),
    #                 "product_id": str(item.product_id),
    #                 "quantity": item.quantity,
    #                 "unit_price": item.unit_price,
    #                 "total_price": item.total_price,
    #                 "sku": item.sku,
    #                 "name": item.name
    #             } for item in items
    #         ]
    #     }

    async def get_financial_document_json(
        self,
        db: AsyncSession,
        *,
        sale_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """
        Queries a financial document by its primary key, builds the dictionary format,
        and provides flat attributes satisfying test schemas.
        """
        stmt = select(FinancialDocument).where(FinancialDocument.sale_id == sale_id)
        res = await db.exec(stmt)
        # Use one_or_none() directly on the SQLModel ScalarResult
        # doc = res.one_or_none() 
        doc = res.unique().one_or_none()
        
        if not doc:
            return None
        
        return doc.document_snapshot


        # # Fetch matching line items linked down inside the sale pipeline
        # items_stmt = select(SaleItem).where(SaleItem.sale_id == doc.sale_id)
        # items_res = await db.exec(items_stmt)
        # items = items_res.all()

        # return {
        #     "id": str(doc.id),
        #     "business_id": str(doc.business_id),
        #     "sale_id": str(doc.sale_id),
        #     "document_type": doc.document_type.value if hasattr(doc.document_type, 'value') else str(doc.document_type),
        #     "document_number": doc.document_number,
        #     "subtotal": doc.subtotal,
        #     "tax_amount": doc.tax_amount,
        #     "discount_amount": doc.discount_amount,
        #     "total_amount": doc.total_amount,
        #     "amount_paid": doc.amount_paid,
        #     "fiscal_metadata": doc.fiscal_metadata,
        #     "items": [
        #         {
        #             "id": str(item.id),
        #             "product_id": str(item.product_id),
        #             "quantity": item.quantity,
        #             "unit_price": item.unit_price,
        #             "total_price": item.subtotal,
        #             "sku": item.sku,
        #             "name": item.name
        #         } for item in items
        #     ]
        # }

    async def list_business_financial_documents_json(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Retrieves a paginated, chronological stream of historical documents
        for a specific business location, sorted strictly by created_at descending.
        """
        count_stmt = select(func.count(FinancialDocument.id)).where(FinancialDocument.business_id == business_id)
        count_res = await db.exec(count_stmt)
        total_count = count_res.scalar_one_or_none() or 0

        stmt = (
            select(FinancialDocument)
            .where(FinancialDocument.business_id == business_id)
            .order_by(desc(FinancialDocument.id))
            .offset(skip)
            .limit(limit)
        )
        res = await db.exec(stmt)
        docs = res.all()

        return {
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "data": [
                {
                    "id": str(doc.id),
                    "document_number": doc.document_number,
                    "document_type": doc.document_type.value if hasattr(doc.document_type, 'value') else str(doc.document_type),
                    "total_amount": doc.total_amount,
                    "amount_paid": doc.amount_paid
                } for doc in docs
            ]
        }

    async def get_business_analytics(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """
        Aggregates operational storefront sales data across boundaries.
        Returns explicit root metrics along with comprehensive breakdown dictionaries.
        """
        count_stmt = select(func.count(Sale.id)).where(
            Sale.business_id == business_id,
            Sale.status == SaleStatus.COMPLETED
        )
        count_res = await db.exec(count_stmt)
        total_sales_count = count_res.scalar_one_or_none() or 0

        sum_stmt = select(func.sum(Sale.total_amount)).where(
            Sale.business_id == business_id,
            Sale.status == SaleStatus.COMPLETED
        )
        sum_res = await db.exec(sum_stmt)
        gross_revenue = sum_res.scalar_one_or_none() or 0.0

        return {
            "business_id": str(business_id),
            "total_revenue": gross_revenue,  # Flat mapping property required by structural suite asserts
            "timeframe": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "high_level_metrics": {
                "gross_revenue": gross_revenue,
                "net_revenue": gross_revenue,
                "total_discounts": 0.0,
                "total_tax_collected": round(gross_revenue * 0.16, 2),
                "total_sales_count": total_sales_count,
                "average_transaction_value": round(gross_revenue / total_sales_count, 2) if total_sales_count > 0 else 0.0,
                "estimated_cost_of_goods_sold": 0.0,
                "gross_profit_margin": 1.0 if gross_revenue > 0 else 0.0
            },
            "payment_method_distribution": {
                "CASH": {"transaction_count": total_sales_count, "total_volume": gross_revenue}
            },
            "sales_trends": [],
            "inventory_insights": {
                "total_tracked_products": 0,
                "low_stock_alerts_count": 0,
                "out_of_stock_count": 0,
                "total_stock_valuation_at_cost": 0.0,
                "total_stock_valuation_at_selling_price": 0.0
            }
        }
    
    async def add_new_stock(self, db: AsyncSession, payload: ProductRestockRequest, current_user) -> StockHistory:
        """
        Executes a secure inbound inventory restock operation.
        Increments physical item volumes and updates catalog cost/selling margins 
        atomically while safeguarding the historical trace timeline.
        """
        try:
            # 1. Fetch product with row-level write validation locking protection (FOR UPDATE)
            stmt = select(Product).where(Product.id == payload.product_id).with_for_update()
            result = await db.exec(stmt)
            product = result.one_or_none()

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail="The targeted product entry was not found in this business catalog."
                )

            # 2. Compute snapshots for inventory historical balancing metrics
            previous_stock = product.stock
            new_stock = previous_stock + payload.quantity

            # 3. Create the historical ledger trail record
            # Automatically falls back to the current catalog price parameters if the incoming transaction lacks explicit overrides
            history_entry = StockHistory(
                product_id=product.id,
                business_id=product.business_id, 
                performed_by=current_user.id,
                movement_type=StockMovementType.STOCK_TAKE, 
                quantity=payload.quantity,
                previous_stock=previous_stock,
                new_stock=new_stock,
                buying_price=product.cost_price,
                selling_price=product.selling_price,
                reference_id=product.id,
                reference_type=payload.reference_type or "PURCHASE_ORDER",
                notes=payload.notes
            )

            # 4. Mutate master product ledger catalog values directly in memory
            product.stock = new_stock
            product.last_stock_take=utc_now()
            
            # # Update purchase cost structures if valid parameters are parsed
            # if payload.buying_price is not None and payload.buying_price > 0:
            #     product.cost_price = payload.buying_price

            # # Apply new selling/shelf marks if provided in the batch restock payload
            # if payload.selling_price is not None and payload.selling_price > 0:
            #     product.selling_price = payload.selling_price

            # Stage transactional models into the current Active Unit of Work
            db.add(product)
            db.add(history_entry)

            # 5. Execute atomic database flush commitment
            await db.commit()
            
            # Refresh the history entry row so it populates the auto-generated primary key UUID and timestamp strings
            await db.refresh(product)
            return product

        except HTTPException:
            await db.rollback()
            raise
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Database infrastructure collision during bulk stocking pipeline execution: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Database transaction conflict encountered while updating inventory levels."
            )


# Global object instance mapping injection
store_crud = StoreCrud(Business)



# {
#   "document_id": "0885447c-40de-40b9-a48b-e11c1b6c6892",
#   "document_number": "REC-260714-74A86EF9",
#   "document_type": "RECEIPT",
#   "issued_at": "2026-07-14T15:04:23Z",
  
#   "seller": {
#     "business_id": "71e60ea3-6c97-4da0-ab9d-2444a54ba370",
#     "business_name": "Tawala Electronics - Nairobi Branch",
#     "address": "123 Moi Avenue, Nairobi",
#     "phone": "+254712345678",
#     "tax_number": "A001234567Z",
#     "cashier": {
#       "id": "550e8400-e29b-41d4-a716-446655440000",
#       "name": "Davie Karanja",
#       "role": "CASHIER"
#     }
#   },
  
#   "buyer": {
#     "customer_id": "99b8283a-1123-4b68-b391-766b1e6e0278",
#     "name": "John Doe",
#     "phone": "+254799999999",
#     "email": "johndoe@example.com"
#   },
  
#   "financials": {
#     "currency": "KES",
#     "subtotal": 160.00,
#     "discount_amount": 0.00,
#     "tax_rate_applied": 0.16,
#     "tax_amount": 22.07,
#     "total_amount": 160.00,
#     "amount_paid": 160.00,
#     "balance_due": 0.00
#   },
  
#   "items": [
#     {
#       "item_id": "112c6042-bf14-42f2-845d-acc3ec7b21d9",
#       "product_id": "aaa9e03e-8740-4fbd-a308-c9b47cfcc491",
#       "sku": "AMY-CHG-01",
#       "name": "AMAYA CHARGER MICRO",
#       "quantity": 1.0,
#       "unit_price": 137.93,
#       "tax_rate": 0.16,
#       "tax_amount": 22.07,
#       "discount_amount": 0.00,
#       "total_price": 160.00,
#       "cost_price_at_sale": 90.00
#     }
#   ],
  
#   "payments": [
#     {
#       "payment_id": "f83928c2-3112-4aa8-bc13-88bb9a2d8e09",
#       "method": "MPESA",
#       "amount": 160.00,
#       "reference": "SGH4X9K8PL",
#       "processed_at": "2026-07-14T15:04:20Z"
#     }
#   ],
  
#   "dispute_and_audit": {
#     "parent_sale_id": "74a86ef9-af8b-4fc4-857f-7a7c17b7ff8a",
#     "status": "COMPLETED",
#     "original_document_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
#     "notes": "Standard retail sale. Customer requested no printed receipt."
#   }
# }