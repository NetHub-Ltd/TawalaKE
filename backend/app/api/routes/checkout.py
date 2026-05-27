from datetime import datetime, timedelta
from enum import StrEnum
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import select, func

from app.api.deps import SessionDep
from app.models.models import (
    Business,
    EventType,
    Payment,
    PaymentMethod,
    Product,
    Sale,
    SaleAnalyticsSummary,
    SaleItem,
    SaleLedgerEvent,
    SaleStatus,
)
from app.schemas.schemas import CheckoutPayloadIn, RefundRequestIn, SalePayload
from app.crud.checkout import sale_crud


# Explicit Enum to restrict valid analytical trend intervals
class AnalyticsPeriod(StrEnum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"


router = APIRouter()


@router.post("/new-sale", status_code=status.HTTP_201_CREATED)
async def process_terminal_checkout(payload: SalePayload, db: SessionDep):
    sale = await sale_crud.new_sale(payload=payload, db=db)
    return sale



# =========================================================
# 1. POS TERMINAL CHECKOUT PIPELINE (HARDENED & ENHANCED)
# =========================================================
@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def process_terminal_checkout(payload: CheckoutPayloadIn, db: SessionDep):
    """
    Unified point-of-sale checkout processing pipeline wrapper for AsyncSession.
    Ensures absolute transactional isolation across an async network driver.
    """
    # ---------------------------------------------------------
    # SECURITY GATEWAY & BUSINESS OPERATIONAL VALIDATION
    # ---------------------------------------------------------
    business = await db.get(Business, payload.meta.business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target operational branch location not found.",
        )
    if not business.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Terminal deactivated. Core business branch is offline.",
        )

    # Determine state machine routes based on incoming payment options
    is_invoice = payload.meta.payment_method == PaymentMethod.INVOICE
    initial_status = (
        SaleStatus.PENDING_PAYMENT if is_invoice else SaleStatus.COMPLETED
    )
    initial_event = (
        EventType.INVOICE_ISSUED if is_invoice else EventType.INITIAL_SALE
    )

    try:
        # ---------------------------------------------------------
        # PERSIST CORE TRANSACTION ROOT (SALE)
        # ---------------------------------------------------------
        db_sale = Sale(
            business_id=payload.meta.business_id,
            cashier_id=payload.meta.cashier_id,
            currency=payload.meta.currency,
            status=initial_status,
            subtotal=payload.financials.subtotal,
            tax_rate=payload.financials.tax_rate,
            tax_amount=payload.financials.tax_amount,
            discount_applied=payload.financials.discount_applied,
            total_amount=payload.financials.grand_total,
        )
        db.add(db_sale)
        await db.flush()  # Populates db_sale.id dynamically for dependent relational keys

        # ---------------------------------------------------------
        # PROCESS LINE ITEMS & WAREHOUSE INVENTORY CONTROLS
        # ---------------------------------------------------------
        for item in payload.line_items:
            db_item = SaleItem(
                sale_id=db_sale.id,
                product_id=item.product_id,
                sku=item.sku,
                name=item.name,
                unit_price=item.unit_price,
                quantity=item.quantity,
                subtotal=item.subtotal,
            )
            db.add(db_item)

            # Execution Gate: Handle inventory deduction tracking loops
            db_product = await db.get(Product, item.product_id)
            if db_product and db_product.track_stock:
                if db_product.stock < item.quantity:
                    # Soft logging variance allowance or hard error triggers can go here depending on business layout
                    pass
                db_product.stock -= item.quantity
                db.add(db_product)

        # ---------------------------------------------------------
        # RECORD SETTLEMENT BALANCE ENTRIES
        # ---------------------------------------------------------
        if not is_invoice:
            db_payment = Payment(
                business_id=payload.meta.business_id,
                sale_id=db_sale.id,
                amount=payload.financials.grand_total,
                method=payload.meta.payment_method,
                reference=None,
            )
            db.add(db_payment)

        # Append audit ledger entry
        db_audit = SaleLedgerEvent(
            sale_id=db_sale.id,
            event_type=initial_event,
            amount_delta=(
                payload.financials.grand_total if not is_invoice else 0.0
            ),
            product_id_context=None,
            notes="Transaction safely written via centralized secure retail POS terminal API stream pipeline.",
        )
        db.add(db_audit)

        # ---------------------------------------------------------
        # REAL-TIME PERFORMANCE DATA PRE-AGGREGATION CACHE
        # ---------------------------------------------------------
        # CRITICAL FIX: explicitly drop timezone offset metadata to match TIMESTAMP WITHOUT TIME ZONE columns
        target_date_dimension = payload.meta.timestamp.replace(
            hour=0, minute=0, second=0, microsecond=0, tzinfo=None
        )

        summary_stmt = select(SaleAnalyticsSummary).where(
            SaleAnalyticsSummary.business_id == payload.meta.business_id,
            SaleAnalyticsSummary.date_dimension == target_date_dimension,
        )
        result = await db.exec(summary_stmt)
        analytics_row = result.first()

        if not analytics_row:
            analytics_row = SaleAnalyticsSummary(
                business_id=payload.meta.business_id,
                date_dimension=target_date_dimension,
            )
            db.add(analytics_row)

        analytics_row.gross_sales_volume += payload.financials.subtotal
        analytics_row.total_tax_collected += payload.financials.tax_amount
        analytics_row.total_discounts_granted += (
            payload.financials.discount_applied
        )

        if not is_invoice:
            analytics_row.net_revenue_collected += (
                payload.financials.grand_total
            )
            analytics_row.total_completed_orders_count += 1

        # ---------------------------------------------------------
        # TRANSACTION BLOCK COMMITMENT
        # ---------------------------------------------------------
        await db.commit()
        return {
            "status": "SUCCESS",
            "sale_id": db_sale.id,
            "message": "Transaction safely verified and compiled.",
        }

    except Exception as error:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Critical transaction execution failure. Pipeline rolled back safely. Logs: {str(error)}",
        )


# =========================================================
# 2. GENERATE THERMAL PRINT RECEIPT / DOCUMENT DATA
# =========================================================
@router.get("/receipt/{sale_id}", status_code=status.HTTP_200_OK)
async def fetch_thermal_receipt_payload(sale_id: UUID, db: SessionDep):
    """
    Fetches a pre-formatted snapshot payload optimized for consumption by
    hardware thermal printers (ESC/POS) or frontend receipt canvas UI layouts.
    """
    sale = await db.get(Sale, sale_id)
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receipt generation aborted. Sale document '{sale_id}' non-existent.",
        )

    items_stmt = select(SaleItem).where(SaleItem.sale_id == sale_id)
    items_result = await db.exec(items_stmt)
    line_items = items_result.all()

    payments_stmt = select(Payment).where(Payment.sale_id == sale_id)
    payments_result = await db.exec(payments_stmt)
    payments = payments_result.all()

    return {
        "header": {
            "sale_id": sale.id,
            "business_id": sale.business_id,
            "cashier_id": sale.cashier_id,
            "document_timestamp": sale.created_at,
            "document_type": (
                "OFFICIAL_RECEIPT"
                if sale.status != SaleStatus.PENDING_PAYMENT
                else "PROFORMA_INVOICE"
            ),
            "transaction_status": sale.status,
        },
        "financials": {
            "currency": sale.currency,
            "subtotal": sale.subtotal,
            "tax_rate": sale.tax_rate,
            "tax_amount": sale.tax_amount,
            "discount_applied": sale.discount_applied,
            "grand_total": sale.total_amount,
        },
        "items": [
            {
                "sku": item.sku,
                "name": item.name,
                "unit_price": item.unit_price,
                "quantity": item.quantity,
                "quantity_refunded": item.quantity_refunded,
                "subtotal": item.subtotal,
            }
            for item in line_items
        ],
        "settlement": [
            {
                "method": pay.method,
                "amount_tendered": pay.amount,
                "reference": pay.reference,
                "processed_at": pay.created_at,
            }
            for pay in payments
        ],
        "footer_note": "Thank you for shopping with Tawala Cloud. Please retain receipt for all return entries.",
    }


# =========================================================
# 3. GENERATE CORPORATE TAX INVOICE
# =========================================================
@router.get("/invoice/{sale_id}", status_code=status.HTTP_200_OK)
async def fetch_corporate_invoice(sale_id: UUID, db: SessionDep):
    """
    Extracts explicit financial compliance metrics for accounting invoices.
    Appends payment ledger timelines for outstanding balances or corporate lines.
    """
    sale = await db.get(Sale, sale_id)
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested tax invoice record not found.",
        )

    items_stmt = select(SaleItem).where(SaleItem.sale_id == sale_id)
    items_result = await db.exec(items_stmt)
    line_items = items_result.all()

    payments_stmt = select(Payment).where(Payment.sale_id == sale_id)
    payments_result = await db.exec(payments_stmt)
    payments = payments_result.all()

    total_paid = sum(p.amount for p in payments)
    balance_due = max(0.0, sale.total_amount - total_paid)

    return {
        "invoice_metadata": {
            "invoice_number": f"INV-{str(sale.id)[:8].upper()}",
            "issue_date": sale.created_at,
            "due_date": sale.created_at,
            "payment_status": (
                "PAID"
                if balance_due <= 0
                else "UNPAID" if total_paid == 0 else "PARTIALLY_PAID"
            ),
        },
        "compliance_breakdown": {
            "taxable_basis_subtotal": sale.subtotal,
            "vat_rate_applied": sale.tax_rate,
            "total_vat_amount": sale.tax_amount,
            "gross_invoice_total": sale.total_amount,
        },
        "line_items": [
            {
                "sku": item.sku,
                "name": item.name,
                "qty": item.quantity,
                "unit_cost": item.unit_price,
                "line_total": item.subtotal,
            }
            for item in line_items
        ],
        "ledger_history": {
            "total_invoiced_amount": sale.total_amount,
            "total_amount_collected": total_paid,
            "outstanding_balance_due": balance_due,
            "payments_logged": [
                {
                    "date": p.created_at,
                    "method": p.method,
                    "amount": p.amount,
                    "ref": p.reference,
                }
                for p in payments
            ],
        },
    }


# =========================================================
# 4. FETCH DYNAMIC PERIODIC BUSINESS ANALYTICS
# =========================================================
@router.get("/analytics/{business_id}", status_code=status.HTTP_200_OK)
async def get_business_performance_analytics(
    business_id: UUID,
    db: SessionDep,
    period: AnalyticsPeriod = Query(
        default=AnalyticsPeriod.WEEKLY,
        description="Scoping macro lookback window configuration frame.",
    ),
):
    """
    High-performance periodic business intelligence aggregator.
    Loads data blocks directly from pre-calculated metrics caches.
    Dynamically recalculates boundaries based on: DAILY, WEEKLY (Default), or MONTHLY periods.
    """
    now_utc = datetime.utcnow()

    # Dynamic lookback window generation matrix
    if period == AnalyticsPeriod.DAILY:
        start_date = now_utc.replace(
            hour=0, minute=0, second=0, microsecond=0, tzinfo=None
        )
    elif period == AnalyticsPeriod.WEEKLY:
        # Subtract 7 days out from the current time loop
        start_date = (now_utc - timedelta(days=7)).replace(
            hour=0, minute=0, second=0, microsecond=0, tzinfo=None
        )
    elif period == AnalyticsPeriod.MONTHLY:
        # Subtract 30 days out from the current time loop
        start_date = (now_utc - timedelta(days=30)).replace(
            hour=0, minute=0, second=0, microsecond=0, tzinfo=None
        )

    end_date = now_utc.replace(
        hour=23, minute=59, second=59, microsecond=999999, tzinfo=None
    )

    stmt = select(SaleAnalyticsSummary).where(
        SaleAnalyticsSummary.business_id == business_id,
        SaleAnalyticsSummary.date_dimension >= start_date,
        SaleAnalyticsSummary.date_dimension <= end_date,
    )
    result = await db.exec(stmt)
    summaries = result.all()

    if not summaries:
        return {
            "business_id": business_id,
            "active_period_scope": period,
            "reporting_window": {"from": start_date, "to": end_date},
            "message": "No analytical logs written inside selected data frame constraints.",
            "aggregates": {
                "gross_sales_volume": 0.0,
                "net_revenue_collected": 0.0,
                "tax_collected": 0.0,
                "refunds": 0.0,
                "total_orders": 0,
            },
        }

    return {
        "business_id": business_id,
        "active_period_scope": period,
        "reporting_window": {"from": start_date, "to": end_date},
        "aggregates": {
            "gross_sales_volume": sum(s.gross_sales_volume for s in summaries),
            "total_tax_collected": sum(s.total_tax_collected for s in summaries),
            "total_discounts_granted": sum(
                s.total_discounts_granted for s in summaries
            ),
            "net_revenue_collected": sum(
                s.net_revenue_collected for s in summaries
            ),
            "refund_deductions_volume": sum(
                s.refund_deductions_volume for s in summaries
            ),
            "total_completed_orders_count": sum(
                s.total_completed_orders_count for s in summaries
            ),
        },
        "trends": [
            {
                "date": s.date_dimension,
                "gross_sales": s.gross_sales_volume,
                "net_revenue": s.net_revenue_collected,
                "orders_count": s.total_completed_orders_count,
            }
            for s in summaries
        ],
    }


# =========================================================
# 5. EXECUTE SAFE IMMUTABLE REFUNDS / DISPUTES
# =========================================================
@router.post("/refund", status_code=status.HTTP_200_OK)
async def process_item_refund(payload: RefundRequestIn, db: SessionDep):
    """
    Safely handles partial or full customer item returns using immutable ledger events.
    Adjusts inventory, increments product tracking records, and posts negative revenue steps.
    """
    sale = await db.get(Sale, payload.sale_id)
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original sale transaction document missing.",
        )

    item_stmt = select(SaleItem).where(
        SaleItem.sale_id == payload.sale_id,
        SaleItem.product_id == payload.product_id,
    )
    item_res = await db.exec(item_stmt)
    sale_item = item_res.first()

    if not sale_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target item not found on this invoice ledger context.",
        )

    if (
        sale_item.quantity_refunded + payload.quantity_to_refund
    ) > sale_item.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Refund overflow. Max return units remaining: {sale_item.quantity - sale_item.quantity_refunded}.",
        )

    try:
        sale_item.quantity_refunded += payload.quantity_to_refund
        db.add(sale_item)

        refund_unit_price = sale_item.unit_price
        tax_per_unit = refund_unit_price * sale.tax_rate
        gross_refund_per_unit = refund_unit_price + tax_per_unit

        total_refund_cash_value = gross_refund_per_unit * payload.quantity_to_refund
        negative_cash_delta = -total_refund_cash_value

        product = await db.get(Product, payload.product_id)
        if product and product.track_stock:
            product.stock += payload.quantity_to_refund
            db.add(product)

        if all(item.quantity_refunded == item.quantity for item in sale.items):
            sale.status = SaleStatus.REFUNDED
        else:
            sale.status = SaleStatus.PARTIALLY_REFUNDED
        db.add(sale)

        ledger_correction = SaleLedgerEvent(
            sale_id=sale.id,
            event_type=EventType.ITEM_RETURNED,
            amount_delta=negative_cash_delta,
            product_id_context=payload.product_id,
            notes=payload.notes,
        )
        db.add(ledger_correction)

        # target_date_dimension = datetime.utcnow().replace(
        #     hour=0, minute=0, second=0, microsecond=0, tzinfo=None
        # )

        # Extract the day's timestamp block cleanly (ignoring microsecond variations)
        target_date_dimension = payload.meta.timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
        summary_stmt = select(SaleAnalyticsSummary).where(
            SaleAnalyticsSummary.business_id == sale.business_id,
            SaleAnalyticsSummary.date_dimension == target_date_dimension,
        )
        summary_result = await db.exec(summary_stmt)
        analytics_row = summary_result.first()

        if analytics_row:
            analytics_row.refund_deductions_volume += total_refund_cash_value
            analytics_row.net_revenue_collected -= total_refund_cash_value
            db.add(analytics_row)

        await db.commit()
        return {
            "status": "SUCCESS",
            "message": "Refund compiled and recorded into immutable ledger.",
            "value_refunded": total_refund_cash_value,
        }

    except Exception as error:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Refund transaction failed and rolled back. Logs: {str(error)}",
        )