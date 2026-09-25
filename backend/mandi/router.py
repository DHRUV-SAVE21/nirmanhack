from fastapi import APIRouter, Query
from typing import Optional, List, Dict
from services.mandi_service import MandiService

router = APIRouter(prefix="/mandi", tags=["Market Prices"])

@router.get("/prices")
async def get_mandi_prices(
    commodity: Optional[str] = Query(None, description="Crop name e.g. Wheat, Rice"),
    state: Optional[str] = Query(None, description="State name e.g. Maharashtra, Punjab")
):
    """
    Get live market prices from Government Mandis (Data.gov.in)
    """
    prices = await MandiService.get_market_prices(commodity=commodity, state=state)
    return {
        "success": True,
        "count": len(prices),
        "data": prices
    }

@router.get("/suggested-price")
async def get_suggested_price(
    crop: str = Query(..., description="Crop name"),
    state: Optional[str] = Query("Maharashtra", description="State")
):
    """
    Returns a single recommended price based on current market averages.
    """
    avg_price = await MandiService.get_price_for_crop(crop, state)
    
    if avg_price:
        return {
            "success": True,
            "crop": crop,
            "suggested_price": round(avg_price, 2),
            "unit": "Quintal",
            "currency": "INR",
            "source": "Mandi API (Data.gov.in)"
        }
    else:
        return {
            "success": False,
            "message": f"No recent price data found for {crop}"
        }
