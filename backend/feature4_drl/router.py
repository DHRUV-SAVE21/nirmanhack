from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from .pipeline import get_recommender
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/feature4",
    tags=["Crop Recommendations"]
)

# --- Pydantic Models ---

class CropRecommendationRequest(BaseModel):
    # Soil parameters
    soil_n: float = Field(..., description="Soil Nitrogen (kg/ha)", example=50)
    soil_p: float = Field(..., description="Soil Phosphorus (kg/ha)", example=35)
    soil_k: float = Field(..., description="Soil Potassium (kg/ha)", example=40)
    soil_ph: float = Field(..., description="Soil pH", example=6.5)
    soil_moisture: float = Field(..., description="Soil Moisture (%)", example=55)
    
    # Climate parameters
    avg_temperature: float = Field(..., description="Average Temperature (°C)", example=28)
    seasonal_rainfall: float = Field(..., description="Seasonal Rainfall (mm)", example=850)
    humidity: float = Field(..., description="Humidity (%)", example=65)
    
    # Crop parameters
    crop_duration_days: float = Field(..., description="Available duration for crop (days)", example=120)
    
    # Optional parameters (with defaults)
    district: str = Field("Sample", description="District Name")
    state: str = Field("Sample", description="State Name")
    soil_type: str = Field("Alluvial", description="Soil Type")
    climate_season: str = Field("Kharif", description="Season")
    previous_crop: str = Field("Rice", description="Previous Crop")
    crop_water_requirement: str = Field("Medium", description="Water Availability/Requirement")


class CropRecommendationResponse(BaseModel):
    rank: int
    crop_name: str
    predicted_yield: float
    yield_unit: str
    yield_comparison_pct: float
    predicted_risk_score: float
    risk_level: str
    water_requirement: str
    duration_days: float
    confidence_score: float
    expected_revenue: float
    market_price: float
    potential_loss: float
    revenue_uplift_pct: float
    previous_revenue: float

class RecommendationResult(BaseModel):
    success: bool
    data: List[CropRecommendationResponse]

# --- Endpoints ---

@router.get("/health")
def health_check():
    recommender = get_recommender()
    if recommender and recommender.initialized:
        return {"status": "healthy", "service": "crop-recommendation-system", "models_loaded": True}
    else:
        return {"status": "degraded", "service": "crop-recommendation-system", "models_loaded": False}

@router.get("/crops")
def get_available_crops():
    """Get list of all supported crops"""
    recommender = get_recommender()
    if not recommender or not recommender.initialized:
         raise HTTPException(status_code=503, detail="Crop Recommendation System is initializing or failed to load.")
    
    return {
        "success": True,
        "count": len(recommender.available_crops),
        "crops": list(recommender.available_crops)
    }

@router.post("/recommend", response_model=RecommendationResult)
def recommend_crops(request: CropRecommendationRequest):
    """
    Get top crop recommendations based on environmental conditions.
    Uses XGBoost models for Yield Prediction and Risk Assessment.
    """
    recommender = get_recommender()
    if not recommender or not recommender.initialized:
        raise HTTPException(status_code=503, detail="Crop Recommendation System is initializing or failed to load.")

    try:
        # Convert request to dictionary
        input_data = request.dict()
        
        # Get recommendations
        recommendations = recommender.get_top_recommendations(input_data, top_n=3)
        
        return {
            "success": True,
            "data": recommendations
        }
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Mock Endpoints REMOVED ---
# These functionality is now provided by feature4 (Scheme Agent)
# to avoid route conflicts.
#
# @router.get("/schemes")
# ... (removed)

