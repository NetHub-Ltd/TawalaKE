from typing import Type, List, Dict,Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.exc import SQLAlchemyError, IntegrityError


from app.crud.base import BaseCRUD
from app.models.models import Business, StaffBusinessAssignment, Staff, StockHistory, StockMovementType
from app.schemas.schemas import BusinessCreate, BusinessUpdate
from app.schemas.business import StaffRequest, ProductAuditRequest, ProductRestockRequest
from app.utils.logging import logger
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import select
from app.models.models import ( Product, Sale, SaleItem, FinancialDocument, DocumentType, SaleStatus,
    Payment, PaymentMethod, Customer, StockHistory, StockMovementType
)
from app.schemas.business import StockTakeRequest
from app.utils.logging import logger
from app.utils.helpers import utc_now
from app.schemas.store import FinalizeCheckoutIn

class StoreCrud(BaseCRUD[Business, BusinessCreate, BusinessUpdate]):
    def __init__(self, model: Type[Business]):
        super().__init__(model)


    async def get_tenant_businesses(self, db: AsyncSession, tenant_id: UUID):
        """
        Retrieves all businesses associated with a specified tenant ID.
        """
        # Using pure SQLModel select() ensures db.exec().all() returns clean model instances,
        # not raw database row-tuples.
        stmt = select(self.model).where(self.model.tenant_id == tenant_id)
        result = (await db.exec(stmt)).all() 
        
        if not result:
            return []

        needs_commit = False

        # Because of SQLModel's design, 'biz' here is cleanly inferred as a Business instance.
        # No weird tuple unpacking like 'for (biz,) in result:' needed!
        for biz in result:
            if not biz.organization_id:
                logger.info(f"Staging organization_id update to {tenant_id}")
                biz.organization_id = tenant_id
                db.add(biz)
                needs_commit = True

        if needs_commit:
            await db.commit()
            for biz in result:
                await db.refresh(biz)

        return result

    async def register_business(self, db_obj: BusinessCreate, db: AsyncSession)-> Business:
        new = await self.create(db, obj_in=db_obj)
        await db.commit()
        return new

    async def update_business(self, business_id: UUID, db_obj: BusinessUpdate, db: AsyncSession)-> Business:
        biz = await self.get(db, id=business_id)
        if not biz:
            raise HTTPException(status_code=404, detail="Business not found")
        new = await self.update(db, db_obj=biz, obj_in=db_obj)
        await db.commit()
        return new

    async def get_business_by_id(self,db: AsyncSession, business_id: UUID)-> Business:
        biz = await self.get(db, id=business_id)
        if not biz:
            raise HTTPException(status_code=404, detail="Business not found")
        return biz


    async def assign_staff_to_business(self, db: AsyncSession, payload: StaffRequest):
        try:
            # 1. Fetch the business and verify it exists
            biz = await self.get(db, id=payload.business_id)
            if not biz:
                raise HTTPException(status_code=404, detail="Business node not found")

            # 2. TODO RESOLVED: Verify both the staff and business belong to the same organization
            # We query the staff member's profile record to check their organization boundary
            staff_query = await db.execute(
                select(Staff).filter(Staff.id == payload.staff_id)
            )
            staff_member = staff_query.scalar_one_or_none()

            if not staff_member:
                raise HTTPException(status_code=404, detail="Staff profile record not found")

            # Validate multi-tenant structural boundaries match perfectly
            if staff_member.organization_id != biz.organization_id:
                raise HTTPException(
                    status_code=403, 
                    detail="Security Violation: Staff member and Business do not belong to the same organization"
                )

            # 3. Safe Upsert Execution Structure (Prevents UniqueViolationError / 409 conflicts)
            # We build a native PostgreSQL insert execution plan
            stmt = (
                insert(StaffBusinessAssignment)
                .values(
                    staff_id=payload.staff_id,
                    business_id=payload.business_id
                )
            )
            
            # If the assignment row link already exists, tell Postgres to do nothing gracefully
            stmt = stmt.on_conflict_do_nothing(
                index_elements=["staff_id", "business_id"]
            )
            
            await db.execute(stmt)
            await db.commit()

            # 4. Fetch and return the relationship assignment record state
            assignment_query = await db.execute(
                select(StaffBusinessAssignment).filter_by(
                    staff_id=payload.staff_id, 
                    business_id=payload.business_id
                )
            )
            assignment = assignment_query.scalar_one_or_none()
            
            return assignment

        except SQLAlchemyError as error:
            await db.rollback()
            logger.error(f"An error occurred when assigning staff to a business: {error}")
            raise HTTPException(
                status_code=500, 
                detail="Internal transactional pipeline failure while updating relationship assignment"
            )
        
    async def audit_stock(self, db: AsyncSession, payload: ProductAuditRequest, current_user) -> StockHistory:
        """
        Executes an isolated physical stock reconciliation audit for a target product.
        Computes variance deltas and commits state changes atomically with strict trail tracking.
        """
        try:
            # 1. Fetch product with row-level write validation locking protection (FOR UPDATE)
            stmt = select(Product).where(Product.id == payload.product_id).with_for_update()
            result = await db.execute(stmt)
            product = result.scalar_one_or_none()

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail="The targeted product entry was not found in this business catalog."
                )

            previous_stock = product.stock
            
            # 🔑 CRITICAL BUSINESS LOGIC: payload.quantity is the absolute count counted on the shelf.
            # Variance = Physical Count Reality - Current System Book Record
            quantity_delta = payload.quantity - previous_stock

            # 2. Map structural adjustments to the single source of truth timeline ledger
            history_entry = StockHistory(
                product_id=product.id,
                business_id=product.business_id,
                performed_by=current_user.id,
                movement_type=StockMovementType.ADJUSTMENT, # Matches your true database enum type name
                quantity=quantity_delta,
                previous_stock=previous_stock,
                new_stock=payload.quantity, # The final verified shelf volume
                buying_price=product.cost_price,
                selling_price=product.selling_price,
                reference_type=payload.reference_type or "MANUAL_AUDIT",
                reason_code=payload.reason_code,
                notes=payload.notes
            )

            # 3. Apply state mutation adjustments down to the product master record
            product.stock = payload.quantity
            product.last_stock_take = utc_now() # Timezone-aware date stamp (TIMESTAMP WITH TIME ZONE)

            db.add(product)
            db.add(history_entry)

            # 4. Execute atomic transaction commitment
            await db.commit()
            await db.refresh(product)
            
            return product

        except HTTPException:
            await db.rollback()
            raise
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Critical exception captured during database inventory reconciliation sequence: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to commit inventory reconciliation adjustments safely due to a database level conflict."
            )
        

    async def add_new_stock(self, db: AsyncSession, payload: ProductRestockRequest, current_user) -> StockHistory:
        """
        Executes a secure inbound inventory restock operation.
        Increments physical item volumes and updates catalog cost/selling margins 
        atomically while safeguarding the historical trace timeline.
        """
        try:
            # 1. Fetch product with row-level write validation locking protection (FOR UPDATE)
            stmt = select(Product).where(Product.id == payload.product_id).with_for_update()
            result = await db.execute(stmt)
            product = result.scalar_one_or_none()

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
                buying_price=payload.buying_price if payload.buying_price is not None else product.cost_price,
                selling_price=payload.selling_price if payload.selling_price is not None else product.selling_price,
                reference_id=payload.reference_id,
                reference_type=payload.reference_type or "PURCHASE_ORDER",
                notes=payload.notes
            )

            # 4. Mutate master product ledger catalog values directly in memory
            product.stock = new_stock
            
            # Update purchase cost structures if valid parameters are parsed
            if payload.buying_price is not None and payload.buying_price > 0:
                product.cost_price = payload.buying_price

            # Apply new selling/shelf marks if provided in the batch restock payload
            if payload.selling_price is not None and payload.selling_price > 0:
                product.selling_price = payload.selling_price

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
        
    async def create_pending_sale(db: AsyncSession, payload: FinalizeCheckoutIn) -> Tuple[Sale, List[SaleItem]]:
        """
        Instantiates a draft transaction record, validates product status, checks 
        inventory thresholds in a single batch query execution context, and saves 
        the immutable line items safely.
        """
        # 1. Extract and deduplicate item identifiers to prevent N+1 loop round-trips
        product_ids = list({item.product_id for item in payload.items})
        if not product_ids:
            raise HTTPException(
                status_code=400,
                detail="Transaction payload must contain at least one retail item line."
            )

        # Bulk fetch all relevant products in one round-trip
        product_query = await db.exec(select(Product).where(Product.id.in_(product_ids)))
        products_map: Dict[UUID, Product] = {product.id: product for product in product_query.all()}

        # 2. Instantiate root draft Sale container structure
        new_sale = Sale(
            business_id=payload.business_id,
            cashier_id=payload.cashier_id,
            customer_id=getattr(payload, "customer_id", None),
            status=SaleStatus.PENDING_PAYMENT,
            subtotal=0.0,
            discount=0.0,
            tax_amount=0.0,
            total_amount=0.0
        )
        
        db.add(new_sale)
        # Flush registers the record and obtains the primary key ID without writing a commit block
        await db.flush()

        running_subtotal = 0.0
        running_tax = 0.0
        created_items: List[SaleItem] = []

        # 3. Safe linear validation and calculation phase
        for item in payload.items:
            product = products_map.get(item.product_id)

            if not product or not getattr(product, "active", True):
                raise HTTPException(
                    status_code=404,
                    detail=f"Product with ID {item.product_id} is unavailable or does not exist."
                )

            # Enforce server-side stock safety checkpoints
            if getattr(product, "track_stock", False) and getattr(product, "stock", 0) < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for '{product.label}'. Available: {product.stock}, Requested: {item.quantity}"
                )

            # Establish tax rate constraints (falling back to standard 16% corporate VAT if unspecified)
            # tax_rate = getattr(product, "tax_rate", 0.0)
            # if tax_rate is None:
            #     tax_rate = 0.0

            # force a taxrate for now
            tax_rate = 0.0

            # Standard clean currency calculations
            item_subtotal = round(product.selling_price * item.quantity, 2)
            item_tax = round(item_subtotal * tax_rate, 2)

            # Map correct safe fallback parameters to match matching model keys
            sku_code = getattr(product, "sku", "GENERIC") or "GENERIC"
            cost_price = getattr(product, "cost_price", None) or getattr(product, "buying_price", None)

            sale_item = SaleItem(
                sale_id=new_sale.id,
                product_id=product.id,
                sku=sku_code,
                name=product.label,
                unit_price=product.selling_price,
                quantity=item.quantity,
                tax_rate=tax_rate,
                subtotal=item_subtotal,
                cost_price_at_sale=cost_price
            )
            
            db.add(sale_item)
            created_items.append(sale_item)
            
            running_subtotal += item_subtotal
            running_tax += item_tax

        # 4. Bind running financial totals to parent transaction ledger container
        new_sale.subtotal = round(running_subtotal, 2)
        new_sale.tax_amount = round(running_tax, 2)
        new_sale.total_amount = round(running_subtotal + running_tax, 2)

        db.add(new_sale)
        
        # Commit execution updates all transactional tables together safely
        await db.commit()
        await db.refresh(new_sale)
        
        return new_sale, created_items

    
    async def finalize_checkout(
        cls, 
        db: AsyncSession, 
        sale_id: UUID, 
        payload: FinalizeCheckoutIn
    ) -> FinancialDocument:
        """
        Locks inventory records, calculates margins, processes documents, 
        and triggers metrics inside an isolated transaction.
        """
        today = utc_now()
        
        # 1. Look up the initial draft transaction record
        sale_res = await db.exec(select(Sale).where(Sale.id == sale_id))
        sale = sale_res.first()
        if not sale:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction records not found.")
        if sale.status == SaleStatus.COMPLETED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This transaction is already finalized.")

        # Resolve items in the current async frame cleanly
        items_res = await db.exec(select(SaleItem).where(SaleItem.sale_id == sale.id))
        sale_items = items_res.all()

        # 2. PESSIMISTIC ROW-LEVEL DATABASE LOCKING
        # Sort product IDs uniformly to prevent random concurrent deadlocks in the DB kernel
        product_ids = sorted(list({item.product_id for item in sale_items}))
        if not product_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot checkout an empty sale.")
        
        # Execute 'SELECT ... FOR UPDATE' to freeze these item metrics completely
        locked_products_query = select(Product).where(Product.id.in_(product_ids)).with_for_update()
        locked_products_res = await db.exec(locked_products_query)
        locked_products = {p.id: p for p in locked_products_res.all()}

        # 3. Process Customer Profiles Safely
        if payload.customer_name or payload.customer_phone:
            customer_stmt = select(Customer).where(
                Customer.business_id == sale.business_id,
                Customer.phone == payload.customer_phone if payload.customer_phone else ""
            )
            customer_res = await db.exec(customer_stmt)
            customer = customer_res.first()

            if not customer and payload.customer_name:
                org_id = uuid4()
                if hasattr(sale, "business") and getattr(sale.business, "organization_id", None):
                    org_id = sale.business.organization_id

                customer = Customer(
                    name=payload.customer_name,
                    phone=payload.customer_phone,
                    organization_id=org_id,
                    business_id=sale.business_id
                )
                db.add(customer)
                await db.flush()  # Gets customer ID within the transaction scope
            
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
        for item in sale_items:
            product = locked_products.get(item.product_id)
            
            if product and getattr(product, "track_stock", False):
                # Re-verify stock volumes within the locked isolation context block
                if product.stock < item.quantity:
                    # Let the router catch the error; the context block handles safe session rollbacks
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

            cogs_unit = getattr(item, "cost_price_at_sale", 0.0) or 0.0
            total_cogs_today += (cogs_unit * item.quantity)

        # 6 & 7. Call the Decoupled Analytics Tracking Layer Method
        # await AnalyticsService.track_daily_checkout_metrics(
        #     db=db,
        #     sale=sale,
        #     sale_items=sale_items,
        #     total_cogs_today=total_cogs_today,
        #     payment_method=payload.payment_method,
        #     today=today
        # )

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
        
        await db.commit()
        await db.refresh(document)
        return document
                
                


store_crud = StoreCrud(Business)