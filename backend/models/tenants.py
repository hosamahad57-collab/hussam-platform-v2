from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Tenants(Base):
    __tablename__ = "tenants"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default='active', server_default='active')
    plan = Column(String(50), nullable=True, default='enterprise', server_default='enterprise')
    max_accounts = Column(Integer, nullable=True, default=100, server_default='100')
    metadata_json = Column(String, nullable=True, default='{}', server_default='{}')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)