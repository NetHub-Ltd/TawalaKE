from fastapi import APIRouter
from app.api.routes import products, sales, payments, business, checkout,staff,tenants

api_router = APIRouter(prefix='/api/v1')

api_router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])
api_router.include_router(business.router, prefix="/business", tags=["Business"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(checkout.router, prefix="/terminal", tags=["Checkout Pipeline"])
api_router.include_router(staff.router, prefix="/staff", tags=["Staff Management"])

