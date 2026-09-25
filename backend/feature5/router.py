from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from core.supabase_client import supabase
from core.security import decrypt_data

router = APIRouter()

class SchemeApplicationCreate(BaseModel):
    scheme_name: str
    scheme_id: str
    applicant_name: str
    state: Optional[str] = None
    category: Optional[str] = None
    subsidy_amount: Optional[str] = None
    subsidy_percentage: Optional[float] = None
    portal_url: Optional[str] = None
    reference_no: Optional[str] = None
    
class SchemeApplicationUpdate(BaseModel):
    status: str
    comments: Optional[str] = None

@router.post("/apply", response_model=dict)
async def apply_scheme(application: SchemeApplicationCreate, user_id: str = "default"):
    # If user_id passed as query param default, we use it.
    if user_id == "default_user": user_id = "default"

    if not application.reference_no:
        import time
        import random
        prefix = "AGR"
        timestamp = str(int(time.time()))[-6:]
        rand = str(random.randint(100, 999))
        application.reference_no = f"{prefix}-{timestamp}-{rand}"

    app_data = application.dict()
    scheme_name = app_data.get("scheme_name")
    reference_no = app_data.get("reference_no")
    
    # Store full details in jsonb
    application_details = app_data

    row = {
        "reference_no": reference_no,
        "user_id": user_id, 
        "scheme_name": scheme_name,
        "status": "submitted", # Default status
        "application_details": application_details
    }
    
    try:
        response = supabase.table("scheme_applications").insert(row).execute()
        return {"message": "Application submitted successfully", "application": response.data[0] if response.data else row}
    except Exception as e:
        print(f"Error submitting application: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/applications/all", response_model=List[dict])
async def get_all_applications():
    """Fetch all applications for Admin - Sorted by latest first"""
    try:
        # 10x Dev Note: Explicitly sort by created_at DESC for 'Latest first' requirement
        # Join with farmer_profiles to get the base64 documents
        # Note: In Supabase/PostgREST, we can use 'farmer_profiles(*)' if FK exists, 
        # but here we'll do a simple efficient separate lookup or fix the model to include docs.
        response = supabase.table("scheme_applications").select("*").order("created_at", desc=True).execute()
        
        apps = response.data
        if not apps:
            return []
            
        # Get all profile docs in one batch to be efficient
        user_ids = list(set([a.get("user_id") for a in apps if a.get("user_id")]))
        profiles_res = supabase.table("farmer_profiles").select("user_id, photo_url, aadhaar_doc_url, land_doc_url, bank_passbook_url").in_("user_id", user_ids).execute()
        
        profiles_map = {p["user_id"]: p for p in profiles_res.data} if profiles_res.data else {}

        mapped_data = []
        for item in apps:
            details = item.get("application_details") or {}
            user_id = item.get("user_id")
            profile = profiles_map.get(user_id, {})
            
            # 10x Dev Note: Return both created_at (original) and applied_date (UI mapping) 
            # to ensure frontend components find the timestamp regardless of naming choice.
            flat_item = {
                "id": item.get("id"),
                "reference_no": item.get("reference_no"),
                "status": item.get("status"),
                "created_at": item.get("created_at"),
                "applied_date": item.get("created_at"),
                "created_at": item.get("created_at"), # Frontend expects created_at
                "scheme_name": item.get("scheme_name"),
                "applicant_name": details.get("applicant_name", "Unknown"),
                "farmer_name": details.get("applicant_name", "Unknown"), # Match frontend AdminSchemes.jsx
                "farmer_phone": profile.get("phone") or details.get("phone", "N/A"),
                "state": details.get("state", "Unknown"),
                "subsidy_amount": details.get("subsidy_amount", "N/A"),
                "category": details.get("category"),
                "details": details,
                # Include the Base64 documents from the profile (DECRYPTED)
                "farmer_docs": {
                    "photo": decrypt_data(profile.get("photo_url")),
                    "aadhaar": decrypt_data(profile.get("aadhaar_doc_url")),
                    "land": decrypt_data(profile.get("land_doc_url")),
                    "bank": decrypt_data(profile.get("bank_passbook_url"))
                }
            }
            mapped_data.append(flat_item)
            
        return mapped_data
    except Exception as e:
        print(f"Error fetching applications: {e}")
        return []

@router.get("/applications/my", response_model=List[dict])
async def get_my_applications(user_id: str = "default"):
    """Fetch applications for logged in user"""
    if user_id == "default_user": user_id = "default"
    
    try:
        response = supabase.table("scheme_applications").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        mapped_data = []
        for item in response.data:
            details = item.get("application_details") or {}
            flat_item = {
                "id": item.get("id"),
                "reference_no": item.get("reference_no"),
                "status": item.get("status"),
                "applied_date": item.get("created_at"),
                "scheme_name": item.get("scheme_name"),
                "applicant_name": details.get("applicant_name"),
                "state": details.get("state"),
                "subsidy_amount": details.get("subsidy_amount"),
                "details": details
            }
            mapped_data.append(flat_item)
        return mapped_data
    except Exception as e:
        print(f"Error fetching my applications: {e}")
        return []

@router.patch("/applications/{application_id}/status", response_model=dict)
async def update_application_status(application_id: str, update: SchemeApplicationUpdate):
    """Update application status"""
    try:
        response = supabase.table("scheme_applications").update({"status": update.status}).eq("id", application_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Application not found")
        return {"message": "Status updated", "application": response.data[0]}
    except Exception as e:
        print(f"Error updating status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/applications/statistics", response_model=dict)
async def get_statistics():
    """Get application statistics"""
    try:
        # We need to compute counts. Supabase py client might vary on how to do count w/o fetching all.
        # But for now, fetching all is okay for small scale.
        response = supabase.table("scheme_applications").select("status", count="exact").execute()
        
        # Or better separate queries if necessary, but select status is cheap.
        response = supabase.table("scheme_applications").select("status").execute()
        data = response.data
        
        total = len(data)
        submitted = sum(1 for x in data if x['status'] == 'submitted')
        under_review = sum(1 for x in data if x['status'] == 'under_review')
        approved = sum(1 for x in data if x['status'] == 'approved')
        rejected = sum(1 for x in data if x['status'] == 'rejected')
        
        return {
            "total": total,
            "submitted": submitted,
            "under_review": under_review,
            "approved": approved,
            "rejected": rejected
        }
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return {"total": 0, "submitted": 0, "under_review": 0, "approved": 0, "rejected": 0}
