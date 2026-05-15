from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from starlette import status

from app.api.deps import SessionDep
from app.crud.product import product_crud
from app.schemas.schemas import ProductResponse, ProductCreate, ApiResponse, \
    ProductUpdate, ProductBase
from app.utils.logging import logger

router = APIRouter()


@router.get("/multi/{business_id}", operation_id="getBusinessProducts")
async def get_products(db: SessionDep, business_id:UUID):
    """
    GET /products

    PURPOSE:
    --------
    Fetch a lightweight list of products optimized for speed and high-frequency usage
    (e.g., POS screens, product pickers, search results).

    DESIGN PRINCIPLE:
    -----------------
    This endpoint MUST remain fast and minimal.
    It should avoid heavy joins, nested objects, or computed logic.

    QUERY PARAMETERS (optional):
    ----------------------------
    - search: str
        Filter products by name (partial match).

    - category_type: str
        Filter products by category type (e.g., "drug", "food").

    - limit: int
        Limit number of results (pagination).

    - offset: int
        Pagination offset.

    RESPONSE SHAPE:
    ----------------
    [
        {
            "id": int,
            "name": str,
            "price": float,
            "stock": int,
            "category_type": str
        }
    ]

    NOTES:
    ------
    - MUST NOT include attributes
    - MUST NOT include behavior or alerts
    - MUST be index-friendly and scalable
    """
    if not business_id:
        raise HTTPException(status_code=400, detail="Business ID is required")
    db_objs = await product_crud.fetch_business_products(business_id, db)
    logger.info("Returned prods: {db_objs}")
    return db_objs



@router.get("/{product_id}", response_model=ApiResponse[ProductResponse], operation_id="getProductDetail")
async def get_product_detail(product_id: UUID, db: SessionDep):
    """
    GET /products/{product_id}

    PURPOSE:
    --------
    Fetch detailed product information for viewing or editing.

    DESIGN PRINCIPLE:
    -----------------
    Provide structured data without exposing system logic.

    RESPONSE SHAPE:
    ----------------
    {
        "id": int,
        "name": str,
        "price": float,
        "stock": int,

        "category": {
            "id": int,
            "name": str,
            "type": str
        },

        "attributes": {
            "key": value
        }
    }

    NOTES:
    ------
    - Includes attributes ✔
    - Includes category ✔
    - MUST NOT include behavior config
    - MUST NOT include alerts
    """
    db_obj = await product_crud.get(db, product_id)
    if not product_id:
        raise HTTPException(status_code=400, detail="Product ID is required")
    if not db_obj:
        raise HTTPException(status_code=404, detail="Product not found")
    return ApiResponse(status=True, status_code=200, message="Success", data=db_obj)

@router.post("/register", response_model=ApiResponse[ProductResponse], operation_id="createProduct")
async def create_product(db: SessionDep, payload: ProductCreate,):
    """
    POST /products

    PURPOSE:
    --------
    Create a new product with core fields and dynamic attributes.

    DESIGN PRINCIPLE:
    -----------------
    This endpoint handles DATA ONLY.
    No behavior logic, no alert computation.

    REQUEST BODY:
    --------------
    {
        "name": str,
        "price": float,
        "stock": int,
        "category_id": int,
        "attributes": {
            "key": value
        }
    }

    RESPONSE SHAPE:
    ----------------
    {
        "id": int,
        "name": str,
        "price": float,
        "stock": int,
        "category_id": int,
        "attributes": { ... }
    }

    VALIDATION REQUIREMENTS:
    ------------------------
    - Category MUST exist
    - Attributes MUST match allowed fields for category
    - Required attributes MUST be present

    NOTES:
    ------
    - No behavior logic should run here
    - No alerts should be computed here
    """
    try:
        data = ProductBase(**payload.model_dump())
        logger.info(data)
        # db_obj = await product_crud.create(db_obj=data,)
        db_obj = await product_crud.create(db, obj_in=data.model_dump())
        await db.commit()
        return ApiResponse(
            status=True,
            status_code=status.HTTP_201_CREATED,
            message="Product created successfully",
            data=db_obj
        )
    except ValidationError as err:
        logger.error(err)
        raise HTTPException(status.HTTP_400_BAD_REQUEST,"Invalid data")

@router.patch("/{product_id}", response_model=ApiResponse[ProductResponse], operation_id="updateProduct")
async def update_product(product_id: UUID, db: SessionDep, payload: ProductUpdate):
    """
    PATCH /products/{product_id}

    PURPOSE:
    --------
    Update product core fields and/or attributes.

    DESIGN PRINCIPLE:
    -----------------
    Allow partial updates while maintaining strict validation.

    REQUEST BODY (partial):
    -----------------------
    {
        "name": str (optional),
        "price": float (optional),
        "stock": int (optional),
        "attributes": { ... } (optional)
    }

    RESPONSE SHAPE:
    ----------------
    {
        "id": int,
        "name": str,
        "price": float,
        "stock": int,
        "attributes": { ... }
    }

    VALIDATION REQUIREMENTS:
    ------------------------
    - Updated attributes must match category schema
    - Required attributes must not be removed
    - Data types must remain valid

    NOTES:
    ------
    - Partial updates allowed
    - No behavior logic executed
    """
    prod = await product_crud.get(db, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    new_obj = await  product_crud.update_product(product_id=prod.id, payload=payload, db=db)
    return ApiResponse(status_code=status.HTTP_200_OK, data=new_obj, status=True, message="Product updated successfully")


@router.delete("/{product_id}", status_code=204, operation_id="deleteProduct")
async def delete_product(product_id: UUID, db: SessionDep):
    """
    DELETE /products/{product_id}

    PURPOSE:
    --------
    Remove a product from the system.

    DESIGN PRINCIPLE:
    -----------------
    Keep deletion simple, but safe.

    RESPONSE SHAPE:
    ----------------
    {
        "success": true
    }

    NOTES:
    ------
    - Consider soft delete in production systems
    - Must handle related records safely (e.g., transactions)
    """
    prod =  await product_crud.delete_product(product_id, db)
    if not prod:
        raise HTTPException(status_code=500, detail="an error occurred, please try again later")
    return ApiResponse(status_code=status.HTTP_204_NO_CONTENT, status=True, message="Product deleted successfully")


