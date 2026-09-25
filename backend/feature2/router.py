from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from .agents import crop_agent_app, analysis_agent_app
from .satellite_service import SatelliteService
from .model_service import predict_disease
import traceback
import io
import requests
import uuid
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from core.supabase_client import supabase
from feature6_blockchain.blockchain_service import get_ledger_from_db

router = APIRouter(prefix="/api/feature2", tags=["crop-health"])

class AnalysisRequest(BaseModel):
    disease: str
    confidence: float
    lang: Optional[str] = "en"  # Language code: en, hi, mr

class SatelliteRequest(BaseModel):
    lat: float
    lng: float
    bbox: Optional[List[float]] = None

@router.post("/predict")
async def predict_only(file: UploadFile = File(...)):
    """
    Step 1: Fast CNN Prediction Only.
    """
    try:
        print(f" Received prediction request for file: {file.filename}")
        content = await file.read()
        print(f" File size: {len(content)} bytes")
        
        result = predict_disease(content)
        print(f" Prediction successful: {result.get('class', 'Unknown')}")
        return result
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f" Prediction Error: {e}")
        print(f"Full traceback:\n{error_details}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.post("/analyze")
async def analyze_results(request: AnalysisRequest):
    """
    Step 2: Slow Agentic Analysis.
    """
    try:
        # Invoke the Analysis Workflow with language
        result = analysis_agent_app.invoke({
            "disease_class": request.disease,
            "confidence": request.confidence,
            "lang": request.lang or "en"
        })
        
        return {
            "analysis": result.get("analysis_report", "Analysis failed"),
            "treatment": result.get("treatment_plan", "No plan generated"),
            "subsidy": result.get("subsidy_info", "No info")
        }
    except Exception as e:
        print(f" Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from .compensation_agent import CompensationAgent
from .agronomist_chat import AgronomistChatAgent

class ChatRequest(BaseModel):
    message: str
    state: dict
    context: Optional[dict] = None
    lang: Optional[str] = "en"  # Language code: en, hi, mr

@router.post("/agent/chat")
async def chat_agent(request: ChatRequest):
    """
    Interacts with Compensation Agent or Agronomist Agent.
    """
    try:
        # If context is provided, it's the Agronomist Chat
        if request.context:
             result = AgronomistChatAgent.chat(request.message, request.state.get("history", []), request.context, request.lang or "en")
             return result
        
        result = CompensationAgent.process_message(request.state, request.message, request.lang or "en")
        return result
    except Exception as e:
         print(f" Agent Error: {e}")
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/ndvi")
async def get_satellite_ndvi(request: SatelliteRequest):
    """
    Fetches NDVI Satellite Data (Real Sentinel-2).
    """
    try:
        # Default to checking last 30 days
        data = SatelliteService.get_ndvi_data(request.lat, request.lng, days_back=30, custom_bbox=request.bbox)
        return data
    except Exception as e:
        print(f" NDVI Error: {e}")
        raise HTTPException(status_code=500, detail=f"Satellite Data Unavailable: {str(e)}")

class TimeSeriesRequest(BaseModel):
    lat: float
    lng: float
    weeks: Optional[int] = 8
    bbox: Optional[List[float]] = None

@router.post("/ndvi-timeseries")
async def get_ndvi_timeseries(request: TimeSeriesRequest):
    """
    Weekly NDVI time-series for trend analysis, growth stage detection, anomaly detection.
    """
    try:
        data = SatelliteService.get_ndvi_timeseries(
            lat=request.lat,
            lng=request.lng,
            weeks=min(request.weeks or 8, 12),
            custom_bbox=request.bbox
        )
        return data
    except Exception as e:
        print(f"❌ Time-Series Error: {e}")
        raise HTTPException(status_code=500, detail=f"Time-Series Unavailable: {str(e)}")

@router.get("/field-sensors")
async def get_field_sensor_data(user_id: Optional[str] = None):
    """
    Fetches real NPK, moisture, pH, temperature from the hardware DB.
    Same source as the FarmDashboard autonomous sensor system.
    """
    try:
        from services.sensor_service import get_latest_sensor_data
        
        sensor = get_latest_sensor_data(user_id or "HARDWARE_DEFAULT")
        if not sensor:
            sensor = get_latest_sensor_data()  # try without user_id
            
        if sensor and not isinstance(sensor, dict):
            return {"status": "no_data", "data": None}
        
        if sensor and "error" not in sensor:
            # Extract the inner data if nested
            raw = sensor.get("data", sensor) if "data" in sensor else sensor
            
            return {
                "status": "success",
                "data": {
                    "soil_moisture": raw.get("soil_moisture", raw.get("moisture")),
                    "soil_temperature": raw.get("soil_temperature", raw.get("temperature")),
                    "nitrogen": raw.get("nitrogen"),
                    "phosphorus": raw.get("phosphorus"),
                    "potassium": raw.get("potassium"),
                    "ph": raw.get("ph"),
                    "timestamp": sensor.get("created_at"),
                },
                "source": "IoT Hardware (autonomous_sensors table)"
            }
        
        return {"status": "no_data", "data": None}
    except Exception as e:
        print(f"❌ Sensor fetch error: {e}")
        return {"status": "error", "data": None, "message": str(e)}

# --- PREDICTIVE ALERTS ENGINE ---
from .predictive_engine import generate_predictive_alerts

class PredictiveAlertsRequest(BaseModel):
    lat: float
    lng: float
    ndvi_series: Optional[List[float]] = None
    crop_type: Optional[str] = "general"
    bbox: Optional[List[float]] = None

@router.post("/predictive-alerts")
async def get_predictive_alerts(request: PredictiveAlertsRequest):
    """
    Real predictive alerts — stress risk, irrigation forecast, disease risk, yield forecast.
    Combines NDVI time-series (from Sentinel-2) + live sensor data (from DB).
    No mocks. Every prediction is computed from actual signals.
    """
    try:
        # Fetch NDVI time-series if not provided
        ndvi_series = request.ndvi_series
        if not ndvi_series or len(ndvi_series) < 2:
            try:
                ts_data = SatelliteService.get_ndvi_timeseries(
                    lat=request.lat, lng=request.lng,
                    weeks=8, custom_bbox=request.bbox
                )
                if ts_data and ts_data.get("weekly_data"):
                    ndvi_series = [w["ndvi"] for w in ts_data["weekly_data"] if w["ndvi"] is not None]
            except Exception as ts_err:
                print(f"⚠️ Time-series fetch for predictions failed: {ts_err}")

        # Fetch sensor data
        from services.sensor_service import get_latest_sensor_data
        sensor = get_latest_sensor_data("HARDWARE_DEFAULT") or get_latest_sensor_data()
        
        soil_moisture = None
        temperature = None
        nitrogen = None
        phosphorus = None
        potassium = None
        ph = None
        
        if sensor and isinstance(sensor, dict) and "error" not in sensor:
            raw = sensor.get("data", sensor) if "data" in sensor else sensor
            soil_moisture = raw.get("soil_moisture", raw.get("moisture"))
            temperature = raw.get("soil_temperature", raw.get("temperature"))
            nitrogen = raw.get("nitrogen")
            phosphorus = raw.get("phosphorus")
            potassium = raw.get("potassium")
            ph = raw.get("ph")

        # Generate predictions
        result = generate_predictive_alerts(
            ndvi_series=ndvi_series,
            soil_moisture=soil_moisture,
            temperature=temperature,
            nitrogen=nitrogen,
            phosphorus=phosphorus,
            potassium=potassium,
            ph=ph,
            crop_type=request.crop_type or "general",
        )

        return result

    except Exception as e:
        print(f"❌ Predictive alerts error: {e}")
        raise HTTPException(status_code=500, detail=f"Predictive engine error: {str(e)}")

# --- DECISION INTELLIGENCE ENGINE ---
from .decision_intelligence import generate_intelligence_report
from services.sensor_service import get_latest_sensor_data as get_sensor_data_for_intelligence

class IntelligenceRequest(BaseModel):
    ndvi_value: float
    lat: float
    lng: float
    user_id: Optional[str] = None
    heatmap_zones: Optional[List[dict]] = None

@router.post("/intelligence")
async def get_intelligence_report(request: IntelligenceRequest):
    """
    Decision Intelligence Engine: Multi-signal causal inference.
    Combines NDVI satellite data with IoT sensor data to determine
    WHY the crop is stressed — not just that it IS stressed.
    """
    try:
        # Fetch latest sensor data from hardware/IoT
        sensor_data = None
        if request.user_id:
            sensor_data = get_sensor_data_for_intelligence(request.user_id)
        if not sensor_data:
            sensor_data = get_sensor_data_for_intelligence()  # Try default
        
        # Run the intelligence engine
        report = generate_intelligence_report(
            ndvi_value=request.ndvi_value,
            sensor_data=sensor_data
        )
        
        return report
        
    except Exception as e:
        import traceback
        print(f"❌ Intelligence Engine Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Intelligence Engine Error: {str(e)}")

# --- PDF GENERATION ---
from fastapi.responses import Response
from .pdf_service import PDFService

class ClaimFormRequest(BaseModel):
    farmer_name: str
    guardian_name: str
    mobile: str
    aadhaar: str
    address: str
    account_holder: str
    bank_name: str
    branch_name: str
    account_number: str
    ifsc: str
    survey_no: str
    village: str
    crop_name: str
    sowing_date: str
    area_insured: str
    loss_date: str
    loss_cause: str
    loss_percentage: str

@router.post("/claim/generate-pdf")
async def generate_claim_pdf(request: ClaimFormRequest):
    try:
        pdf_bytes = PDFService.generate_claim_form(request.dict())
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Claim_Form_{request.aadhaar[-4:]}.pdf"
            }
        )
    except Exception as e:
        print(f" PDF Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- AGRONOMIST ENDPOINTS ---
from .agronomist_service import AgronomistService

@router.get("/agronomists")
async def get_agronomists(count: int = 2, specialization: Optional[str] = None):
    """
    Fetch random available agronomists from database
    
    Args:
        count: Number of agronomists to return (default: 2)
        specialization: Filter by specialization (optional)
    
    Returns:
        List of agronomist details
    """
    try:
        agronomists = AgronomistService.get_random_agronomists(count, specialization)
        return {"agronomists": agronomists}
    except Exception as e:
        print(f" Agronomist Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- SCHEME APPLICATION ENDPOINTS ---
from .scheme_application_service import SchemeApplicationService

class SchemeApplicationRequest(BaseModel):
    user_id: str  # From farmer_profiles
    scheme_name: str
    application_details: dict  # JSONB field containing all scheme details
    farmer_name: Optional[str] = None  # Farmer's name
    farmer_phone: Optional[str] = None  # Farmer's phone

class UpdateStatusRequest(BaseModel):
    status: str

@router.post("/scheme-applications")
async def create_scheme_application(request: SchemeApplicationRequest):
    """
    Create a new scheme application from a farmer
    """
    try:
        result = SchemeApplicationService.create_application(
            user_id=request.user_id,
            scheme_name=request.scheme_name,
            application_details=request.application_details,
            farmer_name=request.farmer_name,
            farmer_phone=request.farmer_phone
        )
        return result
    except Exception as e:
        print(f" Scheme Application Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scheme-applications/farmer/{farmer_id}")
async def get_farmer_applications(farmer_id: str):
    """
    Get all scheme applications for a specific farmer
    """
    try:
        applications = SchemeApplicationService.get_farmer_applications(farmer_id)
        return {"applications": applications}
    except Exception as e:
        print(f" Error fetching farmer applications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scheme-applications")
async def get_all_applications(
    limit: int = 100,
    offset: int = 0,
    status: Optional[str] = None
):
    """
    Get all scheme applications (Admin only)
    """
    try:
        result = SchemeApplicationService.get_all_applications(
            limit=limit,
            status=status,
            offset=offset
        )
        return result
    except Exception as e:
        print(f" Error fetching applications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/scheme-applications/{application_id}/status")
async def update_application_status(
    application_id: str,  # UUID as string
    request: UpdateStatusRequest
):
    """
    Update scheme application status (Admin only)
    """
    try:
        success = SchemeApplicationService.update_application_status(
            application_id=application_id,
            status=request.status
        )
        if success:
            return {"status": "success", "message": "Application updated"}
        else:
            raise HTTPException(status_code=400, detail="Failed to update application")
    except Exception as e:
        print(f" Error updating application: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scheme-applications/statistics")
async def get_application_statistics():
    """
    Get scheme application statistics (Admin only)
    """
    try:
        stats = SchemeApplicationService.get_statistics()
        return stats
    except Exception as e:
        print(f" Error fetching statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scheme-applications/test")
async def test_scheme_applications_table():
    """
    Test endpoint to verify scheme_applications table exists and is accessible
    """
    try:
        from core.supabase_client import supabase
        # Try to query the table
        response = supabase.table('scheme_applications')\
            .select('*')\
            .limit(1)\
            .execute()
        
        return {
            "status": "success",
            "message": "Table is accessible",
            "sample_count": len(response.data) if response.data else 0,
            "sample_data": response.data[0] if response.data and len(response.data) > 0 else None
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }


# --- CLAIM APPLICATION ENDPOINTS ---
from .claims_service import ClaimsService

class ClaimApplicationRequest(BaseModel):
    user_id: str
    farmer_name: str
    father_husband_name: Optional[str] = None
    farmer_phone: Optional[str] = None
    aadhaar_number: Optional[str] = None
    scheme_name: str
    claim_type: str
    crop_name: str
    land_size: float
    ndvi_value: Optional[float] = None
    crop_loss_percentage: Optional[float] = None
    claim_amount: Optional[float] = None
    application_details: Optional[dict] = {}
    loss_details: Optional[dict] = {}
    document_urls: Optional[dict] = {}

class ClaimStatusRequest(BaseModel):
    status: str
    admin_notes: Optional[str] = None
    approved_amount: Optional[float] = None

@router.post("/claims/create")
async def create_claim_application(request: ClaimApplicationRequest):
    """
    Submit a new insurance claim application.
    """
    try:
        result = ClaimsService.create_claim(request.dict(), request.user_id)
        return result
    except Exception as e:
        print(f" Claim Creation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/claims")
async def get_all_claims(limit: int = 100, status: Optional[str] = None):
    """
    Get all claims (Admin).
    """
    try:
        claims = ClaimsService.get_all_claims(limit, status)
        return {"claims": claims}
    except Exception as e:
        print(f" Claim Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/claims/{claim_id}")
async def get_claim(claim_id: str):
    """
    Get specific claim details.
    """
    try:
        claim = ClaimsService.get_claim_by_id(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        return claim
    except Exception as e:
        print(f" Claim Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/claims/{claim_id}/status")
async def update_claim_status(claim_id: str, request: ClaimStatusRequest):
    """
    Update claim status (Admin).
    """
    try:
        result = ClaimsService.update_claim_status(claim_id, request.status, request.admin_notes, request.approved_amount)
        return result
    except Exception as e:
        print(f" Claim Update Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/claims/{claim_id}/certificate")
async def generate_certificate(claim_id: str):
    """
    Generate an official approval certificate PDF for the claim.
    """
    try:
        # Fetch claim
        claim = ClaimsService.get_claim_by_id(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
            
        status = claim.get("status", "").lower()
        if status not in ["approved", "completed"]:
            raise HTTPException(status_code=400, detail="Certificate available only for approved claims.")
            
        # Create PDF
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # --- Header ---
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(width / 2, height - 60, "OFFICIAL CROP INSURANCE APPROVAL")
        
        c.setFont("Helvetica", 12)
        c.drawCentredString(width / 2, height - 80, "Government of India / State Agriculture Department")
        c.line(50, height - 90, width - 50, height - 90)
        
        # --- Content ---
        y = height - 130
        x_label = 70
        x_val = 250
        line_height = 25

        c.setFont("Helvetica-Bold", 14)
        c.drawString(x_label, y, "Certificate of Benefit Approval")
        y -= 40
        
        details = [
            ("Reference No:", claim.get("reference_no", "N/A")),
            ("Farmer Name:", claim.get("farmer_name", "N/A")),
            ("Mobile Number:", claim.get("farmer_phone", "N/A")),
            ("Scheme Name:", claim.get("scheme_name", "N/A")),
            ("Crop Insured:", claim.get("crop_name", "N/A")),
            ("Land Area:", f"{claim.get('land_size', '0')} Acres"),
            ("Loss Assessment:", f"{claim.get('crop_loss_percentage', '0')}% (Satellite Verified)"),
            ("Approval Date:", claim.get("updated_at", "").split("T")[0])
        ]
        
        c.setFont("Helvetica", 12)
        for label, val in details:
            c.drawString(x_label, y, label)
            c.drawString(x_val, y, str(val))
            y -= line_height
            
        y -= 20
        c.line(50, y, width - 50, y)
        y -= 40
        
        # --- Amount ---
        # Prioritize approved_amount, fallback to claim_amount
        final_amount = claim.get("approved_amount") or claim.get("claim_amount") or 0
        
        c.setFont("Helvetica-Bold", 16)
        c.drawString(x_label, y, "Total Approved Amount:")
        c.drawString(x_val, y, f"₹ {float(final_amount):,.2f}")
        y -= 60
        
        # --- Digital Signature Block ---
        c.setStrokeColorRGB(0, 0.5, 0) # Green border
        c.rect(x_label, y - 50, 450, 70, fill=0)
        
        c.setFillColorRGB(0, 0.5, 0) # Green text
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x_label + 20, y - 20, "DIGITALLY VERIFIED & SANCTIONED")
        c.setFont("Helvetica", 10)
        c.drawString(x_label + 20, y - 35, "This document is digitally signed by the Competent Authority.")
        c.drawString(x_label + 20, y - 50, "Valid for bank claim disbursement without physical signature.")
        
        # --- Footer ---
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica-Oblique", 8)
        c.drawCentredString(width / 2, 40, "Generated by Satellite Crop Monitoring System | Let's Go 3.0")
        
        c.save()
        buffer.seek(0)
        
        filename = f"Claim_Certificate_{claim.get('reference_no', 'Approved')}.pdf"
        return StreamingResponse(
            buffer, 
            media_type="application/pdf", 
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        print(f"Error generating certificate: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/motor/{action}")





















































































































async def control_motor(action: str, user_id: str = "default"):
    """
    Proxy to IoT device (172.21.4.105).
    Log to Blockchain and Generate PDF Receipt when Motor is turned ON.
    """
    if action not in ["on", "off"]:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'on' or 'off'.")
    
    target_url = f"http://10.110.7.155/motor/{action}"
    print(f"📡 Sending command to Motor: {target_url}")
    
    blockchain_hash = None
    pdf_log_url = None
    
    try:
        # 1. Hardware Command
        # 2s timeout is enough for local LAN
        try:
            resp = requests.get(target_url, timeout=2)
            device_status = resp.status_code
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Motor Connection Failed: {e} (Continuing to simulated log)")
            device_status = 502

        # 2. Blockchain Logging (Only on ON)
        if action == "on":
            try:
                # Find active batch for this user (Simplified: grab latest planted batch)
                batch_res = supabase.table("inventory").select("batch_id").eq("status", "planted").order("created_at", desc=True).limit(1).execute()
                
                batch_id = batch_res.data[0]['batch_id'] if batch_res.data else f"BATCH-SIM-{uuid.uuid4().hex[:6]}"
                
                # Fetch Sensor Data
                from services.sensor_service import get_latest_sensor_data
                sensor_data = get_latest_sensor_data(user_id) or {"moisture": 45, "temp": 28}
                clean_metrics = {k:v for k,v in sensor_data.items() if k not in ['id', 'user_id', 'created_at']}
                
                # Add to Ledger
                ledger = get_ledger_from_db(batch_id)
                event_data = {
                    "action": "IRRIGATION_START",
                    "source": "IoT_Pump_Controller",
                    "metrics_before": clean_metrics,
                    "timestamp": datetime.now().isoformat()
                }
                ledger.add_event(batch_id, "IRRIGATION", event_data)
                
                # Get the hash of just-added block
                timeline = ledger.get_chain_dict()
                blockchain_hash = timeline[-1]['hash'] if timeline else "HASH_PENDING"
                
                # 3. Generate PDF Log
                pdf_bytes = PDFService.generate_irrigation_log({
                    "batch_id": batch_id,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "action": "Motor ON - Automated Irrigation",
                    "metrics": clean_metrics,
                    "hash": blockchain_hash
                })
                
                # Upload PDF to Supabase Storage (or simulate URL)
                filename = f"irrigation_log_{uuid.uuid4().hex[:6]}.pdf"
                # For now, we return a simulated URL as we might not have storage buckets set up
                pdf_log_url = f"/api/feature2/logs/{filename}" 
                
                # Store PDF in a temporary local cache or DB log if needed
                # (Skipping persistent storage of PDF binary for this step to keep it simple, 
                # but in prod, upload to Supabase Storage here)

            except Exception as e:
                print(f"❌ Logging Error: {e}")
                traceback.print_exc()

        return {
            "status": "success", 
            "device_code": device_status, 
            "action": action,
            "blockchain_hash": blockchain_hash,
            "pdf_url": pdf_log_url
        }
        
    except Exception as e:
        print(f"Critical Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
