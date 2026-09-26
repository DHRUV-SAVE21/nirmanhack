from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Literal
from langchain_core.messages import HumanMessage, AIMessage
from feature4.agent import agent_app
from feature5.subsidy_service import get_all_subsidies, get_available_states
from core.supabase_client import supabase
from core.security import encrypt_data, decrypt_data
import traceback

feature4_router = APIRouter()

class HistoryMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    thread_id: str
    history: Optional[List[HistoryMessage]] = []
    user_state: Optional[Dict] = {}

class FarmerProfileModel(BaseModel):
    user_id: Optional[str] = None
    full_name: Optional[str] = None
    father_husband_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    
    mobile_number: Optional[str] = None
    alternate_mobile: Optional[str] = None
    email: Optional[str] = None
    
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    voter_id: Optional[str] = None
    
    land_size: Optional[Any] = None # Can be str or float from frontend
    land_unit: Optional[str] = "acres"
    survey_number: Optional[str] = None
    land_ownership: Optional[str] = None
    crops: Optional[str] = None
    category: Optional[str] = "General"
    
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    
    profile_completed: Optional[bool] = False
    
    # Document URLs
    aadhaar_doc_url: Optional[str] = None
    land_doc_url: Optional[str] = None
    bank_passbook_url: Optional[str] = None
    photo_url: Optional[str] = None
    
    # Extra fields that might be sent
    last_ndvi_value: Optional[float] = None
    crop_loss_percentage: Optional[float] = None
    
    class Config:
        arbitrary_types_allowed = True
        extra = "allow" # Allow extra fields for flexibility

class ProfileWrapper(BaseModel):
    profile: FarmerProfileModel

class DocumentUpdateRequest(BaseModel):
    user_id: str
    column_name: str
    base64_data: str

# In-memory fallback (used if DB is unavailable)
farmer_profiles_fallback: Dict[str, Dict] = {}

# Supabase table name for farmer profiles
PROFILES_TABLE = "farmer_profiles"

@feature4_router.post("/profile/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    doc_type: str = Form(...)
):
    """
    Upload a document (Aadhaar, Land records, etc.) to Supabase Storage.
    """
    try:
        from datetime import datetime
        import uuid
        
        # Ensure bucket exists (named 'farmer-documents' in our schema)
        bucket_id = "farmer-documents"
        
        # File path formatting
        filename = file.filename
        ext = filename.split('.')[-1] if '.' in filename else ''
        file_path = f"{user_id}/{doc_type}_{uuid.uuid4().hex[:8]}.{ext}"
        
        # Read file
        content = await file.read()
        
        if supabase:
            # Try to upload to public storage
            try:
                # Basic storage upload
                storage_res = supabase.storage.from_(bucket_id).upload(
                    file_path, 
                    content,
                    file_options={"content-type": file.content_type}
                )
                
                # Get and return public URL
                public_url = supabase.storage.from_(bucket_id).get_public_url(file_path)
                return {
                    "success": True, 
                    "url": public_url, 
                    "file_path": file_path
                }
            except Exception as store_err:
                print(f" Supabase Storage error: {store_err}")
                # Fallback URL if bucket doesn't exist or permissions fail
                return {
                    "success": True, 
                    "url": f"https://api.annadatasaathi.com/mock-storage/{user_id}/{filename}",
                    "note": "using mock url due to storage config"
                }

        # Local fallback if Supabase not ready
        return {
            "success": True,
            "url": f"https://mock-storage.com/{filename}",
            "note": "supabase client missing"
        }
    except Exception as e:
        print(f" Error in upload_document: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@feature4_router.get("/schemes")
async def get_schemes(state: Optional[str] = None, category: Optional[str] = None):
    """
    Get all available schemes, optionally filtered by state.
    """
    try:
        result = get_all_subsidies(state=state)
        
        # Add category tags to schemes
        schemes = []
        for s in result.get("central_subsidies", []):
            s["category"] = "Central Scheme"
            schemes.append(s)
        for s in result.get("state_subsidies", []):
            s["category"] = "State Scheme"
            schemes.append(s)
        
        return {
            "schemes": schemes,
            "total": len(schemes),
            "available_states": get_available_states()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@feature4_router.get("/states")
async def get_states():
    """Get list of states with subsidy data."""
    return {"states": get_available_states()}

@feature4_router.post("/profile")
async def save_profile(wrapper: ProfileWrapper, user_id: str = "default"):
    """
    Save farmer profile to Supabase.
    Expects body: { "profile": { ... } }
    """
    try:
        final_user_id = user_id
        profile_data = wrapper.profile.dict(exclude_unset=True)

        # Use user_id from body if present, else use query param/default
        final_user_id = profile_data.get("user_id") or user_id

        # Ensure user_id is set
        profile_data["user_id"] = final_user_id

        # STRATEGIC LOCK: Ensure 'name' and 'user_id' are present (Supabase NOT NULL)
        if not profile_data.get("user_id"):
            profile_data["user_id"] = final_user_id
        
        if not profile_data.get("name"):
            profile_data["name"] = profile_data.get("full_name") or final_user_id

        if not profile_data.get("state"):
            profile_data["state"] = "Unknown"

        # 🔐 FINAL SECURITY HANDSHAKE: Encrypt any raw Base64 data found in doc fields
        doc_fields = ["aadhaar_doc_url", "land_doc_url", "bank_passbook_url", "photo_url"]
        for f in doc_fields:
            val = profile_data.get(f)
            if val and len(str(val)) > 100 and not str(val).startswith("enc_"):
                print(f"🔒 [ENCRYPTION] Locking Document: {f} ({len(str(val))} chars)")
                profile_data[f] = encrypt_data(str(val))

        # Atomic Sync with Supabase (Upsert Strategy)
        if supabase is not None:
             try:
                 print(f"🔄 [Registry_Commit] Syncing {final_user_id}...")
                 # Direct upsert on user_id key
                 result = supabase.table(PROFILES_TABLE).upsert(profile_data, on_conflict="user_id").execute()
                 
                 print(f"✨ [DB_SUCCESS] Registry Sync Complete for {final_user_id}")
                 print("*"*60 + "\n")
                 
                 # Decrypt for the final response so the Frontend shows it correctly
                 final_profile = result.data[0] if result.data else profile_data
                 for f in doc_fields:
                     v = final_profile.get(f)
                     if v and str(v).startswith("enc_"):
                         final_profile[f] = decrypt_data(str(v))

                 return {"message": "Registry Locked", "profile": final_profile}
             except Exception as sup_e:
                 print(f"🚨 [DB_CRITICAL] Registry sync failed: {sup_e}")
                 raise sup_e
        else:
            print("⚠️ Supabase not connected, using fallback")
            if final_user_id in farmer_profiles_fallback:
                farmer_profiles_fallback[final_user_id].update(profile_data)
            else:
                farmer_profiles_fallback[final_user_id] = profile_data
            return {"message": "Profile saved (in-memory fallback)", "profile": farmer_profiles_fallback[final_user_id]}

    except Exception as e:
        print(f"❌ Error saving profile: {e}")
        import traceback
        traceback.print_exc()
        # Fallback to in-memory on error
        if final_user_id in farmer_profiles_fallback:
            farmer_profiles_fallback[final_user_id].update(profile_data)
        else:
            farmer_profiles_fallback[final_user_id] = profile_data
        return {"message": "Profile saved (fallback)", "profile": farmer_profiles_fallback[final_user_id]}

@feature4_router.patch("/profile/document")
async def update_profile_document(request: DocumentUpdateRequest):
    """Atomic update for identity documents - ensures persistence without data clashes."""
    try:
        # Encryption Handshake
        final_data = request.base64_data
        if not final_data.startswith("enc_"):
            final_data = encrypt_data(final_data)
        
        if supabase is not None:
            # Atomic update on specific column
            result = supabase.table(PROFILES_TABLE).update({
                request.column_name: final_data,
                "updated_at": datetime.now().isoformat()
            }).eq("user_id", request.user_id).execute()
            
            if not result.data:
                # If record doesn't exist, we must create it with the document
                print(f"➕ [RegistryVault] Creating initial registry row for: {request.user_id}")
                result = supabase.table(PROFILES_TABLE).insert({
                    "user_id": request.user_id,
                    "name": request.user_id, # Placeholder name
                    "state": "Maharashtra", # Defaults for this project region
                    request.column_name: final_data
                }).execute()
            
            return {
                "status": "success", 
                "document_url": decrypt_data(final_data)
            }
        else:
            return {"status": "fallback", "message": "Manual DB override required"}

    except Exception as e:
        print(f"❌ Atomic Vault Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@feature4_router.get("/profile")
async def get_profile(user_id: str = "default", email: str = ""):
    """Get farmer profile from Supabase with multi-key lookup strategy."""
    try:
        print(f"🔍 [get_profile] Lookup for user_id={user_id}, email={email}")
        if supabase is not None:
            # 1. Try primary lookup (ID)
            result = supabase.table(PROFILES_TABLE).select("*").eq("user_id", user_id).execute()
            
            # 2. Try fallback lookup (Email) if UUID lookup failed and we have an email
            if not (result.data and len(result.data) > 0) and email:
                print(f"🔄 [get_profile] ID lookup failed ({user_id}), trying Email lookup: {email}")
                result = supabase.table(PROFILES_TABLE).select("*").eq("user_id", email).execute()
            
            if result.data and len(result.data) > 0:
                profile = result.data[0]
                
                # Decrypt documents for viewing
                doc_fields = ["aadhaar_doc_url", "land_doc_url", "bank_passbook_url", "photo_url"]
                for f in doc_fields:
                    if profile.get(f):
                        profile[f] = decrypt_data(profile[f])

                print(f"✅ [get_profile] Profile recovered & decrypted for {email or user_id}")
                return {"profile": profile}
        
        # Fallback to in-memory (using either key)
        if user_id in farmer_profiles_fallback:
            return {"profile": farmer_profiles_fallback[user_id]}
        if email and email in farmer_profiles_fallback:
            return {"profile": farmer_profiles_fallback[email]}
        
        print(f"❓ [get_profile] No profile found in DB for: {user_id} or legacy {email}")
        return {"profile": None}
    except Exception as e:
        print(f" Supabase read failed, using fallback: {e}")
        if user_id in farmer_profiles_fallback:
            return {"profile": farmer_profiles_fallback[user_id]}
        return {"profile": None}

@feature4_router.post("/chat")
async def chat_with_agent(request: ChatRequest):
    try:
        # Build messages from history
        messages = []
        if request.history:
            for msg in request.history:
                if msg.role == 'user':
                    messages.append(HumanMessage(content=msg.content))
                else:
                    messages.append(AIMessage(content=msg.content))
        else:
            # Fallback: just use the current message
            messages.append(HumanMessage(content=request.message))
        
        # Construct state with full history
        initial_state = {
            "messages": messages,
            "user_profile": request.user_state or {}
        }
        
        # Run agent
        final_state = await agent_app.ainvoke(initial_state)
        
        # Extract response
        last_message = final_state["messages"][-1]
        response_text = last_message.content
        
        return {
            "response": response_text,
            "current_profile": final_state.get("user_profile"),
            "found_schemes": final_state.get("found_schemes"),
            "application_status": final_state.get("application_status"),
            "application_details": final_state.get("application_details")
        }
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
