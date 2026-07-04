import json
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, status, Request, Response, Depends
from pydantic import ValidationError

# Directly utilizing your provided dependency definitions
from app.api.deps import SessionDep, get_redis, AsyncRedis
from app.crud.product import product_crud
from app.schemas.schemas import ProductResponse, ProductCreate, ApiResponse, ProductUpdate
from app.utils.logging import logger
from app.core.redis_client import limiter

router = APIRouter()

# --- Redis Cache Durations ---
CACHE_TTL_SEC = 300  # 5 minutes cache visibility matrix


# --- High Performance Fail-Safe Redis Invalidation Helper ---
async def invalidate_product_caches(
    redis_client: AsyncRedis, 
    product_id: Optional[UUID] = None, 
    business_id: Optional[UUID] = None
):
    """
    Purges dirty cache entry keys across distributed worker nodes following mutations.
    Accepts the active injected AsyncRedis instance to decouple from the global manager.
    """
    try:
        keys_to_delete = []
        
        if product_id:
            keys_to_delete.append(f"cache:products:id:{product_id}")
        if business_id:
            # Drop multi-tenant lists and paginated result sets for this business
            scan_pattern = f"cache:products:business:{business_id}:*"
            async for key in redis_client.scan_iter(match=scan_pattern):
                keys_to_delete.append(key)
                
        if keys_to_delete:
            await redis_client.delete(*keys_to_delete)
            logger.info("Successfully dropped {} stale product cache records.", len(keys_to_delete))
    except Exception as cache_error:
        logger.error("Redis cache invalidation encountered failure: {}", str(cache_error))


# --- API Routes ---

@router.get("/multi/{business_id}", response_model=ApiResponse[List[ProductResponse]], operation_id="getBusinessProducts")
@limiter.limit("100/minute")  # Fine-tuned limit for high-frequency POS screens/pickers
async def get_products(
    request: Request,
    db: SessionDep, 
    business_id: UUID, 
    skip: int = 0, 
    limit: int = 50,
    redis_client: AsyncRedis = Depends(get_redis)  # Wired clean dependency layer
):
    """
    GET /products/multi/{business_id}

    PURPOSE:
    --------
    Fetch a paginated list of products scoped to a specific business identifier.
    """
    if not business_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Business ID is required")
    
    cache_key = f"cache:products:business:{business_id}:skip:{skip}:limit:{limit}"
    try:
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            logger.info(f"Cache hit: {cache_key}")
            return ApiResponse(status=True, status_code=200, message="Success (Cached)", data=json.loads(cached_data))
    except Exception as cache_err:
        logger.error("Cache read failed on multi-get: {}", str(cache_err))

    # Route execution through custom product_crud/base_crud layers
    db_objs = await product_crud.fetch_business_products(business_id=business_id, db=db, limit=limit, skip=skip)
    
    try:
        serialized_data = [obj.model_dump(mode='json') for obj in db_objs]
        logger.info(f"Setting cache: {cache_key}")
        await redis_client.setex(cache_key, CACHE_TTL_SEC, json.dumps(serialized_data))
    except Exception as cache_err:
        logger.error("Cache write failed on multi-get: {}", str(cache_err))

    return ApiResponse(status=True, status_code=200, message="Success", data=db_objs)


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
async def get_product_detail(
    request: Request, 
    product_id: UUID, 
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis)  # Wired clean dependency layer
):
    """
    GET /products/{product_id}

    PURPOSE:
    --------
    Fetch detailed single product info including standard structural attributes.
    """
    if not product_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product ID is required")
        
    cache_key = f"cache:products:id:{product_id}"
    try:
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            logger.info(f"Cache hit: {cache_key}")
            return ApiResponse(status=True, status_code=200, message="Success (Cached)", data=json.loads(cached_data))
    except Exception as cache_err:
        logger.error("Cache read failed on single get: {}", str(cache_err))

    db_obj = await product_crud.get(db, product_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    try:
        logger.info(f"Setting cache: {cache_key}")
        await redis_client.setex(cache_key, CACHE_TTL_SEC, json.dumps(db_obj.model_dump(mode='json')))
    except Exception as cache_err:
        logger.error("Cache write failed on single get: {}", str(cache_err))

    return ApiResponse(status=True, status_code=200, message="Success", data=db_obj)


@router.post("/register", response_model=ApiResponse[ProductResponse], operation_id="createProduct")
@limiter.limit("20/minute")  # Fine-tuned stricter limit for state-mutating ingestion blocks
async def create_product(
    request: Request, 
    db: SessionDep, 
    payload: ProductCreate,
    redis_client: AsyncRedis = Depends(get_redis)  # Injected dependency for invalidation pass-through
):
    """
    POST /products/register

    PURPOSE:
    --------
    Create a new product with core fields and dynamic JSONB attributes.
    """
    try:
        db_obj = await product_crud.create(db, obj_in=payload)
        await db.commit()
        
        # Pass client explicitly to flush stale queries for the business
        await invalidate_product_caches(redis_client, business_id=db_obj.business_id)
        
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
    redis_client: AsyncRedis = Depends(get_redis)  # Injected dependency for invalidation pass-through
):
    """
    PATCH /products/{product_id}

    PURPOSE:
    --------
    Update product core fields and/or complex nested attributes.
    """
    new_obj = await product_crud.update_product(product_id=product_id, payload=payload, db=db)
    
    # Invalidate both cache matrices cleanly using the injected thread-safe instance
    await invalidate_product_caches(redis_client, product_id=product_id, business_id=new_obj.business_id)
    
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
    redis_client: AsyncRedis = Depends(get_redis)  # Injected dependency for invalidation pass-through
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
        
    business_id = target_product.business_id
    await product_crud.delete_product(product_id, db)
    
    # Cascade invalidations through cache namespaces immediately via clean pass-through
    await invalidate_product_caches(redis_client, product_id=product_id, business_id=business_id)
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)