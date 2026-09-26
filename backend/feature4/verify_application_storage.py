import sys
import os
import asyncio
from dotenv import load_dotenv

# Add parent directory to path to allow importing modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load environment variables
load_dotenv()

from feature4.tools import submit_scheme_application
from core.supabase_client import supabase, PROFILES_TABLE

def test_submit_application():
    print(" Testing submit_scheme_application...")
    
    user_id = "test_user_123"
    
    # 1. Ensure test user profile exists to avoid FK error
    if supabase:
        print(f"Checking/Creating test user profile for ID: {user_id}")
        profile_data = {
            "user_id": user_id,
            "name": "Test Farmer",
            "state": "Maharashtra", 
            "phone": "9999999999"
        }
        try:
            # Upsert profile
            supabase.table(PROFILES_TABLE).upsert(profile_data, on_conflict="user_id").execute()
            print(" Test profile ensured.")
        except Exception as e:
            print(f" Failed to create test profile: {e}")

    # Mock user profile
    user_profile = {
        "user_id": user_id,
        "name": "Test Farmer",
        "state": "Maharashtra",
        "land_size": 5.0,
        "category": "General",
        "phone": "9999999999"
    }
    
    # Mock filled fields
    filled_fields = {
        "name": "Test Farmer",
        "state": "Maharashtra",
        "land_size": 5.0,
        "phone": "9999999999",
        "aadhaar": "1234-5678-9012"
    }
    
    scheme_name = "PM-KUSUM"
    
    # Call the tool
    try:
        result = submit_scheme_application.invoke({
            "scheme_name": scheme_name,
            "filled_fields": filled_fields,
            "user_profile": user_profile
        })
        
        print("\n Tool Result:")
        print(f"Success: {result.get('success')}")
        print(f"Reference No: {result.get('reference_no')}")
        print(f"DB Saved: {result.get('db_saved')}")
        
        if result.get("success") and result.get("db_saved"):
            print("\n Verification PASSED: Application submitted and marked as saved to DB.")
        elif result.get("success") and not result.get("db_saved"):
            print("\n Verification WARNING: Application submitted but NOT saved to DB (check Supabase logs).")
        else:
            print("\n Verification FAILED: Application submission failed.")
            
    except Exception as e:
        print(f"\n Verification ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_submit_application()
