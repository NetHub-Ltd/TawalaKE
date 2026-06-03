from fastapi import APIRouter
from app.api.routes import organization, products, sales, payments, checkout,staff, auth, management, stores
from app.core.config import settings
api_router = APIRouter(prefix='/api/v1')


if settings.admin_route:
    api_router.include_router(management.router, prefix="/management", tags=["Management"])

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(organization.router, prefix="/organizations", tags=["Organization Management"])
api_router.include_router(stores.router, prefix="/business", tags=["Business"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(checkout.router, prefix="/terminal", tags=["Checkout Pipeline"])
api_router.include_router(staff.router, prefix="/staff", tags=["Staff Management"])

