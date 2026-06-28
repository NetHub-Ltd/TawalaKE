from pydantic import BaseModel, Field
from uuid import UUID
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
# from app.models.models import SaleStatus

# =========================================================
# SYSTEM ENUMS
# =========================================================

class PaymentMethod(str, Enum):
    CASH = "CASH"
    MPESA = "MPESA"
    INVOICE = "INVOICE"
    CARD = "CARD"


class SaleStatus(str, Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    COMPLETED = "COMPLETED"
    REFUNDED = "REFUNDED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"
    DISPUTED = "DISPUTED"


class EventType(str, Enum):
    INITIAL_SALE = "INITIAL_SALE"
    INVOICE_ISSUED = "INVOICE_ISSUED"
    PAYMENT_COLLECTED = "PAYMENT_COLLECTED"
    ITEM_RETURNED = "ITEM_RETURNED"
    DISPUTE_RAISED = "DISPUTE_RAISED"
    STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT"


class SubscriptionTier(str, Enum):
    BASIC = "BASIC"
    NDOVU = "NDOVU"
    ENTERPRISE = "ENTERPRISE"
    TRIAL = "TRIAL"


class StaffRole(str, Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    CASHIER = "CASHIER"
    ADMIN = "ADMIN"


class StockMovementType(str, Enum):
    PURCHASE = "PURCHASE"
    SALE = "SALE"
    RETURN = "RETURN"
    ADJUSTMENT = "ADJUSTMENT"
    STOCK_TAKE = "STOCK_TAKE"



class StockTakeStatus(str, Enum):
    DRAFT = "DRAFT"
    COMPLETED = "COMPLETED"
    APPROVED = "APPROVED"
    CANCELLED = "CANCELLED"


class DocumentType(str, Enum):
    INVOICE = "INVOICE"
    RECEIPT = "RECEIPT"
    CREDIT_NOTE = "CREDIT_NOTE"
# =========================================================
# REDUNDANT / DEPRECATED ITEMS (For backward compatibility)
# =========================================================
# These are kept for existing data but should be phased out gradually


# =========================================================
# PYDANTIC VALIDATION SCHEMAS
# =========================================================

class CartItemIn(BaseModel):
    product_id: UUID
    quantity: float = Field(gt=0, description="Quantity must be greater than zero")

class InitializeCheckoutRequest(BaseModel):
    business_id: UUID
    # cashier_id: Optional[UUID] = None
    items: List[CartItemIn]

class InitializeCheckout(BaseModel):
    business_id: UUID
    cashier_id: UUID
    items: List[CartItemIn]

class FinalizeCheckoutIn(BaseModel):
    sale_id: UUID
    payment_method: PaymentMethod
    payment_reference: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


class SaleResponse(BaseModel):
    id: UUID
    status: SaleStatus
    subtotal: float
    discount: float
    tax_rate: float
    tax_amount: float
    total_amount: float
    created_at: datetime