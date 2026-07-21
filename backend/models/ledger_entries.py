from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Ledger_entries(Base):
    __tablename__ = "ledger_entries"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    tenant_id = Column(Integer, nullable=False)
    account_id = Column(Integer, nullable=False)
    description = Column(String(500), nullable=False)
    amount = Column(Float, nullable=False)
    entry_type = Column(String(50), nullable=False)
    reference_id = Column(String(255), nullable=True)
    status = Column(String(50), nullable=True, default='posted', server_default='posted')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)