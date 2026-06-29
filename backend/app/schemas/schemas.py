import uuid

from pydantic import BaseModel, EmailStr

"""
POS SCHEMAS (CREATE / UPDATE / RESPONSE)

GOALS:
- Strict input validation
- Clean API contracts
- Prevent over-posting bugs
- Keep responses frontend-friendly
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any, Union, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.enums import CategoryType,PaymentMethod
from pydantic import BaseModel, EmailStr
from uuid import UUID
from app.models.models import StaffRole, SaleStatus, PaymentMethod
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.models.models import PaymentMethod
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class UserRead(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool
    organization_id: UUID

class BaseAttributes(BaseModel):
    """
    MASTER ATTRIBUTE REGISTRY

    PURPOSE:
    --------
    This defines ALL possible attributes the system can ever understand.

    RULE:
    -----
    - Everything is OPTIONAL
    - Nothing is enforced here
    - This is a reference contract only
    """
    unit_of_measure: Optional[str] = None
    buying_price: Optional[float] = None
    sku: Optional[str] = None




# =========================================================
# BASE SCHEMAS
# =========================================================
class BaseResponseSchema(BaseModel):
    id: UUID
    # created_at: datetime
    # updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# =========================================================
# CATEGORY SCHEMAS
# =========================================================
class CategoryCreate(BaseModel):
    name: str
    type: CategoryType


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[CategoryType] = None


class CategoryResponse(BaseResponseSchema):
    name: str
    type: CategoryType


# =========================================================
# PRODUCT SCHEMAS
# =========================================================
class ProductBase(BaseModel):
    business_id: UUID
    label: str
    selling_price: float
    track_stock: bool = True
    last_stock_take: Optional[datetime] = None
    stock: float
    category: Optional[str] = "General"
    attributes: BaseAttributes = Field(default_factory=BaseAttributes)

class ProductCreate(BaseModel):
    business_id: UUID
    label: str
    selling_price: float
    stock: float
    category: Optional[str] = "General"
    attributes: BaseAttributes = Field(default_factory=BaseAttributes)

class ProductUpdate(BaseModel):
    label: Optional[str] = None
    selling_price: Optional[float] = None
    stock: Optional[int] = None
    track_stock: Optional[bool] = None
    category: Optional[str] = None
    attributes: Optional[BaseAttributes] = None


class ProductResponse(BaseResponseSchema):
    label: str
    selling_price: float
    track_stock: bool
    stock: float
    active: bool
    category: str
    attributes: BaseAttributes

    # Optional lightweight embed (avoid deep nesting)
    # category: Optional["CategoryResponse"] = None


# =========================================================
# SALE ITEM SCHEMAS
# =========================================================
class SaleItemCreate(BaseModel):
    product_id: UUID
    quantity: int


class SaleItemResponse(BaseResponseSchema):
    product_id: UUID

    name_snapshot: str

    quantity: int
    unit_price: float
    subtotal: float


# =========================================================
# SALE SCHEMAS
# =========================================================
class SaleCreate(BaseModel):
    tenant_id: UUID
    items: List[SaleItemCreate]


class SaleUpdate(BaseModel):
    status: Optional[SaleStatus] = None


class SaleResponse(BaseResponseSchema):
    tenant_id: UUID

    status: SaleStatus
    total_amount: float
    created_at: datetime

    items: List[SaleItemResponse] = []
    payments: List["PaymentResponse"] = []


# =========================================================
# PAYMENT SCHEMAS
# =========================================================
class PaymentCreate(BaseModel):
    tenant_id: UUID
    sale_id: UUID

    amount: float
    method: PaymentMethod

    reference: Optional[str] = None


class PaymentUpdate(BaseModel):
    reference: Optional[str] = None


class PaymentResponse(BaseResponseSchema):
    tenant_id: UUID
    sale_id: UUID

    amount: float
    method: PaymentMethod
    reference: Optional[str]



class TenantBase(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    address: str


class TenantCreate(TenantBase):
    pass

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

class TenantResponse(TenantBase):
    id: UUID
    active: bool
    created_at: datetime


class BusinessBase(BaseModel):
    name: str

class BusinessCreate(BusinessBase):
    name: str
    tenant_id: UUID
    organization_id: Optional[UUID] = None
    active: bool = True


class BusinessUpdate(BaseModel):
    name: Optional[str] = None

class BusinessResponse(BusinessBase):
    id: UUID
    tenant_id: UUID
    organization_id: Optional[UUID] = None
    active: bool
    created_at: datetime


T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    status: bool
    status_code: int
    message: str
    data: Optional[T] = None

# =========================================================
# FORWARD REF FIXES
# =========================================================
ProductResponse.model_rebuild()
SaleResponse.model_rebuild()

# ------------------------ SALES --------------------


class MetaIn(BaseModel):
    business_id: UUID
    cashier_id: UUID  # Changed from string to UUID to match the explicit Staff ID link
    currency: str
    payment_method: PaymentMethod
    timestamp: datetime

class FinancialsIn(BaseModel):
    subtotal: float
    tax_rate: float
    tax_amount: float
    discount_applied: float
    grand_total: float

class LineItemIn(BaseModel):
    product_id: UUID
    sku: str
    name: str
    unit_price: float
    quantity: int
    subtotal: float

class CheckoutPayloadIn(BaseModel):
    meta: MetaIn
    financials: FinancialsIn
    line_items: List[LineItemIn]


class StaffCreateIn(BaseModel):
    tenant_id: UUID
    email: EmailStr
    full_name: str
    business_id: UUID
    password: Optional[str] = None  # Plaintext password from front-end to be hashed on server
    role: StaffRole = StaffRole.CASHIER


class StaffResponse(BaseModel):
    id: UUID
    # tenant_id: UUID
    organization_id: Optional[UUID] = None
    business_id: Optional[UUID] = None
    email: EmailStr
    full_name: str
    role: StaffRole
    active: bool


class DateRangeQuery(BaseModel):
    start_date: datetime
    end_date: datetime

class RefundRequestIn(BaseModel):
    sale_id: UUID
    product_id: UUID
    quantity_to_refund: int
    notes: Optional[str] = "Customer return processed via POS terminal supervisor."


# sales
class SaleCreate(BaseModel):
    business_id: UUID
    cashier_id: UUID
    currency: str = "KES"
    status: SaleStatus = SaleStatus.PENDING_PAYMENT
    subtotal: float
    tax_rate: float
    tax_amount: float
    discount_applied: float
    total_amount: float 

class SaleItem(BaseModel):
    product_id: UUID
    sku: str
    name: str
    unit_price: float
    quantity: int
    subtotal: float

class SalePayload(SaleCreate):
    sale_items: List[SaleItem]

class SaleResponse(BaseModel):
    id: UUID
    business_id: UUID
    cashier_id: UUID
    currency: str
    status: SaleStatus
    subtotal: float

class SaleUpdate(BaseModel):
    status: Optional[SaleStatus] = None



