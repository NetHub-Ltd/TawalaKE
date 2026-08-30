from fastapi import APIRouter, Depends
from app.api.routes import organization, products, sales, payments, staff, auth, management, stores, staff_mgmt, stock
from app.core.config import settings

from app.utils.logging import logger
from app.api.deps import AuthUser, get_current_staff
from app.api.paywall_deps import require_paywall, require_active_plan


api_router = APIRouter(prefix='/api/v1')

if settings.admin_route:
    logger.info("Admin route is enabled. Including management routes.")
    api_router.include_router(
        management.router,
        prefix="/management",
        tags=["Management"],
        dependencies=[Depends(get_current_staff)],
    ),  # ,

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(
    organization.router,
    prefix="/organizations",
    tags=["Organization Management"],
)
# Root feature combo (≥3): POS + stock + invoicing — core commerce surface
_commerce_gate = [
    Depends(require_active_plan),
    Depends(require_paywall("pos_and_sales", "basic_stock_tracking", "invoicing")),
]
api_router.include_router(
    stores.router,
    prefix="/business",
    tags=["Store Management"],
    dependencies=_commerce_gate,
)
api_router.include_router(
    staff_mgmt.router,
    prefix="/business/staff",
    tags=["Staff Management"],
    dependencies=[Depends(require_active_plan)],
)
api_router.include_router(
    products.router,
    prefix="/products",
    tags=["products"],
    dependencies=_commerce_gate,
)
api_router.include_router(
    stock.router,
    prefix="/stock",
    tags=["Stock"],
    dependencies=[
        Depends(require_active_plan),
        Depends(require_paywall("basic_stock_tracking", "pos_and_sales", "invoicing")),
    ],
)
# api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
# api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
# api_router.include_router(checkout.router, prefix="/terminal", tags=["Checkout Pipeline"])
# api_router.include_router(staff.router, prefix="/staff", tags=["Staff Management"])
