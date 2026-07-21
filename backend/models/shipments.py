from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Shipments(Base):
    __tablename__ = "shipments"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    tenant_id = Column(Integer, nullable=False)
    order_reference = Column(String(255), nullable=False)
    origin_governorate = Column(String(100), nullable=False)
    destination_governorate = Column(String(100), nullable=False)
    carrier = Column(String(100), nullable=False)
    status = Column(String(50), nullable=True, default='in_transit', server_default='in_transit')
    estimated_days = Column(Integer, nullable=True, default=3, server_default='3')
    tracking_code = Column(String(100), nullable=True)
    weight_kg = Column(Float, nullable=True, default=1.0, server_default='1.0')
    shipping_cost_yer = Column(Float, nullable=True, default=0, server_default='0')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)