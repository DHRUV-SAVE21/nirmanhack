"""
Scheme Application Service - Manages farmer government scheme applications
ADAPTED TO EXISTING SCHEMA: Uses user_id (text), reference_no, and JSONB application_details
"""
from core.supabase_client import supabase
from typing import List, Optional, Dict
from datetime import datetime
import random
import string

class SchemeApplicationService:
    """Service to manage scheme applications in database"""
    
    @staticmethod
    def generate_reference_no() -> str:
        """Generate unique reference number like SA-2024-XXXXX"""
        year = datetime.now().year
        random_part = ''.join(random.choices(string.digits, k=5))
        return f"SA-{year}-{random_part}"
    
    @staticmethod
    def create_application(
        user_id: str,
        scheme_name: str,
        application_details: Dict,
        farmer_name: Optional[str] = None,
        farmer_phone: Optional[str] = None
    ) -> Dict:
        """
        Create a new scheme application
        
        Args:
            user_id: Farmer's user ID (from farmer_profiles)
            scheme_name: Name of the government scheme
            application_details: JSONB object with all application data
            farmer_name: Farmer's name (optional)
            farmer_phone: Farmer's phone number (optional)
            
        Returns:
            Application record or error
        """
        try:
            print(f" Creating application for user: {user_id}, scheme: {scheme_name}")
            
            # Generate unique reference number
            reference_no = SchemeApplicationService.generate_reference_no()
            print(f" Generated reference_no: {reference_no}")
            
            # Check if reference_no already exists (very unlikely)
            try:
                existing = supabase.table('scheme_applications')\
                    .select('reference_no')\
                    .eq('reference_no', reference_no)\
                    .execute()
                
                # Retry if duplicate
                while existing.data and len(existing.data) > 0:
                    reference_no = SchemeApplicationService.generate_reference_no()
                    existing = supabase.table('scheme_applications')\
                        .select('reference_no')\
                        .eq('reference_no', reference_no)\
                        .execute()
            except Exception as check_error:
                print(f" Could not check for existing reference (table might not exist): {check_error}")
            
            application_data = {
                "reference_no": reference_no,
                "user_id": user_id,
                "farmer_name": farmer_name,
                "farmer_phone": farmer_phone,
                "scheme_name": scheme_name,
                "status": "submitted",
                "application_details": application_details
            }
            
            print(f" Inserting data: {application_data}")
            
            response = supabase.table('scheme_applications')\
                .insert(application_data)\
                .execute()
            
            print(f" Supabase response: {response}")
            print(f" Response data: {response.data}")
            print(f" Response count: {response.count if hasattr(response, 'count') else 'N/A'}")
            
            if response.data and len(response.data) > 0:
                print(f" Scheme application created: {reference_no} - {scheme_name}")
                return {"status": "success", "data": response.data[0], "reference_no": reference_no}
            else:
                error_msg = f"No data returned from insert. Response: {response}"
                print(f" {error_msg}")
                return {"status": "error", "message": error_msg}
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f" Error creating scheme application: {e}")
            print(f" Full traceback:\n{error_trace}")
            return {"status": "error", "message": str(e), "traceback": error_trace}
    
    @staticmethod
    def get_farmer_applications(user_id: str) -> List[Dict]:
        """
        Get all applications by a specific farmer
        
        Args:
            user_id: User ID of the farmer
            
        Returns:
            List of application records
        """
        try:
            response = supabase.table('scheme_applications')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            print(f" Error fetching farmer applications: {e}")
            return []
    
    @staticmethod
    def get_all_applications(
        limit: int = 100,
        status: Optional[str] = None,
        offset: int = 0
    ) -> Dict:
        """
        Get all scheme applications (for admin)
        
        Args:
            limit: Number of records to return
            status: Filter by application status
            offset: Pagination offset
            
        Returns:
            Dictionary with applications and count
        """
        try:
            query = supabase.table('scheme_applications')\
                .select('*', count='exact')\
                .order('created_at', desc=True)\
                .range(offset, offset + limit - 1)
            
            # Add status filter if provided
            if status and status != 'All':
                query = query.eq('status', status)
            
            response = query.execute()
            
            return {
                "applications": response.data if response.data else [],
                "total": response.count or 0
            }
            
        except Exception as e:
            print(f" Error fetching all applications: {e}")
            return {"applications": [], "total": 0}
    
    @staticmethod
    def update_application_status(
        application_id: str,  # UUID as string
        status: str
    ) -> bool:
        """
        Update application status (admin only)
        
        Args:
            application_id: UUID of the application
            status: New status
            
        Returns:
            True if successful, False otherwise
        """
        try:
            response = supabase.table('scheme_applications')\
                .update({"status": status})\
                .eq('id', application_id)\
                .execute()
            
            if response.data and len(response.data) > 0:
                print(f" Application {application_id} updated to {status}")
                return True
            
            return False
            
        except Exception as e:
            print(f" Error updating application status: {e}")
            return False
    
    @staticmethod
    def get_statistics() -> Dict:
        """
        Get application statistics for admin dashboard
        
        Returns:
            Statistics dictionary
        """
        try:
            # Total applications
            total = supabase.table('scheme_applications')\
                .select('id', count='exact')\
                .execute()
            
            # Submitted applications
            submitted = supabase.table('scheme_applications')\
                .select('id', count='exact')\
                .eq('status', 'submitted')\
                .execute()
            
            # Approved applications
            approved = supabase.table('scheme_applications')\
                .select('id', count='exact')\
                .eq('status', 'approved')\
                .execute()
            
            # Under review applications
            under_review = supabase.table('scheme_applications')\
                .select('id', count='exact')\
                .eq('status', 'under_review')\
                .execute()
            
            return {
                "total": total.count or 0,
                "submitted": submitted.count or 0,
                "under_review": under_review.count or 0,
                "approved": approved.count or 0
            }
            
        except Exception as e:
            print(f" Error fetching statistics: {e}")
            return {"total": 0, "submitted": 0, "under_review": 0, "approved": 0}
