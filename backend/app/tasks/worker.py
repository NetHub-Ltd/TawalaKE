
# import os
# from uuid import UUID
# from datetime import datetime, timezone
# from celery import Celery
# from sqlmodel import select
# from sqlalchemy.orm import selectinload
# from sqlalchemy.dialects.postgresql import insert as pg_insert

# from app.core.config import settings
# from app.utils.logging import logger

# # Modern factory sessionmaker loaded cleanly from your single point of database configuration config
# from app.core.session import AsyncSessionLocal 
# from app.models.models import Sale, SaleStatus, DocumentType, FinancialDocument, SaleAnalyticsSummary

# # 1. Dynamically evaluate transport URIs based on the active execution framework settings
# if not settings.is_prod:
#     # Use Celery's thread-safe in-memory virtual transport scheme to match FakeRedis behavior locally
#     broker_url = "memory://"
#     backend_url = "cache+memory://"
#     logger.info("⚡ Celery configured to use Virtual In-Memory Broker for dev environment testing.")
# else:
#     broker_url = settings.redis_url
#     backend_url = settings.redis_url

# celery_app = Celery("store_background_workers", broker=broker_url, backend=backend_url)

# # 2. Inject protective overrides for seamless integration testing under dev mode
# if not settings.is_prod:
#     # Forces background tasks to execute synchronously and inline within the primary app process stack
#     celery_app.conf.task_always_eager = True
#     # Ensures exceptions within the background task bubble up directly into primary endpoint logs
#     celery_app.conf.task_eager_propagates = True


# @celery_app.task(name="tasks.generate_financial_document_task", acks_late=True, max_retries=3)
# def generate_financial_document_task(sale_id_str: str) -> str:
#     """
#     Decoupled Task Execution Environment handling immutable Invoice/Receipt row creation and analytics tracking.
#     Executes inline synchronously during development, and pushes to a Redis queue in production.
#     """
#     import asyncio
#     sale_id = UUID(sale_id_str)
    
#     try:
#         # Secure or create a valid running event loop across varied environment execution runtimes
#         loop = asyncio.get_event_loop()
#     except RuntimeError:
#         loop = asyncio.new_event_loop()
#         asyncio.set_event_loop(loop)
        
#     if loop.is_closed():
#         loop = asyncio.new_event_loop()
#         asyncio.set_event_loop(loop)
        
#     return loop.run_until_complete(async_process_document_generation(sale_id))


# async def async_process_document_generation(sale_id: UUID) -> str:
#     """
#     Executes asynchronous transactional queries to render financial documents and record sales metrics.
#     Runs inside the Celery worker container to offload transaction processing from HTTP threads.
#     """
#     async with AsyncSessionLocal() as db:
#         try:
#             # Enforce explicit relational eager loading to protect against MissingGreenlet errors
#             sale_res = await db.exec(
#                 select(Sale)
#                 .where(Sale.id == sale_id)
#                 .options(
#                     selectinload(Sale.items),
#                     selectinload(Sale.business)
#                 )
#             )
#             sale = sale_res.first()

#             if not sale:
#                 err_msg = f"Aborting: Sale ID {sale_id} not found in database records."
#                 logger.error(err_msg)
#                 return err_msg

#             # Maintain system idempotency by verifying if financial document records already exist
#             existing_doc = await db.exec(select(FinancialDocument).where(FinancialDocument.sale_id == sale.id))
#             if existing_doc.first():
#                 logger.warning(f"Financial document already prepared for Sale ID: {sale.id}. Checking analytics registration...")
#             else:
#                 is_invoice = sale.status == SaleStatus.PENDING_PAYMENT
#                 doc_type = DocumentType.INVOICE if is_invoice else DocumentType.RECEIPT

#                 # Format uniform, audit-ready document tracking numbers using created_at values
#                 prefix = "INV" if is_invoice else "REC"
#                 date_slug = sale.created_at.astimezone(timezone.utc).strftime("%y%m%d") if sale.created_at else datetime.now(timezone.utc).strftime("%y%m%d")
#                 serial = sale.id.hex[:8].upper()
#                 document_number = f"{prefix}-{date_slug}-{serial}"

#                 financial_document = FinancialDocument(
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

#                 # Assign matching references across line items
#                 for item in sale.items:
#                     item.financial_document_id = financial_document.id
#                     db.add(item)
                
#                 logger.info(f"Successfully generated {doc_type} reference: {document_number}")

#             # 📊 WORKER-DRIVEN ANALYTICS GENERATION
#             # If the transaction has completed, write or increment metrics within the background thread
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
#                 await db.execute(stmt_analytics)
#                 logger.info(f"Aggregated transaction metrics compiled for Business ID: {sale.business_id}")

#             await db.commit()
#             return f"Worker pipeline completed processing successfully for Sale ID: {sale.id}"

#         except Exception as error:
#             await db.rollback()
#             logger.error(f"Critical exception inside background document/analytics processor pipeline: {str(error)}")
#             raise error

# app/tasks/worker.py
import os
import json
import hashlib
from uuid import UUID, uuid4
from datetime import datetime, timezone
from celery import Celery
from sqlmodel import select
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.config import settings
from app.utils.logging import logger

# Modern factory sessionmaker loaded cleanly from your single point of database configuration config
from app.core.session import AsyncSessionLocal 
from app.models.models import Sale, SaleStatus, DocumentType, FinancialDocument, SaleAnalyticsSummary

# Snapshot Schema Imports
from app.schemas.store import (
    FinancialDocumentSnapshotSchema, SellerSnapshot, CashierSnapshot,
    BuyerSnapshot, FinancialsSnapshot, ItemSnapshot, PaymentSnapshot, DisputeAuditSnapshot
)

# 1. Dynamically evaluate transport URIs based on the active execution framework settings
if not settings.is_prod:
    # Use Celery's thread-safe in-memory virtual transport scheme to match FakeRedis behavior locally
    broker_url = "memory://"
    backend_url = "cache+memory://"
    logger.info("⚡ Celery configured to use Virtual In-Memory Broker for dev environment testing.")
else:
    broker_url = settings.redis_url
    backend_url = settings.redis_url

celery_app = Celery("store_background_workers", broker=broker_url, backend=backend_url)

# 2. Inject protective overrides for seamless integration testing under dev mode
if not settings.is_prod:
    # Forces background tasks to execute synchronously and inline within the primary app process stack
    celery_app.conf.task_always_eager = True
    # Ensures exceptions within the background task bubble up directly into primary endpoint logs
    celery_app.conf.task_eager_propagates = True


@celery_app.task(name="tasks.generate_financial_document_task", acks_late=True, max_retries=3)
def generate_financial_document_task(sale_id_str: str) -> str:
    """
    Decoupled Task Execution Environment handling immutable Invoice/Receipt row creation and analytics tracking.
    Executes inline synchronously during development, and pushes to a Redis queue in production.
    """
    import asyncio
    sale_id = UUID(sale_id_str)
    
    try:
        # Secure or create a valid running event loop across varied environment execution runtimes
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    return loop.run_until_complete(async_process_document_generation(sale_id))


async def async_process_document_generation(sale_id: UUID) -> str:
    """
    Executes asynchronous transactional queries to render financial documents and record sales metrics.
    Runs inside the Celery worker container to offload transaction processing from HTTP threads.
    """
    async with AsyncSessionLocal() as db:
        try:
            # Enforce explicit relational eager loading to protect against MissingGreenlet errors
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

            # Maintain system idempotency by verifying if financial document records already exist
            existing_doc_res = await db.exec(select(FinancialDocument).where(FinancialDocument.sale_id == sale.id))
            financial_document = existing_doc_res.unique().one_or_none()

            is_invoice = sale.status == SaleStatus.PENDING_PAYMENT
            doc_type = DocumentType.INVOICE if is_invoice else DocumentType.RECEIPT

            if financial_document:
                logger.warning(f"Financial document already prepared for Sale ID: {sale.id}. Appending snapshot update...")
            else:
                # Format uniform, audit-ready document tracking numbers using created_at values
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
                    discount_amount=sale.discount,
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

                # Assign matching references across line items
                for item in sale.items:
                    item.financial_document_id = financial_document.id
                    db.add(item)
                
                logger.info(f"Successfully generated {doc_type} reference: {financial_document.document_number}")

            # =========================================================================
            # 🛡️ COMPILE, VALIDATE & SIGN THE IMMUTABLE LEDGER SNAPSHOT
            # =========================================================================
            
            # 1. Who (Seller & Cashier)
            cashier_snap = CashierSnapshot(
                id=sale.cashier.id,
                name=sale.cashier.full_name,
                role=sale.cashier.role.value
            )
            seller_snap = SellerSnapshot(
                business_id=sale.business.id,
                business_name=sale.business.name,
                address=sale.business.address,
                phone=sale.business.phone,
                tax_number=None, # Fallback to None if business tax_number profile is unconfigured
                cashier=cashier_snap
            )

            # 2. Who (Buyer)
            if sale.customer:
                buyer_snap = BuyerSnapshot(
                    customer_id=sale.customer.id,
                    name=sale.customer.name,
                    phone=sale.customer.phone,
                    email=sale.customer.email
                )
            else:
                buyer_snap = BuyerSnapshot(name="Walk-in Customer")

            # 3. Financials
            total_paid_amt = sum(p.amount for p in sale.payments)
            financials_snap = FinancialsSnapshot(
                currency=sale.currency,
                subtotal=sale.subtotal,
                discount_amount=sale.discount,
                tax_rate_applied=sale.tax_rate,
                tax_amount=sale.tax_amount,
                total_amount=sale.total_amount,
                amount_paid=total_paid_amt,
                balance_due=max(0.0, sale.total_amount - total_paid_amt)
            )

            # 4. What (Items)
            items_snap = []
            for item in sale.items:
                item_tax_amt = item.subtotal * (item.tax_rate or 0.0)
                items_snap.append(ItemSnapshot(
                    item_id=item.id,
                    product_id=item.product_id,
                    sku=item.sku,
                    name=item.name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    tax_rate=item.tax_rate or 0.0,
                    tax_amount=item_tax_amt,
                    total_price=item.subtotal + item_tax_amt,
                    cost_price_at_sale=item.cost_price_at_sale
                ))

            # 5. Payments
            payments_snap = [
                PaymentSnapshot(
                    payment_id=payment.id,
                    method=payment.method,
                    amount=payment.amount,
                    reference=payment.reference,
                    processed_at=payment.created_at if payment.created_at else datetime.now(timezone.utc)
                ) for payment in sale.payments
            ]

            # 6. Audit details
            dispute_snap = DisputeAuditSnapshot(
                parent_sale_id=sale.id,
                status=sale.status,
                notes="Snapshot pre-compiled and signed on generation by background worker."
            )

            # Assemble Schema (Implicitly triggers Pydantic Type Validation)
            snapshot_data = FinancialDocumentSnapshotSchema(
                document_id=financial_document.id,
                document_number=financial_document.document_number,
                document_type=financial_document.document_type,
                issued_at=financial_document.created_at if financial_document.created_at else datetime.now(timezone.utc),
                seller=seller_snap,
                buyer=buyer_snap,
                financials=financials_snap,
                items=items_snap,
                payments=payments_snap,
                dispute_and_audit=dispute_snap
            )

            # Generate SHA256 integrity signature of snapshot
            # Serialize cleanly bypassing python type objects (like UUIDs/Datetimes)
            serialized_payload = json.dumps(snapshot_data.model_dump(mode="json"), sort_keys=True)
            integrity_hash = hashlib.sha256(serialized_payload.encode("utf-8")).hexdigest()
            snapshot_data.dispute_and_audit.original_document_hash = integrity_hash

            # Save validated dictionary state back into the JSONB database cell
            financial_document.document_snapshot = snapshot_data.model_dump(mode="json")
            db.add(financial_document)

            # =========================================================================
            # 📊 WORKER-DRIVEN ANALYTICS GENERATION
            # =========================================================================
            if sale.status == SaleStatus.COMPLETED:
                from app.utils.helpers import utc_now
                now = utc_now()
                date_dimension = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

                stmt_analytics = (
                    pg_insert(SaleAnalyticsSummary)
                    .values(
                        business_id=sale.business_id,
                        date_dimension=date_dimension,
                        gross_sales_volume=sale.subtotal,
                        total_tax_collected=sale.tax_amount,
                        total_discounts_granted=sale.discount,
                        net_revenue_collected=sale.total_amount,
                        refund_deductions_volume=0.0,
                        total_completed_orders_count=1
                    )
                    .on_conflict_do_update(
                        index_elements=["business_id", "date_dimension"],
                        set_={
                            "gross_sales_volume": SaleAnalyticsSummary.gross_sales_volume + sale.subtotal,
                            "total_tax_collected": SaleAnalyticsSummary.total_tax_collected + sale.tax_amount,
                            "total_discounts_granted": SaleAnalyticsSummary.total_discounts_granted + sale.discount,
                            "net_revenue_collected": SaleAnalyticsSummary.net_revenue_collected + sale.total_amount,
                            "total_completed_orders_count": SaleAnalyticsSummary.total_completed_orders_count + 1
                        }
                    )
                )
                await db.execute(stmt_analytics)
                logger.info(f"Aggregated transaction metrics compiled for Business ID: {sale.business_id}")

            await db.commit()
            return f"Worker pipeline completed processing successfully for Sale ID: {sale.id}"

        except Exception as error:
            await db.rollback()
            logger.error(f"Critical exception inside background document/analytics processor pipeline: {str(error)}")
            raise error