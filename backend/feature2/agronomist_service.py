"""
Agronomist Service - Fetches expert agronomist data from database
"""
from core.supabase_client import supabase
from typing import List, Optional, Dict
import random

class AgronomistService:
    """Service to manage agronomist data from database"""
    
    @staticmethod
    def get_random_agronomists(count: int = 2, specialization: Optional[str] = None) -> List[Dict]:
        """
        Fetch random available agronomists from database
        
        Args:
            count: Number of agronomists to return (default: 2)
            specialization: Filter by specialization (optional)
            
        Returns:
            List of agronomist dictionaries with name, phone, specialization
        """
        try:
            # Build query
            query = supabase.table('agronomists')\
                .select('id, name, phone, specialization, experience_years, rating')\
                .eq('is_available', True)
            
            # Add specialization filter if provided
            if specialization:
                query = query.ilike('specialization', f'%{specialization}%')
            
            # Execute query
            response = query.execute()
            
            if not response.data or len(response.data) == 0:
                # Fallback to hardcoded experts if DB is empty
                return [
                    {"name": "Dr. Shreedhar", "phone": "+919021935820", "specialization": "Crop Disease"},
                    {"name": "Dr. Dhruv", "phone": "+918408917498", "specialization": "Pest Control"}
                ][:count]
            
            # Shuffle and return random experts
            experts = response.data
            random.shuffle(experts)
            
            return experts[:count]
            
        except Exception as e:
            print(f" Database Error fetching agronomists: {e}")
            # Fallback to hardcoded on error
            return [
                {"name": "Dr. Shreedhar", "phone": "+919021935820", "specialization": "Crop Disease"},
                {"name": "Dr. Dhruv", "phone": "+918408917498", "specialization": "Pest Control"}
            ][:count]
    
    @staticmethod
    def get_agronomist_by_phone(phone: str) -> Optional[Dict]:
        """
        Get agronomist details by phone number
        
        Args:
            phone: Phone number to search
            
        Returns:
            Agronomist dictionary or None
        """
        try:
            response = supabase.table('agronomists')\
                .select('*')\
                .eq('phone', phone)\
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            
            return None
            
        except Exception as e:
            print(f" Error fetching agronomist by phone: {e}")
            return None
    
    @staticmethod
    def increment_consultation_count(agronomist_id: int) -> bool:
        """
        Increment the consultation count for an agronomist
        
        Args:
            agronomist_id: ID of the agronomist
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get current count
            response = supabase.table('agronomists')\
                .select('total_consultations')\
                .eq('id', agronomist_id)\
                .execute()
            
            if response.data and len(response.data) > 0:
                current_count = response.data[0].get('total_consultations', 0)
                
                # Update count
                supabase.table('agronomists')\
                    .update({'total_consultations': current_count + 1})\
                    .eq('id', agronomist_id)\
                    .execute()
                
                return True
            
            return False
            
        except Exception as e:
            print(f" Error updating consultation count: {e}")
            return False
