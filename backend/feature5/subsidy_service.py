"""
Subsidy Service Module - Agricultural Subsidies for Farm Equipment

This module provides information about government subsidies available for:
- Farm equipment purchases
- Repairs and maintenance
- Replacement parts

Data sources:
- Central Government schemes (PM-KISAN, PM-KUSUM, etc.)
- State-level agricultural subsidies
- Bank loan schemes for farmers

Note: Initial implementation uses sample data. 
Can be extended to fetch from official government APIs.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
import os

from core.supabase_client import supabase

# For backward compatibility with existing feature4 imports
CENTRAL_SUBSIDIES = []
STATE_SUBSIDIES = {}

class Subsidy:
    def __init__(
        self,
        scheme_name: str,
        description: str,
        subsidy_percentage: float = 0,
        max_amount: float = 0,
        eligibility: list[str] = [],
        applicable_equipment: list[str] = [],
        source: str = "Government",
        application_url: str = "",
        valid_until: Optional[str] = None,
        state: Optional[str] = None,
        category: Optional[str] = "General",
        **kwargs # Accept extra fields like id, created_at, updated_at
    ):
        self.scheme_name = scheme_name
        self.description = description
        self.subsidy_percentage = subsidy_percentage
        self.max_amount = max_amount
        self.eligibility = eligibility
        self.applicable_equipment = applicable_equipment
        self.source = source
        self.application_url = application_url
        self.valid_until = valid_until
        self.state = state
        self.category = category
    
    def to_dict(self) -> dict:
        return {
            "scheme_name": self.scheme_name,
            "description": self.description,
            "subsidy_percentage": self.subsidy_percentage,
            "max_amount": self.max_amount,
            "formatted_max_amount": f"₹{self.max_amount:,.0f}" if self.max_amount > 0 else "Varies",
            "eligibility": self.eligibility,
            "applicable_equipment": self.applicable_equipment,
            "source": self.source,
            "application_url": self.application_url,
            "valid_until": self.valid_until,
            "state": self.state,
            "category": self.category
        }

# Cache for states
_STATES_CACHE = []

def get_central_subsidies(equipment_type: Optional[str] = None) -> list[dict]:
    """Get central government subsidies from database."""
    try:
        query = supabase.table("available_schemes").select("*").is_("state", "null")
        if equipment_type:
            # Simple text search for equipment in applicable_equipment jsonb
            query = query.filter("applicable_equipment", "cs", f'["{equipment_type}"]')
        
        response = query.execute()
        return [Subsidy(**item).to_dict() for item in response.data] if response.data else []
    except Exception as e:
        print(f"Error fetching central subsidies: {e}")
        return []

def get_state_subsidies(state: str, equipment_type: Optional[str] = None) -> list[dict]:
    """Get state-level subsidies from database."""
    try:
        query = supabase.table("available_schemes").select("*").eq("state", state)
        if equipment_type:
             query = query.filter("applicable_equipment", "cs", f'["{equipment_type}"]')
             
        response = query.execute()
        return [Subsidy(**item).to_dict() for item in response.data] if response.data else []
    except Exception as e:
        print(f"Error fetching state subsidies: {e}")
        return []

def get_all_subsidies(
    equipment_type: Optional[str] = None,
    state: Optional[str] = None
) -> dict:
    """Get all applicable subsidies (central + state) from database."""
    try:
        # Fetch Central
        central_query = supabase.table("available_schemes").select("*").is_("state", "null")
        central_data = central_query.execute().data or []
        
        # Fetch State
        state_data = []
        if state:
            state_query = supabase.table("available_schemes").select("*").eq("state", state)
            state_data = state_query.execute().data or []
        else:
            # If no state, fetch ALL state schemes (for browsing)
            state_query = supabase.table("available_schemes").select("*").not_.is_("state", "null")
            state_data = state_query.execute().data or []

        # Map to dicts
        central = [Subsidy(**item).to_dict() for item in central_data]
        state_subs = [Subsidy(**item).to_dict() for item in state_data]

        # Apply equipment filter in memory if provided
        if equipment_type:
            equip_lower = equipment_type.lower()
            central = [s for s in central if any(equip_lower in e.lower() for e in s.get("applicable_equipment", []))]
            state_subs = [s for s in state_subs if any(equip_lower in e.lower() for e in s.get("applicable_equipment", []))]

        return {
            "central_subsidies": central,
            "state_subsidies": state_subs,
            "total_schemes": len(central) + len(state_subs),
            "equipment_filter": equipment_type,
            "state_filter": state,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error in get_all_subsidies: {e}")
        return {"central_subsidies": [], "state_subsidies": [], "total_schemes": 0}

def calculate_subsidy_amount(
    equipment_cost: float,
    subsidy_percentage: float,
    max_amount: float
) -> dict:
    """Calculate actual subsidy amount for a purchase."""
    calculated_subsidy = equipment_cost * (subsidy_percentage / 100)
    actual_subsidy = min(calculated_subsidy, max_amount) if max_amount > 0 else calculated_subsidy
    farmer_contribution = equipment_cost - actual_subsidy
    
    return {
        "equipment_cost": equipment_cost,
        "formatted_equipment_cost": f"₹{equipment_cost:,.0f}",
        "subsidy_percentage": subsidy_percentage,
        "calculated_subsidy": calculated_subsidy,
        "subsidy_cap": max_amount,
        "actual_subsidy": actual_subsidy,
        "formatted_subsidy": f"₹{actual_subsidy:,.0f}",
        "farmer_contribution": farmer_contribution,
        "formatted_contribution": f"₹{farmer_contribution:,.0f}",
        "savings_percentage": (actual_subsidy / equipment_cost) * 100 if equipment_cost > 0 else 0
    }

def get_available_states() -> list[str]:
    """Get list of states with subsidy data available from database."""
    global _STATES_CACHE
    if _STATES_CACHE: return _STATES_CACHE
    
    try:
        response = supabase.table("available_schemes").select("state").not_.is_("state", "null").execute()
        states = sorted(list(set([item['state'] for item in response.data if item.get('state')])))
        _STATES_CACHE = states
        return states
    except Exception as e:
        print(f"Error fetching states: {e}")
        return ["Maharashtra"]

