from typing import List
from pydantic import BaseModel, EmailStr
from uuid import UUID
from app.models.models import StockMovementType

class StaffRequest(BaseModel):
    staff_id: UUID
    business_id: UUID


from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class StockTakeItemBase(BaseModel):
    product_id: UUID
    counted_stock: float
    notes: str = ""


# For new stock intake (with pricing)
class StockIntakeItem(StockTakeItemBase):
    purchase_cost_price: float                  # Required for new stock
    selling_price: Optional[float] = None       # Optional - falls back to product's current price
    supplier_name: Optional[str] = None
    batch_reference: Optional[str] = None
    expiry_date: Optional[datetime] = None


# Union type for flexibility
class StockTakeItemCreate(BaseModel):
    product_id: UUID
    counted_stock: float
    notes: str = ""

    # New stock intake fields (optional)
    is_new_stock: bool = False
    purchase_cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    supplier_name: Optional[str] = None
    batch_reference: Optional[str] = None
    expiry_date: Optional[datetime] = None


class StockTakeCreate(BaseModel):
    business_id: UUID
    items: List[StockTakeItemCreate]
    notes: str = ""
    # Optional metadata
    reference_number: Optional[str] = None   # Delivery note, invoice number, etc.


class StockTakeRequest(BaseModel):
    product_id: UUID
    business_id: UUID
    performed_by: UUID
    movement_type: StockMovementType
    
    quantity: float
    previous_stock: float
    new_stock: float
    buying_price: Optional[float] = None
    selling_price: Optional[float] = None
