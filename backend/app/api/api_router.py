from fastapi import APIRouter, Depends
from app.api.routes import organization, products, sales, payments,staff, auth, management, stores
from app.core.config import settings
api_router = APIRouter(prefix='/api/v1')
from app.utils.logging import logger
from app.api.deps import AuthUser, get_current_staff


if settings.admin_route:
    logger.info("Admin route is enabled. Including management routes.")
    api_router.include_router(management.router, prefix="/management", dependencies=[Depends(get_current_staff)], tags=["Management"])

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(organization.router, prefix="/organizations", tags=["Organization Management"])
api_router.include_router(stores.router, prefix="/business", tags=["Store Management"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
# api_router.include_router(checkout.router, prefix="/terminal", tags=["Checkout Pipeline"])
api_router.include_router(staff.router, prefix="/staff", tags=["Staff Management"])

