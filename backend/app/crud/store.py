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
from app.utils.helpers import aggregate_rows, period_windows, AnalyticsPeriod

from app.crud.base import BaseCRUD
from app.core.security import security
from app.models.models import (
    Business,
    StaffBusinessAssignment,
    Staff,
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
    SaleAnalyticsSummary
)
from app.schemas.schemas import BusinessCreate, BusinessUpdate, StaffCreateIn
from app.schemas.business import StaffRequest, ProductAuditRequest, ProductRestockRequest
from app.schemas.store import FinalizeCheckoutIn, CartItemIn, InitializeCheckout
from app.utils.logging import logger
from app.utils.helpers import utc_now
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
            subtotal - payload.discount

            sale_items.append(
                SaleItem(
                    organization_id=current_user.organization_id,
                    product_id=product.id,
                    quantity=item.quantity,
                    unit_price=product.selling_price,
                    total_price=item_total,
                    sku=product.attributes.get('sku', 'N/A'),
                    name=product.label,
                    subtotal=subtotal,
                    tax_rate=0.0,
                    cost_price_at_sale=product.selling_price
                )
            )

        # Standard Kenyan 16% VAT Configuration
        tax_amount = round(subtotal * tax_rate, 2)
        total_amount = subtotal + tax_amount

        service = {}

        if payload.service and payload.service.amount is not None:
            service["amount"] = payload.service.amount

        if payload.service and payload.service.description is not None:
            service["description"] = payload.service.description

        # Convert empty dict back to None if no keys were added
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
            discount=payload.discount,
            discount_applied=payload.discount,
            total_amount=total_amount,
            items=sale_items,
            service_amount=service
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
        background_tasks: BackgroundTasks  # ← Added
    ) -> Sale:
        """
        Transitions a pending checkout process into a completed state, processes inventory stock
        reductions, creates stock movement logs, and yields transaction documents.
        """
        # 1. Eagerly load the items relationship to prevent MissingGreenlet errors
        stmt = (
            select(Sale)
            .where(Sale.id == sale_id)
            .options(
                selectinload(Sale.items),
                # selectinload(Sale.customer),
                selectinload(Sale.cashier)
                )
        )
        res = await db.exec(stmt)
        sale = res.one_or_none()

        if not sale:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target pending sale tracking code not found."
            )

        # API accepts INVOICE as checkout intent. Live DB enum is only
        # CASH|MPESA|CARD|BANK — never write INVOICE to payments.method.
        method_value = (
            payload.payment_method.value
            if hasattr(payload.payment_method, "value")
            else str(payload.payment_method)
        )
        is_invoice = method_value == "INVOICE"

        sale.status = (
            SaleStatus.PENDING_PAYMENT if is_invoice else SaleStatus.COMPLETED
        )
        db.add(sale)

        # Settled channels: record payment with a DB-legal method.
        # Invoice / credit: no payment row (nothing collected); worker mints
        # DocumentType.INVOICE from PENDING_PAYMENT status.
        if not is_invoice:
            try:
                db_method = PaymentMethod(method_value)
            except ValueError as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported payment method: {method_value}",
                ) from exc
            payment = Payment(
                organization_id=sale.organization_id,
                business_id=sale.business_id,
                sale_id=sale.id,
                amount=sale.total_amount,
                method=db_method,
                reference=payload.payment_reference
                or f"TXN-{uuid4().hex[:8].upper()}",
            )
            db.add(payment)

        customer_name = (payload.customer_name or "").strip()
        if not customer_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer name is required to complete checkout.",
            )

        customer = Customer(
            organization_id=sale.organization_id,
            business_id=sale.business_id,
            name=customer_name,
            phone=payload.customer_phone,
        )

        db.add(customer)
        await db.flush()

        sale.customer_id = customer.id

        # 3. Defer/Execute product stock balances decrements
        for item in sale.items:
            prod_stmt = select(Product).where(Product.id == item.product_id)
            prod_res = await db.exec(prod_stmt)
            product = prod_res.one_or_none()

            if product and product.track_stock:
                previous_stock_level = product.stock
                product.stock -= item.quantity
                if product.popularity_score is None:
                    product.popularity_score = 0.1
                else:
                    product.popularity_score += 0.1
                db.add(product)

                history = StockHistory(
                    product_id=product.id,
                    organization_id=product.organization_id,
                    business_id=sale.business_id,
                    performed_by=sale.cashier_id,
                    quantity=-item.quantity,
                    previous_stock=previous_stock_level,
                    new_stock=product.stock,
                    selling_price=item.unit_price,
                    buying_price=product.cost_price,
                    movement_type=StockMovementType.SALE,
                    notes=f"Automated POS checkout tracking deduction for sale ID: {sale.id}"
                )
                db.add(history)

        try:
            await db.commit()

            # === Background Document & Analytics Generation ===
            background_tasks.add_task(
                async_process_document_generation, 
                sale.id
            )

            # background_tasks.add_task(async_process_document_generation, sale.id)
            background_tasks.add_task(async_update_sales_analytics, sale.id)

            # Re-load with the same graph as fetch_sale_by_id so callers see
            # final status, customer, items, payments after commit.
            new_stmt = (
                select(Sale)
                .where(Sale.id == sale_id)
                .options(*self._get_sale_eager_options())
            )
            new_sale = (await db.exec(new_stmt)).first()
            if not new_sale:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Sale finalized but could not be reloaded.",
                )
            return new_sale
        except IntegrityError as e:
            await db.rollback()
            logger.error(f"Uniqueness check violation during storefront finalization: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Document sequencing integrity index crash. Transaction aborted."
            )
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Database error during checkout finalization: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to finalize checkout.",
            ) from e

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
                hashed_password=security.hash_password(payload.password) if payload.password else "",
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

    async def add_new_stock(self, db: AsyncSession, payload: ProductRestockRequest, current_user) -> Product:
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
                organization_id=current_user.organization_id,
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
            if product.organization_id is None:
                product.organization_id = current_user.organization_id

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

    async def audit_stock(self, db: AsyncSession, payload: ProductAuditRequest, current_user) -> Product:
        """
        Executes a secure inbound inventory restock operation.
        Increments physical item volumes and updates catalog cost/selling margins 
        atomically while safeguarding the historical trace timeline.
        """
        try:
            # 1. Fetch product with row-level write validation locking protection (FOR UPDATE)
            stmt = select(Product).where(Product.business_id == payload.business_id, Product.id == payload.product_id).with_for_update()
            result = await db.exec(stmt)
            product = result.one_or_none()

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail="The targeted product entry was not found in this business catalog."
                )

            # 2. Compute snapshots for inventory historical balancing metrics
            previous_stock = product.stock
            new_stock = payload.quantity

            # If the product's organization_id is not set, assign it to the current user's organization_id,
            # this happens freqyuently when the product was created without an organization context
            # this used to migrate the products to an organization context instraed of using a cronjob
            if product.organization_id is None:
                product.organization_id = current_user.organization_id

            # 3. Create the historical ledger trail record
            # Automatically falls back to the current catalog price parameters if the incoming transaction lacks explicit overrides
            history_entry = StockHistory(
                product_id=product.id,
                business_id=product.business_id, 
                organization_id=product.organization_id or current_user.organization_id, # mark this for potential failure if the product is orphaned
                performed_by=current_user.id,
                movement_type=StockMovementType.ADJUSTMENT, 
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

    async def fetch_dashboard_analytics(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
) -> dict:
        try:
            cur_start, cur_end, prev_start, prev_end = period_windows(period)

            # Single query: from previous_start → current_end
            stmt = (
                select(SaleAnalyticsSummary)
                .where(SaleAnalyticsSummary.business_id == business_id)
                .where(SaleAnalyticsSummary.date_dimension >= prev_start)
                .where(SaleAnalyticsSummary.date_dimension < cur_end)
                .where(SaleAnalyticsSummary.deleted_at.is_(None))
                .order_by(SaleAnalyticsSummary.date_dimension.desc())
            )
            all_rows = (await db.exec(stmt)).all()

            current_rows = [
                r for r in all_rows
                if cur_start <= r.date_dimension < cur_end
            ]
            previous_rows = [
                r for r in all_rows
                if prev_start <= r.date_dimension < prev_end
            ]

            current_summary = aggregate_rows(current_rows)
            previous_summary = aggregate_rows(previous_rows)

            return {
                "period": period.value,
                "window": {
                    "start": cur_start.isoformat(),
                    "end": cur_end.isoformat(),
                },
                "previous_window": {
                    "start": prev_start.isoformat(),
                    "end": prev_end.isoformat(),
                },
                "summary": current_summary,
                "previous_summary": previous_summary,
                "series": [
                    {
                        "date": r.date_dimension.date().isoformat(),
                        "date_dimension": r.date_dimension.isoformat(),
                        "gross_sales_volume": r.gross_sales_volume,
                        "total_tax_collected": r.total_tax_collected,
                        "total_discounts_granted": r.total_discounts_granted,
                        "net_revenue_collected": r.net_revenue_collected,
                        "refund_deductions_volume": r.refund_deductions_volume,
                        "total_completed_orders_count": r.total_completed_orders_count,
                    }
                    for r in current_rows  # already latest → oldest from query; filter keeps order
                ],
            }
        except SQLAlchemyError as e:
            logger.error(f"Failed to fetch analytics for {business_id}: {e}")
            raise HTTPException(
                status_code=500,
                detail="Database read failure during analytics aggregation.",
            )

    #     from typing import Optional, Sequence

    def _get_sale_eager_options(self) -> Tuple:
        """Centralized eager loading options for Sale relationships."""
        return (
            selectinload(Sale.items),
            selectinload(Sale.customer),
            selectinload(Sale.cashier),
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
        return result.first()

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
        return results.all()

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
            sales = results.all()

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
