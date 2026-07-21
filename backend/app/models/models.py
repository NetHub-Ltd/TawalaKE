from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy import Column, Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel, DateTime

from app.models.base import BaseMixin
from app.utils.helpers import utc_now
import sqlalchemy as sa


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
    onboarding: Optional[bool] = Field(default=False)


# =========================================================
# 2. SUBSCRIPTION & BILLING
# =========================================================

class Subscription(BaseMixin, table=True):
    """Subscription plan for an organization/tenant"""
    __tablename__ = "subscriptions"

    tenant_id: UUID = Field(foreign_key="tenants.id", index=True, ondelete="CASCADE")
    organization_id: UUID = Field(foreign_key="organizations.id", index=True, ondelete="CASCADE")

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
    


# =========================================================
# 3. STAFF & ACCESS CONTROL
# =========================================================

class StaffBusinessAssignment(BaseMixin, table=True):
    """Junction table linking staff to businesses they can access"""
    __tablename__ = "staff_business_assignments"
    staff_id: UUID = Field(foreign_key="staff.id", primary_key=True, ondelete="CASCADE")
    business_id: UUID = Field(foreign_key="businesses.id", primary_key=True, ondelete="CASCADE")

    role: StaffRole = Field(                                      # ← Moved here
        sa_column=Column(SAEnum(StaffRole, name="staff_role_enum")),
        default=StaffRole.CASHIER
    )


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
    # organization_id: Optional[UUID] = Field(foreign_key='organizations.id', index=True, ondelete="CASCADE")

    name: str = Field(index=True)
    tax_rate: Optional[float] = Field(default=0.0)
    address: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    active: bool = Field(index=True, default=True)

    sales: List["Sale"] = Relationship(back_populates="business")
    analytics_summaries: List["SaleAnalyticsSummary"] = Relationship(back_populates="business")
    
    assigned_staff: List[Staff] = Relationship(
        back_populates="assigned_businesses", 
        link_model=StaffBusinessAssignment
    )

    # add a jsob column for storing store level configs like logo etc
    config: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        default_factory=dict
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
    popularity_score: Optional[float] = Field(default=None, nullable=True)
    min_stock_level: float = Field(default=10.0, nullable=True)
    # last_stock_take: Optional[datetime] = Field(default=None)
    last_stock_take: Optional[datetime] = Field(
        sa_column=sa.Column(
            sa.DateTime(timezone=True), 
            nullable=True,
            default=None
        ),
        description="Tracks the last time a physical stock take audit verified this product variant."
    )

    active: bool = Field(index=True, default=True)
    category: str = Field(index=True, default="General")
    attributes: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        default_factory=dict
    )

    transactions: List["StockHistory"] = Relationship(back_populates="product")


class StockHistory(BaseMixin, table=True):
    """
    The Single Source of Truth (SSOT) for all historical stock movements, 
    balancing audits, and financial snapshots within a business tenant.
    """
    __tablename__ = "stock_history"

    product_id: UUID = Field(
        foreign_key="products.id", 
        index=True, 
        ondelete="CASCADE",
        description="The target product impacted by this specific stock ledger update."
    )
    
    business_id: UUID = Field(
        foreign_key="businesses.id", 
        index=True, 
        ondelete="CASCADE",
        description="The organizational business entity running this transactional context."
    )
    
    performed_by: Optional[UUID] = Field(
        default=None,
        foreign_key="staff.id", 
        index=True, 
        ondelete="SET NULL",
        description="The staff identity or system worker who committed or authorized the inventory event."
    )


    movement_type: StockMovementType = Field(
        sa_type=SAEnum(StockMovementType, name="stock_history_type_enum", create_type=True),
        nullable=False,
        index=True,
        description="Categorizes the operational flow: SALE, RESTOCK, RECONCILIATION, WASTAGE, or RETURN."
    )

    # type: Optional[str] = sa.Column(sa.String, default="SALE")  # Fallback for deprecated fields if needed

    quantity: float = Field(
        default=0.0,
        description="The delta shift amount. Numeric positive weights signify incoming items, negatives represent outbound flows."
    )
    
    previous_stock: Optional[float] = Field(
        default=None,
        description="Historical snapshot state of product stock immediately before committing this transaction."
    )
    
    new_stock: float = Field(
        default=0.0,
        description="Calculated balance snapshot state immediately matching historical application confirmation (previous_stock + quantity)."
    )

    buying_price: Optional[float] = Field(
        default=None,
        description="Historical COGS purchase valuation capture at block time. Vital for FIFO/LIFO financial profit metrics."
    )
    
    selling_price: Optional[float] = Field(
        default=None,
        description="Historical gross price capturing the exact point-of-sale layout, ignoring future price fluctuations."
    )

    reference_id: Optional[UUID] = Field(
        default=None, 
        index=True,
        description="Nullable foreign pointer linking directly to underlying operational objects like SaleInvoiceID or PurchaseOrderID."
    )
    
    reference_type: Optional[str] = Field(
        default=None,
        index=True,
        description="Polymorphic discriminator string tracking the structural target domain (e.g., 'INVOICE', 'PURCHASE_ORDER', 'MANUAL_AUDIT')."
    )

    # --- New Recommended Operational Fields ---
    
    reason_code: Optional[str] = Field(
        default=None,
        index=True,
        description="Standardized classification tag explaining anomalies or discrepancies (e.g., 'DAMAGED_IN_TRANSIT', 'THEFT', 'DATA_ENTRY_ERROR')."
    )

    notes: Optional[str] = Field(
        default=None,
        description="Unstructured human text entry highlighting physical audit specific observations or operational notes."
    )

    # --- Database Relationships ---
    
    product: "Product" = Relationship(back_populates="transactions")

# =========================================================
# 6. CUSTOMERS
# =========================================================

class Customer(BaseMixin, table=True):
    """Customer records"""
    __tablename__ = "customers"

    tenant_id: Optional[UUID] = Field(default=None, index=True)
    # organization_id: UUID = Field(foreign_key="organizations.id", index=True)
    organization_id: Optional[UUID] = Field(foreign_key='organizations.id', index=True, ondelete="CASCADE")
    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")

    name: str
    phone: Optional[str] = Field(default=None, index=True)
    email: Optional[str] = Field(default=None)

    sales: List["Sale"] = Relationship(back_populates="customer")


# class SaleAnalyticsSummary(BaseMixin, table=True):
#     """Pre-aggregated analytics for performance"""
#     __tablename__ = "sale_analytics_summaries"
#     business_id: UUID = Field(foreign_key="businesses.id", index=True)
#     date_dimension: datetime = Field(
#         sa_column=Column(DateTime(timezone=True), index=True)
#     )
    
#     gross_sales_volume: float = Field(default=0.0)
#     total_tax_collected: float = Field(default=0.0)
#     total_discounts_granted: float = Field(default=0.0)
#     net_revenue_collected: float = Field(default=0.0)
#     refund_deductions_volume: float = Field(default=0.0)
#     total_completed_orders_count: int = Field(default=0)

#     business: Business = Relationship(back_populates="analytics_summaries")



class SaleAnalyticsSummary(BaseMixin, table=True):
    """Pre-aggregated analytics for performance"""
    __tablename__ = "sale_analytics_summaries"
    
    # ADD THIS: Define composite unique constraint for ON CONFLICT resolution
    __table_args__ = (
        sa.UniqueConstraint(
            "business_id", 
            "date_dimension", 
            name="uq_business_analytics_date"
        ),
    )

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


# =========================================================
# CORE BILLING & TRANSACTION MODELS
# =========================================================

class Sale(BaseMixin, table=True):
    """Main sales transaction record."""
    __tablename__ = "sales"

    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")
    cashier_id: UUID = Field(foreign_key="staff.id", index=True)
    customer_id: Optional[UUID] = Field(default=None, foreign_key="customers.id")

    currency: str = Field(default="KES", max_length=5)
    
    # CHANGE: Added `default=SaleStatus.PENDING_PAYMENT` to the SQLModel Field.
    # REASON: When providing custom `sa_column` declarations with defaults, SQLModel doesn't forward the default back to the underlying Pydantic schema layout. 
    # Adding it here prevents validation errors when parsing/instantiating a new Sale without explicitly submitting a status code.
    status: SaleStatus = Field(
        default=SaleStatus.PENDING_PAYMENT,
        sa_column=Column(
            SAEnum(SaleStatus, name="business_sale_status_enum"), 
            nullable=False, 
            default=SaleStatus.PENDING_PAYMENT
        )
    )

    subtotal: float = Field(default=0.0)
    discount: float = Field(default=0.0)
    tax_rate: float = Field(default=0.0)
    tax_amount: float = Field(default=0.0)
    discount_applied: float = Field(default=0.0)
    total_amount: float = Field(default=0.0)

    # Standard two-way relationships
    items: List["SaleItem"] = Relationship(back_populates="sale")
    document: Optional["FinancialDocument"] = Relationship(back_populates="sale", sa_relationship_kwargs={"uselist": False})
    cashier: "Staff" = Relationship(back_populates="sales_processed")
    business: "Business" = Relationship(back_populates="sales")
    customer: "Customer" = Relationship(back_populates="sales")
    
    # CHANGE: Normalized lowercase `list` to capitalized `List` typing.
    # REASON: Keeps collection types strictly uniform with the rest of your system (e.g., List["SaleItem"]) to bypass runtime parsing variations in strict SQLModel implementations.
    payments: List["Payment"] = Relationship(back_populates="sale")


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
    # mpesa_payload: Optional["MpesaPayload"] = Relationship(back_populates="payment")


class SaleItem(BaseMixin, table=True):
    """
    Individual items tied to a sale. 
    This acts as your immutable receipt/invoice line-item snapshot.
    """
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
    cost_price_at_sale: Optional[float] = Field(default=None)

    # Link back to the parent sale container
    sale: Sale = Relationship(back_populates="items")
    financial_document_id: Optional[UUID] = Field(
        default=None, 
        foreign_key="financial_documents.id", 
        index=True, 
        ondelete="CASCADE"
    )


class FinancialDocument(BaseMixin, table=True):
    """
    Unified Invoice and Receipt model.
    Allows direct retrieval of items without walking through the Sale model.
    """
    __tablename__ = "financial_documents"

    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")
    sale_id: UUID = Field(foreign_key="sales.id", index=True, unique=True, ondelete="CASCADE")
    customer_id: Optional[UUID] = Field(default=None, foreign_key="customers.id", index=True)

    document_type: DocumentType = Field(default=DocumentType.RECEIPT, index=True)
    document_number: str = Field(unique=True, index=True, max_length=50)
    
    subtotal: float = Field(default=0.0)
    discount_amount: float = Field(default=0.0)
    tax_amount: float = Field(default=0.0)
    total_amount: float = Field(default=0.0)
    amount_paid: float = Field(default=0.0)
    fiscal_metadata: Dict[str, Any] = Field(sa_column=Column(JSONB), default_factory=dict)

    # Standard relationship to get parent sale details if needed
    sale: Sale = Relationship(back_populates="document")

    items: List["SaleItem"] = Relationship(
        sa_relationship_kwargs={
            "lazy": "joined",
            "viewonly": True
        }
    )

    document_snapshot: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
        description="Immutable snapshot of the invoice/receipt at issuance. Added for ledger compliance."
    )