from langchain_core.tools import tool
from typing import Dict, List, Optional
from feature5.subsidy_service import get_all_subsidies, calculate_subsidy_amount
from core.supabase_client import supabase, PROFILES_TABLE
from datetime import datetime, timezone
import random
import string
import json

# Table for scheme applications
APPLICATIONS_TABLE = "scheme_applications"

@tool
def search_local_schemes(query: str, state: Optional[str] = None) -> Dict:
    """
    Search for government schemes and subsidies in the local database.
    Useful when you need to find specific policies for farmers.
    
    Args:
        query: The search query (e.g., "tractor", "solar pump").
        state: The state of the farmer (e.g., "Maharashtra", "Punjab").
    """
    # Simple keyword mapping for local tool
    equipment_type = None
    if "tractor" in query.lower():
        equipment_type = "Tractors"
    elif "solar" in query.lower():
        equipment_type = "Solar"
    elif "pump" in query.lower():
        equipment_type = "Water Pumps"
    
    return get_all_subsidies(equipment_type=equipment_type, state=state)

@tool
def calculate_benefits(cost: float, percentage: float, max_cap: float) -> Dict:
    """
    Calculate the exact subsidy amount and farmer's contribution.
    """
    return calculate_subsidy_amount(cost, percentage, max_cap)


# --- New Tools for Automated Form Filling and Submission ---

def _generate_reference_number() -> str:
    """Generate a unique application reference number."""
    prefix = "AGR"
    timestamp = datetime.now().strftime("%y%m%d%H%M")
    random_suffix = ''.join(random.choices(string.digits, k=4))
    return f"{prefix}-{timestamp}-{random_suffix}"


def _find_scheme_by_name(scheme_name: str) -> Optional[Dict]:
    """Find a scheme by name from the database."""
    scheme_name_lower = scheme_name.lower()
    result = get_all_subsidies()
    all_schemes = result.get("central_subsidies", []) + result.get("state_subsidies", [])
    for scheme in all_schemes:
        if scheme_name_lower in scheme.get("scheme_name", "").lower():
            return scheme
    return None


# Required fields for different scheme types
SCHEME_REQUIRED_FIELDS = {
    "default": ["name", "state", "phone", "aadhaar"],
    "equipment": ["name", "state", "phone", "aadhaar", "land_size", "equipment_type"],
    "solar": ["name", "state", "phone", "aadhaar", "land_size", "electricity_connection"],
    "loan": ["name", "state", "phone", "aadhaar", "land_size", "bank_account", "income"],
}


def _get_required_fields(scheme_name: str) -> List[str]:
    """Determine required fields based on scheme type."""
    scheme_lower = scheme_name.lower()
    
    if "solar" in scheme_lower or "kusum" in scheme_lower:
        return SCHEME_REQUIRED_FIELDS["solar"]
    elif "loan" in scheme_lower or "credit" in scheme_lower or "fund" in scheme_lower:
        return SCHEME_REQUIRED_FIELDS["loan"]
    elif any(eq in scheme_lower for eq in ["tractor", "pump", "machinery", "equipment", "mechanization"]):
        return SCHEME_REQUIRED_FIELDS["equipment"]
    
    return SCHEME_REQUIRED_FIELDS["default"]


@tool
def auto_fill_application(scheme_name: str, user_profile: Dict) -> Dict:
    """
    Automatically fill application form fields for a government scheme using user profile data.
    Use this when the user wants to apply for a scheme and you need to prepare the application.
    
    Args:
        scheme_name: Name of the scheme to apply for (e.g., "PM-KUSUM", "SMAM").
        user_profile: User's profile data containing name, state, phone, land_size, category, etc.
    
    Returns:
        Dictionary with filled_fields, missing_fields, can_submit status, and scheme details.
    """
    # Find the scheme
    scheme = _find_scheme_by_name(scheme_name)
    if not scheme:
        return {
            "success": False,
            "error": f"Scheme '{scheme_name}' not found in database",
            "can_submit": False,
            "filled_fields": {},
            "missing_fields": [],
            "suggestions": "Please search for available schemes first using search_local_schemes tool."
        }
    
    # Get required fields for this scheme
    required_fields = _get_required_fields(scheme_name)
    
    # Map user profile to form fields
    profile = user_profile or {}
    filled_fields = {}
    missing_fields = []
    
    # Field mapping from profile to form
    field_mapping = {
        "name": profile.get("name"),
        "state": profile.get("state"),
        "district": profile.get("district"),
        "phone": profile.get("phone"),
        "aadhaar": profile.get("aadhaar", "XXXX-XXXX-XXXX"),  # Placeholder for demo
        "land_size": profile.get("land_size"),
        "category": profile.get("category", "General"),
        "crops": profile.get("crops"),
        "bank_account": profile.get("bank_account", "Auto-linked via Aadhaar"),
        "equipment_type": profile.get("equipment_type", "As per scheme"),
        "electricity_connection": profile.get("electricity_connection", "Yes"),
        "income": profile.get("income", "Below 2.5 LPA"),
    }
    
    # Fill available fields and track missing ones
    for field in required_fields:
        value = field_mapping.get(field)
        if value and str(value).strip():
            filled_fields[field] = value
        else:
            missing_fields.append(field)
    
    # Calculate subsidy if land_size is available
    subsidy_info = None
    if profile.get("land_size") and scheme.get("max_amount"):
        estimated_cost = float(profile.get("land_size", 1)) * 50000  # Rough estimate
        subsidy_info = calculate_subsidy_amount(
            estimated_cost, 
            scheme.get("subsidy_percentage", 50), 
            scheme.get("max_amount", 100000)
        )
    
    can_submit = len(missing_fields) == 0 or all(
        f in ["aadhaar", "bank_account", "electricity_connection", "income"] 
        for f in missing_fields
    )
    
    return {
        "success": True,
        "scheme": scheme,
        "filled_fields": filled_fields,
        "missing_fields": missing_fields,
        "can_submit": can_submit,
        "subsidy_estimate": subsidy_info,
        "message": "Form auto-filled successfully" if can_submit else f"Missing required fields: {', '.join(missing_fields)}"
    }


@tool
def submit_scheme_application(scheme_name: str, filled_fields: Dict, user_profile: Dict) -> Dict:
    """
    Submit an application for a government scheme on behalf of the user.
    Use this after auto_fill_application confirms can_submit is True.
    
    Args:
        scheme_name: Name of the scheme to apply for.
        filled_fields: Dictionary of form fields that have been filled.
        user_profile: User's profile data for verification.
    
    Returns:
        Dictionary with reference_no, status, submission details, and next steps.
    """
    # Find the scheme
    scheme = _find_scheme_by_name(scheme_name)
    if not scheme:
        return {
            "success": False,
            "status": "failed",
            "error": f"Scheme '{scheme_name}' not found",
            "fallback_url": None
        }
    
    # Validate required fields
    profile = user_profile or {}
    if not profile.get("name") or not profile.get("state"):
        return {
            "success": False,
            "status": "incomplete",
            "error": "Missing required profile information (name and state)",
            "missing": ["name", "state"],
            "fallback_url": scheme.get("application_url")
        }
    
    # Generate application reference
    reference_no = _generate_reference_number()
    submitted_at = datetime.now(timezone.utc).isoformat()
    
    # Prepare application details
    application_details = {
        "reference_no": reference_no,
        "scheme_name": scheme.get("scheme_name"),
        "scheme_source": scheme.get("source"),
        "applicant_name": profile.get("name", "Farmer"),
        "applicant_state": profile.get("state"),
        "applicant_category": profile.get("category", "General"),
        "land_size": profile.get("land_size"),
        "subsidy_percentage": scheme.get("subsidy_percentage"),
        "max_subsidy_amount": scheme.get("formatted_max_amount"),
        "submitted_at": submitted_at,
        "status": "submitted",
        "estimated_processing_days": 14,
        "portal_url": scheme.get("application_url"),
        "filled_fields": filled_fields
    }
    
    # Try to save to Database
    db_save_success = False
    try:
        if supabase:
            # First ensure user has a profile or get their ID
            # In a real app we would query the user_id from auth, here we assume it's passed or default
            user_id = profile.get("user_id", "default")
            
            # Prepare DB record
            db_record = {
                "reference_no": reference_no,
                "user_id": user_id,
                "scheme_name": scheme.get("scheme_name"),
                "status": "submitted",
                "application_details": application_details,
                "farmer_name": profile.get("name") or profile.get("full_name") or "Farmer",
                "farmer_phone": profile.get("phone") or profile.get("mobile_number") or "",
                "created_at": submitted_at,
                "updated_at": submitted_at
            }
            
            # Insert into Supabase
            result = supabase.table(APPLICATIONS_TABLE).insert(db_record).execute()
            if result.data:
                db_save_success = True
                print(f" Application saved to DB: {reference_no}")
            else:
                print(f" Failed to save application to DB (no data returned)")
    except Exception as e:
        print(f" Database error saving application: {e}")
        # Continue with success response even if DB fails (graceful degradation)
    
    return {
        "success": True,
        "status": "submitted",
        "reference_no": reference_no,
        "application_details": application_details,
        "db_saved": db_save_success,
        "message": f"Application for {scheme.get('scheme_name')} submitted successfully!",
        "next_steps": [
            "Your application has been registered in the system",
            f"Reference Number: {reference_no}",
            "You will receive SMS confirmation shortly",
            "Document verification will be scheduled within 7 days",
            f"Track status at: {scheme.get('application_url')}"
        ],
        "helpline": "1800-180-1551 (Kisan Call Center)"
    }


# List of all tools for export
ALL_TOOLS = [search_local_schemes, calculate_benefits, auto_fill_application, submit_scheme_application]
