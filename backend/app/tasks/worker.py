# # app/tasks/worker.py
# import json
# import hashlib
# from uuid import UUID, uuid4
# from datetime import datetime, timezone

# from sqlmodel import select
# from sqlalchemy.orm import selectinload
# from sqlalchemy.dialects.postgresql import insert as pg_insert

# from app.core.config import settings
# from app.utils.logging import logger
# from app.core.session import AsyncSessionLocal 

# from app.models.models import Sale, SaleStatus, DocumentType, FinancialDocument, SaleAnalyticsSummary
# from app.schemas.store import (
#     FinancialDocumentSnapshotSchema, SellerSnapshot, CashierSnapshot,
#     BuyerSnapshot, FinancialsSnapshot, ItemSnapshot, PaymentSnapshot, DisputeAuditSnapshot
# )


# async def async_process_document_generation(sale_id: UUID) -> str:
#     """
#     Background task: Generate financial document + analytics.
#     Runs in the same event loop as FastAPI (via BackgroundTasks).
#     """
#     async with AsyncSessionLocal() as db:
#         try:
#             # Enforce explicit relational eager loading
#             sale_res = await db.exec(
#                 select(Sale)
#                 .where(Sale.id == sale_id)
#                 .options(
#                     selectinload(Sale.items),
#                     selectinload(Sale.business),
#                     selectinload(Sale.cashier),
#                     selectinload(Sale.customer),
#                     selectinload(Sale.payments)
#                 )
#             )
#             sale = sale_res.unique().one_or_none()

#             if not sale:
#                 err_msg = f"Aborting: Sale ID {sale_id} not found in database records."
#                 logger.error(err_msg)
#                 return err_msg

#             # Check existing document
#             existing_doc_res = await db.exec(
#                 select(FinancialDocument).where(FinancialDocument.sale_id == sale.id)
#             )
#             financial_document = existing_doc_res.unique().one_or_none()

#             is_invoice = sale.status == SaleStatus.PENDING_PAYMENT
#             doc_type = DocumentType.INVOICE if is_invoice else DocumentType.RECEIPT

#             if not financial_document:
#                 prefix = "INV" if is_invoice else "REC"
#                 date_slug = sale.created_at.astimezone(timezone.utc).strftime("%y%m%d") if sale.created_at else datetime.now(timezone.utc).strftime("%y%m%d")
#                 serial = sale.id.hex[:8].upper()
#                 document_number = f"{prefix}-{date_slug}-{serial}"

#                 financial_document = FinancialDocument(
#                     id=uuid4(),
#                     business_id=sale.business_id,
#                     sale_id=sale.id,
#                     customer_id=sale.customer_id,
#                     document_type=doc_type,
#                     document_number=document_number,
#                     subtotal=sale.subtotal,
#                     discount_amount=sale.discount,
#                     tax_amount=sale.tax_amount,
#                     total_amount=sale.total_amount,
#                     amount_paid=0.0 if is_invoice else sale.total_amount,
#                     fiscal_metadata={
#                         "rendered_by_worker": True,
#                         "is_eager_local_run": not settings.is_prod,
#                         "processed_at": datetime.now(timezone.utc).isoformat()
#                     }
#                 )
#                 db.add(financial_document)
#                 await db.flush()

#                 # Assign financial_document_id to items
#                 for item in sale.items:
#                     item.financial_document_id = financial_document.id
#                     db.add(item)

#                 logger.info(f"Successfully generated {doc_type} reference: {financial_document.document_number}")

#             # ====================== SNAPSHOT ======================
#             cashier_snap = CashierSnapshot(
#                 id=sale.cashier.id,
#                 name=sale.cashier.full_name,
#                 role=sale.cashier.role.value
#             )
#             seller_snap = SellerSnapshot(
#                 business_id=sale.business.id,
#                 business_name=sale.business.name,
#                 address=sale.business.address,
#                 phone=sale.business.phone,
#                 tax_number=None,
#                 cashier=cashier_snap
#             )

#             buyer_snap = BuyerSnapshot(
#                 customer_id=sale.customer.id if sale.customer else None,
#                 name=sale.customer.name if sale.customer else "Walk-in Customer",
#                 phone=sale.customer.phone if sale.customer else None,
#                 email=sale.customer.email if sale.customer else None
#             )

#             total_paid_amt = sum(p.amount for p in sale.payments)
#             financials_snap = FinancialsSnapshot(
#                 currency=sale.currency,
#                 subtotal=sale.subtotal,
#                 discount_amount=sale.discount,
#                 tax_rate_applied=sale.tax_rate,
#                 tax_amount=sale.tax_amount,
#                 total_amount=sale.total_amount,
#                 amount_paid=total_paid_amt,
#                 balance_due=max(0.0, sale.total_amount - total_paid_amt)
#             )

#             items_snap = [
#                 ItemSnapshot(
#                     item_id=item.id,
#                     product_id=item.product_id,
#                     sku=item.sku,
#                     name=item.name,
#                     quantity=item.quantity,
#                     unit_price=item.unit_price,
#                     tax_rate=item.tax_rate or 0.0,
#                     tax_amount=item.subtotal * (item.tax_rate or 0.0),
#                     total_price=item.subtotal + item.subtotal * (item.tax_rate or 0.0),
#                     cost_price_at_sale=item.cost_price_at_sale
#                 ) for item in sale.items
#             ]

#             payments_snap = [
#                 PaymentSnapshot(
#                     payment_id=payment.id,
#                     method=payment.method,
#                     amount=payment.amount,
#                     reference=payment.reference,
#                     processed_at=payment.created_at or datetime.now(timezone.utc)
#                 ) for payment in sale.payments
#             ]

#             dispute_snap = DisputeAuditSnapshot(
#                 parent_sale_id=sale.id,
#                 status=sale.status,
#                 notes="Snapshot pre-compiled by background task."
#             )

#             snapshot_data = FinancialDocumentSnapshotSchema(
#                 document_id=financial_document.id,
#                 document_number=financial_document.document_number,
#                 document_type=financial_document.document_type,
#                 issued_at=financial_document.created_at or datetime.now(timezone.utc),
#                 seller=seller_snap,
#                 buyer=buyer_snap,
#                 financials=financials_snap,
#                 items=items_snap,
#                 payments=payments_snap,
#                 dispute_and_audit=dispute_snap
#             )

#             # Integrity hash
#             serialized_payload = json.dumps(snapshot_data.model_dump(mode="json"), sort_keys=True)
#             integrity_hash = hashlib.sha256(serialized_payload.encode("utf-8")).hexdigest()
#             snapshot_data.dispute_and_audit.original_document_hash = integrity_hash

#             financial_document.document_snapshot = snapshot_data.model_dump(mode="json")
#             db.add(financial_document)

#             # Analytics
#             if sale.status == SaleStatus.COMPLETED:
#                 from app.utils.helpers import utc_now
#                 now = utc_now()
#                 date_dimension = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

#                 stmt_analytics = (
#                     pg_insert(SaleAnalyticsSummary)
#                     .values(
#                         business_id=sale.business_id,
#                         date_dimension=date_dimension,
#                         gross_sales_volume=sale.subtotal,
#                         total_tax_collected=sale.tax_amount,
#                         total_discounts_granted=sale.discount,
#                         net_revenue_collected=sale.total_amount,
#                         refund_deductions_volume=0.0,
#                         total_completed_orders_count=1
#                     )
#                     .on_conflict_do_update(
#                         index_elements=["business_id", "date_dimension"],
#                         set_={
#                             "gross_sales_volume": SaleAnalyticsSummary.gross_sales_volume + sale.subtotal,
#                             "total_tax_collected": SaleAnalyticsSummary.total_tax_collected + sale.tax_amount,
#                             "total_discounts_granted": SaleAnalyticsSummary.total_discounts_granted + sale.discount,
#                             "net_revenue_collected": SaleAnalyticsSummary.net_revenue_collected + sale.total_amount,
#                             "total_completed_orders_count": SaleAnalyticsSummary.total_completed_orders_count + 1
#                         }
#                     )
#                 )
#                 await db.exec(stmt_analytics)

#             await db.commit()
#             logger.info(f"Background processing completed successfully for Sale ID: {sale.id}")
#             return f"Success for Sale ID: {sale.id}"

#         except Exception as error:
#             await db.rollback()
#             logger.error(f"Critical exception in background document processor: {str(error)}")
#             raise

# app/tasks/worker.py
import json
import hashlib
from uuid import UUID, uuid4
from datetime import datetime, timezone

from sqlmodel import select
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.config import settings
from app.utils.logging import logger
from app.core.session import AsyncSessionLocal 

from app.models.models import Sale, SaleStatus, DocumentType, FinancialDocument, SaleAnalyticsSummary
from app.schemas.store import (
    FinancialDocumentSnapshotSchema, SellerSnapshot, CashierSnapshot,
    BuyerSnapshot, FinancialsSnapshot, ItemSnapshot, PaymentSnapshot, DisputeAuditSnapshot
)


async def async_process_document_generation(sale_id: UUID) -> str:
    """
    Background task: Generate financial document (Receipt/Invoice) snapshot only.
    Analytics are handled separately for better modularity.
    """
    async with AsyncSessionLocal() as db:
        try:
            # Enforce explicit relational eager loading
            sale_res = await db.exec(
                select(Sale)
                .where(Sale.id == sale_id)
                .options(
                    selectinload(Sale.items),
                    selectinload(Sale.business),
                    selectinload(Sale.cashier),
                    selectinload(Sale.customer),
                    selectinload(Sale.payments)
                )
            )
            sale = sale_res.unique().one_or_none()

            if not sale:
                err_msg = f"Aborting: Sale ID {sale_id} not found in database records."
                logger.error(err_msg)
                return err_msg

            # Check existing document
            existing_doc_res = await db.exec(
                select(FinancialDocument).where(FinancialDocument.sale_id == sale.id)
            )
            financial_document = existing_doc_res.unique().one_or_none()

            is_invoice = sale.status == SaleStatus.PENDING_PAYMENT
            doc_type = DocumentType.INVOICE if is_invoice else DocumentType.RECEIPT

            if not financial_document:
                prefix = "INV" if is_invoice else "REC"
                date_slug = sale.created_at.astimezone(timezone.utc).strftime("%y%m%d") if sale.created_at else datetime.now(timezone.utc).strftime("%y%m%d")
                serial = sale.id.hex[:8].upper()
                document_number = f"{prefix}-{date_slug}-{serial}"

                financial_document = FinancialDocument(
                    id=uuid4(),
                    business_id=sale.business_id,
                    sale_id=sale.id,
                    customer_id=sale.customer_id,
                    document_type=doc_type,
                    document_number=document_number,
                    subtotal=sale.subtotal,
                    discount_amount=getattr(sale, 'discount', 0.0),
                    tax_amount=sale.tax_amount,
                    total_amount=sale.total_amount,
                    amount_paid=0.0 if is_invoice else sale.total_amount,
                    fiscal_metadata={
                        "rendered_by_worker": True,
                        "is_eager_local_run": not settings.is_prod,
                        "processed_at": datetime.now(timezone.utc).isoformat()
                    }
                )
                db.add(financial_document)
                await db.flush()

                # Assign financial_document_id to items
                for item in sale.items:
                    item.financial_document_id = financial_document.id
                    db.add(item)

                logger.info(f"Successfully generated {doc_type} reference: {financial_document.document_number}")

            # ====================== PROFESSIONAL SNAPSHOT ======================
            # Seller
            cashier_snap = CashierSnapshot(
                id=sale.cashier.id,
                name=sale.cashier.full_name,
                role=sale.cashier.role.value if hasattr(sale.cashier.role, "value") else str(sale.cashier.role)
            )
            seller_snap = SellerSnapshot(
                business_id=sale.business.id,
                business_name=sale.business.name,
                address=sale.business.address,
                phone=sale.business.phone,
                tax_number=getattr(sale.business, 'tax_number', None),
                cashier=cashier_snap
            )

            # Buyer
            if sale.customer:
                buyer_snap = BuyerSnapshot(
                    customer_id=sale.customer.id,
                    name=sale.customer.name,
                    phone=sale.customer.phone,
                    email=sale.customer.email,
                    is_walk_in=False
                )
            else:
                buyer_snap = BuyerSnapshot(
                    customer_id=None,
                    name="Walk-in Customer",
                    phone=None,
                    email=None,
                    is_walk_in=True
                )

            # Financials
            total_paid = sum((p.amount for p in sale.payments), 0.0)
            financials_snap = FinancialsSnapshot(
                currency=sale.currency,
                subtotal=round(float(sale.subtotal), 2),
                discount_amount=round(float(getattr(sale, 'discount', 0.0)), 2),
                tax_rate_applied=round(float(getattr(sale, 'tax_rate', 0.0)), 4),
                tax_amount=round(float(getattr(sale, 'tax_amount', 0.0)), 2),
                total_amount=round(float(sale.total_amount), 2),
                amount_paid=round(float(total_paid), 2),
                balance_due=round(max(0.0, float(sale.total_amount) - total_paid), 2)
            )

            # Items + Summary calculations
            items_snap = []
            total_quantity = 0.0
            total_item_tax = 0.0

            for item in sale.items:
                item_tax = round(float(getattr(item, 'subtotal', 0.0)) * float(getattr(item, 'tax_rate', 0.0) or 0.0), 2)
                item_total = round(float(getattr(item, 'subtotal', 0.0)) + item_tax, 2)

                items_snap.append(ItemSnapshot(
                    item_id=item.id,
                    product_id=item.product_id,
                    sku=item.sku,
                    name=item.name,
                    quantity=float(item.quantity),
                    unit_price=round(float(item.unit_price), 2),
                    tax_rate=round(float(getattr(item, 'tax_rate', 0.0)), 4),
                    tax_amount=item_tax,
                    discount_amount=round(float(getattr(item, 'discount', 0.0)), 2),
                    total_price=item_total,
                    cost_price_at_sale=getattr(item, 'cost_price_at_sale', None)
                ))
                total_quantity += float(item.quantity)
                total_item_tax += item_tax

            # Payments
            payments_snap = [
                PaymentSnapshot(
                    payment_id=payment.id,
                    method=payment.method,
                    amount=round(float(payment.amount), 2),
                    reference=payment.reference,
                    processed_at=payment.created_at or datetime.now(timezone.utc)
                ) for payment in sale.payments
            ]

            # Dispute & Audit
            dispute_snap = DisputeAuditSnapshot(
                parent_sale_id=sale.id,
                status=sale.status,
                notes="Snapshot generated by background document task."
            )

            # Final Snapshot
            snapshot_data = FinancialDocumentSnapshotSchema(
                document_id=financial_document.id,
                document_number=financial_document.document_number,
                document_type=financial_document.document_type,
                issued_at=financial_document.created_at or datetime.now(timezone.utc),
                version="1.0",
                seller=seller_snap,
                buyer=buyer_snap,
                financials=financials_snap,
                items=items_snap,
                payments=payments_snap,
                dispute_and_audit=dispute_snap,
                summary={
                    "total_items": len(items_snap),
                    "total_quantity": round(total_quantity, 4),
                    "total_tax_collected": round(total_item_tax, 2),
                    "payment_count": len(payments_snap)
                }
            )

            # Integrity hash
            serialized_payload = json.dumps(
                snapshot_data.model_dump(mode="json", exclude_none=True),
                sort_keys=True,
                default=str
            )
            integrity_hash = hashlib.sha256(serialized_payload.encode("utf-8")).hexdigest()
            snapshot_data.dispute_and_audit.original_document_hash = integrity_hash

            financial_document.document_snapshot = snapshot_data.model_dump(mode="json", exclude_none=True)
            db.add(financial_document)

            await db.commit()
            logger.info(f"✅ Financial document generated successfully for Sale ID: {sale.id}")
            return f"Document generated successfully for Sale ID: {sale.id}"

        except Exception as error:
            await db.rollback()
            logger.error(f"Critical exception in document generation: {str(error)}")
            raise


async def async_update_sales_analytics(sale_id: UUID) -> str:
    """
    Separate background task for updating sales analytics.
    Can be triggered independently.
    """
    async with AsyncSessionLocal() as db:
        try:
            sale_res = await db.exec(
                select(Sale).where(Sale.id == sale_id)
            )
            sale = sale_res.unique().one_or_none()

            if not sale or sale.status != SaleStatus.COMPLETED:
                return "Analytics skipped: Sale not completed or not found."

            from app.utils.helpers import utc_now
            now = utc_now()
            date_dimension = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

            stmt = (
                pg_insert(SaleAnalyticsSummary)
                .values(
                    business_id=sale.business_id,
                    date_dimension=date_dimension,
                    gross_sales_volume=sale.subtotal,
                    total_tax_collected=getattr(sale, 'tax_amount', 0.0),
                    total_discounts_granted=getattr(sale, 'discount', 0.0),
                    net_revenue_collected=sale.total_amount,
                    refund_deductions_volume=0.0,
                    total_completed_orders_count=1
                )
                .on_conflict_do_update(
                    index_elements=["business_id", "date_dimension"],
                    set_={
                        "gross_sales_volume": SaleAnalyticsSummary.gross_sales_volume + sale.subtotal,
                        "total_tax_collected": SaleAnalyticsSummary.total_tax_collected + getattr(sale, 'tax_amount', 0.0),
                        "total_discounts_granted": SaleAnalyticsSummary.total_discounts_granted + getattr(sale, 'discount', 0.0),
                        "net_revenue_collected": SaleAnalyticsSummary.net_revenue_collected + sale.total_amount,
                        "total_completed_orders_count": SaleAnalyticsSummary.total_completed_orders_count + 1
                    }
                )
            )
            await db.exec(stmt)
            await db.commit()

            logger.info(f"✅ Analytics updated for Business ID: {sale.business_id} on {date_dimension.date()}")
            return f"Analytics updated successfully for Sale ID: {sale.id}"

        except Exception as error:
            await db.rollback()
            logger.error(f"Critical exception in analytics update: {str(error)}")
            raise