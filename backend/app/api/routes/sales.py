from json import JSONDecodeError

from fastapi import APIRouter, Request, HTTPException

from app.utils.logging import logger
from app.schemas.schemas import CheckoutPayloadIn

router = APIRouter()

@router.post("/new-sale")
async def create_sale(request: Request, db_obj: CheckoutPayloadIn):
    """
    POST /sales

    PURPOSE:
    --------
    Create a new sales transaction from a cart of products.

    CORE RESPONSIBILITY:
    --------------------
    - Convert cart items into a finalized sale
    - Ensure stock validation is enforced
    - Calculate totals server-side
    - Persist immutable transaction record

    REQUEST BODY:
    --------------
    {
        "customer_id": int | null,
        "items": [
            {
                "product_id": int,
                "quantity": int,
                "unit_price": float
            }
        ],
        "payment_method": str
    }

    RESPONSE:
    ---------
    {
        "id": int,
        "total_amount": float,
        "payment_method": str,
        "status": "completed",
        "created_at": datetime,

        "items": [
            {
                "product_id": int,
                "quantity": int,
                "unit_price": float,
                "subtotal": float
            }
        ]
    }

    RULES:
    ------
    - MUST validate product existence
    - MUST validate stock availability
    - MUST compute totals server-side
    - MUST reduce inventory atomically
    - MUST NOT trust client pricing
    """
    try:
        
        logger.info(f"Received Payload: {db_obj}")
    
    except JSONDecodeError as e:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    pass
