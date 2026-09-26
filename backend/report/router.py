"""
Report Router — /api/report
============================
Endpoints:
  POST /api/report/farmer-profile   — Save onboarding profile to Supabase
  GET  /api/report/farmer-profile   — Fetch saved profile for a user
  POST /api/report/generate         — Generate + download PDF using Supabase data
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import io

from core.supabase_client import supabase
from report.generator import generate_soil_report

router = APIRouter(prefix="/api/report", tags=["Report"])


# ─── Pydantic Models ──────────────────────────────────────────────────────

class FarmerProfileIn(BaseModel):
    user_id:            str
    farmer_name:        str
    farm_size:          Optional[str]  = ""
    soil_type:          Optional[str]  = "Alluvial"
    gps:                Optional[str]  = "N/A"
    irrigation_status:  Optional[bool] = True
    role:               Optional[str]  = "farmer"
    state:              Optional[str]  = None
    district:           Optional[str]  = None
    village:            Optional[str]  = None


class GenerateReportIn(BaseModel):
    user_id:    Optional[str] = "HARDWARE_DEFAULT"
    language:   Optional[str] = "en"
    # Override fields — if not provided, pulled from Supabase farmer_profiles
    name:               Optional[str]  = None
    farm_size:          Optional[str]  = None
    soil_type:          Optional[str]  = None
    gps:                Optional[str]  = None
    irrigation_status:  Optional[bool] = None


# ─── Helper: fetch sensor data ────────────────────────────────────────────

_DEFAULT_SENSOR = {
    "ph":               7.0,
    "conductivity":     350.0,
    "nitrogen":         210,
    "phosphorus":       18,
    "potassium":        95,
    "soil_moisture":    45.0,
    "soil_temperature": 26.0,
}

async def _fetch_sensor(user_id: str) -> dict:
    try:
        r = supabase.table("autonomous_sensors").select("*").eq("user_id", user_id).execute()
        if r.data:
            return r.data[0].get("data", _DEFAULT_SENSOR)
        # fallback to HARDWARE_DEFAULT
        r2 = supabase.table("autonomous_sensors").select("*").eq("user_id","HARDWARE_DEFAULT").execute()
        if r2.data:
            return r2.data[0].get("data", _DEFAULT_SENSOR)
    except Exception as e:
        print(f"[REPORT] Sensor fetch error: {e}")
    return _DEFAULT_SENSOR


# ─── Route 1: Save farmer profile ─────────────────────────────────────────

@router.post("/farmer-profile")
async def save_farmer_profile(payload: FarmerProfileIn):
    """Save (upsert) farmer onboarding profile to Supabase farmer_profiles table."""
    try:
        record = {
            "user_id":           payload.user_id,
            "farmer_name":       payload.farmer_name,
            "farm_size":         payload.farm_size or "",
            "soil_type":         payload.soil_type or "Alluvial",
            "gps":               payload.gps or "N/A",
            "irrigation_status": payload.irrigation_status,
            "role":              payload.role or "farmer",
            "state":             payload.state,
            "district":          payload.district,
            "village":           payload.village,
        }

        # Check if profile already exists for this user_id
        existing = supabase.table("farmer_profiles").select("id").eq("user_id", payload.user_id).execute()

        if existing.data:
            # Update
            resp = supabase.table("farmer_profiles").update(record).eq("user_id", payload.user_id).execute()
            action = "updated"
        else:
            # Insert
            resp = supabase.table("farmer_profiles").insert(record).execute()
            action = "created"

        return {
            "success": True,
            "action":  action,
            "data":    resp.data[0] if resp.data else record,
        }

    except Exception as e:
        print(f"[REPORT] Profile save error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save profile: {str(e)}")


# ─── Route 2: Fetch farmer profile ────────────────────────────────────────

@router.get("/farmer-profile")
async def get_farmer_profile(user_id: str):
    """Fetch saved farmer profile from Supabase."""
    try:
        r = supabase.table("farmer_profiles").select("*").eq("user_id", user_id).execute()
        if r.data:
            return {"success": True, "data": r.data[0]}
        return {"success": False, "data": None, "message": "No profile found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Route 3: Generate PDF report ─────────────────────────────────────────

@router.post("/generate")
async def generate_report(req: GenerateReportIn):
    """
    Generate a multilingual soil health PDF report.
    1. Fetch farmer profile from Supabase (override with request body if provided)
    2. Fetch latest sensor data from Supabase autonomous_sensors
    3. Generate PDF
    4. Log to report_logs table
    5. Stream PDF as download
    """
    user_id = req.user_id or "HARDWARE_DEFAULT"

    # ── 1. Get farmer profile from Supabase ────────────────────
    farmer_dict = {
        "name":             "—",
        "farm_size":        "—",
        "soil_type":        "Alluvial",
        "gps":              "N/A",
        "irrigation_status": True,
    }
    try:
        r = supabase.table("farmer_profiles").select("*").eq("user_id", user_id).execute()
        if r.data:
            db = r.data[0]
            farmer_dict = {
                "name":             db.get("farmer_name", "—"),
                "farm_size":        db.get("farm_size", "—"),
                "soil_type":        db.get("soil_type", "Alluvial"),
                "gps":              db.get("gps", "N/A"),
                "irrigation_status": db.get("irrigation_status", True),
            }
    except Exception as e:
        print(f"[REPORT] Profile fetch: {e}")

    # Request body overrides
    if req.name:            farmer_dict["name"]             = req.name
    if req.farm_size:       farmer_dict["farm_size"]        = req.farm_size
    if req.soil_type:       farmer_dict["soil_type"]        = req.soil_type
    if req.gps:             farmer_dict["gps"]              = req.gps
    if req.irrigation_status is not None:
                            farmer_dict["irrigation_status"] = req.irrigation_status

    # ── 2. Get sensor data ──────────────────────────────────────
    sensor_data = await _fetch_sensor(user_id)

    # ── 3. Generate PDF ─────────────────────────────────────────
    try:
        pdf_bytes = generate_soil_report(
            sensor   = sensor_data,
            farmer   = farmer_dict,
            language = req.language or "en",
        )
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    # ── 4. Log to Supabase report_logs ─────────────────────────
    try:
        supabase.table("report_logs").insert({
            "user_id":         user_id,
            "farmer_name":     farmer_dict["name"],
            "language":        req.language or "en",
            "soil_type":       farmer_dict["soil_type"],
            "farm_size":       farmer_dict["farm_size"],
            "sensor_snapshot": sensor_data,
        }).execute()
    except Exception as e:
        print(f"[REPORT] Log insert warning (non-fatal): {e}")

    # ── 5. Stream PDF ───────────────────────────────────────────
    lang_s   = req.language or "en"
    date_s   = datetime.now().strftime("%Y%m%d_%H%M")
    filename = f"soil_report_{lang_s}_{date_s}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition":       f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        }
    )
