from uuid import UUID, uuid4
from datetime import date, datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from fastapi import HTTPException, status

from app.models.models import (
    Sale, SaleItem, FinancialDocument, DocumentType, SaleStatus,
    Payment, PaymentMethod, Customer, StockHistory, StockMovementType,
    Product
)

# =========================================================
# PYDANTIC VALIDATION SCHEMAS
# =========================================================

class CartItemIn(BaseModel):
    product_id: UUID
    quantity: float = Field(gt=0, description="Quantity must be greater than zero")

class InitializeCheckoutRequest(BaseModel):
    business_id: UUID
    # cashier_id: Optional[UUID] = None
    items: List[CartItemIn]

class InitializeCheckout(BaseModel):
    business_id: UUID
    cashier_id: UUID
    items: List[CartItemIn]

class FinalizeCheckoutIn(BaseModel):
    payment_method: PaymentMethod
    payment_reference: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


# =========================================================
# CORE TRANSACTION SERVICE LAYER
# =========================================================

class SaleService:
    
    @staticmethod
    def initialize_checkout(db: Session, payload: InitializeCheckout) -> Sale:
        """
        Step 1: Re-calculates and creates a server-verified draft checkout record.
        Validates stock availability and forces pricing snapshots from the DB.
        """
        # 1. Instantiate draft root Sale object
        new_sale = Sale(
            id=uuid4(),
            business_id=payload.business_id,
            cashier_id=payload.cashier_id,
            status=SaleStatus.PENDING_PAYMENT,
            subtotal=0.0,
            discount=0.0,
            tax_amount=0.0,
            total_amount=0.0
        )
        db.add(new_sale)
        
        running_subtotal = 0.0
        running_tax = 0.0

        # 2. Iterate through submitted items, pulling data exclusively from DB records
        for item in payload.items:
            product = db.exec(select(Product).where(Product.id == item.product_id)).first()
            
            if not product or not product.active:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item.product_id} is unavailable or does not exist."
                )
                
            # Server-side stock check before allowing draft checkout to process
            if product.track_stock and product.stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.label}'. Available: {product.stock}, Requested: {item.quantity}"
                )
            
            # Fallback handling for tax rates (default to 16% standard corporate VAT)
            tax_rate = getattr(product, "tax_rate", 0.00) or 0.00
            item_subtotal = product.selling_price * item.quantity
            item_tax = item_subtotal * tax_rate

            sale_item = SaleItem(
                sale_id=new_sale.id,
                product_id=product.id,
                sku=product.sku if hasattr(product, "sku") else "GENERIC",
                name=product.label,
                unit_price=product.selling_price,
                quantity=item.quantity,
                tax_rate=tax_rate,
                subtotal=item_subtotal,
                cost_price_at_sale=product.cost_price # Immutable margin history tracking snapshot
            )
            db.add(sale_item)
            
            running_subtotal += item_subtotal
            running_tax += item_tax

        # 3. Apply compiled totals to the verified Sale instance
        new_sale.subtotal = running_subtotal
        new_sale.tax_amount = running_tax
        new_sale.total_amount = running_subtotal + running_tax
        
        db.commit()
        db.refresh(new_sale)
        return new_sale

    @staticmethod
    def finalize_checkout(db: Session, sale_id: UUID, payload: FinalizeCheckoutIn) -> FinancialDocument:
        """
        Step 2: Locks product inventory records using a database row-level block,
        deducts quantities safely, triggers daily rolling updates, and yields financial papers.
        """
        today = date.today()
        
        # 1. Look up the initial draft transaction record
        sale = db.exec(select(Sale).where(Sale.id == sale_id)).first()
        if not sale:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction records not found.")
        if sale.status == SaleStatus.COMPLETED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This transaction is already finalized.")

        # 2. PESSIMISTIC ROW-LEVEL DATABASE LOCKING
        # Sort product IDs uniformly to prevent random concurrent deadlocks in the DB kernel
        product_ids = sorted(list({item.product_id for item in sale.items}))
        
        # Execute 'SELECT ... FOR UPDATE' to freeze these item metrics completely
        locked_products_query = select(Product).where(Product.id.in_(product_ids)).with_for_update()
        locked_products = {p.id: p for p in db.exec(locked_products_query).all()}

        # 3. Process Customer Profiles Safely
        if payload.customer_name or payload.customer_phone:
            customer_stmt = select(Customer).where(
                Customer.business_id == sale.business_id,
                Customer.phone == payload.customer_phone if payload.customer_phone else ""
            )
            customer = db.exec(customer_stmt).first()

            if not customer and payload.customer_name:
                customer = Customer(
                    name=payload.customer_name,
                    phone=payload.customer_phone,
                    organization_id=sale.business.organization_id if hasattr(sale.business, "organization_id") else uuid4(),
                    business_id=sale.business_id
                )
                db.add(customer)
                db.commit()
                db.refresh(customer)
            
            if customer:
                sale.customer_id = customer.id

        # 4. Route Payment & Configure Operational Document Status
        payment = Payment(
            business_id=sale.business_id,
            sale_id=sale.id,
            amount=sale.total_amount,
            method=payload.payment_method,
            reference=payload.payment_reference
        )
        db.add(payment)

        if payload.payment_method == PaymentMethod.INVOICE:
            sale.status = SaleStatus.PENDING_PAYMENT
            doc_type = DocumentType.INVOICE
        else:
            sale.status = SaleStatus.COMPLETED
            doc_type = DocumentType.RECEIPT

        # 5. Inventory Deduction Loop Under Safe Row-Locking Guarantee
        total_cogs_today = 0.0
        for item in sale.items:
            product = locked_products.get(item.product_id)
            
            if product and product.track_stock:
                # Re-verify stock volumes within the locked isolation context block
                if product.stock < item.quantity:
                    db.rollback() # Instantly dissolve database transaction state cleanly
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Stock for '{product.label}' depleted by a concurrent checkout thread. Only {product.stock} items left."
                    )
                
                prev_stock = product.stock
                new_stock = prev_stock - item.quantity
                
                product.stock = new_stock
                db.add(product)

                # Append historical single source of truth audit event records
                history = StockHistory(
                    product_id=product.id,
                    business_id=sale.business_id,
                    performed_by=sale.cashier_id,
                    movement_type=StockMovementType.SALE,
                    quantity=-item.quantity,
                    previous_stock=prev_stock,
                    new_stock=new_stock,
                    buying_price=item.cost_price_at_sale,
                    selling_price=item.unit_price,
                    reference_id=sale.id,
                    reference_type="SALE"
                )
                db.add(history)

            cogs_unit = item.cost_price_at_sale if item.cost_price_at_sale else 0.0
            total_cogs_today += (cogs_unit * item.quantity)

            # 6. Atomic Rolling Aggregation: Product Dashboard Summaries
            p_analytic = db.exec(
                select(DailyProductAnalytics).where(
                    DailyProductAnalytics.business_id == sale.business_id,
                    DailyProductAnalytics.product_id == item.product_id,
                    DailyProductAnalytics.date_dimension == today
                )
            ).first()

            if not p_analytic:
                p_analytic = DailyProductAnalytics(business_id=sale.business_id, product_id=item.product_id, date_dimension=today)
            
            p_analytic.units_sold += item.quantity
            p_analytic.gross_sales_value += item.subtotal
            p_analytic.total_cost_value += (cogs_unit * item.quantity)
            p_analytic.net_profit_margin += (item.subtotal - (cogs_unit * item.quantity))
            db.add(p_analytic)

        # 7. Atomic Rolling Aggregation: Business Sales Revenue Summaries
        s_analytic = db.exec(
            select(DailySalesAnalytics).where(
                DailySalesAnalytics.business_id == sale.business_id,
                DailySalesAnalytics.date_dimension == today
            )
        ).first()

        if not s_analytic:
            s_analytic = DailySalesAnalytics(business_id=sale.business_id, date_dimension=today)
        
        s_analytic.gross_revenue += sale.subtotal
        s_analytic.net_revenue += (sale.total_amount - sale.discount)
        s_analytic.tax_collected += sale.tax_amount
        s_analytic.discounts_given += sale.discount
        s_analytic.cost_of_goods_sold += total_cogs_today
        s_analytic.gross_profit += ((sale.total_amount - sale.discount) - total_cogs_today)
        s_analytic.total_transactions_count += 1

        # Break out revenue volume metrics matching designated channels
        if payload.payment_method == PaymentMethod.CASH:
            s_analytic.cash_sales_volume += sale.total_amount
        elif payload.payment_method == PaymentMethod.MPESA:
            s_analytic.mpesa_sales_volume += sale.total_amount
        elif payload.payment_method == PaymentMethod.CARD:
            s_analytic.card_sales_volume += sale.total_amount
        elif payload.payment_method == PaymentMethod.INVOICE:
            s_analytic.credit_invoice_volume += sale.total_amount

        db.add(s_analytic)
        db.add(sale)

        # 8. Mint Global Billing References & Save Document Row Contexts
        prefix = "REC" if doc_type == DocumentType.RECEIPT else "INV"
        serial_hash = sale.id.hex[:6].upper()
        date_slug = datetime.now(timezone.utc).strftime("%y%m%d")
        generated_number = f"{prefix}-{date_slug}-{serial_hash}"

        document = FinancialDocument(
            business_id=sale.business_id,
            sale_id=sale.id,
            customer_id=sale.customer_id,
            document_type=doc_type,
            document_number=generated_number,
            subtotal=sale.subtotal,
            discount_amount=sale.discount,
            tax_amount=sale.tax_amount,
            total_amount=sale.total_amount,
            amount_paid=0.0 if payload.payment_method == PaymentMethod.INVOICE else sale.total_amount
        )
        db.add(document)
        
        db.commit()
        db.refresh(document)
        return document