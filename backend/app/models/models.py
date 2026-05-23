import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy import Column, Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

from app.models.base import BaseMixin
from app.utils.helpers import utc_now


# =========================================================
# SYSTEM ENUMS
# =========================================================
class PaymentMethod(str, Enum):
    CASH = "CASH"
    MPESA = "MPESA"
    INVOICE = "INVOICE"


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


class SubscriptionTier(str, Enum):
    FREE = "FREE"
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"


class StaffRole(str, Enum):
    OWNER = "OWNER"            # Tenant account administrator
    MANAGER = "MANAGER"        # Multi-branch or specific branch manager
    CASHIER = "CASHIER"        # Point of sale terminal clerk
    KITCHEN_STAFF = "KITCHEN"  # Back-office fulfillment role


# =========================================================
# 0. TENANT SUBSCRIPTIONS MANAGEMENT
# =========================================================
class Subscription(BaseMixin, table=True):
    """
    TENANT LEVEL SUBSCRIPTION MANAGEMENT
    Directly tied via tenant_id constraint.
    """
    __tablename__ = "subscriptions"

    tenant_id: UUID = Field(index=True, unique=True)
    tier: SubscriptionTier = Field(
        sa_column=Column(SAEnum(SubscriptionTier, name="subscription_tier_enum")),
        default=SubscriptionTier.FREE
    )
    active: bool = Field(index=True, default=True)
    start_date: datetime = Field(default_factory=utc_now)
    end_date: Optional[datetime] = Field(default=None, index=True)
    max_registers: int = Field(default=1)


# =========================================================
# 1. STAFF & ROLE ACCOUNTABILITY LAYER
# =========================================================
class StaffBusinessAssignment(SQLModel, table=True):
    """
    JUNCTION TABLE FOR MANY-TO-MANY ASSIGNMENTS
    Enables staff to be scoped to one or more active business locations/branches.
    """
    __tablename__ = "staff_business_assignments"

    staff_id: UUID = Field(foreign_key="staff.id", primary_key=True, ondelete="CASCADE")
    business_id: UUID = Field(foreign_key="businesses.id", primary_key=True, ondelete="CASCADE")
    assigned_at: datetime = Field(default_factory=utc_now)


class Staff(BaseMixin, table=True):
    """
    GLOBAL STAFF RECORDS UNDER A TENANCY
    Belongs directly to a tenant, dynamically mapped to physical businesses.
    """
    __tablename__ = "staff"

    tenant_id: UUID = Field(index=True)
    email: str = Field(index=True, unique=True)
    full_name: str = Field(max_length=100)
    hashed_password: str
    active: bool = Field(index=True, default=True)
    
    role: StaffRole = Field(
        sa_column=Column(SAEnum(StaffRole, name="staff_role_enum")),
        default=StaffRole.CASHIER
    )

    # Relationships
    assigned_businesses: List["Business"] = Relationship(
        back_populates="assigned_staff", 
        link_model=StaffBusinessAssignment
    )
    sales_processed: List["Sale"] = Relationship(back_populates="cashier")


# =========================================================
# UNTOUCHED CORE CONSTANTS (BUSINESS & PRODUCT)
# =========================================================
class Business(BaseMixin, table=True):
    __tablename__ = "businesses"
    tenant_id: UUID = Field(index=True)
    name: str = Field(index=True, unique=True)
    active: bool = Field(index=True, default=False)

    # Cohesive relationships attached to constants
    sales: List["Sale"] = Relationship(back_populates="business")
    analytics_summaries: List["SaleAnalyticsSummary"] = Relationship(back_populates="business")
    
    # Staff Many-to-Many Bridge
    assigned_staff: List[Staff] = Relationship(
        back_populates="assigned_businesses", 
        link_model=StaffBusinessAssignment
    )


class Product(BaseMixin, table=True):
    __tablename__ = "products"
    business_id: UUID = Field(foreign_key="businesses.id", index=True)
    label: str = Field(index=True, default="Product Label")
    selling_price: float = Field(default=0.0)
    track_stock: bool = Field(index=True, default=True)
    stock: float = Field(default=0.0)
    active: bool = Field(index=True, default=True)
    category: str = Field(index=True, default="General")
    attributes: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        default_factory=dict
    )


# =========================================================
# 2. SALE TRANSACTION ANCHOR
# =========================================================
class Sale(BaseMixin, table=True):
    """
    FINANCIAL TRANSACTION ROOT
    Traces business location aggregates, totals, and processing staff.
    """
    __tablename__ = "sales"

    business_id: UUID = Field(foreign_key="businesses.id", index=True)
    cashier_id: UUID = Field(foreign_key="staff.id", index=True) # Strict foreign key link to Staff table
    currency: str = Field(default="KES", max_length=5)
    
    status: SaleStatus = Field(
        sa_column=Column(SAEnum(SaleStatus, name="sale_status_enum")),
        default=SaleStatus.COMPLETED
    )

    # Consolidated Financial Aggregations
    subtotal: float
    tax_rate: float = Field(default=0.16)
    tax_amount: float
    discount_applied: float = Field(default=0.0)
    total_amount: float  # Serves as grand_total payable amount

    # Relational Pipelines
    business: Business = Relationship(back_populates="sales")
    cashier: Staff = Relationship(back_populates="sales_processed")
    payments: List["Payment"] = Relationship(back_populates="sale")
    items: List["SaleItem"] = Relationship(back_populates="sale")
    ledger_events: List["SaleLedgerEvent"] = Relationship(back_populates="sale")


# =========================================================
# 3. SOLD ITEM LINE ENTRIES
# =========================================================
class SaleItem(BaseMixin, table=True):
    __tablename__ = "sale_items"

    sale_id: UUID = Field(foreign_key="sales.id", index=True)
    product_id: UUID = Field(index=True)
    sku: str = Field(max_length=50, index=True)
    name: str = Field(max_length=150)
    unit_price: float
    quantity: int
    quantity_refunded: int = Field(default=0)
    subtotal: float

    sale: Sale = Relationship(back_populates="items")


# =========================================================
# 4. PAYMENT ACCOUNTABILITY MATRIX
# =========================================================
class Payment(BaseMixin, table=True):
    __tablename__ = "payments"

    business_id: UUID = Field(foreign_key="businesses.id", index=True)
    sale_id: UUID = Field(foreign_key="sales.id", index=True)
    amount: float
    
    method: PaymentMethod = Field(
        sa_column=Column(SAEnum(PaymentMethod, name="payment_method_enum"))
    )
    reference: Optional[str] = Field(default=None, index=True)

    sale: Sale = Relationship(back_populates="payments")


# =========================================================
# 5. IMMUTABLE SYSTEM AUDIT LEDGER
# =========================================================
class SaleLedgerEvent(BaseMixin, table=True):
    __tablename__ = "sale_ledger_events"

    sale_id: UUID = Field(foreign_key="sales.id", index=True)
    event_type: EventType = Field(
        sa_column=Column(SAEnum(EventType, name="event_type_enum"))
    )
    amount_delta: float = Field(default=0.0)
    product_id_context: Optional[UUID] = Field(default=None, index=True)
    notes: Optional[str] = Field(default=None)

    sale: Sale = Relationship(back_populates="ledger_events")


# =========================================================
# 6. DYNAMIC HIGH PERFORMANCE ANALYTICS LEVEL
# =========================================================
class SaleAnalyticsSummary(BaseMixin, table=True):
    __tablename__ = "sale_analytics_summaries"

    business_id: UUID = Field(foreign_key="businesses.id", index=True)
    date_dimension: datetime = Field(index=True)
    
    gross_sales_volume: float = Field(default=0.0)
    total_tax_collected: float = Field(default=0.0)
    total_discounts_granted: float = Field(default=0.0)
    net_revenue_collected: float = Field(default=0.0)
    refund_deductions_volume: float = Field(default=0.0)
    total_completed_orders_count: int = Field(default=0)

    business: Business = Relationship(back_populates="analytics_summaries")