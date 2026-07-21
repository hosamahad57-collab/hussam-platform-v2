from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Ai_logs(Base):
    __tablename__ = "ai_logs"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    tenant_id = Column(Integer, nullable=False)
    request_id = Column(String(255), nullable=False)
    model = Column(String(100), nullable=False)
    prompt = Column(String, nullable=False)
    response = Column(String, nullable=True)
    tokens_used = Column(Integer, nullable=True, default=0, server_default='0')
    latency_ms = Column(Integer, nullable=True, default=0, server_default='0')
    status = Column(String(50), nullable=True, default='success', server_default='success')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)