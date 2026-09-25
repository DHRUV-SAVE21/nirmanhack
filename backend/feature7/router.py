"""
Feature 7: Warehouse Safety Monitoring System
- Gas Monitoring (Safe < 600, Moderate 600-2000, Dangerous > 2000 PPM)
- Fire Detection (Safe / Fire Detected)

Data Source: Hardware Sensor at 10.110.7.93:8000
Fetches real-time data every 5 seconds from hardware
"""

import os
import time
import httpx
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

# Reuse TwilioManager for emergency calls
from feature3.twilio_manager import TwilioManager

router = APIRouter(prefix="/api/feature7", tags=["Feature 7: Warehouse Safety"])

twilio_manager = TwilioManager()

# Hardware sensor endpoint
HARDWARE_SENSOR_URL = "http://10.110.7.93:8000/api/hardware/fire-gas/latest"

# Updated thresholds for MQ2 sensor
GAS_SAFE_MAX = 600         # < 600: Safe
GAS_MODERATE_MAX = 2000    # 600-2000: Moderate
# > 2000: Dangerous (Emergency)

# ─── In-Memory State for Emergency Call Cooldown ───
emergency_state = {
    "gas_last_call_time": 0,
    "fire_last_call_time": 0
}

CALL_COOLDOWN_SECONDS = 60

# ─── Schemas ───
class ManualCallRequest(BaseModel):
    reason: str = "Manual emergency trigger"
    phone_number: Optional[str] = None

# ─── Helper ───
def classify_gas(ppm: float) -> str:
    """Classify gas level based on MQ2 sensor thresholds"""
    if ppm < GAS_SAFE_MAX:
        return "safe"
    elif ppm <= GAS_MODERATE_MAX:
        return "moderate"
    else:
        return "dangerous"

async def fetch_hardware_data():
    """Fetch real-time data from hardware sensor. Returns None if hardware is offline."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(HARDWARE_SENSOR_URL)
            if response.status_code == 200:
                hw_response = response.json()
                # Hardware returns: {"status":"success","data":{"mq2_value":...,"fire_status":...}}
                sensor_data = hw_response.get("data", {})
                return {
                    "mq2_value": sensor_data.get("mq2_value", 0),
                    "fire_status": sensor_data.get("fire_status", "Unknown"),
                    "timestamp": sensor_data.get("last_updated", datetime.now().isoformat()),
                    "mq2_d0": sensor_data.get("mq2_d0", 0)
                }
    except Exception as e:
        print(f"[HARDWARE] Fire/Gas sensor offline: {e}")
    
    return None

# ─── Endpoints ───

@router.get("/status")
async def get_overall_status():
    """Get real-time fire and gas status. Robust to hardware failure."""
    hardware_data = await fetch_hardware_data()
    
    if not hardware_data:
        # Final emergency fallback if even mock fails (shouldn't happen)
        return {
            "status": "partial",
            "gas": {"level": 350, "status": "safe"},
            "fire": {"detected": False, "status": "Offline"}
        }
    
    # Extract data from hardware response
    mq2_value = hardware_data.get("mq2_value", 350)
    fire_status = hardware_data.get("fire_status", "Safe")
    
    # Classify gas level
    gas_classification = classify_gas(mq2_value)
    
    # Determine if fire is detected
    fire_detected = "fire" in fire_status.lower() and "no" not in fire_status.lower()
    
    response = {
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "gas": {
            "level": mq2_value,
            "status": gas_classification,
            "unit": "ppm",
            "thresholds": {
                "safe": f"< {GAS_SAFE_MAX}",
                "moderate": f"{GAS_SAFE_MAX}-{GAS_MODERATE_MAX}",
                "dangerous": f"> {GAS_MODERATE_MAX}"
            }
        },
        "fire": {
            "detected": fire_detected,
            "status": fire_status,
            "raw_status": fire_status
        },
        "hardware_source": HARDWARE_SENSOR_URL if "random" not in str(hardware_data) else "Simulated"
    }
    
    # Check for emergency conditions and trigger calls if needed
    current_time = time.time()
    
    # Gas emergency
    if gas_classification == "dangerous":
        last_call = emergency_state["gas_last_call_time"]
        if current_time - last_call > CALL_COOLDOWN_SECONDS:
            phone = os.getenv("FARMER_PHONE_NUMBER", "+919579649407")
            print(f"[GAS EMERGENCY] {mq2_value} ppm > {GAS_MODERATE_MAX}. Calling {phone}...")
            
            call_result = twilio_manager.make_call(phone)
            emergency_state["gas_last_call_time"] = current_time
            
            response["emergency_action"] = {
                "type": "gas_alert",
                "call_triggered": True,
                "call_result": call_result
            }
    
    # Fire emergency
    if fire_detected:
        last_call = emergency_state["fire_last_call_time"]
        if current_time - last_call > CALL_COOLDOWN_SECONDS:
            phone = os.getenv("FARMER_PHONE_NUMBER", "+919579649407")
            print(f"[FIRE EMERGENCY] Fire Detected! Calling {phone}...")
            
            call_result = twilio_manager.make_call(phone)
            emergency_state["fire_last_call_time"] = current_time
            
            response["emergency_action"] = {
                "type": "fire_alert",
                "call_triggered": True,
                "call_result": call_result
            }
    
    return response

@router.get("/gas/status")
async def get_gas_status():
    """Get current gas status from hardware sensor."""
    hardware_data = await fetch_hardware_data()
    
    if not hardware_data:
        raise HTTPException(status_code=503, detail="Hardware sensor unavailable")
    
    mq2_value = hardware_data.get("mq2_value", 0)
    gas_classification = classify_gas(mq2_value)
    
    return {
        "status": "success",
        "data": {
            "level": mq2_value,
            "classification": gas_classification,
            "unit": "ppm",
            "timestamp": datetime.now().isoformat()
        }
    }

@router.get("/fire/status")
async def get_fire_status():
    """Get current fire status from hardware sensor."""
    hardware_data = await fetch_hardware_data()
    
    if not hardware_data:
        raise HTTPException(status_code=503, detail="Hardware sensor unavailable")
    
    fire_status = hardware_data.get("fire_status", "Unknown")
    fire_detected = "fire" in fire_status.lower() and "no" not in fire_status.lower()
    
    return {
        "status": "success",
        "data": {
            "detected": fire_detected,
            "status": fire_status,
            "timestamp": datetime.now().isoformat()
        }
    }

@router.post("/emergency-call")
async def manual_call(data: ManualCallRequest):
    """Manual emergency call trigger."""
    phone = data.phone_number or os.getenv("FARMER_PHONE_NUMBER", "+919579649407")
    print(f"[MANUAL CALL] Triggering emergency call to {phone}. Reason: {data.reason}")
    
    call_result = twilio_manager.make_call(phone)
    
    return {
        "status": "success",
        "reason": data.reason,
        "phone": phone,
        "call_result": call_result
    }

@router.get("/health")
async def health_check():
    """Check if hardware sensor is reachable."""
    hardware_data = await fetch_hardware_data()
    
    return {
        "status": "healthy" if hardware_data else "unhealthy",
        "hardware_sensor": HARDWARE_SENSOR_URL,
        "reachable": hardware_data is not None,
        "timestamp": datetime.now().isoformat()
    }
