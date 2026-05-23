from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select, func
from uuid import UUID

from app.api.deps import SessionDep
from app.models.models import (
    Sale, SaleItem, Payment, SaleLedgerEvent, 
    SaleAnalyticsSummary, Product, Business, 
    SaleStatus, EventType, PaymentMethod
)
from app.schemas.schemas import RefundRequestIn

router = APIRouter()
# 330a2007-8554-45a1-989d-58f7874a5932


# =========================================================
# 1. GENERATE THERMAL PRINT RECEIPT / DOCUMENT DATA
# =========================================================
@router.get("/receipt/{sale_id}", status_code=status.HTTP_200_OK)
async def fetch_thermal_receipt_payload(sale_id: UUID, db: SessionDep):
    """
    Fetches a pre-formatted snapshot payload optimized for consumption by 
    hardware thermal printers (ESC/POS) or frontend receipt canvas UI layouts.
    """
    # Eagerly load the core transaction anchor
    sale = await db.get(Sale, sale_id)
    if not sale:
        raise HTTPException(
            status_code=404, 
            detail=f"Receipt generation aborted. Sale document '{sale_id}' non-existent."
        )

    # Fetch associated line items and payments over the async wire
    items_stmt = select(SaleItem).where(SaleItem.sale_id == sale_id)
    items_result = await db.exec(items_stmt)
    line_items = items_result.all()

    payments_stmt = select(Payment).where(Payment.sale_id == sale_id)
    payments_result = await db.exec(payments_stmt)
    payments = payments_result.all()

    # Structure serialized presentation dictionary
    return {
        "header": {
            "sale_id": sale.id,
            "business_id": sale.business_id,
            "cashier_id": sale.cashier_id,
            "document_timestamp": sale.created_at,
            "document_type": "OFFICIAL_RECEIPT" if sale.status != SaleStatus.PENDING_PAYMENT else "PROFORMA_INVOICE",
            "transaction_status": sale.status
        },
        "financials": {
            "currency": sale.currency,
            "subtotal": sale.subtotal,
            "tax_rate": sale.tax_rate,
            "tax_amount": sale.tax_amount,
            "discount_applied": sale.discount_applied,
            "grand_total": sale.total_amount
        },
        "items": [
            {
                "sku": item.sku,
                "name": item.name,
                "unit_price": item.unit_price,
                "quantity": item.quantity,
                "quantity_refunded": item.quantity_refunded,
                "subtotal": item.subtotal
            } for item in line_items
        ],
        "settlement": [
            {
                "method": pay.method,
                "amount_tendered": pay.amount,
                "reference": pay.reference,
                "processed_at": pay.created_at
            } for pay in payments
        ],
        "footer_note": "Thank you for shopping with Tawala Cloud. Please retain receipt for all return entries."
    }


# =========================================================
# 2. GENERATE CORPORATE TAX INVOICE
# =========================================================
@router.get("/invoice/{sale_id}", status_code=status.HTTP_200_OK)
async def fetch_corporate_invoice(sale_id: UUID, db: SessionDep):
    """
    Extracts explicit financial compliance metrics for accounting invoices.
    Appends payment ledger timelines for outstanding balances or corporate lines.
    """
    sale = await db.get(Sale, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Requested tax invoice record not found.")

    items_stmt = select(SaleItem).where(SaleItem.sale_id == sale_id)
    items_result = await db.exec(items_stmt)
    line_items = items_result.all()

    payments_stmt = select(Payment).where(Payment.sale_id == sale_id)
    payments_result = await db.exec(payments_stmt)
    payments = payments_result.all()

    # Calculate current real total collected vs remaining outstanding debt metrics
    total_paid = sum(p.amount for p in payments)
    balance_due = max(0.0, sale.total_amount - total_paid)

    return {
        "invoice_metadata": {
            "invoice_number": f"INV-{str(sale.id)[:8].upper()}",
            "issue_date": sale.created_at,
            "due_date": sale.created_at,  # Can add dynamic extension deltas for net-30 accounts
            "payment_status": "PAID" if balance_due <= 0 else "UNPAID" if total_paid == 0 else "PARTIALLY_PAID"
        },
        "compliance_breakdown": {
            "taxable_basis_subtotal": sale.subtotal,
            "vat_rate_applied": sale.tax_rate,
            "total_vat_amount": sale.tax_amount,
            "gross_invoice_total": sale.total_amount
        },
        "line_items": [
            {
                "sku": item.sku,
                "name": item.name,
                "qty": item.quantity,
                "unit_cost": item.unit_price,
                "line_total": item.subtotal
            } for item in line_items
        ],
        "ledger_history": {
            "total_invoiced_amount": sale.total_amount,
            "total_amount_collected": total_paid,
            "outstanding_balance_due": balance_due,
            "payments_logged": [
                {"date": p.created_at, "method": p.method, "amount": p.amount, "ref": p.reference}
                for p in payments
            ]
        }
    }


# =========================================================
# 3. FETCH STRATEGIC BUSINESS ANALYTICS
# =========================================================
@router.get("/analytics/{business_id}", status_code=status.HTTP_200_OK)
async def get_business_performance_analytics(
    business_id: UUID, 
    start_date: datetime, 
    end_date: datetime, 
    db: SessionDep
):
    """
    High-performance business intelligence aggregator. Pulls pre-calculated parameters 
    from the analytics caching summaries instead of doing raw, heavy table scans.
    """
    # Scoping filter using the timezone-naive date dimension truncation bounds
    trunc_start = start_date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
    trunc_end = end_date.replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=None)

    stmt = select(SaleAnalyticsSummary).where(
        SaleAnalyticsSummary.business_id == business_id,
        SaleAnalyticsSummary.date_dimension >= trunc_start,
        SaleAnalyticsSummary.date_dimension <= trunc_end
    )
    result = await db.exec(stmt)
    summaries = result.all()

    if not summaries:
        return {
            "business_id": business_id,
            "message": "No analytical data blocks initialized for specified window parameters.",
            "aggregates": {"gross_sales": 0.0, "net_revenue": 0.0, "tax_collected": 0.0, "refunds_issued": 0.0, "total_orders": 0}
        }

    # Reduce summary collections dynamically
    return {
        "business_id": business_id,
        "reporting_window": {"from": trunc_start, "to": trunc_end},
        "aggregates": {
            "gross_sales_volume": sum(s.gross_sales_volume for s in summaries),
            "total_tax_collected": sum(s.total_tax_collected for s in summaries),
            "total_discounts_granted": sum(s.total_discounts_granted for s in summaries),
            "net_revenue_collected": sum(s.net_revenue_collected for s in summaries),
            "refund_deductions_volume": sum(s.refund_deductions_volume for s in summaries),
            "total_completed_orders_count": sum(s.total_completed_orders_count for s in summaries)
        },
        "daily_trends": [
            {
                "date": s.date_dimension,
                "gross_sales": s.gross_sales_volume,
                "net_revenue": s.net_revenue_collected,
                "orders_count": s.total_completed_orders_count
            } for s in summaries
        ]
    }


# =========================================================
# 4. EXECUTE SAFE IMMUTABLE REFUNDS / DISPUTES
# =========================================================
@router.post("/refund", status_code=status.HTTP_200_OK)
async def process_item_refund(payload: RefundRequestIn, db: SessionDep):
    """
    Safely handles partial or full customer item returns using immutable ledger events.
    Adjusts inventory, increments product tracking records, and posts negative revenue steps.
    """
    # 1. Extract structural targets
    sale = await db.get(Sale, payload.sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Original sale transaction document missing.")

    item_stmt = select(SaleItem).where(
        SaleItem.sale_id == payload.sale_id, 
        SaleItem.product_id == payload.product_id
    )
    item_res = await db.exec(item_stmt)
    sale_item = item_res.first()

    if not sale_item:
        raise HTTPException(status_code=404, detail="Target item not found on this invoice ledger context.")

    # 2. Guard constraint verification bounds
    if (sale_item.quantity_refunded + payload.quantity_to_refund) > sale_item.quantity:
        raise HTTPException(
            status_code=400, 
            detail=f"Refund overflow. Max return units remaining: {sale_item.quantity - sale_item.quantity_refunded}."
        )

    try:
        # 3. Update Line Item Return Tracking Indexes
        sale_item.quantity_refunded += payload.quantity_to_refund
        db.add(sale_item)

        # 4. Re-calculate financial correction parameters (Proportional Item Pricing + VAT)
        refund_unit_price = sale_item.unit_price
        tax_per_unit = refund_unit_price * sale.tax_rate
        gross_refund_per_unit = refund_unit_price + tax_per_unit
        
        total_refund_cash_value = gross_refund_per_unit * payload.quantity_to_refund
        negative_cash_delta = -total_refund_cash_value

        # 5. Reverse Product Stock Levels if Tracked
        product = await db.get(Product, payload.product_id)
        if product and product.track_stock:
            product.stock += payload.quantity_to_refund
            db.add(product)

        # 6. Flag Main Sale Document State
        if all(item.quantity_refunded == item.quantity for item in sale.items):
            sale.status = SaleStatus.REFUNDED
        else:
            sale.status = SaleStatus.PARTIALLY_REFUNDED
        db.add(sale)

        # 7. Write Entry to the Immutable Ledger Event Stream
        ledger_correction = SaleLedgerEvent(
            sale_id=sale.id,
            event_type=EventType.ITEM_RETURNED,
            amount_delta=negative_cash_delta,
            product_id_context=payload.product_id,
            notes=payload.notes
        )
        db.add(ledger_correction)

        # 8. Apply Corrections Directly into Analytics Cache Aggregates
        target_date_dimension = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
        summary_stmt = select(SaleAnalyticsSummary).where(
            SaleAnalyticsSummary.business_id == sale.business_id,
            SaleAnalyticsSummary.date_dimension == target_date_dimension
        )
        summary_result = await db.exec(summary_stmt)
        analytics_row = summary_result.first()

        if analytics_row:
            analytics_row.refund_deductions_volume += total_refund_cash_value
            # Net revenue adjustments reflect deduction directly
            analytics_row.net_revenue_collected -= total_refund_cash_value
            db.add(analytics_row)

        await db.commit()
        return {"status": "SUCCESS", "message": "Refund compiled and recorded into immutable ledger.", "value_refunded": total_refund_cash_value}

    except Exception as error:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Refund transaction failed and rolled back. Logs: {str(error)}")