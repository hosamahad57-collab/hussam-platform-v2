import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.marketplace_service import MarketplaceService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/marketplace", tags=["marketplace"])


class CatalogRequest(BaseModel):
    category: Optional[str] = None
    search: Optional[str] = None
    currency: str = "USD"


class CheckoutItem(BaseModel):
    product_id: int
    quantity: int = 1


class CheckoutRequest(BaseModel):
    items: List[CheckoutItem]
    currency: str = "USD"


@router.post("/catalog")
async def get_catalog(data: CatalogRequest, db: AsyncSession = Depends(get_db)):
    """Get product catalog with filtering and currency conversion"""
    service = MarketplaceService(db)
    return await service.get_catalog(
        category=data.category,
        search=data.search,
        currency=data.currency,
    )


@router.post("/checkout")
async def process_checkout(data: CheckoutRequest, db: AsyncSession = Depends(get_db)):
    """Process checkout order"""
    service = MarketplaceService(db)
    items = [{"product_id": item.product_id, "quantity": item.quantity} for item in data.items]
    return await service.process_checkout(items, currency=data.currency)


@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all product categories"""
    service = MarketplaceService(db)
    categories = await service.get_categories()
    return {"categories": categories}


@router.get("/exchange-rates")
async def get_exchange_rates(db: AsyncSession = Depends(get_db)):
    """Get current exchange rates"""
    service = MarketplaceService(db)
    rates = await service.get_exchange_rates()
    return {"rates": rates}