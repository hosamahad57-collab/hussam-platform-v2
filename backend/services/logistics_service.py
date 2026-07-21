import logging
import random
from typing import Dict, Any, List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from models.shipments import Shipments

logger = logging.getLogger(__name__)

# Governorate distance matrix (approximate km)
GOVERNORATE_DISTANCES = {
    ("Sana'a", "Aden"): 350,
    ("Sana'a", "Taiz"): 256,
    ("Sana'a", "Hadramout"): 770,
    ("Sana'a", "Marib"): 173,
    ("Sana'a", "Ibb"): 193,
    ("Sana'a", "Hodeidah"): 226,
    ("Aden", "Taiz"): 170,
    ("Aden", "Hadramout"): 630,
    ("Aden", "Marib"): 450,
    ("Aden", "Ibb"): 260,
    ("Taiz", "Marib"): 380,
    ("Taiz", "Ibb"): 70,
    ("Hadramout", "Marib"): 600,
    ("Socotra", "Aden"): 380,  # Sea route
}

# Carrier speed profiles (km/day)
CARRIER_SPEEDS = {
    "Al-Universal Express": 180,
    "Yemen Express": 200,
    "Bus Freight Network": 150,
    "Local Motorcycle Courier": 100,
}

# Cost per kg per km (YER)
COST_PER_KG_KM = {
    "Al-Universal Express": 3.5,
    "Yemen Express": 4.2,
    "Bus Freight Network": 2.0,
    "Local Motorcycle Courier": 5.0,
}


class LogisticsService:
    """Inter-governorate logistics and transport service"""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _get_distance(self, origin: str, destination: str) -> int:
        """Get distance between two governorates"""
        key1 = (origin, destination)
        key2 = (destination, origin)
        return GOVERNORATE_DISTANCES.get(key1, GOVERNORATE_DISTANCES.get(key2, 300))

    def calculate_route(self, origin: str, destination: str, carrier: str, weight_kg: float) -> Dict[str, Any]:
        """Calculate shipping route, cost, and estimated delivery"""
        distance = self._get_distance(origin, destination)
        speed = CARRIER_SPEEDS.get(carrier, 150)
        cost_rate = COST_PER_KG_KM.get(carrier, 3.0)

        estimated_days = max(1, round(distance / speed))
        shipping_cost = round(distance * weight_kg * cost_rate)

        # Add base fee
        base_fee = 1000
        shipping_cost += base_fee

        return {
            "origin": origin,
            "destination": destination,
            "carrier": carrier,
            "distance_km": distance,
            "weight_kg": weight_kg,
            "estimated_days": estimated_days,
            "shipping_cost_yer": shipping_cost,
            "route_type": "direct" if distance < 400 else "multi-hop",
        }

    async def get_shipment_stats(self) -> Dict[str, Any]:
        """Get aggregated shipment statistics"""
        result = await self.db.execute(select(Shipments))
        shipments = result.scalars().all()

        stats = {
            "total": len(shipments),
            "in_transit": sum(1 for s in shipments if s.status == "in_transit"),
            "delivered": sum(1 for s in shipments if s.status == "delivered"),
            "processing": sum(1 for s in shipments if s.status == "processing"),
            "failed": sum(1 for s in shipments if s.status == "failed"),
            "total_weight_kg": sum(float(s.weight_kg or 0) for s in shipments),
            "total_cost_yer": sum(float(s.shipping_cost_yer or 0) for s in shipments),
        }

        # Route frequency
        routes = {}
        for s in shipments:
            route_key = f"{s.origin_governorate} → {s.destination_governorate}"
            routes[route_key] = routes.get(route_key, 0) + 1

        stats["popular_routes"] = sorted(routes.items(), key=lambda x: x[1], reverse=True)[:5]
        return stats

    async def create_shipment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new shipment with calculated route"""
        origin = data["origin_governorate"]
        destination = data["destination_governorate"]
        carrier = data.get("carrier", "Al-Universal Express")
        weight_kg = data.get("weight_kg", 1.0)

        route = self.calculate_route(origin, destination, carrier, weight_kg)

        tracking_code = f"{carrier[:3].upper()}-{random.randint(10000, 99999)}-YM"
        order_reference = data.get("order_reference") or f"ORD-YA-2026-{random.randint(1000, 9999)}"

        shipment = Shipments(
            tenant_id=data.get("tenant_id", 1),
            order_reference=order_reference,
            origin_governorate=origin,
            destination_governorate=destination,
            carrier=carrier,
            status="processing",
            estimated_days=route["estimated_days"],
            tracking_code=tracking_code,
            weight_kg=weight_kg,
            shipping_cost_yer=route["shipping_cost_yer"],
        )
        self.db.add(shipment)
        await self.db.commit()
        await self.db.refresh(shipment)

        return {
            "id": shipment.id,
            "tracking_code": tracking_code,
            "route": route,
            "status": "processing",
        }