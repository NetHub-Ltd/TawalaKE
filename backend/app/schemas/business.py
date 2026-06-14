from typing import List
from pydantic import BaseModel, EmailStr
from uuid import UUID
from app.models.models import StockMovementType
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class StaffRequest(BaseModel):
    staff_id: UUID
    business_id: UUID

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


from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional

class RestockRequest(BaseModel):
    product_id: UUID
    quantity: float = Field(..., gt=0, description="The positive quantity of items arriving at the business.")
    cost_price: Optional[float] = Field(None, ge=0, description="Optional updated buying price for COGS calculations.")
    notes: Optional[str] = Field(None, max_length=500)

class StockAuditRequest(BaseModel):
    product_id: UUID
    actual_physical_stock: float = Field(..., ge=0, description="The actual count physically verified on the shop floor.")
    reason_code: str = Field(..., description="E.g., 'DAMAGED_IN_TRANSIT', 'THEFT', 'DATA_ENTRY_ERROR'")
    notes: Optional[str] = Field(None, max_length=500)


from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from typing import Optional
from enum import Enum

# Assuming you have an Enum matching your DB states
class StockMovementType(str, Enum):
    SALE = "SALE"
    RESTOCK = "RESTOCK"
    RECONCILIATION = "RECONCILIATION"

# ==========================================
# 1. RESTOCK PAYLOAD SCHEMA
# ==========================================
class ProductRestockRequest(BaseModel):
    product_id: UUID = Field(..., description="The target product inventory variant to update.")
    business_id: UUID = Field(..., description="The operating branch store receiving the batch items.")
    
    quantity: float = Field(..., gt=0, description="The positive unit count arriving from your supplier.")
    
    buying_price: Optional[float] = Field(None, gt=0, description="New cost price matching the current supplier invoice. Updates master catalog if provided.")
    selling_price: Optional[float] = Field(None, gt=0, description="Optional markup shelf adjustment for this incoming batch.")
    
    reference_id: Optional[UUID] = Field(None, description="Optional PurchaseOrderID string link tracing back to bookkeeping logs.")
    reference_type: Optional[str] = Field("PURCHASE_ORDER", description="Polymorphic source classification descriptor.")
    
    notes: Optional[str] = Field(None, max_length=500, description="Delivery anomalies, supplier details, or worker logs.")


# ==========================================
# 2. SALE PAYLOAD SCHEMA
# ==========================================
class ProductSaleRequest(BaseModel):
    product_id: UUID = Field(..., description="The item profile variant being subtracted from the inventory layout.")
    business_id: UUID = Field(..., description="The location branch executing the register transaction checkout.")
    
    quantity: float = Field(..., gt=0, description="The human-entered count sold (e.g., 2 items). The backend code safely forces this negative.")
    
    reference_id: Optional[UUID] = Field(None, description="The underlying core TransactionID or SaleInvoiceID reference point mapping node.")
    reference_type: Optional[str] = Field("INVOICE", description="Polymorphic tracking tag.")
    
    notes: Optional[str] = Field(None, max_length=250, description="Customer specificity notes or discount reason logs.")


# ==========================================
# 3. AUDIT PAYLOAD SCHEMA
# ==========================================
class ProductAuditRequest(BaseModel):
    product_id: UUID = Field(..., description="The item row profile undergoing physical count verification.")
    business_id: UUID = Field(..., description="The specific shop floor warehouse zone boundary undergoing tracking adjustments.")
    
    # 🔑 CRITICAL BUSINESS LOGIC: Audits take the ABSOLUTE physical counter reality count!
    # A manager types "10 units on shelf", they don't do delta calculations manually.
    quantity: float = Field(..., ge=0, description="The absolute physical stock number counted live on shelves.")
    
    reason_code: str = Field(..., min_length=3, max_length=100, description="Standardized shrinkage taxonomy: 'THEFT', 'DAMAGED_IN_TRANSIT', 'DATA_ENTRY_ERROR'.")
    notes: Optional[str] = Field(..., min_length=5, max_length=1000, description="Compulsory description detailing the verification workflow observations.")
    
    reference_type: Optional[str] = Field("MANUAL_AUDIT", description="Polymorphic classification discriminator.")

    @field_validator('reason_code')
    @classmethod
    def validate_reason_code_integrity(cls, value: str) -> str:
        """Forces normalization to ensure queries for accounting aren't fragmented by typos."""
        normalized = value.strip().upper().replace(" ", "_")
        if not normalized:
            raise ValueError("Reason code must contain alphanumeric structural classifications.")
        return normalized