"""Plan-based paywall — class-centric enforcement.

Architecture
------------
- **PostgreSQL is the source of truth** for subscriptions, plans, and usage
  (`subscriptions.current_usage` JSONB is updated on successful mutations).
- **Redis is a read cache** for entitlements + validity flags so hot paths
  avoid repeated plan/subscription joins. Cache is invalidated on billing
  events and after usage bumps.
- Layers: middleware (plan validity) → route deps (features) → service
  methods (limits + defense-in-depth in business logic).

Status conventions
------------------
- 402 PLAN_LIMIT_REACHED — capacity / quota
- 403 FEATURE_NOT_AVAILABLE | SUBSCRIPTION_INACTIVE | SUBSCRIPTION_EXPIRED
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Sequence
from uuid import UUID

from fastapi import HTTPException, status
from redis.asyncio.client import Redis as AsyncRedis
from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import (
    Business,
    Plan,
    Product,
    Staff,
    Subscription,
)
from app.utils.logging import logger

# ---------------------------------------------------------------------------
# Limit & feature keys (docs/billing.md + PLANS_SEED)
# ---------------------------------------------------------------------------
LIMIT_BUSINESSES = "max_businesses"
LIMIT_STAFF = "max_staff"
LIMIT_PRODUCTS = "max_products"
LIMIT_CUSTOMERS = "max_customers"
LIMIT_TX_MONTH = "max_transactions_per_month"
LIMIT_INVOICES_MONTH = "max_invoices_per_month"

LIMIT_KEYS: Sequence[str] = (
    LIMIT_BUSINESSES,
    LIMIT_STAFF,
    LIMIT_PRODUCTS,
    LIMIT_CUSTOMERS,
    LIMIT_TX_MONTH,
    LIMIT_INVOICES_MONTH,
)

_LIMIT_LABELS = {
    LIMIT_BUSINESSES: "businesses / branches",
    LIMIT_STAFF: "staff accounts",
    LIMIT_PRODUCTS: "products / services",
    LIMIT_CUSTOMERS: "customers",
    LIMIT_TX_MONTH: "transactions this month",
    LIMIT_INVOICES_MONTH: "invoices this month",
}

# Feature keys from plan matrix (enforceable)
FEATURE_KEYS: Sequence[str] = (
    "pos_and_sales",
    "invoicing",
    "basic_stock_tracking",
    "full_inventory",
    "low_stock_alerts",
    "customer_management",
    "customer_credit",
    "expense_tracking",
    "multi_business",
    "receipt_customization",
    "daily_sales_report",
    "advanced_reports",
    "profit_and_loss",
    "staff_performance",
    "custom_reports",
    "pin_login",
    "audit_trail",
    "api_access",
    "sso",
    "enhanced_security",
    "email_support",
    "whatsapp_support",
    "phone_support",
    "priority_support",
    "dedicated_account_manager",
    "onboarding_training",
    "automatic_backups",
    "offline_mode",
    "supplier_management",
    "purchase_orders",
    "batch_tracking",
    "custom_domain",
    "white_label",
    "csv_export",
    "pdf_export",
)

# Redis
_ENT_TTL_SEC = 90
_VALID_TTL_SEC = 60
_ENT_PREFIX = "paywall:ent:"
_VALID_PREFIX = "paywall:valid:"


def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _is_expired(end: Optional[datetime], now: Optional[datetime] = None) -> bool:
    now = now or datetime.now(timezone.utc)
    end_u = _as_utc(end)
    if end_u is None:
        return False
    return end_u < now


def _paywall_detail(
    code: str,
    message: str,
    **extra: Any,
) -> Dict[str, Any]:
    detail: Dict[str, Any] = {"code": code, "message": message}
    for k, v in extra.items():
        if v is not None:
            detail[k] = v
    return detail


@dataclass
class Entitlements:
    """Resolved plan entitlements for an organization (cacheable)."""

    organization_id: str
    subscription_id: Optional[str]
    plan_id: Optional[str]
    plan_code: str
    plan_name: str
    active: bool
    trial: bool
    start_date: Optional[str]
    end_date: Optional[str]
    limits: Dict[str, Any] = field(default_factory=dict)
    features: Dict[str, Any] = field(default_factory=dict)
    usage: Dict[str, int] = field(default_factory=dict)

    def limit(self, key: str) -> Optional[int]:
        raw = self.limits.get(key)
        if raw is None:
            return None
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None

    def has_feature(self, key: str) -> bool:
        val = self.features.get(key)
        if val is True:
            return True
        if val is False or val is None:
            return False
        if isinstance(val, str) and val.strip().lower() not in ("", "false", "off", "none"):
            return True
        return bool(val)

    def to_cache_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_cache_dict(cls, data: Dict[str, Any]) -> "Entitlements":
        return cls(
            organization_id=str(data["organization_id"]),
            subscription_id=data.get("subscription_id"),
            plan_id=data.get("plan_id"),
            plan_code=data.get("plan_code") or "NONE",
            plan_name=data.get("plan_name") or "No active plan",
            active=bool(data.get("active")),
            trial=bool(data.get("trial")),
            start_date=data.get("start_date"),
            end_date=data.get("end_date"),
            limits=dict(data.get("limits") or {}),
            features=dict(data.get("features") or {}),
            usage={k: int(v) for k, v in (data.get("usage") or {}).items()},
        )


class PaywallService:
    """
    Single entry point for plan enforcement.

    Usage is **persisted on Subscription.current_usage** (and reconciled from
    live table counts where needed). Redis only caches resolved entitlements
    and a validity bit for middleware speed.
    """

    def __init__(self, ent_ttl: int = _ENT_TTL_SEC, valid_ttl: int = _VALID_TTL_SEC):
        self.ent_ttl = ent_ttl
        self.valid_ttl = valid_ttl

    # ------------------------------------------------------------------
    # Redis helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _ent_key(org_id: UUID | str) -> str:
        return f"{_ENT_PREFIX}{org_id}"

    @staticmethod
    def _valid_key(org_id: UUID | str) -> str:
        return f"{_VALID_PREFIX}{org_id}"

    async def get_cached(
        self, redis: Optional[AsyncRedis], org_id: UUID
    ) -> Optional[Entitlements]:
        if redis is None:
            return None
        try:
            raw = await redis.get(self._ent_key(org_id))
            if not raw:
                return None
            if isinstance(raw, bytes):
                raw = raw.decode("utf-8")
            return Entitlements.from_cache_dict(json.loads(raw))
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"paywall cache read failed org={org_id}: {exc}")
            return None

    async def set_cached(
        self, redis: Optional[AsyncRedis], org_id: UUID, ent: Entitlements
    ) -> None:
        if redis is None:
            return
        try:
            payload = json.dumps(ent.to_cache_dict())
            pipe = redis.pipeline()
            pipe.set(self._ent_key(org_id), payload, ex=self.ent_ttl)
            pipe.set(
                self._valid_key(org_id),
                "1" if ent.active else "0",
                ex=self.valid_ttl,
            )
            await pipe.execute()
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"paywall cache write failed org={org_id}: {exc}")

    async def invalidate(self, redis: Optional[AsyncRedis], org_id: UUID) -> None:
        """Drop cache after trial start, plan change, or usage mutation."""
        if redis is None:
            return
        try:
            await redis.delete(self._ent_key(org_id), self._valid_key(org_id))
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"paywall invalidate failed org={org_id}: {exc}")

    async def is_plan_valid_cached(
        self, redis: Optional[AsyncRedis], org_id: UUID
    ) -> Optional[bool]:
        """Middleware fast path. None = cache miss."""
        if redis is None:
            return None
        try:
            raw = await redis.get(self._valid_key(org_id))
            if raw is None:
                return None
            if isinstance(raw, bytes):
                raw = raw.decode("utf-8")
            return raw == "1"
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"paywall valid-bit read failed org={org_id}: {exc}")
            return None

    # ------------------------------------------------------------------
    # DB resolve + usage (source of truth)
    # ------------------------------------------------------------------
    async def _count_businesses(self, db: AsyncSession, org_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Business)
            .where(
                Business.organization_id == org_id,
                Business.active == True,  # noqa: E712
            )
        )
        return int((await db.exec(stmt)).one())

    async def _count_staff(self, db: AsyncSession, org_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Staff)
            .where(
                Staff.organization_id == org_id,
                Staff.active == True,  # noqa: E712
            )
        )
        return int((await db.exec(stmt)).one())

    async def _count_products(self, db: AsyncSession, org_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Product)
            .where(Product.organization_id == org_id)
        )
        return int((await db.exec(stmt)).one())

    async def _live_usage(self, db: AsyncSession, org_id: UUID) -> Dict[str, int]:
        """Authoritative counts from tables (not Redis)."""
        return {
            LIMIT_BUSINESSES: await self._count_businesses(db, org_id),
            LIMIT_STAFF: await self._count_staff(db, org_id),
            LIMIT_PRODUCTS: await self._count_products(db, org_id),
        }

    async def _load_active_sub(
        self, db: AsyncSession, org_id: UUID
    ) -> Optional[Subscription]:
        now = datetime.now(timezone.utc)
        stmt = (
            select(Subscription)
            .where(
                Subscription.organization_id == org_id,
                Subscription.active == True,  # noqa: E712
            )
            .order_by(Subscription.start_date.desc())
        )
        for sub in list(await db.exec(stmt)):
            if not _is_expired(sub.end_date, now):
                return sub
        return None

    async def resolve_from_db(self, db: AsyncSession, org_id: UUID) -> Entitlements:
        """Build entitlements from Postgres (plans + subscription + live usage)."""
        sub = await self._load_active_sub(db, org_id)
        usage = await self._live_usage(db, org_id)

        if sub is None:
            return Entitlements(
                organization_id=str(org_id),
                subscription_id=None,
                plan_id=None,
                plan_code="NONE",
                plan_name="No active plan",
                active=False,
                trial=False,
                start_date=None,
                end_date=None,
                limits={},
                features={},
                usage=usage,
            )

        plan: Optional[Plan] = None
        if sub.plan_id is not None:
            plan = await db.get(Plan, sub.plan_id)

        # Merge persisted current_usage for keys we don't count live yet
        # (e.g. monthly transactions) while live counts win for staff/products/biz
        persisted = dict(sub.current_usage or {})
        for k, v in persisted.items():
            if k not in usage:
                try:
                    usage[k] = int(v)
                except (TypeError, ValueError):
                    pass

        if plan is None:
            return Entitlements(
                organization_id=str(org_id),
                subscription_id=str(sub.id),
                plan_id=str(sub.plan_id) if sub.plan_id else None,
                plan_code="UNKNOWN",
                plan_name="Unknown plan",
                active=True,
                trial=False,
                start_date=_as_utc(sub.start_date).isoformat() if sub.start_date else None,
                end_date=_as_utc(sub.end_date).isoformat() if sub.end_date else None,
                limits={},
                features={},
                usage=usage,
            )

        trial = False
        if plan.trial_days and sub.start_date and sub.end_date:
            span = (_as_utc(sub.end_date) - _as_utc(sub.start_date)).days
            if 0 < span <= int(plan.trial_days) + 1:
                trial = True

        return Entitlements(
            organization_id=str(org_id),
            subscription_id=str(sub.id),
            plan_id=str(plan.id),
            plan_code=plan.code,
            plan_name=plan.name,
            active=True,
            trial=trial,
            start_date=_as_utc(sub.start_date).isoformat() if sub.start_date else None,
            end_date=_as_utc(sub.end_date).isoformat() if sub.end_date else None,
            limits=dict(plan.limits or {}),
            features=dict(plan.features or {}),
            usage=usage,
        )

    async def resolve(
        self,
        db: AsyncSession,
        org_id: UUID,
        redis: Optional[AsyncRedis] = None,
        *,
        force_db: bool = False,
    ) -> Entitlements:
        """Redis first; on miss load DB and populate cache."""
        if not force_db:
            cached = await self.get_cached(redis, org_id)
            if cached is not None:
                return cached
        ent = await self.resolve_from_db(db, org_id)
        await self.set_cached(redis, org_id, ent)
        return ent

    # ------------------------------------------------------------------
    # Persist usage to DB (source of truth)
    # ------------------------------------------------------------------
    async def persist_usage(
        self,
        db: AsyncSession,
        org_id: UUID,
        usage: Dict[str, int],
        redis: Optional[AsyncRedis] = None,
    ) -> None:
        """Write usage snapshot onto Subscription.current_usage and invalidate cache."""
        sub = await self._load_active_sub(db, org_id)
        if sub is None:
            return
        merged = dict(sub.current_usage or {})
        merged.update({k: int(v) for k, v in usage.items()})
        sub.current_usage = merged
        db.add(sub)
        await db.flush()
        await self.invalidate(redis, org_id)

    async def bump_usage(
        self,
        db: AsyncSession,
        org_id: UUID,
        limit_key: str,
        *,
        delta: int = 1,
        redis: Optional[AsyncRedis] = None,
    ) -> Dict[str, int]:
        """
        After a successful create: refresh live counts into DB current_usage.
        Call inside the same request after commit-ready flush of the entity.
        """
        usage = await self._live_usage(db, org_id)
        # For monthly counters not derived from live table counts, increment persisted
        if limit_key in (LIMIT_TX_MONTH, LIMIT_INVOICES_MONTH, LIMIT_CUSTOMERS):
            sub = await self._load_active_sub(db, org_id)
            base = dict(sub.current_usage or {}) if sub else {}
            prev = int(base.get(limit_key) or usage.get(limit_key) or 0)
            usage[limit_key] = prev + delta
        await self.persist_usage(db, org_id, usage, redis=redis)
        return usage

    # ------------------------------------------------------------------
    # Enforcement
    # ------------------------------------------------------------------
    def require_active(self, ent: Entitlements) -> Entitlements:
        if not ent.active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=_paywall_detail(
                    "SUBSCRIPTION_INACTIVE",
                    "No active subscription. Start a trial or choose a plan to continue.",
                    plan_code=ent.plan_code,
                ),
            )
        if ent.end_date:
            try:
                end = datetime.fromisoformat(ent.end_date)
                if _is_expired(end):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=_paywall_detail(
                            "SUBSCRIPTION_EXPIRED",
                            "Your subscription has expired. Renew or upgrade to continue.",
                            plan_code=ent.plan_code,
                        ),
                    )
            except HTTPException:
                raise
            except ValueError:
                pass
        return ent

    def require_feature(self, ent: Entitlements, feature_key: str) -> Entitlements:
        self.require_active(ent)
        if not ent.has_feature(feature_key):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=_paywall_detail(
                    "FEATURE_NOT_AVAILABLE",
                    f"'{feature_key}' is not included in your current plan ({ent.plan_name}). "
                    "Upgrade to unlock it.",
                    feature=feature_key,
                    plan_code=ent.plan_code,
                ),
            )
        return ent

    def require_features(
        self, ent: Entitlements, feature_keys: Sequence[str], *, mode: str = "all"
    ) -> Entitlements:
        """mode='all' requires every feature; mode='any' requires at least one."""
        self.require_active(ent)
        keys = list(feature_keys)
        if not keys:
            return ent
        if mode == "any":
            if not any(ent.has_feature(k) for k in keys):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=_paywall_detail(
                        "FEATURE_NOT_AVAILABLE",
                        f"None of {keys} are included in plan {ent.plan_name}.",
                        feature=keys[0],
                        plan_code=ent.plan_code,
                    ),
                )
            return ent
        for k in keys:
            self.require_feature(ent, k)
        return ent

    def check_limit(
        self,
        ent: Entitlements,
        limit_key: str,
        *,
        increment: int = 1,
        current: Optional[int] = None,
    ) -> Entitlements:
        self.require_active(ent)
        maximum = ent.limit(limit_key)
        if maximum is None:
            return ent
        cur = current if current is not None else int(ent.usage.get(limit_key) or 0)
        if cur + increment > maximum:
            label = _LIMIT_LABELS.get(limit_key, limit_key)
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=_paywall_detail(
                    "PLAN_LIMIT_REACHED",
                    f"Plan limit reached for {label} ({cur}/{maximum}). "
                    f"Upgrade from {ent.plan_name} to add more.",
                    limit_key=limit_key,
                    current=cur,
                    maximum=maximum,
                    plan_code=ent.plan_code,
                ),
            )
        return ent

    async def enforce_create_business(
        self,
        db: AsyncSession,
        org_id: UUID,
        redis: Optional[AsyncRedis] = None,
    ) -> Entitlements:
        ent = await self.resolve(db, org_id, redis)
        # multi_business is required beyond first store when plan says so
        live = await self._count_businesses(db, org_id)
        if live >= 1:
            self.require_feature(ent, "multi_business")
        return self.check_limit(ent, LIMIT_BUSINESSES, current=live)

    async def enforce_create_staff(
        self,
        db: AsyncSession,
        org_id: UUID,
        redis: Optional[AsyncRedis] = None,
    ) -> Entitlements:
        ent = await self.resolve(db, org_id, redis)
        live = await self._count_staff(db, org_id)
        return self.check_limit(ent, LIMIT_STAFF, current=live)

    async def enforce_create_product(
        self,
        db: AsyncSession,
        org_id: UUID,
        redis: Optional[AsyncRedis] = None,
    ) -> Entitlements:
        ent = await self.resolve(db, org_id, redis)
        self.require_feature(ent, "basic_stock_tracking")
        live = await self._count_products(db, org_id)
        return self.check_limit(ent, LIMIT_PRODUCTS, current=live)

    async def usage_snapshot(
        self,
        db: AsyncSession,
        org_id: UUID,
        redis: Optional[AsyncRedis] = None,
    ) -> Dict[str, Any]:
        ent = await self.resolve(db, org_id, redis, force_db=True)
        return ent.to_cache_dict()


# Module singleton — import as `from app.services.paywall import paywall`
paywall = PaywallService()

# Backward-compatible aliases used by earlier routes/tests
async def resolve_entitlements(db: AsyncSession, organization_id: UUID) -> Entitlements:
    return await paywall.resolve_from_db(db, organization_id)


async def require_active_subscription(
    db: AsyncSession, organization_id: UUID
) -> Entitlements:
    ent = await paywall.resolve_from_db(db, organization_id)
    return paywall.require_active(ent)


async def require_feature(
    db: AsyncSession, organization_id: UUID, feature_key: str
) -> Entitlements:
    ent = await paywall.resolve_from_db(db, organization_id)
    return paywall.require_feature(ent, feature_key)


async def check_limit(
    db: AsyncSession,
    organization_id: UUID,
    limit_key: str,
    *,
    increment: int = 1,
) -> Entitlements:
    ent = await paywall.resolve_from_db(db, organization_id)
    current = int(ent.usage.get(limit_key) or 0)
    return paywall.check_limit(ent, limit_key, increment=increment, current=current)


async def enforce_create_business(db: AsyncSession, organization_id: UUID) -> Entitlements:
    return await paywall.enforce_create_business(db, organization_id)


async def enforce_create_staff(db: AsyncSession, organization_id: UUID) -> Entitlements:
    return await paywall.enforce_create_staff(db, organization_id)


async def enforce_create_product(db: AsyncSession, organization_id: UUID) -> Entitlements:
    return await paywall.enforce_create_product(db, organization_id)


async def get_usage_snapshot(db: AsyncSession, organization_id: UUID) -> Dict[str, Any]:
    return await paywall.usage_snapshot(db, organization_id)
