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

from app.schemas.enums import CategoryType, SaleStatus, PaymentMethod


class UserRead(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool
    tenant_id: UUID

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
    unit_of_measure: str
    category: str
    unit_price: float
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
class ProductCreate(BaseModel):
    business_id: UUID
    name: str
    price: float
    stock: float
    attributes: BaseAttributes = Field(default_factory=BaseAttributes)

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    attributes: Optional[Dict[str, Any]] = None


class ProductResponse(BaseResponseSchema):
    name: str
    price: float
    stock: int
    active: bool
    # business_id: UUID

    attributes: Dict[str, Any]

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
    active: bool = True


class BusinessUpdate(BaseModel):
    name: Optional[str] = None

class BusinessResponse(BusinessBase):
    id: UUID
    tenant_id: UUID
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

