"""
Business Management System – Core Models
=======================================

This module contains all SQLModel models for the multi-tenant BMS.

IMPORTANT – PRODUCTION SAFETY RULES
-----------------------------------
• This file is designed for a live production database.
• NO breaking changes: existing columns, enums, and relationships are kept.
• All new fields are nullable or have safe defaults.
• New tables are purely additive.
• Soft-delete + AuditLog patterns are used so we can always answer:
  “Who changed what, when, and from which value to which value?”

Migration strategy: one single Alembic migration that only adds
tables and nullable columns.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy import Column, Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel, DateTime
import sqlalchemy as sa

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
    """
    Legacy tier column on subscriptions/tenants.

    Live Postgres `subscription_tier_enum` (migration 08aa8478a0e5) is:
      FREE | BRONZE | SILVER | GOLD

    BASIC / NDOVU / ENTERPRISE / TRIAL exist in application vocabulary and
    plans.code but MUST NOT be written to `tier` until an Alembic migration
    extends the DB enum (issue #108 Phase B). Prefer plan_id for product truth.
    """
    FREE = "FREE"
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    # Aspirational labels (code/docs only until DB migration)
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


class ItemType(str, Enum):
    """
    Distinguishes physical products from services.
    Added to support proper catalog separation without breaking
    existing Product rows (default = PRODUCT).
    """
    PRODUCT = "PRODUCT"
    SERVICE = "SERVICE"


class PlatformRole(str, Enum):
    """Roles for platform-level (non-tenant) users."""
    SUPER_ADMIN = "SUPER_ADMIN"
    SUPPORT = "SUPPORT"
    BILLING = "BILLING"
    AUDITOR = "AUDITOR"


# =========================================================
# 1. ORGANIZATION & TENANCY
# =========================================================

class Tenant(BaseMixin, table=True):
    """
    Legacy tenant table – kept purely for backward compatibility.
    New code should use Organization.
    """
    __tablename__ = "tenants"

    name: str
    email: str = Field(index=True, unique=True)
    active: bool = Field(index=True, default=True)
    plan: SubscriptionTier = Field(
        sa_column=Column(SAEnum(SubscriptionTier, name="tenant_tier_enum")),
        default=SubscriptionTier.TRIAL
    )


class Organization(BaseMixin, table=True):
    """
    Main organization entity – represents a company/account (the tenant).
    """
    __tablename__ = "organizations"

    name: str
    email: str = Field(index=True, unique=True)
    phone: Optional[str] = Field(default=None)
    address: Optional[str] = Field(default=None)
    tax_number: Optional[str] = Field(default=None)          # KRA PIN
    logo_url: Optional[str] = Field(default=None)
    active: bool = Field(index=True, default=True)
    onboarding: Optional[bool] = Field(default=False)

    # ----- Soft-delete support (non-breaking) -----
    deleted_by: Optional[UUID] = Field(
        default=None,
        index=True,
        description="PlatformUser or Staff who performed the soft-delete."
    )


# =========================================================
# 2. SUBSCRIPTION & BILLING  (Plans driven from DB)
# =========================================================

class Plan(BaseMixin, table=True):
    """
    Canonical definition of a subscription plan.
    Plans (and their limits/features) are read from the database so that
    pricing and entitlements can be changed without a code deploy.

    Backend paywall logic should load the Plan and enforce
    `limits` + `features` + subscription dates.
    """
    __tablename__ = "plans"

    code: str = Field(
        unique=True,
        index=True,
        max_length=50,
        description="Stable machine key, e.g. 'BASIC', 'NDOVU', 'ENTERPRISE'."
    )
    name: str = Field(max_length=100)
    description: Optional[str] = Field(default=None)

    price_monthly: float = Field(default=0.0)
    price_yearly: Optional[float] = Field(default=None)
    currency: str = Field(default="KES", max_length=5)

    is_active: bool = Field(default=True, index=True)
    is_public: bool = Field(
        default=True,
        description="Whether this plan appears on the public pricing page."
    )
    trial_days: int = Field(default=14)
    sort_order: int = Field(default=0)


    features: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        default_factory=dict,
        description="Boolean / list feature flags enabled for this plan."
    )
    limits: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        default_factory=dict,
        description="Numeric caps enforced by the backend paywall."
    )


class Subscription(BaseMixin, table=True):
    """
    Subscription instance for an organization.
    Legacy `tier` enum is kept for backward compatibility.
    New code should prefer `plan_id` → Plan.
    """
    __tablename__ = "subscriptions"

    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE"
    )

    # Legacy field – DO NOT REMOVE
    tier: SubscriptionTier = Field(
        sa_column=Column(
            SAEnum(
                SubscriptionTier,
                name="subscription_tier_enum",
                values_callable=lambda obj: [e.value for e in obj],
                create_type=False,
            )
        ),
        default=SubscriptionTier.FREE,
    )

    active: bool = Field(index=True, default=True)

    start_date: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True))
    )
    end_date: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )

    # ----- Additive fields (non-breaking) -----
    plan_id: Optional[UUID] = Field(
        default=None,
        foreign_key="plans.id",
        index=True,
        description="Preferred link to the Plan table. Nullable so existing rows remain valid."
    )

    current_usage: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        default_factory=dict,
        description="Cached usage counters, e.g. {'businesses': 2, 'staff': 5, 'products': 120}."
    )


# =========================================================
# 3. STAFF & ACCESS CONTROL
# =========================================================

class StaffBusinessAssignment(BaseMixin, table=True):
    """Junction table linking staff to the businesses they can access."""
    __tablename__ = "staff_business_assignments"

    staff_id: UUID = Field(foreign_key="staff.id", primary_key=True, ondelete="CASCADE")
    business_id: UUID = Field(foreign_key="businesses.id", primary_key=True, ondelete="CASCADE")
    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE"
    )

    role: StaffRole = Field(
        sa_column=Column(SAEnum(StaffRole, name="staff_role_enum")),
        default=StaffRole.CASHIER
    )


class Staff(BaseMixin, table=True):
    """
    Staff members / users that belong to an organization (tenant users).
    Platform-level admins live in the separate PlatformUser table.
    """
    __tablename__ = "staff"

    tenant_id: UUID = Field(index=True)  # legacy
    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE"
    )

    email: str = Field(index=True, unique=True)
    full_name: str = Field(max_length=100)
    hashed_password: Optional[str] = Field(default=None)
    pin_hash: Optional[str] = Field(default=None)
    pin_salt: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)

    active: bool = Field(index=True, default=True)
    role: StaffRole = Field(
        sa_column=Column(SAEnum(StaffRole, name="staff_role_enum")),
        default=StaffRole.CASHIER
    )

    # Soft-delete support
    deleted_by: Optional[UUID] = Field(default=None, index=True)

    assigned_businesses: List["Business"] = Relationship(
        back_populates="assigned_staff",
        link_model=StaffBusinessAssignment
    )
    sales_processed: List["Sale"] = Relationship(back_populates="cashier")


class PlatformUser(BaseMixin, table=True):
    """
    Platform-level users (system admins, support agents, billing staff, auditors).
    These users are NOT tied to any organization and must never appear
    in a tenant's staff list or queries.
    """
    __tablename__ = "platform_users"

    email: str = Field(unique=True, index=True)
    full_name: str = Field(max_length=100)
    hashed_password: Optional[str] = Field(default=None)

    role: PlatformRole = Field(
        sa_column=Column(SAEnum(PlatformRole, name="platform_role_enum")),
        default=PlatformRole.SUPPORT
    )
    active: bool = Field(default=True, index=True)
    last_login_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )


# =========================================================
# 4. BUSINESS LOCATIONS
# =========================================================

class Business(BaseMixin, table=True):
    """Individual business location / branch under an organization."""
    __tablename__ = "businesses"

    tenant_id: UUID = Field(index=True)  # legacy
    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE"
    )

    industry: Optional[str] = Field(default="General", nullable=True)
    name: str = Field(index=True)
    tax_rate: Optional[float] = Field(default=0.0)
    address: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    active: bool = Field(index=True, default=True)

    # Soft-delete
    deleted_by: Optional[UUID] = Field(default=None, index=True)
    # registered_by: Optional[UUID]

    config: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        default_factory=dict,
        description="Store-level settings (logo, receipt footer, etc.)."
    )

    sales: List["Sale"] = Relationship(back_populates="business")
    analytics_summaries: List["SaleAnalyticsSummary"] = Relationship(back_populates="business")
    assigned_staff: List[Staff] = Relationship(
        back_populates="assigned_businesses",
        link_model=StaffBusinessAssignment
    )


# =========================================================
# 5. PRODUCTS, SERVICES & CATEGORIES
# =========================================================

class Category(BaseMixin, table=True):
    """
    Proper category taxonomy.
    Supports optional hierarchy via parent_id.
    Organization-scoped (and optionally business-scoped).
    """
    __tablename__ = "categories"

    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE"
    )
    business_id: Optional[UUID] = Field(
        foreign_key="businesses.id",
        index=True,
        ondelete="CASCADE",
        description="Null = organization-wide category."
    )

    name: str = Field(index=True, max_length=100)
    parent_id: Optional[UUID] = Field(
        default=None,
        foreign_key="categories.id",
        description="Optional parent for hierarchical categories."
    )
    sort_order: int = Field(default=0)
    active: bool = Field(default=True, index=True)


class Product(BaseMixin, table=True):
    """
    Master catalog item.
    Can represent either a physical PRODUCT or a SERVICE.
    The old free-text `category` column is retained for backward compatibility;
    new code should prefer `category_id`.
    """
    __tablename__ = "products"

    tenant_id: Optional[UUID] = Field(default=None, index=True)
    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE"
    )
    business_id: UUID = Field(
        foreign_key="businesses.id",
        index=True,
        ondelete="CASCADE"
    )

    label: str = Field(index=True)
    selling_price: float = Field(default=0.0)
    cost_price: Optional[float] = Field(default=None)

    track_stock: bool = Field(index=True, default=True)
    stock: float = Field(default=0.0)
    popularity_score: Optional[float] = Field(default=None, nullable=True)
    min_stock_level: float = Field(default=10.0, nullable=True)

    last_stock_take: Optional[datetime] = Field(
        sa_column=sa.Column(
            sa.DateTime(timezone=True),
            nullable=True,
            default=None
        ),
        description="Last physical stock-take verification timestamp."
    )

    active: bool = Field(index=True, default=True)

    # Legacy free-text category – KEPT for backward compatibility
    category: str = Field(index=True, default="General")

    # ----- New structured fields (non-breaking) -----
    item_type: ItemType = Field(
        default=ItemType.PRODUCT,
        sa_column=Column(SAEnum(ItemType, name="item_type_enum")),
        description="PRODUCT normally tracks stock; SERVICE usually does not."
    )
    category_id: Optional[UUID] = Field(
        default=None,
        foreign_key="categories.id",
        index=True,
        description="Preferred structured category. Null is allowed so existing rows stay valid."
    )

    attributes: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        default_factory=dict
    )

    # Soft-delete
    deleted_by: Optional[UUID] = Field(default=None, index=True)

    transactions: List["StockHistory"] = Relationship(back_populates="product")


class StockHistory(BaseMixin, table=True):
    """
    Single Source of Truth for all historical stock movements,
    balancing audits, and financial snapshots.
    """
    __tablename__ = "stock_history"

    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE"
    )
    product_id: UUID = Field(
        foreign_key="products.id",
        index=True,
        ondelete="CASCADE",
        description="The product impacted by this ledger entry."
    )
    business_id: UUID = Field(
        foreign_key="businesses.id",
        index=True,
        ondelete="CASCADE"
    )
    performed_by: Optional[UUID] = Field(
        default=None,
        foreign_key="staff.id",
        index=True,
        ondelete="SET NULL",
        description="Staff member who committed the movement."
    )

    movement_type: StockMovementType = Field(
        sa_type=SAEnum(StockMovementType, name="stock_history_type_enum", create_type=True),
        nullable=False,
        index=True
    )

    quantity: float = Field(
        default=0.0,
        description="Delta. Positive = inbound, negative = outbound."
    )
    previous_stock: Optional[float] = Field(default=None)
    new_stock: float = Field(default=0.0)

    buying_price: Optional[float] = Field(default=None)
    selling_price: Optional[float] = Field(default=None)

    reference_id: Optional[UUID] = Field(default=None, index=True)
    reference_type: Optional[str] = Field(default=None, index=True)

    reason_code: Optional[str] = Field(default=None, index=True)
    notes: Optional[str] = Field(default=None)

    product: "Product" = Relationship(back_populates="transactions")


# =========================================================
# 6. CUSTOMERS
# =========================================================

class Customer(BaseMixin, table=True):
    """Customer records belonging to a business."""
    __tablename__ = "customers"

    tenant_id: Optional[UUID] = Field(default=None, index=True)
    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE"
    )
    business_id: UUID = Field(
        foreign_key="businesses.id",
        index=True,
        ondelete="CASCADE"
    )

    name: str
    phone: Optional[str] = Field(default=None, index=True)
    email: Optional[str] = Field(default=None)

    # Soft-delete / anonymization support
    deleted_by: Optional[UUID] = Field(default=None, index=True)

    sales: List["Sale"] = Relationship(back_populates="customer")


class SaleAnalyticsSummary(BaseMixin, table=True):
    """Pre-aggregated daily analytics for performance."""
    __tablename__ = "sale_analytics_summaries"

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
    # Additive — gross profit from line cost_price_at_sale (not net of expenses)
    cogs_volume: float = Field(default=0.0)
    gross_profit: float = Field(default=0.0)
    # Payment mix (COMPLETED collected only)
    cash_volume: float = Field(default=0.0)
    mpesa_volume: float = Field(default=0.0)
    # Lines sold without known cost (honesty signal for Products tab)
    missing_cost_line_count: int = Field(default=0)

    business: Business = Relationship(back_populates="analytics_summaries")



class ProductSalesSummary(BaseMixin, table=True):
    """Pre-aggregated product performance per business per calendar day (UTC)."""
    __tablename__ = "product_sales_summaries"
    __table_args__ = (
        sa.UniqueConstraint(
            "business_id",
            "date_dimension",
            "product_id",
            name="uq_product_sales_day",
        ),
    )

    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")
    organization_id: Optional[UUID] = Field(
        default=None, foreign_key="organizations.id", index=True, ondelete="CASCADE"
    )
    date_dimension: datetime = Field(sa_column=Column(DateTime(timezone=True), index=True))
    product_id: UUID = Field(index=True)
    sku: str = Field(default="", max_length=50, index=True)
    name: str = Field(default="", max_length=150)

    quantity_sold: float = Field(default=0.0)
    revenue: float = Field(default=0.0)
    cogs: float = Field(default=0.0)
    gross_profit: float = Field(default=0.0)
    discount_amount: float = Field(default=0.0)
    line_count: int = Field(default=0)


class StaffSalesSummary(BaseMixin, table=True):
    """Pre-aggregated cashier performance per business per calendar day (UTC)."""
    __tablename__ = "staff_sales_summaries"
    __table_args__ = (
        sa.UniqueConstraint(
            "business_id",
            "date_dimension",
            "staff_id",
            name="uq_staff_sales_day",
        ),
    )

    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")
    organization_id: Optional[UUID] = Field(
        default=None, foreign_key="organizations.id", index=True, ondelete="CASCADE"
    )
    date_dimension: datetime = Field(sa_column=Column(DateTime(timezone=True), index=True))
    staff_id: UUID = Field(foreign_key="staff.id", index=True, ondelete="CASCADE")

    orders_count: int = Field(default=0)
    revenue: float = Field(default=0.0)
    cogs: float = Field(default=0.0)
    gross_profit: float = Field(default=0.0)
    discounts: float = Field(default=0.0)


class BusinessSalesHourly(BaseMixin, table=True):
    """Hourly business revenue bars for near-realtime dashboard charts."""
    __tablename__ = "business_sales_hourly"
    __table_args__ = (
        sa.UniqueConstraint(
            "business_id",
            "hour_dimension",
            name="uq_business_sales_hour",
        ),
    )

    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")
    organization_id: Optional[UUID] = Field(
        default=None, foreign_key="organizations.id", index=True, ondelete="CASCADE"
    )
    hour_dimension: datetime = Field(
        sa_column=Column(DateTime(timezone=True), index=True),
        description="UTC hour floor of the sale.",
    )

    gross_sales_volume: float = Field(default=0.0)
    net_revenue_collected: float = Field(default=0.0)
    cogs_volume: float = Field(default=0.0)
    gross_profit: float = Field(default=0.0)
    total_completed_orders_count: int = Field(default=0)
    total_discounts_granted: float = Field(default=0.0)



# =========================================================
# CORE BILLING & TRANSACTION MODELS
# =========================================================

class Sale(BaseMixin, table=True):
    """Main sales transaction record."""
    __tablename__ = "sales"

    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")
    cashier_id: UUID = Field(foreign_key="staff.id", index=True)
    customer_id: Optional[UUID] = Field(default=None, foreign_key="customers.id")
    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE"
    )

    currency: str = Field(default="KES", max_length=5)

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
    service_amount: Optional[Dict[str, Any]] = Field(
            default=None,
            sa_column=Column(JSONB, nullable=True),
            description="Service fee applied to a sale!."
        )
    discount_amount: Optional[Dict[str, Any]] = Field(
                default=None,
                sa_column=Column(JSONB, nullable=True),
                description="Discount ammount applied to a sale"
            )

    items: List["SaleItem"] = Relationship(back_populates="sale")
    document: Optional["FinancialDocument"] = Relationship(
        back_populates="sale",
        sa_relationship_kwargs={"uselist": False}
    )
    cashier: "Staff" = Relationship(back_populates="sales_processed")
    business: "Business" = Relationship(back_populates="sales")
    customer: "Customer" = Relationship(back_populates="sales")
    payments: List["Payment"] = Relationship(back_populates="sale")


class Payment(BaseMixin, table=True):
    __tablename__ = "payments"

    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")
    sale_id: UUID = Field(foreign_key="sales.id", index=True, ondelete="CASCADE")
    amount: float
    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE"
    )
    method: PaymentMethod = Field(
        sa_column=Column(SAEnum(PaymentMethod, name="payment_method_enum"))
    )
    reference: Optional[str] = Field(default=None, index=True)

    sale: Sale = Relationship(back_populates="payments")


class SaleItem(BaseMixin, table=True):
    """
    Immutable line-item snapshot belonging to a sale.
    """
    __tablename__ = "sale_items"

    sale_id: UUID = Field(foreign_key="sales.id", index=True, ondelete="CASCADE")
    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE"
    )
    product_id: UUID = Field(index=True)
    sku: str = Field(max_length=50, index=True)
    name: str = Field(max_length=150)
    unit_price: float
    quantity: float
    tax_rate: float = Field(default=0.16, nullable=True)
    quantity_refunded: float = Field(default=0.0, nullable=True)
    subtotal: float
    cost_price_at_sale: Optional[float] = Field(default=None)

    financial_document_id: Optional[UUID] = Field(
        default=None,
        foreign_key="financial_documents.id",
        index=True,
        ondelete="CASCADE"
    )

    sale: Sale = Relationship(back_populates="items")


class FinancialDocument(BaseMixin, table=True):
    """
    Unified Invoice / Receipt / Credit Note model.
    """
    __tablename__ = "financial_documents"

    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE"
    )
    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")
    sale_id: UUID = Field(
        foreign_key="sales.id",
        index=True,
        unique=True,
        ondelete="CASCADE"
    )
    customer_id: Optional[UUID] = Field(
        default=None,
        foreign_key="customers.id",
        index=True
    )

    document_type: DocumentType = Field(default=DocumentType.RECEIPT, index=True)
    document_number: str = Field(unique=True, index=True, max_length=50)

    subtotal: float = Field(default=0.0)
    discount_amount: float = Field(default=0.0)
    tax_amount: float = Field(default=0.0)
    total_amount: float = Field(default=0.0)
    amount_paid: float = Field(default=0.0)

    fiscal_metadata: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        default_factory=dict
    )
    document_snapshot: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
        description="Immutable snapshot of the document at issuance time."
    )

    sale: Sale = Relationship(back_populates="document")
    items: List["SaleItem"] = Relationship(
        sa_relationship_kwargs={
            "lazy": "joined",
            "viewonly": True
        }
    )


# =========================================================
# 7. PRIVACY & DATA DELETION
# =========================================================

class DataDeletionRequest(BaseMixin, table=True):
    """
    Tracks data-subject / privacy requests (right to be forgotten).

    Policy guidance (enforce in application code):
    • Financial records (Sales, Payments, Documents, StockHistory) → retain + anonymize PII.
    • Pure PII (Staff contact, Customer contact) → soft-delete + anonymize.
    • Never hard-delete financial history.
    """
    __tablename__ = "data_deletion_requests"

    organization_id: Optional[UUID] = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="SET NULL"
    )
    requested_by_email: str
    requested_by_user_id: Optional[UUID] = Field(default=None)

    status: str = Field(
        default="PENDING",
        index=True,
        description="PENDING | IN_PROGRESS | COMPLETED | REJECTED"
    )
    reason: Optional[str] = Field(default=None)
    completed_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    notes: Optional[str] = Field(default=None)

    # Exact record of what was done (for audit & compliance)
    actions_taken: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        default_factory=dict,
        description="Snapshot of anonymized/deleted entities and fields."
    )




# =========================================================
# 7b. DATA ARCHIVE JOBS (soft-delete retention pipeline)
# =========================================================



class AnalyticsOutbox(BaseMixin, table=True):
    """
    Durable queue for rollup application after COMPLETED sales.
    Ensures dashboard analytics are not lost if in-process BackgroundTasks die.
    """
    __tablename__ = "analytics_outbox"
    __table_args__ = (
        sa.UniqueConstraint("sale_id", name="uq_analytics_outbox_sale"),
    )

    sale_id: UUID = Field(foreign_key="sales.id", index=True, ondelete="CASCADE")
    business_id: UUID = Field(foreign_key="businesses.id", index=True, ondelete="CASCADE")
    organization_id: Optional[UUID] = Field(
        default=None, foreign_key="organizations.id", index=True, ondelete="CASCADE"
    )
    status: str = Field(
        default="PENDING",
        index=True,
        description="PENDING | PROCESSING | DONE | FAILED",
    )
    attempts: int = Field(default=0)
    last_error: Optional[str] = Field(default=None)
    processed_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )

class DataArchiveJob(BaseMixin, table=True):
    """
    Tracks archive → notify → purge lifecycle for soft-deleted (or scoped) data.

    Production purge must only run when status reaches NOTIFIED (or ARCHIVED with
    notify skipped by policy) and settings.archive_enabled is True.
    """
    __tablename__ = "data_archive_jobs"

    organization_id: UUID = Field(
        foreign_key="organizations.id",
        index=True,
        ondelete="CASCADE",
    )
    business_id: Optional[UUID] = Field(
        default=None,
        foreign_key="businesses.id",
        index=True,
        ondelete="SET NULL",
    )

    status: str = Field(
        default="PENDING",
        index=True,
        description="PENDING | ARCHIVING | ARCHIVED | NOTIFIED | PURGED | FAILED",
    )
    # Snapshot of plan retention at job creation time
    retention_months: int = Field(default=6)
    entity_scope: str = Field(
        default="soft_deleted_catalog",
        description="soft_deleted_catalog | organization_offboard | custom",
    )
    schema_version: str = Field(default="1")

    archive_object_key: Optional[str] = Field(default=None, max_length=512)
    archive_byte_size: Optional[int] = Field(default=None)
    download_url_expires_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    notified_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    purged_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    error_message: Optional[str] = Field(default=None)
    # Manifest / entity counts for audit
    manifest: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB),
    )


# =========================================================
# 8. AUDITING  (who did what, from → to)
# =========================================================

class AuditLog(BaseMixin, table=True):
    """
    Immutable audit trail.

    This table is the primary mechanism that satisfies the acceptance criterion:
    “I need to be able to check why something was changed and from what to what.”

    Usage pattern:
        old_values = {"selling_price": 100.0, "label": "Old Name"}
        new_values = {"selling_price": 120.0, "label": "New Name"}
    """
    __tablename__ = "audit_logs"

    # Null organization_id = platform-level action
    organization_id: Optional[UUID] = Field(default=None, index=True)

    actor_id: Optional[UUID] = Field(
        default=None,
        index=True,
        description="Staff.id or PlatformUser.id"
    )
    actor_role: str = Field(
        default="STAFF",
        index=True,
        description="STAFF | PLATFORM_USER | SYSTEM"
    )
    actor_email: Optional[str] = Field(
        default=None,
        description="Denormalized for convenient querying without joins."
    )

    action: str = Field(
        index=True,
        description="CREATE | UPDATE | DELETE | LOGIN | LOGOUT | SOFT_DELETE | ANONYMIZE | ..."
    )
    entity_type: str = Field(
        index=True,
        description="Product | Staff | Sale | Plan | Organization | ..."
    )
    entity_id: Optional[UUID] = Field(default=None, index=True)

    # Critical for “from → to” visibility
    old_values: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="State before the change."
    )
    new_values: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB),
        description="State after the change."
    )

    ip_address: Optional[str] = Field(default=None)
    user_agent: Optional[str] = Field(default=None)

    extra: Dict[str, Any] = Field(
        sa_column=Column(JSONB),
        default_factory=dict,
        description="Any additional context (request id, correlation id, etc.)."
    )