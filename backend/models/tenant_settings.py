from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Tenant_settings(Base):
    __tablename__ = "tenant_settings"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    tenant_id = Column(Integer, nullable=False)
    setting_key = Column(String(255), nullable=False)
    setting_value = Column(String, nullable=False)
    category = Column(String(100), nullable=True, default='general', server_default='general')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)