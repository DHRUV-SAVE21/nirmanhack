import random
from .database import db

# Default initial data if user is new
DEFAULT_DATA = {
    "soil_moisture": 45,
    "soil_temperature": 28,
    "nitrogen": 40,
    "phosphorus": 22,
    "potassium": 18,
    "ph": 6.5,
    "last_irrigation_hours_ago": 0,
    "crop_type": "Wheat",
    "crop_stage": "Vegetative",
    "rain_forecast_next_24h_mm": 0
}

def get_data(user_id):
    """Reads current soil data from DB or initializes default."""
    data = db.get_sensor_data(user_id)
    if not data:
        # User doesn't exist yet, init
        db.upsert_sensor_data(user_id, DEFAULT_DATA)
        return DEFAULT_DATA
    return data

def update_data(user_id, updates):
    """Updates soil data with new values."""
    current = get_data(user_id)
    current.update(updates)
    db.upsert_sensor_data(user_id, current)
    return current

def simulate_drying(user_id):
    """Simulates soil drying over time (consistent for each user)."""
    data = get_data(user_id)
    current_moisture = data.get("soil_moisture", 30)
    
    # Random drop between 0.5% and 2%
    drop = random.uniform(0.5, 2.0)
    new_moisture = max(0, current_moisture - drop)
    
    update_data(user_id, {"soil_moisture": round(new_moisture, 2)})
    return new_moisture
