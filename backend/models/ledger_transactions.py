from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Ledger_transactions(Base):
    __tablename__ = "ledger_transactions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    tenant_id = Column(Integer, nullable=False)
    ledger_entry_id = Column(Integer, nullable=False)
    debit_account = Column(String(255), nullable=False)
    credit_account = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), nullable=True, default='completed', server_default='completed')
    memo = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)