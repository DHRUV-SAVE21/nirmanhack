"""
Hardware Router — Memory cache is primary. Supabase runs in background thread.
ESP32 always gets 200. No 500s from DNS/network failures.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import threading
from core.supabase_client import supabase

router = APIRouter(prefix="/api/hardware", tags=["hardware"])

_fire_gas_cache = {
    "mq2_value": 0, "fire_status": "Unknown", "mq2_d0": 0,
    "flame1": 1, "flame2": 1, "last_updated": None, "online": False
}
_soil_cache = {
    "soil_moisture": 0, "nitrogen": 0, "phosphorus": 0, "potassium": 0,
    "ph": 0.0, "soil_temperature": 0.0, "conductivity": 0.0,
    "last_updated": None, "online": False
}


def start_fire_gas_polling():
    print("[HARDWARE] Fire/Gas: ESP32 pushes via POST /api/hardware/fire-gas")


def _bg_save(user_id: str, data: dict):
    """Fire-and-forget Supabase save in background thread."""
    def _run():
        try:
            existing = supabase.table("autonomous_sensors").select("id").eq("user_id", user_id).execute()
            if existing.data:
                supabase.table("autonomous_sensors").update({"data": data}).eq("user_id", user_id).execute()
            else:
                supabase.table("autonomous_sensors").insert({"user_id": user_id, "data": data}).execute()
            print(f"[SUPABASE] Saved {user_id}")
        except Exception as e:
            print(f"[SUPABASE] Failed {user_id}: {e}")
    threading.Thread(target=_run, daemon=True).start()


def _bg_read(user_id: str):
    try:
        res = supabase.table("autonomous_sensors").select("*").eq("user_id", user_id).execute()
        if res.data:
            row = res.data[0]
            d = row.get("data", {})
            d["created_at"] = row.get("created_at", d.get("last_updated"))
            return d
    except Exception as e:
        print(f"[SUPABASE] Read failed {user_id}: {e}")
    return None


# ─── Fire/Gas ───

class FireGasData(BaseModel):
    mq2_value: int
    mq2_d0: int = 0
    flame1: int = 1
    flame2: int = 1
    fire_status: str

@router.post("/fire-gas")
async def receive_fire_gas_data(data: FireGasData):
    global _fire_gas_cache
    _fire_gas_cache = {
        "mq2_value": data.mq2_value, "fire_status": data.fire_status,
        "mq2_d0": data.mq2_d0, "flame1": data.flame1, "flame2": data.flame2,
        "last_updated": datetime.utcnow().isoformat(), "online": True
    }
    print(f"[FIRE/GAS] MQ2={data.mq2_value} | Status={data.fire_status}")
    _bg_save("FIRE_GAS_SENSOR", {k: v for k, v in _fire_gas_cache.items() if k != "online"})
    return {"status": "success", "message": "Fire/gas data received"}

@router.get("/fire-gas/latest")
async def get_fire_gas_latest():
    if _fire_gas_cache.get("online"):
        return {"status": "success", "data": _fire_gas_cache}
    d = _bg_read("FIRE_GAS_SENSOR")
    return {"status": "success", "data": d} if d else {
        "status": "no_data", "data": {"mq2_value": 0, "fire_status": "Unknown", "online": False}
    }


# ─── Soil Sensor ───

class SensorData(BaseModel):
    soil_moisture: float
    nitrogen: int
    phosphorus: int
    potassium: int
    ph: float
    soil_temperature: float
    conductivity: float
    user_id: Optional[str] = "HARDWARE_DEFAULT"

@router.post("/sensor-data")
async def receive_sensor_data(data: SensorData):
    global _soil_cache
    _soil_cache = {
        "ph": data.ph, "nitrogen": data.nitrogen, "phosphorus": data.phosphorus,
        "potassium": data.potassium, "conductivity": data.conductivity,
        "soil_moisture": data.soil_moisture, "soil_temperature": data.soil_temperature,
        "last_updated": datetime.utcnow().isoformat(), "online": True
    }
    print(f"[SOIL] Moisture={data.soil_moisture}% N={data.nitrogen} P={data.phosphorus} K={data.potassium}")
    _bg_save(data.user_id, {k: v for k, v in _soil_cache.items() if k != "online"})
    return {"status": "success", "message": "Sensor data stored successfully", "data": data.dict()}

@router.get("/latest")
async def get_latest_sensor_data(user_id: str = "HARDWARE_DEFAULT"):
    if _soil_cache.get("online"):
        return {"status": "success", "data": _soil_cache}
    d = _bg_read(user_id)
    return {"status": "success", "data": d} if d else {
        "status": "no_data", "message": "No sensor data available yet"
    }
