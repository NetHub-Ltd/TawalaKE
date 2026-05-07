from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from app.api.deps import get_session, SessionDep
from app.crud.product import product_crud
from app.schemas.schemas import CategoryCreate, CategoryResponse, ProductResponse, ProductCreate, ApiResponse, \
    ProductUpdate
from app.utils.logging import logger

# from app.core.database import get_session

router = APIRouter()


@router.get("/multi/{business_id}", response_model=ApiResponse[List[ProductResponse]])
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
    if not db_objs:
        raise HTTPException(status_code=404, detail="No products found")
    return ApiResponse(status=True, status_code=200, message="Success", data=db_objs)



@router.get("/{product_id}/attributes")
async def get_product_attributes(product_id: int, session: AsyncSession = Depends(get_session)):
    """
    GET /products/{product_id}/attributes

    PURPOSE:
    --------
    Fetch only the dynamic attributes of a product.

    DESIGN PRINCIPLE:
    -----------------
    Isolate editable data for forms and UI components.

    RESPONSE SHAPE:
    ----------------
    {
        "key": value
    }

    USE CASES:
    ----------
    - Edit product form
    - Dynamic UI rendering

    NOTES:
    ------
    - No category data
    - No behavior logic
    """
    pass


@router.get("/{product_id}/alerts")
async def get_product_alerts(product_id: int, session: AsyncSession = Depends(get_session)):
    """
    GET /products/{product_id}/alerts

    PURPOSE:
    --------
    Fetch computed alert state for a product.

    DESIGN PRINCIPLE:
    -----------------
    Return ONLY actionable runtime information.

    RESPONSE SHAPE:
    ----------------
    {
        "low_stock": bool,
        "expiry": bool
    }

    NOTES:
    ------
    - This is COMPUTED data (not stored)
    - Should be lightweight and fast
    - Can be polled frequently
    - MUST NOT expose behavior configuration
    """
    pass


@router.get("/{product_id}/behavior")
async def get_product_behavior(product_id: int, session: AsyncSession = Depends(get_session)):
    """
    GET /products/{product_id}/behavior

    PURPOSE:
    --------
    Fetch resolved behavior configuration for a product.

    DESIGN PRINCIPLE:
    -----------------
    This endpoint is for ADMIN / DEBUG use only.

    RESPONSE SHAPE:
    ----------------
    {
        "stock_alert": {
            "enabled": bool,
            "threshold": int
        },
        "expiry_alert": {
            "enabled": bool,
            "trigger_before_days": int
        }
    }

    NOTES:
    ------
    - Combines category behavior + product overrides
    - MUST NOT include computed fields (no is_triggered)
    - Not required for POS flows
    """
    pass


@router.get("/schema/{category_id}")
async def get_product_schema(category_id: int, session: AsyncSession = Depends(get_session)):
    """
    GET /products/schema/{category_id}

    PURPOSE:
    --------
    Fetch attribute schema for a category to dynamically build forms.

    DESIGN PRINCIPLE:
    -----------------
    Backend defines structure → frontend renders UI.

    RESPONSE SHAPE:
    ----------------
    {
        "fields": [
            {
                "name": str,
                "type": str,
                "required": bool,
                "label": str
            }
        ]
    }

    USE CASES:
    ----------
    - Dynamic product creation forms
    - Category-based UI rendering
    - Validation alignment (frontend + backend)

    NOTES:
    ------
    - Driven by AttributeDefinition + CategoryAttribute
    - No product-specific data here
    """
    pass


@router.get("/{product_id}")
async def get_product_detail(product_id: int, session: AsyncSession = Depends(get_session)):
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
    pass


@router.get('/categories', response_model=list[CategoryResponse])
async def get_categories(db: SessionDep):
    return await product_crud.fetch_categories(db=db)

@router.post('/register-categories', status_code=200, response_model=CategoryResponse)
async def create_categories(db: SessionDep, obj_data: CategoryCreate):
    db_obj = await product_crud.create_category(db_obj=obj_data, db=db)
    return db_obj

@router.post("/register")
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
    logger.info(payload.model_dump())
    db_obj = await product_crud.create(db, obj_in=payload.model_dump())
    await db.commit()
    return db_obj



@router.patch("/{product_id}")
async def update_product(product_id: int, db: SessionDep, payload: ProductUpdate):
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
    prod = product_crud.get(db, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")




@router.delete("/{product_id}")
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


