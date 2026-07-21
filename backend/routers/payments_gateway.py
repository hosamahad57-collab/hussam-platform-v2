import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.payment_verification_service import PaymentVerificationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/payments-gateway", tags=["payments-gateway"])


class VerifyReferenceRequest(BaseModel):
    reference_number: str
    tenant_id: Optional[int] = None


class ApprovePaymentRequest(BaseModel):
    payment_id: int


@router.post("/verify")
async def verify_reference(data: VerifyReferenceRequest, db: AsyncSession = Depends(get_db)):
    """Verify a transaction reference number against the escrow ledger"""
    service = PaymentVerificationService(db)
    return await service.verify_reference(
        reference_number=data.reference_number,
        tenant_id=data.tenant_id,
    )


@router.post("/approve")
async def approve_payment(data: ApprovePaymentRequest, db: AsyncSession = Depends(get_db)):
    """Manually approve a pending payment"""
    service = PaymentVerificationService(db)
    return await service.approve_payment(data.payment_id)


@router.get("/stats")
async def get_gateway_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregated payment gateway statistics"""
    service = PaymentVerificationService(db)
    return await service.get_gateway_stats()