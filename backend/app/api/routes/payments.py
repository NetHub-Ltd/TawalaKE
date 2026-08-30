"""Payment webhooks and STK — fulfillment hooks into subscription activation.

STK push / M-Pesa still need provider credentials. Confirmation path invalidates
and can activate a plan when org_id + plan_code are supplied (internal/ops).
Public confirmation without org binding is rejected.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import SessionDep
from app.crud import subscription as subscription_crud
from app.schemas.schemas import ApiResponse

router = APIRouter()


class StkPushBody(BaseModel):
    organization_id: UUID
    amount: float = Field(gt=0)
    phone: str
    plan_code: str = "NDOVU"
    days: int = Field(default=30, ge=1, le=366)


class PaymentConfirmationBody(BaseModel):
    organization_id: UUID
    plan_code: str = "NDOVU"
    days: int = Field(default=30, ge=1, le=366)
    external_ref: Optional[str] = None
    amount: Optional[float] = None


@router.post("/stk-push")
async def stk_push(body: StkPushBody):
    """
    Initiate STK push (provider integration pending).
    Returns accepted payload for client polling; does not activate subscription yet.
    """
    return {
        "message": "STK Push accepted (provider not configured)",
        "organization_id": str(body.organization_id),
        "plan_code": body.plan_code,
        "amount": body.amount,
        "status": "pending",
    }


@router.post("/confirmation", response_model=ApiResponse[dict])
async def confirmation(body: PaymentConfirmationBody, db: SessionDep):
    """
    Payment confirmation / webhook fulfillment.
    Activates or extends the org plan and invalidates paywall cache.
    Protect this route at the edge (IP allowlist / shared secret) in production.
    """
    sub, plan = await subscription_crud.activate_or_extend_subscription(
        db,
        body.organization_id,
        plan_code=body.plan_code,
        days=body.days,
    )
    return ApiResponse(
        status=True,
        status_code=200,
        message="Payment confirmed; subscription activated",
        data={
            "subscription_id": str(sub.id),
            "plan_code": plan.code,
            "organization_id": str(body.organization_id),
            "external_ref": body.external_ref,
            "end_date": sub.end_date.isoformat() if sub.end_date else None,
        },
    )


@router.post("/validation")
async def validation():
    """Provider validation callback placeholder."""
    return {"ResultCode": 0, "ResultDesc": "Accepted"}
