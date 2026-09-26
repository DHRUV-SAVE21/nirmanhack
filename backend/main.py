import os
import warnings
# Suppress TensorFlow logs before any imports that might use TF
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
# Suppress google-generativeai deprecation warning (we use google-genai v1)
warnings.filterwarnings("ignore", message=".*google-generativeai.*")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="google")

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import base64
from typing import Optional

# Load environment variables
load_dotenv()

# Import our modules
from feature5.equipment_analyzer import (
    analyze_equipment_image,
    analyze_equipment_intelligence,
    generate_maintenance_schedule,
    get_repair_recommendations,
    identify_damaged_parts,
    get_analysis_history,
    get_maintenance_schedules
)
from feature5.subsidy_service import get_all_subsidies, calculate_subsidy_amount, get_available_states
from feature5.router import router as feature5_router
from feature1.router import router as feature1_router
from feature2.router import router as feature2_router
from feature3.api import router as feature3_router
from auth.router import router as auth_router
from services.sensor_service import get_latest_sensor_data
from hardware.router import router as hardware_router
from admin.router import router as admin_router
from feature_news.router import router as news_router
from inspections.router import router as inspections_router
from feature7.router import router as feature7_router
from mandi.router import router as mandi_router
from feature_agent.router import router as feature_agent_router
from voice.router import voice_router
from report.router import router as report_router

app = FastAPI(
    title="Annadata Saathi API",
    description="Multi-agent precision agriculture system for farm intelligence and automated controls",
    version="1.0.0"
)

# Pre-load heavy models at startup to avoid timeout on first request
@app.on_event("startup")
async def startup_event():
    """
    Pre-load all heavy models during application startup.
    This prevents worker timeout on first request.
    """
    import asyncio
    from concurrent.futures import ThreadPoolExecutor
    
    print("[INIT] Starting application initialization...")
    
    # Load TensorFlow model in background (non-blocking)
    import threading
    
    def load_tf_model():
        try:
            print("[INFO] Pre-loading TensorFlow disease prediction model...")
            from feature2.model_service import load_model
            load_model()
            print("[OK] TensorFlow model loaded successfully")
        except Exception as e:
            print(f"[WARN] Failed to pre-load TensorFlow model: {e}")
            print("   Model will load on first request (may cause timeout)")
    
    # Start model loading in background thread (don't wait for it)
    thread = threading.Thread(target=load_tf_model, daemon=True)
    thread.start()
    
    # Start fire/gas sensor background polling (every 5 seconds)
    from hardware.router import start_fire_gas_polling
    start_fire_gas_polling()
    
    print("[OK] Application startup complete")

# CORS configuration - Allow Vercel frontend and local development
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "https://let-go-3-0.vercel.app",
    "https://lets-go-3-frontend.vercel.app",
    "https://annadata-saathi.vercel.app",
    "https://annadata-saathi-api.vercel.app",
    "https://annadatasaathi.vercel.app",       # production domain (no hyphen)
    "https://annadatasaathi-git-main.vercel.app",
    *ALLOWED_ORIGINS
]

# Clean up origins
origins = [origin.strip() for origin in origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class ImageAnalysisRequest(BaseModel):
    image_base64: str
    equipment_type: Optional[str] = "Unknown"
    equipment_age_days: Optional[int] = 0
    total_usage_hours: Optional[int] = 0
    last_service_date: Optional[str] = "Unknown"
    environment: Optional[str] = "normal"
    repair_cost_estimate: Optional[float] = None
    replacement_cost_estimate: Optional[float] = None
    

    
class SubsidyRequest(BaseModel):
    equipment_type: Optional[str] = None
    state: Optional[str] = None
    
class SubsidyCalculationRequest(BaseModel):
    equipment_cost: float
    subsidy_percentage: float
    max_amount: float


# Root endpoints
@app.get("/")
def read_root():
    return {"message": "Hello from Let Go 3.0 - Farm Equipment Analyzer!"}


@app.get("/api/sensors/latest")
async def read_latest_sensor_data(user_id: Optional[str] = None):
    """
    Get the most recent sensor reading from Supabase for a specific user.
    """
    data = get_latest_sensor_data(user_id)
    if not data:
        return {"success": False, "message": "No data found"}
    
    # If the row has a 'data' column that contains the JSON:
    # We want to return { success: True, data: { ...fields... } }
    # Adjust this based on your actual table structure. 
    # If the response.data[0] is the whole row, and the JSON is in a 'data' column:
    sensor_values = data.get('data', {}) if 'data' in data else data
    
    return {
        "success": True,
        "data": sensor_values,
        "raw_record": data # Useful for debugging or if other fields like created_at are needed
    }




# Equipment Analysis Endpoints
@app.post("/api/equipment/analyze")
async def analyze_equipment(request: ImageAnalysisRequest):
    """
    Analyze an equipment image using AI.
    
    Accepts a base64 encoded image and returns:
    - Equipment identification
    - Health score (0-100)
    - Condition assessment
    - List of issues identified
    """
    if not request.image_base64:
        raise HTTPException(status_code=400, detail="No image provided")
    
    try:
        analysis = await analyze_equipment_intelligence(
            request.image_base64,
            equipment_type=request.equipment_type,
            equipment_age_days=request.equipment_age_days,
            total_usage_hours=request.total_usage_hours,
            last_service_date=request.last_service_date,
            environment=request.environment,
            repair_cost_estimate=request.repair_cost_estimate,
            replacement_cost_estimate=request.replacement_cost_estimate
        )
        
        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])
        
        return {
            "success": True,
            "data": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/equipment/analyze/upload")
async def analyze_equipment_upload(file: UploadFile = File(...)):
    """
    Analyze an uploaded equipment image.
    
    Accepts an image file upload and returns analysis results.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    try:
        # Read and encode the file
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        # Add data URL prefix based on content type
        prefix = f"data:{file.content_type};base64,"
        full_base64 = prefix + image_base64
        
        analysis = await analyze_equipment_image(full_base64)
        
        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])
        
        return {
            "success": True,
            "data": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/equipment/schedule")
async def create_maintenance_schedule(request: ImageAnalysisRequest):
    """
    Generate a maintenance schedule based on equipment analysis.
    
    First analyzes the image, then generates a 6-month maintenance schedule.
    """
    try:
        # First analyze the equipment
        analysis = await analyze_equipment_image(request.image_base64)
        
        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])
        
        # Generate maintenance schedule
        schedule = await generate_maintenance_schedule(analysis)
        
        return {
            "success": True,
            "data": {
                "analysis": analysis,
                "schedule": schedule
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/equipment/schedule/from-analysis")
async def create_schedule_from_analysis(analysis: dict):
    """
    Generate a maintenance schedule from an existing analysis result.
    """
    try:
        schedule = await generate_maintenance_schedule(analysis)
        return {
            "success": True,
            "data": schedule
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/equipment/recommendations")
async def get_recommendations(analysis: dict):
    """
    Get repair recommendations for identified issues.
    """
    try:
        recommendations = await get_repair_recommendations(analysis)
        return {
            "success": True,
            "data": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/equipment/damaged-parts")
async def get_damaged_parts(analysis: dict):
    """
    Identify parts that need replacement.
    """
    try:
        parts = await identify_damaged_parts(analysis)
        return {
            "success": True,
            "data": parts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/equipment/history")
async def get_equipment_history():
    """
    Get history of all equipment analyses.
    """
    return {
        "success": True,
        "data": get_analysis_history()
    }


@app.get("/api/equipment/schedules")
async def get_all_schedules():
    """
    Get all maintenance schedules.
    """
    return {
        "success": True,
        "data": get_maintenance_schedules()
    }




# Subsidy Endpoints
@app.post("/api/subsidies")
async def get_subsidies(request: SubsidyRequest):
    """
    Get available agricultural subsidies.
    
    Can filter by equipment type and state.
    """
    subsidies = get_all_subsidies(
        equipment_type=request.equipment_type,
        state=request.state
    )
    return {
        "success": True,
        "data": subsidies
    }


@app.get("/api/subsidies/states")
async def get_subsidy_states():
    """
    Get list of states with subsidy data available.
    """
    return {
        "success": True,
        "data": get_available_states()
    }


@app.post("/api/subsidies/calculate")
async def calculate_subsidy(request: SubsidyCalculationRequest):
    """
    Calculate actual subsidy amount for an equipment purchase.
    """
    calculation = calculate_subsidy_amount(
        equipment_cost=request.equipment_cost,
        subsidy_percentage=request.subsidy_percentage,
        max_amount=request.max_amount
    )
    return {
        "success": True,
        "data": calculation
    }


# Full Analysis Pipeline
@app.post("/api/equipment/full-analysis")
async def full_equipment_analysis(request: ImageAnalysisRequest):
    """
    Perform complete equipment analysis including:
    - Equipment identification and health assessment
    - Maintenance schedule generation
    - Repair recommendations
    - Damaged parts identification
    - Price comparison for replacement parts
    - Applicable subsidies
    
    This is the main endpoint that orchestrates all agents.
    """
    try:
        # Step 1: Analyze equipment with full intelligence
        analysis = await analyze_equipment_intelligence(
            request.image_base64,
            equipment_type=request.equipment_type,
            equipment_age_days=request.equipment_age_days,
            total_usage_hours=request.total_usage_hours,
            last_service_date=request.last_service_date,
            environment=request.environment,
            repair_cost_estimate=request.repair_cost_estimate,
            replacement_cost_estimate=request.replacement_cost_estimate
        )
        
        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])
        
        # Step 2: Generate maintenance schedule
        schedule = await generate_maintenance_schedule(analysis)
        
        # Step 3: Get repair recommendations
        recommendations = await get_repair_recommendations(analysis)
        
        # Step 4: Identify damaged parts
        damaged_parts = await identify_damaged_parts(analysis)
        
        # Step 5: Get applicable subsidies
        subsidies = get_all_subsidies(
            equipment_type=analysis.get("equipment_type")
        )

        # Step 6: Connect to Marketplace (find relevant products)
        all_products = (await get_products())["products"]
        relevant_products = []
        
        # Search for products matching affected parts
        affected_parts = analysis.get("affected_parts", [])
        for part in affected_parts:
            part_lower = part.lower()
            for product in all_products:
                if part_lower in product["name"].lower() or part_lower in product["description"].lower():
                    if product not in relevant_products:
                        relevant_products.append(product)
        
        # If no specific parts found, suggest general maintenance kits for the equipment type
        if not relevant_products:
            eq_type_lower = analysis.get("equipment_type", "").lower()
            for product in all_products:
                if eq_type_lower in product["name"].lower() or eq_type_lower in product["description"].lower():
                     if product not in relevant_products:
                        relevant_products.append(product)

        return {
            "success": True,
            "data": {
                "analysis": analysis,
                "maintenance_schedule": schedule,
                "repair_recommendations": recommendations,
                "damaged_parts": damaged_parts,
                "subsidies": subsidies,
                "marketplace_recommendations": relevant_products[:5] # Limit to top 5
            }
        }
        

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in full_equipment_analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def root():
    return {"status": "ok", "message": "Annadata Saathi API Running"}

@app.get("/api/health")
def health_check_api():
    return {"status": "healthy", "service": "sankaat-saathi-api"}

# Include routers
app.include_router(feature1_router)
app.include_router(feature5_router, prefix="/api/schemes", tags=["Schemes"])
app.include_router(feature2_router)
app.include_router(feature3_router, prefix="/api/feature3")
# Feature 4: Farmer AI Agent & Profile Management
from feature4.router import feature4_router as farmer_agent_router
app.include_router(farmer_agent_router, prefix="/api/feature4", tags=["Farmer Agent"])

app.include_router(auth_router)
@app.get("/api/products")
async def get_products():
    """
    Get a list of available farming products for the marketplace.
    """
    products = [
        # Fertilizers & Chemicals
        { "id": 1, "name": "Organic Neem Oil", "price": 450, "category": "Fertilizer", "image": "https://placehold.co/400x400?text=Neem+Oil", "description": "Natural pesticide and fertilizer" },
        { "id": 2, "name": "Urea 46% Nitrogen", "price": 280, "category": "Fertilizer", "image": "https://placehold.co/400x400?text=Urea+Fertilizer", "description": "High nitrogen fertilizer for rapid growth" },
        { "id": 3, "name": "DAP Fertilizer", "price": 1350, "category": "Fertilizer", "image": "https://placehold.co/400x400?text=DAP+Fertilizer", "description": "Di-ammonium Phosphate for root development" },
        { "id": 4, "name": "NPK 19:19:19", "price": 1200, "category": "Fertilizer", "image": "https://placehold.co/400x400?text=NPK+Fertilizer", "description": "Balanced fertilizer for all crops" },
        { "id": 5, "name": "MOP (Potash)", "price": 1700, "category": "Fertilizer", "image": "https://placehold.co/400x400?text=MOP+Potash", "description": "Muriate of Potash for disease resistance" },
        
        # Seeds
        { "id": 10, "name": "Cotton Seeds (Bt)", "price": 850, "category": "Seeds", "image": "https://placehold.co/400x400?text=Cotton+Seeds", "description": "High yield pest resistant cotton seeds" },
        { "id": 11, "name": "Hybrid Maize Seeds", "price": 420, "category": "Seeds", "image": "https://placehold.co/400x400?text=Maize+Seeds", "description": "Drought resistant corn seeds" },
        
        # Equipment Parts
        { "id": 20, "name": "Rotavator Blade Set", "price": 2500, "category": "Parts", "image": "https://placehold.co/400x400?text=Rotavator+Blade", "description": "High durability L-type blades" },
        { "id": 21, "name": "Tractor Oil Filter", "price": 350, "category": "Parts", "image": "https://placehold.co/400x400?text=Oil+Filter", "description": "Standard oil filter for most tractors" },
        { "id": 22, "name": "Hydraulic Pump", "price": 8500, "category": "Parts", "image": "https://placehold.co/400x400?text=Hydraulic+Pump", "description": "Heavy duty hydraulic pump" },
        { "id": 23, "name": "Clutch Plate", "price": 4200, "category": "Parts", "image": "https://placehold.co/400x400?text=Clutch+Plate", "description": "Long life clutch plate" },
        { "id": 24, "name": "Air Filter", "price": 600, "category": "Parts", "image": "https://placehold.co/400x400?text=Air+Filter", "description": "High efficiency air intake filter" },
        { "id": 25, "name": "Maintenance Kit", "price": 1500, "category": "Parts", "image": "https://placehold.co/400x400?text=Service+Kit", "description": "General purpose maintenance kit" }
    ]
    
    return {
        "success": True,
        "products": products,
        "data": products,
        "total": len(products),
        "source": "LetGo3.0_Backend"
    }

# Feature 4 DRL: Crop Recommendations
from feature4_drl.router import router as feature4_drl_router
app.include_router(feature4_drl_router)

# Feature 6: Inventory & Blockchain
from feature6_blockchain.router import router as blockchain_router
app.include_router(blockchain_router, prefix="/api/feature6", tags=["Feature 6: Blockchain"])

# Face Auth Router
from face_auth.router import router as face_router
app.include_router(face_router, prefix="/api/face-auth", tags=["Face Auth"])
app.include_router(hardware_router)
app.include_router(admin_router)
app.include_router(news_router, prefix="/api")
app.include_router(inspections_router)
app.include_router(mandi_router, prefix="/api")
app.include_router(feature_agent_router)
app.include_router(voice_router, prefix="/api/voice", tags=["Voice Engine"])
app.include_router(report_router)

# Feature 7: Warehouse Safety Monitoring (Gas + Fire)
app.include_router(feature7_router)

# Crop Yield Prediction
from crop_yield_prediction.router import router as crop_yield_router
app.include_router(crop_yield_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
 
