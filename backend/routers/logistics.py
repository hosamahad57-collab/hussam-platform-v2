import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.logistics_service import LogisticsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/logistics", tags=["logistics"])


class RouteCalculationRequest(BaseModel):
    origin: str
    destination: str
    carrier: str = "Al-Universal Express"
    weight_kg: float = 1.0


class CreateShipmentRequest(BaseModel):
    tenant_id: int = 1
    order_reference: Optional[str] = None
    origin_governorate: str
    destination_governorate: str
    carrier: str = "Al-Universal Express"
    weight_kg: float = 1.0


@router.get("/stats")
async def get_shipment_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregated shipment statistics"""
    service = LogisticsService(db)
    return await service.get_shipment_stats()


@router.post("/calculate-route")
async def calculate_route(data: RouteCalculationRequest, db: AsyncSession = Depends(get_db)):
    """Calculate shipping route, cost, and ETA"""
    service = LogisticsService(db)
    return service.calculate_route(
        origin=data.origin,
        destination=data.destination,
        carrier=data.carrier,
        weight_kg=data.weight_kg,
    )


@router.post("/create-shipment")
async def create_shipment(data: CreateShipmentRequest, db: AsyncSession = Depends(get_db)):
    """Create a new shipment"""
    service = LogisticsService(db)
    return await service.create_shipment(data.model_dump())