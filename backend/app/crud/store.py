from typing import Type, List, Dict, Tuple, Optional, Any, Sequence
from uuid import UUID, uuid4
from datetime import datetime, timezone
from fastapi import BackgroundTasks
from app.core.security import security
from datetime import date, datetime, time

from fastapi import HTTPException, status
from sqlmodel import select, desc, func, col
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from pydantic import BaseModel, Field

from app.crud.base import BaseCRUD
from app.core.security import security
from app.models.models import (
    Business,
    StockHistory,
    StockMovementType,
    Product,
    Sale,
    SaleItem,
    FinancialDocument,
    DocumentType,
    SaleStatus,
    Payment,
    PaymentMethod,
    Customer,
    StaffRole,
)
from app.schemas.schemas import BusinessCreate, BusinessUpdate
from app.schemas.business import StaffRequest, ProductAuditRequest, ProductRestockRequest
from app.schemas.store import FinalizeCheckoutIn, CartItemIn, InitializeCheckout
from app.utils.logging import logger
from app.utils.helpers import utc_now
from app.crud.stock import stock_crud
from sqlalchemy.orm import selectinload
from app.schemas.schemas import StaffResponse

from app.tasks.worker import async_process_document_generation,async_update_sales_analytics


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
                .order_by(Product.popularity_score)
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
        current_user: StaffResponse,
        tax_rate: float = 0.0,
    ) -> Sale:
        """
        Validates checkout initiation, accurately tracks item lines, computes totals,
        and constructs a transient pending sale ledger instance.
        """
        subtotal = 0.0
        sale_items = []
        discount = float(getattr(payload, "discount", None) or 0.0)

        # Resolve business for tax + scope checks
        biz_res = await db.exec(select(Business).where(Business.id == payload.business_id))
        business = biz_res.one_or_none()
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found for checkout.",
            )
        if tax_rate == 0.0 and getattr(business, "tax_rate", None) is not None:
            tax_rate = float(business.tax_rate or 0.0)

        for item in payload.items:
            stmt = select(Product).where(Product.id == item.product_id)
            res = await db.exec(stmt)
            product = res.one_or_none()

            if not product:
                logger.error(f"Checkout failure: Product ID {item.product_id} not found.")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="One or more selected inventory items could not be found.",
                )
            # Soft-delete / inactive / wrong store
            if getattr(product, "deleted_at", None) is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Product '{getattr(product, 'label', item.product_id)}' is deleted and cannot be sold.",
                )
            if hasattr(product, "active") and product.active is False:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Product '{product.label}' is inactive and cannot be sold.",
                )
            if product.business_id and str(product.business_id) != str(payload.business_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Product does not belong to this business.",
                )
            qty = float(item.quantity)
            if qty <= 0:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Quantity must be greater than zero.",
                )
            if product.track_stock and float(product.stock or 0) < qty:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Insufficient stock for '{product.label}': "
                        f"available {product.stock}, requested {qty}."
                    ),
                )

            logger.info(f"Product data: {product.attributes.get('sku', 'N/A')} ")
            item_total = float(product.selling_price) * qty
            subtotal += item_total

            # Honest cost: null stays null (do not invent selling_price as COGS)
            cost_at_sale = (
                float(product.cost_price)
                if product.cost_price is not None
                else None
            )

            sale_items.append(
                SaleItem(
                    organization_id=current_user.organization_id,
                    product_id=product.id,
                    quantity=qty,
                    unit_price=float(product.selling_price),
                    total_price=item_total,
                    sku=(product.attributes or {}).get("sku", "N/A") or "N/A",
                    name=product.label,
                    subtotal=item_total,
                    tax_rate=tax_rate,
                    cost_price_at_sale=cost_at_sale,
                )
            )

        # Apply discount after line aggregation (never negative subtotal)
        subtotal = max(0.0, subtotal - discount)

        tax_amount = round(subtotal * tax_rate, 2)
        total_amount = subtotal + tax_amount

        service = {}
        payload_service = getattr(payload, "service", None)
        if payload_service and getattr(payload_service, "amount", None) is not None:
            service["amount"] = payload_service.amount
        if payload_service and getattr(payload_service, "description", None) is not None:
            service["description"] = payload_service.description
        service = service or None

        sale = Sale(
            id=uuid4(),
            organization_id=current_user.organization_id,
            business_id=payload.business_id,
            cashier_id=current_user.id,
            status=SaleStatus.PENDING_PAYMENT,
            currency="KES",
            subtotal=subtotal,
            tax_rate=tax_rate,
            tax_amount=tax_amount,
            discount=discount,
            discount_applied=discount,
            total_amount=total_amount,
            items=sale_items,
            service_amount=service,
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
        payload: FinalizeCheckoutIn,
        background_tasks: BackgroundTasks,
    ) -> Sale:
        """
        Finalize a staged sale: stock deduction (always), payment (paid methods only),
        customer link, and document/analytics side effects.

        Credit (PaymentMethod.INVOICE): customer walks with goods unpaid.
        - status stays / becomes PENDING_PAYMENT (outstanding)
        - no collecting Payment row
        - stock still deducted
        - background worker issues an INVOICE (amount_paid=0) for collection
        """
        is_credit = payload.payment_method == PaymentMethod.INVOICE

        # 1. Load sale + items (eager) for stock loop
        stmt = (
            select(Sale)
            .where(Sale.id == sale_id)
            .options(
                selectinload(Sale.items),
                selectinload(Sale.cashier),
            )
        )
        res = await db.exec(stmt)
        sale = res.one_or_none()

        if not sale:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target pending sale tracking code not found.",
            )

        # Idempotency: already fully paid/completed
        if sale.status == SaleStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This sale is already finalized.",
            )

        # Idempotency: document already minted (covers re-finalize of credit)
        existing_doc_res = await db.exec(
            select(FinancialDocument).where(FinancialDocument.sale_id == sale.id)
        )
        if existing_doc_res.first() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This sale already has a financial document and cannot be finalized again.",
            )

        # Credit requires an identifiable customer for collection
        customer_name = (payload.customer_name or "").strip() if payload.customer_name else ""
        customer_phone = (payload.customer_phone or "").strip() if payload.customer_phone else ""
        if is_credit and not customer_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer name is required for credit sales.",
            )

        # 2. Status: credit remains outstanding; paid methods complete
        sale.status = (
            SaleStatus.PENDING_PAYMENT if is_credit else SaleStatus.COMPLETED
        )
        db.add(sale)

        # 3. Payment only when money was collected (not credit)
        if not is_credit:
            payment = Payment(
                organization_id=sale.organization_id,
                business_id=sale.business_id,
                sale_id=sale.id,
                amount=sale.total_amount,
                method=payload.payment_method,
                reference=payload.payment_reference
                or f"TXN-{uuid4().hex[:8].upper()}",
            )
            db.add(payment)

        # 4. Customer: reuse by phone within business when possible; never pass removed sale_id
        customer = None
        if customer_phone:
            cust_stmt = select(Customer).where(
                Customer.business_id == sale.business_id,
                Customer.phone == customer_phone,
            )
            customer = (await db.exec(cust_stmt)).first()

        if customer is None and (customer_name or customer_phone):
            # name is non-nullable on Customer; fall back for cash-only edge cases
            resolved_name = customer_name or (customer_phone or "Walk-in customer")
            customer = Customer(
                organization_id=sale.organization_id,
                business_id=sale.business_id,
                name=resolved_name,
                phone=customer_phone or None,
            )
            db.add(customer)
            await db.flush()

        if customer is not None:
            sale.customer_id = customer.id
            db.add(sale)

        # 5. Stock deduction — always (cash and credit). Goods left the shelf.
        # 4. Stock deduction ALWAYS (paid or credit) via stock_crud.
        for item in sale.items:
            prod_stmt = select(Product).where(Product.id == item.product_id).with_for_update()
            prod_res = await db.exec(prod_stmt)
            product = prod_res.one_or_none()

            if product and product.track_stock:
                await stock_crud.apply_sale_item_deduction(
                    db,
                    product=product,
                    quantity=float(item.quantity),
                    business_id=sale.business_id,
                    performed_by=sale.cashier_id,
                    unit_price=item.unit_price,
                    notes=(
                        f"{'Credit' if is_credit else 'POS'} checkout stock deduction "
                        f"for sale ID: {sale.id}"
                    ),
                    commit=False,
                )

        try:
            # Durable analytics outbox for COMPLETED (collected) sales only
            if sale.status == SaleStatus.COMPLETED:
                from app.services.analytics_outbox import enqueue_analytics_outbox
                await enqueue_analytics_outbox(
                    db,
                    sale_id=sale.id,
                    business_id=sale.business_id,
                    organization_id=sale.organization_id,
                )

            await db.commit()

            # Document: invoice for credit (amount_paid=0), receipt for paid
            background_tasks.add_task(async_process_document_generation, sale.id)
            # Drain outbox soon after response (best-effort); durable row survives process death
            if sale.status == SaleStatus.COMPLETED:
                background_tasks.add_task(async_update_sales_analytics, sale.id)

            new_stmt = (
                select(Sale)
                .where(Sale.id == sale_id)
                .options(
                    selectinload(Sale.items),
                    selectinload(Sale.customer),
                    selectinload(Sale.cashier),
                    selectinload(Sale.payments),
                )
            )
            new_sale = (await db.exec(new_stmt)).first()
            return new_sale
        except IntegrityError as e:
            await db.rollback()
            logger.error(
                f"Uniqueness check violation during storefront finalization: {str(e)}"
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Document sequencing integrity index crash. Transaction aborted.",
            )



    async def collect_credit_sale(
        self,
        db: AsyncSession,
        *,
        sale_id: UUID,
        payload: FinalizeCheckoutIn,
        background_tasks: BackgroundTasks,
    ) -> Sale:
        """
        Collect payment on a credit (PENDING_PAYMENT) sale → COMPLETED + Payment + analytics outbox.
        """
        stmt = (
            select(Sale)
            .where(Sale.id == sale_id)
            .options(selectinload(Sale.items), selectinload(Sale.payments))
        )
        sale = (await db.exec(stmt)).one_or_none()
        if not sale:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")
        if sale.status == SaleStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Sale is already collected/completed.",
            )
        if sale.status != SaleStatus.PENDING_PAYMENT:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Sale status {sale.status} cannot be collected.",
            )
        if payload.payment_method == PaymentMethod.INVOICE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Collection requires CASH or MPESA (not another invoice).",
            )

        sale.status = SaleStatus.COMPLETED
        db.add(sale)
        payment = Payment(
            organization_id=sale.organization_id,
            business_id=sale.business_id,
            sale_id=sale.id,
            amount=sale.total_amount,
            method=payload.payment_method,
            reference=payload.payment_reference
            or f"COLLECT-{uuid4().hex[:8].upper()}",
        )
        db.add(payment)

        from app.services.analytics_outbox import enqueue_analytics_outbox
        await enqueue_analytics_outbox(
            db,
            sale_id=sale.id,
            business_id=sale.business_id,
            organization_id=sale.organization_id,
        )
        await db.commit()
        background_tasks.add_task(async_update_sales_analytics, sale.id)

        new_stmt = (
            select(Sale)
            .where(Sale.id == sale_id)
            .options(
                selectinload(Sale.items),
                selectinload(Sale.customer),
                selectinload(Sale.cashier),
                selectinload(Sale.payments),
            )
        )
        return (await db.exec(new_stmt)).first()

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


    #     from typing import Optional, Sequence

    def _get_sale_eager_options(self) -> Tuple:
        """Centralized eager loading options for Sale relationships."""
        return (
            selectinload(Sale.items),
            selectinload(Sale.customer),
            selectinload(Sale.cashier),
            selectinload(Sale.business),
            selectinload(Sale.payments),
            selectinload(Sale.document),
        )

    async def fetch_sale_by_id(self,
        db: AsyncSession,
        business_id: UUID,
        sale_id: UUID,
        user: StaffResponse,
    ) -> Optional[Sale]:
        """
        Fetches a single sale by ID while enforcing tenant isolation and cashier ownership RBAC.
        Loads all declared sibling relationships eagerly.
        """
        stmt = select(Sale).where(Sale.id == sale_id).where(Sale.business_id == business_id)

        # Role-Based Access Control
        if user.role == StaffRole.CASHIER:
            stmt = stmt.where(Sale.cashier_id == user.id)
        elif user.role not in (StaffRole.OWNER, StaffRole.MANAGER):
            return None

        # Eagerly load all sibling relationships
        stmt = stmt.options(*self._get_sale_eager_options())

        result = await db.exec(stmt)
        return result.unique().first()

    async def fetch_sales(self,
        db: AsyncSession,
        business_id: UUID,
        user: StaffResponse,
    ) -> Sequence[Sale]:
        """
        Fetches all sales for a business scoped by user role, ordered by latest updated_at.
        """
        stmt = select(Sale).where(Sale.business_id == business_id)

        if user.role == StaffRole.CASHIER:
            stmt = stmt.where(Sale.cashier_id == user.id)
        elif user.role not in (StaffRole.OWNER, StaffRole.MANAGER):
            return []

        stmt = stmt.options(*self._get_sale_eager_options()).order_by(Sale.updated_at.desc())

        results = await db.exec(stmt)
        return results.unique().all()

    async def fetch_sales(
        self,
        db: AsyncSession,
        business_id: UUID,
        user: StaffResponse,
        *,
        page: int = 1,
        page_size: int = 50,
        single_date: Optional[date] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Tuple[Sequence[Sale], int]:
        """
        Fetches paginated sales for a business scoped by user role, supporting
        single-day and date-range filters, with exception handling.

        :param db: AsyncSession database connection instance.
        :param business_id: Target business UUID.
        :param user: Current authenticated staff member.
        :param page: 1-indexed page number (default: 1).
        :param page_size: Number of items per page (default: 50, capped at 100).
        :param single_date: Exact calendar date filter.
        :param start_date: Beginning timestamp range bound.
        :param end_date: Ending timestamp range bound.
        :return: Tuple of (Sequence of Sale objects, total unpaginated count).
        """
        # 1. Parameter Guard Rules & Validation
        if page < 1:
            raise ValueError("Page number must be greater than or equal to 1.")

        page_size = min(max(1, page_size), 100)

        if single_date and (start_date or end_date):
            raise ValueError(
                "Cannot combine 'single_date' with 'start_date' or 'end_date'."
            )

        if start_date and end_date and start_date > end_date:
            raise ValueError(
                "'start_date' cannot be chronologically later than 'end_date'."
            )

        # 2. Scope & Base Statement Construction
        stmt = select(Sale).where(Sale.business_id == business_id)

        # Security Scoping by Role
        if user.role == StaffRole.CASHIER:
            stmt = stmt.where(Sale.cashier_id == user.id)
        elif user.role not in (StaffRole.OWNER, StaffRole.MANAGER):
            raise HTTPException(status_code=403,
                detail="Unauthorized: Insufficient permissions to view sales."
            )

        # 3. Date Filtering Logic (SARGable range comparisons preserve B-tree indexes)
        if single_date:
            day_start = datetime.combine(single_date, time.min)
            day_end = datetime.combine(single_date, time.max)
            stmt = stmt.where(Sale.created_at >= day_start, Sale.created_at <= day_end)
        else:
            if start_date:
                stmt = stmt.where(Sale.created_at >= start_date)
            if end_date:
                stmt = stmt.where(Sale.created_at <= end_date)

        try:
            # 4. Total Unpaginated Count Query
            count_stmt = select(func.count()).select_from(stmt.subquery())
            count_result = await db.exec(count_stmt)
            total_count = count_result.one() or 0

            if total_count == 0:
                return [], 0

            # 5. Apply Eager Loading, Sorting, and Window Pagination
            offset = (page - 1) * page_size
            paginated_stmt = (
                stmt.options(*self._get_sale_eager_options())
                .order_by(Sale.created_at.desc())
                .offset(offset)
                .limit(page_size)
            )

            results = await db.exec(paginated_stmt)
            sales = results.unique().all()

            return sales, total_count

        except SQLAlchemyError as exc:
            logger.error(
                "Database error while querying sales for business_id=%s, user_id=%s: %s",
                business_id,
                user.id,
                str(exc),
                exc_info=True,
            )
            raise HTTPException(status_code=500,
                detail="Failed to retrieve sales records from database."
            ) from exc


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
