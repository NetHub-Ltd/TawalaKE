import json
from typing import List, Optional, Dict, Any, TypeVar, Generic
from uuid import UUID
from pydantic import BaseModel
import math

from fastapi import APIRouter, HTTPException, status, Request, Response, Depends, Query
from pydantic import ValidationError
from fastapi_cache.decorator import cache

# Directly utilizing your provided dependency definitions
from app.api.deps import SessionDep, get_redis, AsyncRedis, universal_key_builder, purge_cache_namespace, AuthUser
from app.models.models import Staff
from app.api.rbac_deps import require_permissions, assert_business_access
from app.core.rbac import Permission
from app.crud.product import product_crud
from app.schemas.schemas import ProductResponse, ProductCreate, ApiResponse, ProductUpdate
from app.utils.logging import logger
from app.core.redis_client import limiter
from app.services.paywall import paywall as paywall_service, LIMIT_PRODUCTS
from app.api.deps import get_redis


router = APIRouter()

# --- Redis Cache Durations ---
CACHE_TTL_SEC = 300  # 5 minutes cache visibility matrix


# --- Pagination Schema Core ---
T = TypeVar('T')

class PaginatedMetadata(BaseModel):
    total: int
    page: int
    size: int
    pages: int

class PaginatedResponse(BaseModel, Generic[T]):
    status: bool = True
    status_code: int = 200
    message: str = "Success"
    data: List[T]
    pagination: PaginatedMetadata

# --- Router Implementation ---
@router.get(
    "/multi/{business_id}", 
    response_model=PaginatedResponse[ProductResponse], 
    operation_id="getBusinessProducts"
)
@limiter.limit("100/minute")
@cache(expire=CACHE_TTL_SEC, namespace="products", key_builder=universal_key_builder)
async def get_products(
    request: Request,
    business_id: UUID,
    db: SessionDep,
    _user: Staff = Depends(require_permissions(Permission.CATALOG_READ)),
    active: Optional[bool] = True,
    page: int = Query(default=1, ge=1, description="Current page number"),
    size: int = Query(default=50, ge=1, le=100, alias="limit", description="Number of rows per page"),
    sort_by: Optional[str] = Query(default=None, description="Model column attribute name to sort by"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$", description="Sort direction order"),
    redis_client: AsyncRedis = Depends(get_redis)
):
    """
    GET /products/multi/{business_id}

    PURPOSE:
    --------
    Fetch a true paginated payload structural framework of products scoped to a specific business identifier
    coupled with execution metadata allowing absolute page length control configurations on the client.
    """
    if not business_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Business ID is required"
        )

    await assert_business_access(db, _user, business_id, redis_client)
    
    # Calculate offset engine parameters from 1-indexed page systems
    skip = (page - 1) * size

    # Fire modern multi-tuple indexing batch engine
    items, total = await product_crud.fetch_poducts(
        db=db,
        limit=size,
        skip=skip,
        sort_by=sort_by,
        sort_order=sort_order,
        business_id=str(business_id)
    )

    # Compute absolute pagination landscape geometry
    pages = math.ceil(total / size) if total > 0 else 1

    return PaginatedResponse(
        status=True,
        status_code=200,
        message="Success",
        data=items,
        pagination=PaginatedMetadata(
            total=total,
            page=page,
            size=size,
            pages=pages
        )
    )

@router.get("/search", response_model=ApiResponse[Dict[str, Any]], operation_id="searchProducts")
@limiter.limit("60/minute")  # Fine-tuned lookup limit to shield database search resources
async def search_products(
    request: Request,
    db: SessionDep,
    search_query: str,
    business_id: Optional[UUID] = None,
    tenant_id: Optional[UUID] = None,
    category: Optional[str] = None,
    active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
):
    """
    GET /products/search

    PURPOSE:
    --------
    Execute real-time database-level ILIKE lookups across text boundaries
    while enforcing multi-tenant isolation contexts.
    """
    if not search_query or not search_query.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Search query parameter cannot be empty")

    records, total_count = await product_crud.search_products(
        db=db,
        search_query=search_query.strip(),
        business_id=business_id,
        tenant_id=tenant_id,
        category=category,
        active=active,
        skip=skip,
        limit=limit
    )
    
    payload = {
        "records": records,
        "total": total_count
    }
    return ApiResponse(status=True, status_code=200, message="Success", data=payload)


@router.get("/{product_id}", response_model=ApiResponse[ProductResponse], operation_id="getProductDetail")
@limiter.limit("150/minute")  # Fine-tuned higher allowance for asset detail retrievals
@cache(expire=CACHE_TTL_SEC, namespace="products", key_builder=universal_key_builder)  # 👈 Wired generic key patterns
async def get_product_detail(
    request: Request, 
    product_id: UUID, 
    db: SessionDep,
    business_id: Optional[UUID] = None,
):
    """
    GET /products/{product_id}

    PURPOSE:
    --------
    Fetch detailed single product info including standard structural attributes.
    """
    if not product_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product ID is required")
        
    db_obj = await product_crud.get(db, product_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    return ApiResponse(status=True, status_code=200, message="Success", data=db_obj)


@router.post("/new", response_model=ApiResponse[ProductResponse], operation_id="createProduct")
@limiter.limit("20/minute")  # Fine-tuned stricter limit for state-mutating ingestion blocks
async def create_product(
    request: Request, 
    db: SessionDep, 
    payload: ProductCreate,
    redis_client: AsyncRedis = Depends(get_redis),
    _user: Staff = Depends(require_permissions(Permission.CATALOG_WRITE)),
):
    """
    POST /products/new

    PURPOSE:
    --------
    Create a new product with core fields and dynamic JSONB attributes.
    Enforces plan max_products paywall before write.
    """
    org_id = getattr(_user, "organization_id", None) or getattr(_user, "tenant_id", None)
    if org_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ORG_REQUIRED", "message": "Staff must belong to an organization"},
        )

    # Tenant + business binding: never trust client org; verify business belongs to caller org
    from sqlmodel import select
    from app.models.models import Business
    from app.api.rbac_deps import load_assigned_business_ids
    from app.core.rbac import is_org_wide_role

    biz = (
        await db.exec(select(Business).where(Business.id == payload.business_id))
    ).first()
    if not biz or biz.organization_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "RBAC_DENIED", "message": "Business not in your organization"},
        )
    if not is_org_wide_role(_user):
        assigned = await load_assigned_business_ids(db, _user, redis_client)
        if payload.business_id not in assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "RBAC_DENIED", "message": "No access to this business"},
            )

    await paywall_service.enforce_create_product(db, org_id, redis=redis_client)

    try:
        create_data = payload.model_dump(exclude_unset=True)
        create_data["organization_id"] = org_id
        create_data["business_id"] = payload.business_id
        db_obj = await product_crud.create(db, obj_in=create_data)
        await paywall_service.bump_usage(db, org_id, LIMIT_PRODUCTS, redis=redis_client)
        await db.commit()
        logger.info(f"Product created: {db_obj}")
        
        # Micro-targeted namespace eviction via your generic shared utility
        await purge_cache_namespace(redis_client, namespace="products", business_id=db_obj.business_id)
        
        return ApiResponse(
            status=True,
            status_code=status.HTTP_201_CREATED,
            message="Product created successfully",
            data=db_obj
        )
    except ValidationError as err:
        logger.error("Validation breakdown on creation sequence: {}", str(err))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request parameters")


@router.patch("/{product_id}", response_model=ApiResponse[ProductResponse], operation_id="updateProduct")
@limiter.limit("30/minute")  # Fine-tuned state modification throttle limit
async def update_product(
    request: Request, 
    product_id: UUID, 
    db: SessionDep, 
    payload: ProductUpdate,
    redis_client: AsyncRedis = Depends(get_redis),  # invalidation
    _user: Staff = Depends(require_permissions(Permission.CATALOG_WRITE)),
):
    """
    PATCH /products/{product_id}

    PURPOSE:
    --------
    Update product core fields and/or complex nested attributes.
    """
    existing = await product_crud.get(db, product_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await assert_business_access(db, _user, existing.business_id, redis_client)
    caller_org = _user.organization_id or getattr(_user, "tenant_id", None)
    if caller_org and existing.organization_id and str(existing.organization_id) != str(caller_org):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "RBAC_DENIED", "message": "Product not in your organization"},
        )

    new_obj = await product_crud.update_product(product_id=product_id, payload=payload, db=db)
    
    # Drops targeted arrays matching both specific IDs and parent business matrices cleanly
    await purge_cache_namespace(redis_client, namespace="products", product_id=product_id)
    await purge_cache_namespace(redis_client, namespace="products", business_id=new_obj.business_id)
    
    return ApiResponse(
        status=True, 
        status_code=status.HTTP_200_OK, 
        message="Product updated successfully",
        data=new_obj
    )


@router.delete("/{product_id}", operation_id="deleteProduct")
@limiter.limit("15/minute")  # Strict destructive mutation execution limit
async def delete_product(
    request: Request, 
    product_id: UUID, 
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),  # invalidation
    _user: Staff = Depends(require_permissions(Permission.CATALOG_WRITE)),
):
    """
    DELETE /products/{product_id}

    PURPOSE:
    --------
    Safely purges a physical product while avoiding orphan record integrity states.
    """
    target_product = await product_crud.get(db, product_id)
    if not target_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    await assert_business_access(db, _user, target_product.business_id, redis_client)
    caller_org = _user.organization_id or getattr(_user, "tenant_id", None)
    if caller_org and target_product.organization_id and str(target_product.organization_id) != str(caller_org):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "RBAC_DENIED", "message": "Product not in your organization"},
        )
        
    business_id = target_product.business_id
    await product_crud.delete_product(product_id, db)
    
    # Cascade invalidations completely through isolated namespaces immediately
    await purge_cache_namespace(redis_client, namespace="products", product_id=product_id)
    await purge_cache_namespace(redis_client, namespace="products", business_id=business_id)
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)