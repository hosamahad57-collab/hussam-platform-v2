from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Products(Base):
    __tablename__ = "products"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    tenant_id = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String, nullable=True)
    price_usd = Column(Float, nullable=False)
    price_yer = Column(Float, nullable=True)
    price_sar = Column(Float, nullable=True)
    stock = Column(Integer, nullable=True, default=0, server_default='0')
    category = Column(String(100), nullable=False)
    image_url = Column(String(500), nullable=True)
    vendor_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=True, default='active', server_default='active')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)