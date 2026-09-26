from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import json

from .inference import predict_top_crops

router = APIRouter(prefix="/api/crop-yield", tags=["Crop Yield AI"])

class PredictionRequest(BaseModel):
    ndvi: float = 0.5
    moisture: float = 0.5
    nitrogen: float = 0.5
    temp: float = 0.5
    rainfall: float = 0.1
    soil_type: str = "Alluvial"

class ExplainRequest(BaseModel):
    crop_name: str
    yield_tons_ha: float
    mandi_price_quintal: float
    profit_margin_pct: float
    revenue_ha: float
    cost_ha: float
    profit_ha: float
    soil_type: str
    ndvi: float = 0.5
    moisture: float = 0.5
    nitrogen: float = 0.5
    temp: float = 0.5
    rainfall: float = 0.1

@router.post("/predict")
async def get_crop_predictions(request: PredictionRequest):
    try:
        result = await predict_top_crops(
            ndvi=request.ndvi,
            moisture=request.moisture,
            nitrogen=request.nitrogen,
            temp=request.temp,
            rainfall=request.rainfall,
            soil_type=request.soil_type
        )
            
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/iot-telemetry")
async def get_iot_telemetry():
    """
    Fetches latest IoT sensor data and maps it to the 0-1 scale
    used by the crop yield prediction model.
    """
    try:
        from services.sensor_service import get_latest_sensor_data
        raw = get_latest_sensor_data()
        
        if not raw or "error" in (raw if isinstance(raw, dict) else {}):
            return {"success": False, "error": "No IoT sensor data available. Connect your hardware first."}
        
        # The sensor data is nested under "data" key
        sensor = raw.get("data", raw) if isinstance(raw, dict) else {}
        
        # Map real sensor values to 0-1 normalized scale
        # Soil Moisture: 0-100% → 0-1
        moisture_raw = float(sensor.get("soil_moisture", 0))
        moisture = min(max(moisture_raw / 100.0, 0), 1)
        
        # Nitrogen: 0-500 mg/kg → 0-1
        nitrogen_raw = float(sensor.get("nitrogen", 0))
        nitrogen = min(max(nitrogen_raw / 500.0, 0), 1)
        
        # Temperature: 0-60°C → 0-1
        temp_raw = float(sensor.get("soil_temperature", 25))
        temp = min(max(temp_raw / 60.0, 0), 1)
        
        # NDVI: estimate from moisture & nitrogen (no direct sensor)
        ndvi = min(max((moisture * 0.6 + nitrogen * 0.4), 0), 1)
        
        # Rainfall: not from soil sensor, use a default (0.4 * 1200 = 480mm)
        rainfall = 0.4
        
        return {
            "success": True,
            "telemetry": {
                "ndvi": round(ndvi, 2),
                "moisture": round(moisture_raw, 1),
                "nitrogen": round(nitrogen_raw, 1),
                "temp": round(temp_raw, 1),
                "rainfall": 480.0
            },
            "raw": {
                "soil_moisture": moisture_raw,
                "nitrogen_mg_kg": nitrogen_raw,
                "temperature_c": temp_raw,
                "phosphorus": sensor.get("phosphorus", 0),
                "potassium": sensor.get("potassium", 0),
                "ph": sensor.get("ph", 0),
                "conductivity": sensor.get("conductivity", 0)
            },
            "last_updated": sensor.get("last_updated", raw.get("created_at", "unknown"))
        }
    except Exception as e:
        print(f"IoT telemetry error: {e}")
        return {"success": False, "error": str(e)}

@router.post("/explain")
async def explain_crop_prediction(request: ExplainRequest):
    """
    Uses Gemini to generate explainable AI insights for a specific crop prediction.
    """
    try:
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
            load_dotenv(env_path)
            api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")
        
        from google import genai as google_genai
        client = google_genai.Client(api_key=api_key)
        
        prompt = f"""You are an expert Indian agricultural economist and advisor. A crop yield prediction AI has recommended the following crop. Provide a brief, actionable analysis.

**Crop:** {request.crop_name}
**Predicted Yield:** {request.yield_tons_ha} Tons/Ha
**Mandi Price:** ₹{request.mandi_price_quintal}/Quintal
**ROI:** {request.profit_margin_pct}%
**Revenue:** ₹{request.revenue_ha}/Ha
**Cost of Cultivation:** ₹{request.cost_ha}/Ha
**Net Profit:** ₹{request.profit_ha}/Ha
**Soil Type:** {request.soil_type}
**Current Conditions:** NDVI={request.ndvi}, Moisture={request.moisture*100:.1f}%, Nitrogen={request.nitrogen*500:.0f} mg/kg, Temp={request.temp*60:.1f}°C, Rainfall={request.rainfall*1200:.0f}mm

Return ONLY a valid JSON object with these fields (no markdown, no code blocks):
{{
  "roi_explanation": "2-3 sentences explaining WHY this ROI is calculated — break down the revenue vs cost logic simply.",
  "market_conditions": "2-3 sentences about current Indian market conditions for this crop — demand, price trends, seasonal factors.",
  "maximize_tips": ["tip 1", "tip 2", "tip 3"],
  "risks": ["risk 1", "risk 2"],
  "best_season": "When to plant for maximum yield",
  "confidence_note": "One sentence on how confident the prediction is given the soil and climate inputs"
}}"""
        
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        
        raw = response.text.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) >= 2 else raw
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()
        
        insights = json.loads(raw)
        return {"success": True, "insights": insights}
        
    except json.JSONDecodeError:
        return {
            "success": True,
            "insights": {
                "roi_explanation": raw if raw else "Analysis could not be parsed.",
                "market_conditions": "Market data is sourced from Indian Mandi APIs with regional price awareness.",
                "maximize_tips": ["Ensure proper irrigation", "Use recommended fertilizer doses", "Monitor pest infestations early"],
                "risks": ["Weather uncertainty", "Market price fluctuation"],
                "best_season": "Consult local agricultural calendar",
                "confidence_note": "Prediction confidence depends on input data quality."
            }
        }
    except Exception as e:
        print(f"Gemini explain error: {e}")
        return {
            "success": True,
            "insights": {
                "roi_explanation": f"{request.crop_name} with a yield of {request.yield_tons_ha} T/ha at ₹{request.mandi_price_quintal}/Qtl generates ₹{request.revenue_ha}/ha revenue against ₹{request.cost_ha}/ha cost, resulting in {request.profit_margin_pct}% ROI.",
                "market_conditions": f"Current Mandi price for {request.crop_name} is ₹{request.mandi_price_quintal}/Qtl. Prices vary by season and region.",
                "maximize_tips": ["Optimize irrigation scheduling", "Apply balanced NPK fertilizers", "Choose disease-resistant varieties"],
                "risks": ["Unpredictable monsoon patterns", "Mandi price volatility"],
                "best_season": "Refer to regional Kharif/Rabi calendar for optimal sowing window",
                "confidence_note": "Analysis generated from available prediction data."
            }
        }
