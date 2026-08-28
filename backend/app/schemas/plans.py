from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator, ConfigDict
from uuid import UUID
from datetime import datetime


# -------------------------------------------------
# Nested value objects
# -------------------------------------------------

class PlanLimits(BaseModel):
    """
    Hard numeric limits enforced by the backend paywall.
    Use `None` to represent 'Unlimited'.
    """
    max_businesses: Optional[int] = Field(
        default=None,
        ge=0,
        description="Maximum number of businesses/branches. None = unlimited"
    )
    max_staff: Optional[int] = Field(
        default=None,
        ge=0,
        description="Maximum staff accounts. None = unlimited"
    )
    max_products: Optional[int] = Field(
        default=None,
        ge=0,
        description="Maximum products + services. None = unlimited"
    )
    max_customers: Optional[int] = Field(
        default=None,
        ge=0,
        description="Maximum customers. None = unlimited"
    )
    max_transactions_per_month: Optional[int] = Field(
        default=None,
        ge=0,
        description="Maximum sales/transactions per calendar month"
    )
    max_invoices_per_month: Optional[int] = Field(
        default=None,
        ge=0,
        description="Maximum invoices that can be generated per month"
    )
    data_retention_months: Optional[int] = Field(
        default=None,
        ge=1,
        description="How many months of historical data are retained"
    )

    model_config = ConfigDict(extra="forbid")


class PlanFeatures(BaseModel):
    """
    Feature flags.
    - Prefer boolean values for simple on/off features.
    - Use string values only when you need graded access
      (e.g. "basic", "full", "limited").
    """
    # Core
    pos_and_sales: bool = False
    invoicing: bool = False
    basic_stock_tracking: bool = False
    full_inventory: bool = False
    low_stock_alerts: bool = False
    customer_management: bool = False
    customer_credit: bool = False
    expense_tracking: bool = False
    multi_business: bool = False
    receipt_customization: bool = False

    # Reporting & Analytics
    daily_sales_report: bool = False
    advanced_reports: bool = False
    profit_and_loss: bool = False
    staff_performance: bool = False
    custom_reports: bool = False

    # Access & Security
    pin_login: bool = False
    audit_trail: Union[bool, str] = False          # False | True | "basic" | "full"
    api_access: Union[bool, str] = False          # False | True | "limited" | "standard"
    sso: bool = False
    enhanced_security: bool = False

    # Support & Operations
    email_support: bool = False
    whatsapp_support: bool = False
    phone_support: bool = False
    priority_support: bool = False
    dedicated_account_manager: bool = False
    onboarding_training: bool = False
    automatic_backups: bool = False

    # Advanced
    offline_mode: Union[bool, str] = False         # False | True | "limited" | "full"
    supplier_management: bool = False
    purchase_orders: bool = False
    batch_tracking: bool = False
    custom_domain: bool = False
    white_label: bool = False

    # Exports
    csv_export: bool = False
    pdf_export: bool = False

    model_config = ConfigDict(extra="allow")  # allow future flags without breaking


# -------------------------------------------------
# Write schemas
# -------------------------------------------------

class PlanCreate(BaseModel):
    """Schema used when creating or seeding a plan."""
    code: str = Field(..., min_length=2, max_length=50, examples=["BASIC", "NDOVU"])
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

    price_monthly: float = Field(..., ge=0)
    price_yearly: Optional[float] = Field(default=None, ge=0)
    currency: str = Field(default="KES", min_length=3, max_length=5)

    is_active: bool = True
    is_public: bool = True
    trial_days: int = Field(default=0, ge=0, le=90)
    sort_order: int = Field(default=0, ge=0)

    limits: PlanLimits
    features: PlanFeatures

    @field_validator("code")
    @classmethod
    def code_must_be_uppercase(cls, v: str) -> str:
        return v.strip().upper()

    model_config = ConfigDict(extra="forbid")


class PlanUpdate(BaseModel):
    """Schema for partial updates to an existing plan."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = None

    price_monthly: Optional[float] = Field(default=None, ge=0)
    price_yearly: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=5)

    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    trial_days: Optional[int] = Field(default=None, ge=0, le=90)
    sort_order: Optional[int] = Field(default=None, ge=0)

    limits: Optional[PlanLimits] = None
    features: Optional[PlanFeatures] = None

    model_config = ConfigDict(extra="forbid")


# -------------------------------------------------
# Read schema
# -------------------------------------------------

class PlanRead(BaseModel):
    """Schema returned by the API when reading a plan."""
    id: UUID
    code: str
    name: str
    description: Optional[str] = None

    price_monthly: float
    price_yearly: Optional[float] = None
    currency: str

    is_active: bool
    is_public: bool
    trial_days: int
    sort_order: int

    limits: PlanLimits
    features: PlanFeatures

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------
# Convenience type for seeding
# -------------------------------------------------

class PlanSeed(PlanCreate):
    """
    Exact schema used to validate the PLANS_SEED list
    before inserting/updating records in the database.
    """
    pass