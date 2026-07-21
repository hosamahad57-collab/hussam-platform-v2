import logging
from typing import Dict, Any, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from models.products import Products

logger = logging.getLogger(__name__)

# Real-time exchange rates (simulated with realistic values)
EXCHANGE_RATES = {
    "USD": 1.0,
    "YER_SANAA": 600.0,
    "YER_ADEN": 1820.0,
    "SAR": 3.75,
}


class MarketplaceService:
    """Yemen's Amazon - Sovereign Marketplace Service"""

    def __init__(self, db: AsyncSession):
        self.db = db

    def convert_price(self, usd_price: float, target_currency: str) -> float:
        """Convert USD price to target currency"""
        rate = EXCHANGE_RATES.get(target_currency, 1.0)
        return round(usd_price * rate, 2)

    async def get_catalog(self, category: str = None, search: str = None, currency: str = "USD") -> Dict[str, Any]:
        """Get product catalog with optional filtering and currency conversion"""
        query = select(Products).where(Products.status == "active")

        if category and category != "All":
            query = query.where(Products.category == category)

        result = await self.db.execute(query)
        products = result.scalars().all()

        # Apply search filter in Python (for flexibility)
        if search:
            search_lower = search.lower()
            products = [p for p in products if
                        search_lower in (p.name or "").lower() or
                        search_lower in (p.vendor_name or "").lower()]

        items = []
        for p in products:
            item = {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price_usd": float(p.price_usd),
                "price_display": self.convert_price(float(p.price_usd), currency),
                "currency": currency,
                "stock": p.stock,
                "category": p.category,
                "vendor_name": p.vendor_name,
            }
            items.append(item)

        return {
            "items": items,
            "total": len(items),
            "currency": currency,
            "exchange_rate": EXCHANGE_RATES.get(currency, 1.0),
        }

    async def process_checkout(self, items: List[Dict[str, Any]], currency: str = "USD") -> Dict[str, Any]:
        """Process a checkout order - validate stock and calculate totals"""
        order_items = []
        total_usd = 0

        for item in items:
            product_id = item.get("product_id")
            quantity = item.get("quantity", 1)

            result = await self.db.execute(
                select(Products).where(Products.id == product_id)
            )
            product = result.scalar_one_or_none()

            if not product:
                return {"success": False, "error": f"Product {product_id} not found"}

            if product.stock < quantity:
                return {"success": False, "error": f"Insufficient stock for {product.name}"}

            # Deduct stock
            product.stock -= quantity
            line_total = float(product.price_usd) * quantity
            total_usd += line_total

            order_items.append({
                "product_id": product.id,
                "name": product.name,
                "quantity": quantity,
                "unit_price_usd": float(product.price_usd),
                "line_total_usd": line_total,
            })

        await self.db.commit()

        return {
            "success": True,
            "order_items": order_items,
            "total_usd": total_usd,
            "total_display": self.convert_price(total_usd, currency),
            "currency": currency,
            "exchange_rate": EXCHANGE_RATES.get(currency, 1.0),
        }

    async def get_categories(self) -> List[str]:
        """Get all product categories"""
        result = await self.db.execute(
            select(Products.category).distinct()
        )
        return [row[0] for row in result.all()]

    async def get_exchange_rates(self) -> Dict[str, float]:
        """Get current exchange rates"""
        return EXCHANGE_RATES