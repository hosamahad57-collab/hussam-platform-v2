from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Payment_verifications(Base):
    __tablename__ = "payment_verifications"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    tenant_id = Column(Integer, nullable=False)
    gateway = Column(String(100), nullable=False)
    reference_number = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=True, default='YER', server_default='YER')
    sender_name = Column(String(255), nullable=True)
    status = Column(String(50), nullable=True, default='pending', server_default='pending')
    verified_at = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)