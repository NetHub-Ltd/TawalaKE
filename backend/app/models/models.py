from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy import Column, Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel, DateTime

from app.models.base import BaseMixin
from app.utils.helpers import utc_now


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
    KITCHEN_STAFF = "KITCHEN"


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


# =========================================================
# REDUNDANT / DEPRECATED ITEMS (For backward compatibility)
# =========================================================
# These are kept for existing data but should be phased out gradually


# =========================================================
# 1. ORGANIZATION & TENANCY
# =========================================================

class Tenant(BaseMixin, table=True):
    """Legacy tenant table - kept for backward compatibility"""
    __tablename__ = "tenants"
    name: str
    email: str = Field(index=True, unique=True)
    active: bool = Field(index=True, default=True)
    plan: SubscriptionTier = Field(
        sa_column=Column(SAEnum(SubscriptionTier, name="tenant_tier_enum")),
        default=SubscriptionTier.TRIAL
    )


class Organization(BaseMixin, table=True):
    """Main organization entity - represents a company/account"""
    __tablename__ = "organizations"
    name: str
    email: str = Field(index=True, unique=True)
    phone: Optional[str] = Field(default=None)
    address: Optional[str] = Field(default=None)
    tax_number: Optional[str] = Field(default=None)      # KRA PIN
    logo_url: Optional[str] = Field(default=None)
    active: bool = Field(index=True, default=True)


# =========================================================
# 2. SUBSCRIPTION & BILLING
# =========================================================

class Subscription(BaseMixin, table=True):
    """Subscription plan for an organization/tenant"""
    __tablename__ = "subscriptions"

    tenant_id: UUID = Field(foreign_key="tenants.id", index=True, ondelete="CASCADE")
    organization_id: Optional[UUID] = Field(default=None, index=True)

    tier: SubscriptionTier = Field(
        sa_column=Column(SAEnum(SubscriptionTier, name="subscription_tier_enum")),
        default=SubscriptionTier.TRIAL
    )
    active: bool = Field(index=True, default=True)
    # start_date: datetime = Field(default_factory=utc_now)
    # end_date: Optional[datetime] = Field(default=None, index=True)
    start_date: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True))
    )
    
    end_date: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    max_businesses: int = Field(default=1)


# =========================================================
# 3. STAFF & ACCESS CONTROL
# =========================================================

class StaffBusinessAssignment(BaseMixin, table=True):
    """Junction table linking staff to businesses they can access"""
    __tablename__ = "staff_business_assignments"
    staff_id: UUID = Field(foreign_key="staff.id", primary_key=True, ondelete="CASCADE")
    business_id: UUID = Field(foreign_key="businesses.id", primary_key=True, ondelete="CASCADE")

    # role: StaffRole = Field(                                      # ← Moved here
    #     sa_column=Column(SAEnum(StaffRole, name="staff_role_enum")),
    #     default=StaffRole.CASHIER
    # )


class Staff(BaseMixin, table=True):
    """Staff members / users under an organization"""
    __tablename__ = "staff"

    tenant_id: UUID = Field(index=True)
    organization_id: Optional[UUID] = Field(foreign_key='organizations.id', index=True, ondelete="CASCADE")

    email: str = Field(index=True, unique=True)
    full_name: str = Field(max_length=100)
    hashed_password: str
    pin_hash: Optional[str] = Field(default=None)
    pin_salt: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)

    active: bool = Field(index=True, default=True)
    role: StaffRole = Field(
        sa_column=Column(SAEnum(StaffRole, name="staff_role_enum")),
        default=StaffRole.CASHIER
    )

    assigned_businesses: List["Business"] = Relationship(
        back_populates="assigned_staff", 
        link_model=StaffBusinessAssignment
    )
    sales_processed: List["Sale"] = Relationship(back_populates="cashier")


# =========================================================
# 4. BUSINESS LOCATIONS
# =========================================================

class Business(BaseMixin, table=True):
    """Individual business location / branch under an organization"""
    __tablename__ = "businesses"

    tenant_id: UUID = Field(index=True)
    organization_id: Optional[UUID] = Field(default=None, index=True)

    name: str = Field(index=True)
    address: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    active: bool = Field(index=True, default=True)

    sales: List["Sale"] = Relationship(back_populates="business")
    analytics_summaries: List["SaleAnalyticsSummary"] = Relationship(back_populates="business")
    
    assigned_staff: List[Staff] = Relationship(
        back_populates="assigned_businesses", 
        link_model=StaffBusinessAssignment
    )


# =========================================================
# 5. PRODUCTS & INVENTORY
# =========================================================

class Product(BaseMixin, table=True):
    """Master product catalog - current state"""
    __tablename__ = "products"

    tenant_id: Optional[UUID] = Field(default=None, index=True)
    organization_id: Optional[UUID] = Field(default=None, index=True)
    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")

    label: str = Field(index=True)
    selling_price: float = Field(default=0.0)
    cost_price: Optional[float] = Field(default=None)

    track_stock: bool = Field(index=True, default=True)
    stock: float = Field(default=0.0)
    min_stock_level: float = Field(default=10.0, nullable=True)
    last_stock_take: Optional[datetime] = Field(default=None)

    active: bool = Field(index=True, default=True)
    category: str = Field(index=True, default="General")
    attributes: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        default_factory=dict
    )

    transactions: List["InventoryTransaction"] = Relationship(back_populates="product")


class InventoryTransaction(BaseMixin, table=True):
    """Single source of truth for ALL stock movements and changes"""
    __tablename__ = "inventory_transactions"

    product_id: UUID = Field(foreign_key="products.id", index=True, ondelete="CASCADE")
    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")
    performed_by: Optional[UUID] = Field(foreign_key="staff.id", index=True, ondelete="CASCADE")

    movement_type: StockMovementType = Field(
        sa_column=Column(SAEnum(StockMovementType, name="stock_movement_type_enum"))
    )

    quantity: float = Field(default=0.0)                   # Positive = IN, Negative = OUT
    previous_stock: Optional[float] = Field(default=None)
    new_stock: float = Field(default=0.0)

    buying_price: Optional[float] = Field(default=None)
    selling_price: Optional[float] = Field(default=None)

    reference_id: Optional[UUID] = Field(default=None, index=True)
    reference_type: Optional[str] = Field(default=None)


    product: "Product" = Relationship(back_populates="transactions")


# =========================================================
# 6. CUSTOMERS
# =========================================================

class Customer(BaseMixin, table=True):
    """Customer records"""
    __tablename__ = "customers"

    tenant_id: Optional[UUID] = Field(default=None, index=True)
    organization_id: UUID = Field(foreign_key="organizations.id", index=True)
    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")

    name: str
    phone: Optional[str] = Field(default=None, index=True)
    email: Optional[str] = Field(default=None)

    sales: List["Sale"] = Relationship(back_populates="customer")


# =========================================================
# 7. SALES & TRANSACTIONS
# =========================================================

class Sale(BaseMixin, table=True):
    """Main sales transaction"""
    __tablename__ = "sales"

    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")
    cashier_id: UUID = Field(foreign_key="staff.id", index=True)
    customer_id: Optional[UUID] = Field(default=None, foreign_key="customers.id")

    currency: str = Field(default="KES", max_length=5)
    status: SaleStatus = Field(
        sa_column=Column(SAEnum(SaleStatus, name="business_sale_status_enum")),
        default=SaleStatus.PENDING_PAYMENT
    )

    subtotal: float = Field(default=0.0)
    discount: float = Field(default=0.0)
    tax_rate: float = Field(default=0.0)
    tax_amount: float = Field(default=0.0)
    discount_applied: float = Field(default=0.0)
    total_amount: float = Field(default=0.0)

    # relationships
    business: Business = Relationship(back_populates="sales")
    cashier: Staff = Relationship(back_populates="sales_processed")
    customer: Optional[Customer] = Relationship()
    payments: List["Payment"] = Relationship(back_populates="sale")
    items: List["SaleItem"] = Relationship(back_populates="sale")
    ledger_events: List["SaleLedgerEvent"] = Relationship(back_populates="sale")


class SaleItem(BaseMixin, table=True):
    """Individual items in a sale"""
    __tablename__ = "sale_items"
    sale_id: UUID = Field(foreign_key="sales.id", index=True, ondelete="CASCADE")
    product_id: UUID = Field(index=True)
    sku: str = Field(max_length=50, index=True)
    name: str = Field(max_length=150)
    unit_price: float
    quantity: float
    tax_rate: float = Field(default=0.16, nullable=True)
    quantity_refunded: float = Field(default=0.0, nullable=True)
    subtotal: float
    # stock_batch_id: Optional[UUID] = Field(default=None, foreign_key="stock_batches.id")
    cost_price_at_sale: Optional[float] = Field(default=None)

    sale: Sale = Relationship(back_populates="items")


# =========================================================
# 8. PAYMENTS & EXTERNAL INTEGRATIONS
# =========================================================

class Payment(BaseMixin, table=True):
    __tablename__ = "payments"
    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")
    sale_id: UUID = Field(foreign_key="sales.id", index=True, ondelete="CASCADE")
    amount: float
    
    method: PaymentMethod = Field(
        sa_column=Column(SAEnum(PaymentMethod, name="payment_method_enum"))
    )
    reference: Optional[str] = Field(default=None, index=True)

    sale: Sale = Relationship(back_populates="payments")
    mpesa_payload: Optional["MpesaPayload"] = Relationship(back_populates="payment")


class MpesaPayload(BaseMixin, table=True):
    __tablename__ = "mpesa_payloads"

    payment_id: Optional[UUID] = Field(default=None, foreign_key="payments.id", index=True)
    transaction_type: str = Field(index=True)

    raw_payload: Dict[str, Any] = Field(sa_column=Column(JSONB))
    response_payload: Optional[Dict[str, Any]] = Field(sa_column=Column(JSONB), default=None)

    mpesa_receipt_number: Optional[str] = Field(index=True)
    transaction_status: str = Field(default="PENDING")
    amount: float
    phone_number: str
    account_reference: Optional[str] = Field(default=None)

    is_reconciled: bool = Field(default=False)
    reconciled_at: Optional[datetime] = Field(default=None)

    payment: Optional[Payment] = Relationship(back_populates="mpesa_payload")


# =========================================================
# 9. AUDIT & ANALYTICS
# =========================================================

class SaleLedgerEvent(BaseMixin, table=True):
    """Immutable audit log for sales events"""
    __tablename__ = "sale_ledger_events"
    sale_id: UUID = Field(foreign_key="sales.id", index=True)
    event_type: EventType = Field(
        sa_column=Column(SAEnum(EventType, name="event_type_enum"))
    )
    amount_delta: float = Field(default=0.0)
    product_id_context: Optional[UUID] = Field(default=None, index=True)
    notes: Optional[str] = Field(default=None)

    sale: Sale = Relationship(back_populates="ledger_events")


class SaleAnalyticsSummary(BaseMixin, table=True):
    """Pre-aggregated analytics for performance"""
    __tablename__ = "sale_analytics_summaries"
    business_id: UUID = Field(foreign_key="businesses.id", index=True)
    date_dimension: datetime = Field(
        sa_column=Column(DateTime(timezone=True), index=True)
    )
    
    gross_sales_volume: float = Field(default=0.0)
    total_tax_collected: float = Field(default=0.0)
    total_discounts_granted: float = Field(default=0.0)
    net_revenue_collected: float = Field(default=0.0)
    refund_deductions_volume: float = Field(default=0.0)
    total_completed_orders_count: int = Field(default=0)

    business: Business = Relationship(back_populates="analytics_summaries")

