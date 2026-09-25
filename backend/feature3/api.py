from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from datetime import datetime
from .decision_engine import evaluate_crop_status
from .blockchain_logger import ledger
from .data_simulator import update_data, simulate_drying

router = APIRouter()

# Helper to require Farmer ID
def get_user_id(x_farmer_id: Optional[str] = Header(None)):
    if not x_farmer_id:
        # Fallback for dev/testing if header missing
        return "DEMO_FARMER_001"
    return x_farmer_id

@router.get("/status")
def get_system_status(x_farmer_id: Optional[str] = Header(None)):
    """Returns current sensor data and decision engine status for specific user."""
    user_id = get_user_id(x_farmer_id)
    return evaluate_crop_status(user_id)

@router.post("/run-cycle")
def run_automation_cycle(x_farmer_id: Optional[str] = Header(None)):
    """
    Manually triggers the automation cycle (for Demo).
    Checks sensors -> Decides -> Returns Action.
    """
    user_id = get_user_id(x_farmer_id)
    
    # 1. Simulate data change (e.g. soil getting drier)
    simulate_drying(user_id)
    
    # 2. Evaluate
    status = evaluate_crop_status(user_id)
    
    # 3. Log cycle run
    ledger.log_event(user_id, "Automation Cycle Ran", {"moisture": status["soil_moisture"]})
    
    return status

@router.post("/execute-irrigation")
def execute_irrigation(x_farmer_id: Optional[str] = Header(None)):
    """
    Executes the irrigation action (triggered by User from Dashboard).
    """
    user_id = get_user_id(x_farmer_id)
    
    # 1. Log to Blockchain
    block = ledger.log_event(user_id, "Irrigation Triggered", {"source": "User Dashboard", "amount_liters": 1000})
    
    # 2. Update Soil Data (Simulate watering)
    update_data(user_id, {"soil_moisture": 45, "last_irrigation_hours_ago": 0})
    
    return {
        "status": "success",
        "message": "Irrigation system activated.",
        "blockchain_record": block
    }

from .twilio_manager import TwilioManager

twilio_manager = TwilioManager()

@router.post("/consultation-call")
def make_consultation_call(to_number: str):
    """Triggers a Twilio call to the agronomist."""
    return twilio_manager.make_call(to_number)

@router.get("/history")
def get_history(x_farmer_id: Optional[str] = Header(None)):
    """Returns the immutable ledger history for the user."""
    user_id = get_user_id(x_farmer_id)
    return ledger.get_history(user_id)

@router.get("/recommendations")
def get_recommendations(user_id: str = "HARDWARE_DEFAULT"):
    """
    Get AI-powered recommendations based on current sensor data and crop status.
    Returns actionable insights for irrigation, fertilization, pest control, etc.
    """
    from .decision_engine import evaluate_crop_status
    from .data_simulator import get_data
    
    # Get current status
    status = evaluate_crop_status(user_id)
    sensor_data = get_data(user_id)
    
    recommendations = []
    priority_actions = []
    
    # 1. Irrigation Recommendations
    soil_moisture = sensor_data.get("soil_moisture", 0)
    if soil_moisture < 25:
        recommendations.append({
            "category": "Irrigation",
            "priority": "High",
            "title": "Immediate Irrigation Required",
            "description": f"Soil moisture is critically low at {soil_moisture}%. Crops may experience water stress.",
            "action": "Start irrigation system immediately",
            "impact": "Prevent crop wilting and yield loss",
            "icon": "💧"
        })
        priority_actions.append("irrigation")
    elif soil_moisture < 35:
        recommendations.append({
            "category": "Irrigation",
            "priority": "Medium",
            "title": "Schedule Irrigation Soon",
            "description": f"Soil moisture at {soil_moisture}% is below optimal range (35-45%).",
            "action": "Plan irrigation within next 12 hours",
            "impact": "Maintain optimal growing conditions",
            "icon": "💧"
        })
    else:
        recommendations.append({
            "category": "Irrigation",
            "priority": "Low",
            "title": "Irrigation Status: Good",
            "description": f"Soil moisture at {soil_moisture}% is within optimal range.",
            "action": "No immediate action needed",
            "impact": "Continue monitoring",
            "icon": "✅"
        })
    
    # 2. Temperature Recommendations
    temperature = sensor_data.get("temperature", 25)
    if temperature > 35:
        recommendations.append({
            "category": "Climate Control",
            "priority": "High",
            "title": "High Temperature Alert",
            "description": f"Temperature at {temperature}°C is above optimal range. Risk of heat stress.",
            "action": "Increase irrigation frequency, consider shade nets",
            "impact": "Prevent heat damage to crops",
            "icon": "🌡️"
        })
        priority_actions.append("cooling")
    elif temperature < 15:
        recommendations.append({
            "category": "Climate Control",
            "priority": "Medium",
            "title": "Low Temperature Warning",
            "description": f"Temperature at {temperature}°C may slow crop growth.",
            "action": "Monitor for frost risk, consider protective measures",
            "impact": "Protect crops from cold damage",
            "icon": "❄️"
        })
    
    # 3. Humidity Recommendations
    humidity = sensor_data.get("humidity", 60)
    if humidity > 80:
        recommendations.append({
            "category": "Disease Prevention",
            "priority": "Medium",
            "title": "High Humidity - Disease Risk",
            "description": f"Humidity at {humidity}% increases fungal disease risk.",
            "action": "Improve ventilation, reduce irrigation frequency",
            "impact": "Prevent fungal infections",
            "icon": "🍄"
        })
        priority_actions.append("ventilation")
    elif humidity < 40:
        recommendations.append({
            "category": "Climate Control",
            "priority": "Low",
            "title": "Low Humidity Notice",
            "description": f"Humidity at {humidity}% is below optimal. May increase water needs.",
            "action": "Monitor plant stress, adjust irrigation",
            "impact": "Maintain plant health",
            "icon": "💨"
        })
    
    # 4. NPK Recommendations
    npk = sensor_data.get("npk", "Balanced")
    if npk == "Low Nitrogen":
        recommendations.append({
            "category": "Fertilization",
            "priority": "High",
            "title": "Nitrogen Deficiency Detected",
            "description": "Soil nitrogen levels are low. Leaves may show yellowing.",
            "action": "Apply nitrogen-rich fertilizer (Urea or Ammonium Nitrate)",
            "impact": "Improve leaf growth and crop yield",
            "icon": "🌱"
        })
        priority_actions.append("fertilization")
    elif npk == "Low Phosphorus":
        recommendations.append({
            "category": "Fertilization",
            "priority": "High",
            "title": "Phosphorus Deficiency Detected",
            "description": "Low phosphorus affects root development and flowering.",
            "action": "Apply DAP or SSP fertilizer",
            "impact": "Enhance root growth and fruit development",
            "icon": "🌱"
        })
        priority_actions.append("fertilization")
    elif npk == "Low Potassium":
        recommendations.append({
            "category": "Fertilization",
            "priority": "Medium",
            "title": "Potassium Deficiency Detected",
            "description": "Low potassium reduces disease resistance.",
            "action": "Apply MOP (Muriate of Potash)",
            "impact": "Improve disease resistance and fruit quality",
            "icon": "🌱"
        })
        priority_actions.append("fertilization")
    
    # 5. Rain Forecast Recommendations
    rain_forecast = sensor_data.get("rain_forecast_next_24h_mm", 0)
    if rain_forecast > 20:
        recommendations.append({
            "category": "Weather Planning",
            "priority": "Medium",
            "title": "Heavy Rain Expected",
            "description": f"Forecast shows {rain_forecast}mm rain in next 24 hours.",
            "action": "Delay irrigation, ensure proper drainage",
            "impact": "Prevent waterlogging and root rot",
            "icon": "🌧️"
        })
    elif rain_forecast > 5:
        recommendations.append({
            "category": "Weather Planning",
            "priority": "Low",
            "title": "Light Rain Expected",
            "description": f"Forecast shows {rain_forecast}mm rain in next 24 hours.",
            "action": "Reduce irrigation schedule accordingly",
            "impact": "Optimize water usage",
            "icon": "🌦️"
        })
    
    # 6. Overall Health Score
    health_score = 100
    if soil_moisture < 25: health_score -= 30
    elif soil_moisture < 35: health_score -= 15
    if temperature > 35 or temperature < 15: health_score -= 20
    if humidity > 80: health_score -= 15
    if npk in ["Low Nitrogen", "Low Phosphorus"]: health_score -= 20
    elif npk == "Low Potassium": health_score -= 10
    
    health_status = "Excellent" if health_score >= 80 else "Good" if health_score >= 60 else "Fair" if health_score >= 40 else "Poor"
    
    return {
        "success": True,
        "user_id": user_id,
        "timestamp": datetime.now().isoformat(),
        "health_score": health_score,
        "health_status": health_status,
        "priority_actions": priority_actions,
        "recommendations": recommendations,
        "sensor_summary": {
            "soil_moisture": soil_moisture,
            "temperature": temperature,
            "humidity": humidity,
            "npk_status": npk,
            "rain_forecast": rain_forecast
        },
        "irrigation_status": {
            "needed": status.get("irrigation_needed", False),
            "reason": status.get("irrigation_reason", "")
        }
    }
