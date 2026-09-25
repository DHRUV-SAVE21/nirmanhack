import traceback
from datetime import datetime
from core.supabase_client import supabase

class ClaimsService:
    @staticmethod
    def create_claim(application_data: dict, user_id: str):
        """
        Creates a new claim application in the database.
        
        Args:
            application_data (dict): The claim data from the frontend.
            user_id (str): The ID of the user submitting the claim.
            
        Returns:
            dict: The created claim record, including the reference number.
        """
        try:
            # Generate Reference Number (CLM-YYYY-XXXXX)
            # We let the database handle the reference number generation via trigger/function if possible
            # OR we generate it here. Let's do it here for simplicity.
            # actually, let's rely on UUID for ID and generate a reference number
            
            import random
            ref_no = f"CLM-{datetime.now().year}-{random.randint(10000, 99999)}"

            # Prepare payload for Supabase
            payload = {
                "user_id": user_id,
                "reference_no": ref_no,
                "farmer_name": application_data.get("farmer_name"),
                "father_husband_name": application_data.get("father_husband_name"),
                "farmer_phone": application_data.get("farmer_phone"),
                "aadhaar_number": application_data.get("aadhaar_number"),
                "scheme_name": application_data.get("scheme_name"),
                "claim_type": application_data.get("claim_type"),
                "crop_name": application_data.get("crop_name"),
                "land_size": application_data.get("land_size"),
                "ndvi_value": application_data.get("ndvi_value"),
                "crop_loss_percentage": application_data.get("crop_loss_percentage"),
                "claim_amount": application_data.get("claim_amount"),
                "status": "submitted",
                "application_details": application_data.get("application_details", {}),
                "loss_details": application_data.get("loss_details", {}),
                "document_urls": application_data.get("document_urls", {}),
                "created_at": datetime.now().isoformat()
            }

            # Insert into database
            response = supabase.table("claim_applications").insert(payload).execute()
            
            if not response.data:
                raise Exception("Failed to insert claim application")
                
            return response.data[0]

        except Exception as e:
            print(f"Error creating claim: {e}")
            traceback.print_exc()
            raise e

    @staticmethod
    def get_all_claims(limit=100, status=None):
        """
        Fetches all claims (for admin).
        """
        try:
            query = supabase.table("claim_applications").select("*").order("created_at", desc=True).limit(limit)
            
            if status:
                query = query.eq("status", status)
                
            response = query.execute()
            return response.data
        except Exception as e:
            print(f"Error fetching claims: {e}")
            raise e

    @staticmethod
    def get_claim_by_id(claim_id):
        """
        Fetches a single claim by ID.
        """
        try:
            response = supabase.table("claim_applications").select("*").eq("id", claim_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error fetching claim {claim_id}: {e}")
            raise e

    @staticmethod
    def update_claim_status(claim_id, status, notes=None, approved_amount=None):
        """
        Updates the status of a claim.
        """
        try:
            payload = {"status": status}
            if notes:
                payload["admin_notes"] = notes
            if approved_amount:
                payload["approved_amount"] = approved_amount
                
            response = supabase.table("claim_applications").update(payload).eq("id", claim_id).execute()
            return response.data
        except Exception as e:
            print(f"Error updating claim status: {e}")
            raise e
