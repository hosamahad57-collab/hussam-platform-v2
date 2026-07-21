from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Accounts(Base):
    __tablename__ = "accounts"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    tenant_id = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)
    account_type = Column(String(50), nullable=False)
    balance = Column(Float, nullable=True, default=0, server_default='0')
    currency = Column(String(10), nullable=True, default='USD', server_default='USD')
    status = Column(String(50), nullable=True, default='active', server_default='active')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)