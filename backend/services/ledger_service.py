import logging
from typing import Optional, Dict, Any, List
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from models.ledger_entries import Ledger_entries
from models.ledger_transactions import Ledger_transactions
from models.accounts import Accounts

logger = logging.getLogger(__name__)


class LedgerService:
    """Double-entry bookkeeping ledger service"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_double_entry(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a double-entry bookkeeping transaction (debit + credit)"""
        debit_account_id = data.get("debit_account_id")
        credit_account_id = data.get("credit_account_id")
        amount = data.get("amount", 0)
        description = data.get("description", "")
        tenant_id = data.get("tenant_id", 1)
        currency = data.get("currency", "YER")

        # Create debit entry
        debit_entry = Ledger_entries(
            tenant_id=tenant_id,
            account_id=debit_account_id,
            entry_type="debit",
            amount=amount,
            currency=currency,
            description=f"[DR] {description}",
            status="posted",
        )
        self.db.add(debit_entry)

        # Create credit entry
        credit_entry = Ledger_entries(
            tenant_id=tenant_id,
            account_id=credit_account_id,
            entry_type="credit",
            amount=amount,
            currency=currency,
            description=f"[CR] {description}",
            status="posted",
        )
        self.db.add(credit_entry)

        await self.db.commit()
        await self.db.refresh(debit_entry)
        await self.db.refresh(credit_entry)

        return {
            "debit_entry_id": debit_entry.id,
            "credit_entry_id": credit_entry.id,
            "amount": amount,
            "currency": currency,
            "description": description,
            "status": "posted"
        }

    async def get_account_balance(self, account_id: int) -> Dict[str, Any]:
        """Calculate account balance from double-entry records"""
        debit_result = await self.db.execute(
            select(func.coalesce(func.sum(Ledger_entries.amount), 0)).where(
                Ledger_entries.account_id == account_id,
                Ledger_entries.entry_type == "debit"
            )
        )
        total_debits = float(debit_result.scalar() or 0)

        credit_result = await self.db.execute(
            select(func.coalesce(func.sum(Ledger_entries.amount), 0)).where(
                Ledger_entries.account_id == account_id,
                Ledger_entries.entry_type == "credit"
            )
        )
        total_credits = float(credit_result.scalar() or 0)

        return {
            "account_id": account_id,
            "total_debits": total_debits,
            "total_credits": total_credits,
            "balance": total_debits - total_credits
        }

    async def get_tenant_ledger_summary(self, tenant_id: int) -> Dict[str, Any]:
        """Get full ledger summary for a tenant"""
        entries_result = await self.db.execute(
            select(Ledger_entries).where(Ledger_entries.tenant_id == tenant_id)
            .order_by(Ledger_entries.id.desc()).limit(50)
        )
        entries = entries_result.scalars().all()

        total_debit = sum(e.amount for e in entries if e.entry_type == "debit")
        total_credit = sum(e.amount for e in entries if e.entry_type == "credit")

        return {
            "tenant_id": tenant_id,
            "total_entries": len(entries),
            "total_debits": float(total_debit),
            "total_credits": float(total_credit),
            "net_balance": float(total_debit - total_credit),
            "entries": [
                {
                    "id": e.id,
                    "account_id": e.account_id,
                    "entry_type": e.entry_type,
                    "amount": float(e.amount),
                    "currency": e.currency,
                    "description": e.description,
                    "status": e.status,
                }
                for e in entries
            ]
        }