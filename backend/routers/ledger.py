import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.ledger_service import LedgerService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ledger", tags=["ledger"])


class DoubleEntryRequest(BaseModel):
    tenant_id: int = 1
    debit_account_id: int
    credit_account_id: int
    amount: float
    currency: str = "YER"
    description: str = ""


class AccountBalanceRequest(BaseModel):
    account_id: int


class TenantLedgerRequest(BaseModel):
    tenant_id: int


@router.post("/double-entry")
async def create_double_entry(data: DoubleEntryRequest, db: AsyncSession = Depends(get_db)):
    """Create a double-entry bookkeeping transaction"""
    service = LedgerService(db)
    return await service.create_double_entry(data.model_dump())


@router.post("/account-balance")
async def get_account_balance(data: AccountBalanceRequest, db: AsyncSession = Depends(get_db)):
    """Get account balance from double-entry records"""
    service = LedgerService(db)
    return await service.get_account_balance(data.account_id)


@router.post("/tenant-summary")
async def get_tenant_ledger_summary(data: TenantLedgerRequest, db: AsyncSession = Depends(get_db)):
    """Get full ledger summary for a tenant"""
    service = LedgerService(db)
    return await service.get_tenant_ledger_summary(data.tenant_id)