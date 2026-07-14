from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException,BackgroundTasks

from app.api.deps import SessionDep, AuthUser
from app.crud.business import business_crud
from app.schemas.schemas import BusinessCreate, BusinessResponse, ApiResponse, \
    BusinessUpdate, BusinessBase
from app.schemas.business import RestockRequest, ProductAuditRequest, StaffRequest, ProductRestockRequest
from app.utils.logging import logger
from app.crud.store import store_crud
from app.crud.sale import InitializeCheckout, InitializeCheckoutRequest
from app.schemas.store import SaleResponse, FinalizeCheckoutIn
from sqlmodel import select
from app.models.models import Sale
from app.schemas.schemas import StaffCreateIn, StaffResponse, ProductResponse


router = APIRouter()

@router.post("/register-business", response_model=ApiResponse[BusinessResponse])
async def create_business(user: AuthUser, db: SessionDep, payload: BusinessBase):
    """
    Create a new business within a specified tenant.

    This function is responsible for creating a new business entity associated with
    a given tenant. It retrieves the tenant by its identifier, processes the given
    business creation payload, and registers the new business under the associated
    tenant. Upon successful creation, it returns an API response containing the
    newly created business details.

    :param user:
    :param db: The database session dependency to interact with persistence layer.
    :type db: SessionDep
    :param payload: The business creation payload containing the necessary data
        for creating the business entity.
    :type payload: BusinessCreate
    :return: An API response indicating the result of the operation, including
        the details of the newly created business if successful.
    :rtype: ApiResponse[BusinessResponse]
    """
    data = BusinessCreate(name=payload.name,tenant_id=user.tenant_id, active=True, organization_id=user.tenant_id)
    db_obj = await business_crud.register_business(data, db=db)

    return ApiResponse(
        status=True,
        status_code=200,
        message="Success",
        data=db_obj,
    )
#
#
@router.patch('/update-business/{business_id}', response_model=ApiResponse[BusinessResponse])
async def update_business(user: AuthUser, business_id:UUID, db: SessionDep, payload:BusinessUpdate):
    """
    Updates the details of an existing business entity identified by its unique
    business ID. This function interacts with the database session to locate the
    target business record and applies the provided update payload to modify its
    attributes. It allows for modification of relevant business details while
    maintaining database integrity.

    :param user:
    :param business_id: Unique identifier of the business to be updated.
    :param db: Database session dependency for database operations.
    :param payload: Data object containing updated attributes for the business.
    :return: The updated business object reflecting the changes applied.
    :rtype: Business
    """
    db_obj = await business_crud.get_business_by_id(db, business_id)

    if db_obj.tenant_id != user.tenant_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    new = await business_crud.update_business(business_id, db=db, db_obj=payload)
    return ApiResponse(
        status_code=200,
        message="Success",
        data=new,
        status=True,
    )
#
#
@router.delete('/delete/{business_id}', status_code=200, response_model=ApiResponse)
async def delete_client(user: AuthUser, db: SessionDep, business_id: UUID):
    """
    Deletes a client business entity by its unique identifier. This endpoint removes
    the business entity from the database and returns a successful response if the
    operation completes successfully.

    :param user:
    :param db: Database session dependency used to interact with the database.
    :type db: SessionDep
    :param business_id: Unique identifier of the business entity to be deleted.
    :type business_id: UUID
    :return: Response model indicating the success or failure of the delete operation.
    :rtype: ApiResponse
    """
    biz = await business_crud.get_business_by_id(db, business_id)
    if biz.tenant_id != user.tenant_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    await business_crud.remove(db=db, id=business_id)
    await db.commit()
    return ApiResponse(
        status=True,
        status_code=200,
        message="Success",
    )



@router.post("/restock")
async def restock_product(
    payload: ProductRestockRequest,
    db: SessionDep,
    current_staff: AuthUser # Injected authenticated user metadata
):
    """
    Increments product inventory based on an incoming supply.
    Maintains an atomic history snapshot balance.
    """
    return await store_crud.add_new_stock(db=db, payload=payload, current_user=current_staff)

@router.post("/stock-audit", status_code=200)
async def audit_product_stock(
    payload: ProductAuditRequest,
    db: SessionDep,
    user: AuthUser
):
    """
    Reconciles physical counter reality audits with system database balances.
    Calculates the inventory variance delta and tracks loss anomalies.
    """
    return await store_crud.add_new_stock(db=db, payload=payload, current_user=user)


@router.post("/new-sale", status_code=200, response_model=SaleResponse)
async def create_pending_sale(payload: InitializeCheckoutRequest, db: SessionDep, user: AuthUser):
    payload_data = InitializeCheckout(**payload.model_dump(), cashier_id=user.id)
    record_sale = await store_crud.initialize_checkout(db=db, payload=payload_data)
    await db.commit()
    return record_sale

@router.get('/get-sales/{business_id}', response_model=List[SaleResponse])
async def get_pending_sales(db: SessionDep, user: AuthUser, business_id: UUID, sale_id: UUID = None, limit: int = 20, offset: int = None):
    # fetch sales for a business
    stmt = select(Sale).where(Sale.business_id == business_id)
    if sale_id:
        stmt = stmt.where(Sale.id == sale_id)
    
    if limit:
        stmt = stmt.limit(limit)
    if offset:
        stmt = stmt.offset(offset)
    
    sales = (await db.exec(stmt)).all()
    # if not sales:
    #     raise HTTPException(status_code=404, detail="Sales not found")
    return sales

# @router.post("/checkout")
# async def checkout_sale(db: SessionDep, payload: FinalizeCheckoutIn, user: AuthUser):
#     return await store_crud.finalize_checkout(db=db, payload=payload, sale_id=payload.sale_id)

@router.post("/checkout")
async def checkout_sale(
    db: SessionDep,
    payload: FinalizeCheckoutIn,
    user: AuthUser,
    background_tasks: BackgroundTasks
):
    """
    Finalizes the sale (payment + stock deduction) and returns immediately.
    Document (Receipt/Invoice) generation runs in the background.
    """
    # 1. Finalize the sale (critical path - fast response)
    sale = await store_crud.finalize_checkout(
        db=db, 
        sale_id=payload.sale_id, 
        payload=payload
    )

    # 2. Fire background task for document creation (non-blocking)
    logger.info("firing background task to create receipt/invoice")
    background_tasks.add_task(
        store_crud.create_financial_document,
        db,           # Note: Background tasks get their own session in real implementation
        sale.id
    )

    # 3. Return fast response to frontend
    return sale


@router.post("/assign-staff", response_model=StaffResponse)
async def register_and_assign_staff(db: SessionDep, user: AuthUser, payload: StaffCreateIn):
    logger.info(f"endpoint hit with payload: {payload}")
    staff = await store_crud.register_staff(db, payload)
    if staff:
        logger.info(f"created staff with id: {staff.id}")
    logger.info(f"Created Staff with id: {staff.id}")
    return staff

@router.get("/get-staff", response_model=StaffResponse)
async def fetch_staff_with_id(db: SessionDep, staff_id: UUID):
    staff, ass = await store_crud.fetch_staff_with_id(db, staff_id)
    if ass.business_id is not None:
        db_obj = StaffResponse(**staff.model_dump(), business_id=ass.business_id)
    
    db_obj = StaffResponse(**staff.model_dump())
    return db_obj

@router.get("/receipts/{sale_id}", status_code=200)
async def fetch_receipts(db: SessionDep, user: AuthUser, sale_id: UUID):
    """
    Fetches a list of receipts for a given business, with optional pagination.
    """
    receipt = await store_crud.get_financial_document_json(db=db, sale_id=sale_id)
    return receipt