from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep, AuthUser
from app.crud.business import business_crud
from app.schemas.schemas import BusinessCreate, BusinessResponse, ApiResponse, \
    BusinessUpdate, BusinessBase
from app.schemas.business import RestockRequest, ProductAuditRequest, StaffRequest, ProductRestockRequest
from app.utils.logging import logger
from app.crud.store import store_crud

router = APIRouter()

# =======================================================================
# Business Logic
# =======================================================================
@router.get("/multi", response_model=ApiResponse[List[BusinessResponse]])
async def get_businesses(user: AuthUser, db: SessionDep):
    """
    Retrieve the list of businesses associated with a specified tenant.

    This function handles the HTTP GET request to fetch businesses linked to the given
    tenant ID. The response is structured as an ApiResponse containing a list of business
    data models. It ensures the operation's success and provides a status message along
    with the relevant data.

    :param user:
    :param db: Database session dependency used for querying tenant businesses.
    :type db: SessionDep
    :return: ApiResponse containing a list of businesses associated with the given tenant ID.
    :rtype: ApiResponse[List[BusinessResponse]]
    """
    businesses = await business_crud.get_tenant_businesses(db, user.tenant_id)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Success",
        data=businesses
    )

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


@router.post('/assign-staff')
async def assign_staff_to_business(db: SessionDep, request: StaffRequest):
    """
    Assigns a staff member to a business entity based on the provided request data.
    This function processes the staff assignment by validating the existence of the
    target business and ensuring that the staff member is associated with the same
    tenant. It then creates an assignment record linking the staff member to the
    specified business.

    :param user:
    :param db: Database session dependency for database operations.
    :param request: Data object containing staff and business identifiers for assignment.
    :return: An API response indicating the success or failure of the staff assignment operation.
    :rtype: ApiResponse
    """
    assignment = await business_crud.assign_staff_to_business(db, request)
    if not assignment:
        raise HTTPException(status_code=400, detail="Failed to assign staff to business")
    return assignment


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
    return await store_crud.audit_stock(db=db, payload=payload, current_user=user)