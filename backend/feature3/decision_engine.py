from datetime import datetime
from .data_simulator import get_data
from .twilio_manager import TwilioManager

twilio_client = TwilioManager()

def evaluate_crop_status(user_id):
    """
    Evaluates sensor data against defined thresholds.
    Returns a dict with required actions.
    """
    data = get_data(user_id)
    
    # 1. Irrigation Logic
    soil_moisture = data.get("soil_moisture", 0)
    rain_forecast = data.get("rain_forecast_next_24h_mm", 0)
    
    # Thresholds (Example for Wheat)
    MOISTURE_THRESHOLD = 25 # %
    RAIN_THRESHOLD = 5 # mm
    
    irrigation_needed = False
    irrigation_reason = ""
    
    if soil_moisture < MOISTURE_THRESHOLD:
        if rain_forecast < RAIN_THRESHOLD:
            irrigation_needed = True
            irrigation_reason = f"Soil Moisture is low ({soil_moisture}%) and no rain predicted."
        else:
            irrigation_reason = "Soil is dry, but rain is forecasted. Skipping irrigation."

    # 2. Twilio Trigger (Only if irrigation needed + not recently notified logic can be added)
    if irrigation_needed:
        # In a real app, we'd check if we already sent a notification recently
        twilio_client.send_sms(f" Farm Alert: {irrigation_reason}. Please start irrigation via the Dashboard.")
            
    return {
        "irrigation_needed": irrigation_needed,
        "irrigation_reason": irrigation_reason,
        "soil_moisture": soil_moisture,
        "rain_forecast": rain_forecast,
        "sensor_data": data
    }
