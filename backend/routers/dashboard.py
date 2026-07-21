import logging
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.dashboard_service import get_dashboard_stats

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


class ActivityItem(BaseModel):
    id: int
    tenant_id: int
    request_id: str
    model: str
    status: str
    tokens_used: int
    latency_ms: int


class DashboardStats(BaseModel):
    total_tenants: int
    active_tenants: int
    total_accounts: int
    total_ledger_entries: int
    total_transactions: int
    total_ai_requests: int
    success_rate: float
    recent_activity: List[dict]


@router.get("/stats", response_model=DashboardStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregate dashboard statistics."""
    stats = await get_dashboard_stats(db)
    return DashboardStats(**stats)