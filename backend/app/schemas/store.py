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


from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models.models import DocumentType, PaymentMethod, SaleStatus

class CashierSnapshot(BaseModel):
    id: UUID
    name: str
    role: str

class SellerSnapshot(BaseModel):
    business_id: UUID
    business_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    tax_number: Optional[str] = None
    cashier: CashierSnapshot

class BuyerSnapshot(BaseModel):
    customer_id: Optional[UUID] = None
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class FinancialsSnapshot(BaseModel):
    currency: str = "KES"
    subtotal: float
    discount_amount: float
    tax_rate_applied: float
    tax_amount: float
    total_amount: float
    amount_paid: float
    balance_due: float

class ItemSnapshot(BaseModel):
    item_id: UUID
    product_id: UUID
    sku: str
    name: str
    quantity: float
    unit_price: float
    tax_rate: float
    tax_amount: float
    discount_amount: float = 0.0
    total_price: float
    cost_price_at_sale: Optional[float] = None

class PaymentSnapshot(BaseModel):
    payment_id: UUID
    method: PaymentMethod
    amount: float
    reference: Optional[str] = None
    processed_at: datetime

class DisputeAuditSnapshot(BaseModel):
    parent_sale_id: UUID
    status: SaleStatus
    original_document_hash: Optional[str] = None
    notes: Optional[str] = None

# This is the master validator schema for the JSONB snapshot
class FinancialDocumentSnapshotSchema(BaseModel):
    document_id: UUID
    document_number: str
    document_type: DocumentType
    issued_at: datetime
    
    seller: SellerSnapshot
    buyer: BuyerSnapshot
    financials: FinancialsSnapshot
    items: List[ItemSnapshot]
    payments: List[PaymentSnapshot]
    dispute_and_audit: DisputeAuditSnapshot