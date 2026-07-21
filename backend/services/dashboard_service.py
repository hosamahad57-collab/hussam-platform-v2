import logging
from typing import Dict, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.tenants import Tenants
from models.accounts import Accounts
from models.ledger_entries import Ledger_entries
from models.ledger_transactions import Ledger_transactions
from models.ai_logs import Ai_logs

logger = logging.getLogger(__name__)


async def get_dashboard_stats(db: AsyncSession) -> Dict[str, Any]:
    """Get aggregate dashboard statistics."""
    # Total tenants
    total_tenants_result = await db.execute(select(func.count(Tenants.id)))
    total_tenants = total_tenants_result.scalar() or 0

    # Active tenants
    active_tenants_result = await db.execute(
        select(func.count(Tenants.id)).where(Tenants.status == "active")
    )
    active_tenants = active_tenants_result.scalar() or 0

    # Total accounts
    total_accounts_result = await db.execute(select(func.count(Accounts.id)))
    total_accounts = total_accounts_result.scalar() or 0

    # Total ledger entries
    total_entries_result = await db.execute(select(func.count(Ledger_entries.id)))
    total_entries = total_entries_result.scalar() or 0

    # Total transactions
    total_transactions_result = await db.execute(select(func.count(Ledger_transactions.id)))
    total_transactions = total_transactions_result.scalar() or 0

    # Total AI requests
    total_ai_result = await db.execute(select(func.count(Ai_logs.id)))
    total_ai = total_ai_result.scalar() or 0

    # AI success rate
    success_ai_result = await db.execute(
        select(func.count(Ai_logs.id)).where(Ai_logs.status == "success")
    )
    success_ai = success_ai_result.scalar() or 0
    success_rate = round((success_ai / total_ai * 100), 1) if total_ai > 0 else 0

    # Recent activity - last 5 AI logs
    recent_result = await db.execute(
        select(Ai_logs).order_by(Ai_logs.id.desc()).limit(5)
    )
    recent_logs = recent_result.scalars().all()
    recent_activity = [
        {
            "id": log.id,
            "tenant_id": log.tenant_id,
            "request_id": log.request_id,
            "model": log.model,
            "status": log.status,
            "tokens_used": log.tokens_used,
            "latency_ms": log.latency_ms,
        }
        for log in recent_logs
    ]

    return {
        "total_tenants": total_tenants,
        "active_tenants": active_tenants,
        "total_accounts": total_accounts,
        "total_ledger_entries": total_entries,
        "total_transactions": total_transactions,
        "total_ai_requests": total_ai,
        "success_rate": success_rate,
        "recent_activity": recent_activity,
    }