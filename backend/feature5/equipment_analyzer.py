"""
Equipment Analyzer Module - Multi-Agent System for Farm Equipment Maintenance

This module provides AI-powered analysis of farm equipment using Google Gemini API.
It includes agents for:
- Image Analysis: Identifies equipment, assesses condition, detects damage
- Maintenance Planning: Generates schedules based on condition and usage
- Repair Advisory: Provides repair instructions and recommendations
"""

from google import genai
from google.genai import types
import asyncio
import base64
import json
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv
import os

# Timeout for Gemini API calls (seconds)
GEMINI_TIMEOUT = 90
# Load environment variables
load_dotenv()

# Configure Gemini API
_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            # Try to find it in the parent directory if not in current
            env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
            load_dotenv(env_path)
            api_key = os.getenv("GEMINI_API_KEY")
            
        if not api_key:
            # Fallback to current directory .env if still not found
            load_dotenv()
            api_key = os.getenv("GEMINI_API_KEY")
            
        if api_key:
            _client = genai.Client(api_key=api_key)
        else:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
            
    return _client

# Pydantic models for structured responses
class EquipmentIssue(BaseModel):
    name: str
    severity: str  # low, medium, high, critical
    description: str
    affected_part: str

class EquipmentAnalysisResponse(BaseModel):
    equipment_type: str
    visual_damage_percentage: int
    damage_severity: str
    affected_parts: list[str]
    failure_risk: str
    equipment_health_score: int
    recommended_action: str
    urgency_level: str
    next_service_due_in_days: int
    confidence: float
    farmer_message: str

# In-memory storage for equipment analyses
equipment_history: list[dict] = []
maintenance_schedules: list[dict] = []


def get_gemini_model():
    """Get the Gemini model for image analysis."""
    return 'gemini-2.5-flash'


async def analyze_equipment_intelligence(
    image_base64: str,
    equipment_type: str = "Unknown",
    equipment_age_days: int = 0,
    total_usage_hours: int = 0,
    last_service_date: str = "Unknown",
    environment: str = "normal",
    repair_cost_estimate: Optional[float] = None,
    replacement_cost_estimate: Optional[float] = None
) -> dict:
    """
    Full-fledged AI Farm Equipment Intelligence Assistant.
    Analyzes equipment condition from image and metadata.
    """
    model_name = get_gemini_model()
    
    # Decode base64 to image data
    if ',' in image_base64:
        image_base64 = image_base64.split(',')[1]
    
    image_data = base64.b64decode(image_base64)
    
    # Create the intelligence prompt
    analysis_prompt = f"""You are an AI Farm Equipment Intelligence Assistant specialized in analyzing agricultural machinery condition from images and structured metadata.

Visually analyze the equipment condition and provide a detailed assessment. 

INPUT METADATA:
- Equipment Type: {equipment_type}
- Equipment Age: {equipment_age_days} days
- Total Usage: {total_usage_hours} hours
- Last Service: {last_service_date}
- Environment: {environment}
- Repair Cost Estimate: {f"₹{repair_cost_estimate}" if repair_cost_estimate else "Not provided"}
- Replacement Cost Estimate: {f"₹{replacement_cost_estimate}" if replacement_cost_estimate else "Not provided"}

YOUR TASKS:
1. Visually analyze the equipment condition.
2. Estimate visual_damage_percentage (0–100) based on visible wear, rust, cracks, leaks, or deformation.
3. Classify damage_severity into: Minor (0–25%), Moderate (26–50%), Major (51–75%), Critical (76–100%).
4. Identify affected_parts when possible.
5. Estimate failure_risk as: Low / Medium / High / Imminent.
6. Compute equipment_health_score = 100 − visual_damage_percentage.
7. Recommend one primary action: Continue Use, Schedule Maintenance, Repair Required, Immediate Replacement.
8. If repair and replacement costs are provided, perform cost-aware recommendation.
9. Suggest next_service_due_in_days based on usage intensity (Heavy: sooner, Light: later).
10. Provide farmer-friendly explanation in simple language.

IMPORTANT RULES:
- Be realistic and conservative in damage estimation.
- If image clarity is poor, lower confidence and mention uncertainty.
- Prioritize farmer safety in all recommendations.
- If visual_damage_percentage > 60%, strongly consider replacement.
- If failure risk is High or Imminent, mark as urgent.
- Never give vague advice.
- Keep explanations practical for rural farmers.
- Avoid technical jargon in the final recommendation text.

OUTPUT FORMAT (STRICT JSON):
{{
  "equipment_type": "{equipment_type}",
  "visual_damage_percentage": 0,
  "damage_severity": "",
  "affected_parts": [],
  "failure_risk": "",
  "equipment_health_score": 0,
  "recommended_action": "",
  "urgency_level": "",
  "next_service_due_in_days": 0,
  "confidence": 0.0,
  "farmer_message": ""
}}
"""

    try:
        # Send image and prompt to Gemini using new API
        client = get_client()
        response = await asyncio.wait_for(
            asyncio.to_thread(
                client.models.generate_content,
                model=model_name,
                contents=[
                    types.Part.from_bytes(
                        data=image_data,
                        mime_type="image/jpeg"
                    ),
                    analysis_prompt
                ]
            ),
            timeout=GEMINI_TIMEOUT
        )
        
        # Parse the response
        response_text = response.text.strip()
        print(f"[DEBUG] Gemini Response Length: {len(response_text)}")
        
        # Robust JSON extraction
        import re
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(0)
        
        try:
            analysis_result = json.loads(response_text)
        except json.JSONDecodeError as je:
            print(f"[ERROR] JSON Decode Failed: {je}")
            print(f"[DEBUG] Raw Response: {response_text[:500]}...")
            raise Exception("AI returned invalid data format. Please try another image.")
        
        # Add metadata and store in history
        analysis_result['analyzed_at'] = datetime.now().isoformat()
        analysis_result['id'] = f"eq_{len(equipment_history) + 1}"
        analysis_result['metadata'] = {
            "age_days": equipment_age_days,
            "usage_hours": total_usage_hours,
            "environment": environment
        }
        equipment_history.append(analysis_result)
        
        return analysis_result
        
    except asyncio.TimeoutError:
        print(f"Gemini API call timed out after {GEMINI_TIMEOUT}s")
        return {
            "error": f"Analysis timed out after {GEMINI_TIMEOUT} seconds. The AI service is taking too long. Please try again.",
            "message": "Timeout",
            "status": "timeout"
        }
    except Exception as e:
        import traceback
        print(f"[CRITICAL] Equipment Analysis Error: {str(e)}")
        traceback.print_exc()
        return {
            "error": "Failed to analyze equipment condition",
            "message": str(e),
            "details": "Check if GEMINI_API_KEY is valid and has vision capabilities.",
            "status": "failure"
        }


# Keep the legacy function for compatibility but mark it or update it to use the new logic
async def analyze_equipment_image(image_base64: str) -> dict:
    """Legacy wrapper for analyze_equipment_image."""
    return await analyze_equipment_intelligence(image_base64)



async def generate_maintenance_schedule(analysis: dict) -> list[dict]:
    """
    Generate a maintenance schedule based on equipment analysis.
    
    Args:
        analysis: Equipment analysis result
        
    Returns:
        List of maintenance tasks
    """
    model_name = get_gemini_model()
    
    schedule_prompt = f"""Based on this equipment analysis, generate a maintenance schedule for the next 6 months.

Equipment Analysis:
{json.dumps(analysis, indent=2)}

Return a JSON array of maintenance tasks ONLY (no markdown, no code blocks):
[
    {{
        "task_id": "task_1",
        "task_name": "Task name",
        "description": "Detailed description",
        "priority": "low|medium|high|urgent",
        "scheduled_date": "YYYY-MM-DD",
        "estimated_duration": "30 minutes",
        "tools_required": ["Tool 1", "Tool 2"],
        "difficulty": "easy|moderate|difficult"
    }}
]

Schedule Guidelines:
- For Critical condition: Schedule urgent repairs immediately
- For Poor condition: Weekly check-ups, monthly maintenance
- For Fair condition: Monthly maintenance, quarterly deep cleaning
- For Good condition: Quarterly maintenance, annual overhaul
- For Excellent condition: Semi-annual maintenance

Include:
1. Immediate repairs for any critical/high severity issues
2. Regular maintenance tasks (oil changes, cleaning, lubrication)
3. Seasonal preparation tasks
4. Preventive maintenance based on equipment type"""

    try:
        client = get_client()
        response = await asyncio.wait_for(
            asyncio.to_thread(
                client.models.generate_content,
                model=model_name,
                contents=schedule_prompt
            ),
            timeout=GEMINI_TIMEOUT
        )
        response_text = response.text.strip()
        
        # Clean up response
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
            
        schedule = json.loads(response_text.strip())
        
        # Store in memory
        for task in schedule:
            task['equipment_id'] = analysis.get('id')
            maintenance_schedules.append(task)
        
        return schedule
        
    except Exception as e:
        # Generate a basic schedule if AI fails
        today = datetime.now()
        return [
            {
                "task_id": "task_1",
                "task_name": "General Inspection",
                "description": "Perform a thorough visual inspection of the equipment",
                "priority": "high" if analysis.get('health_score', 50) < 50 else "medium",
                "scheduled_date": today.strftime("%Y-%m-%d"),
                "estimated_duration": "1 hour",
                "tools_required": ["Flashlight", "Inspection checklist"],
                "difficulty": "easy"
            },
            {
                "task_id": "task_2", 
                "task_name": "Routine Maintenance",
                "description": "Clean, lubricate, and check all moving parts",
                "priority": "medium",
                "scheduled_date": (today + timedelta(days=7)).strftime("%Y-%m-%d"),
                "estimated_duration": "2 hours",
                "tools_required": ["Lubricant", "Cleaning cloth", "Basic tools"],
                "difficulty": "moderate"
            }
        ]


async def get_repair_recommendations(analysis: dict) -> list[dict]:
    """
    Get detailed repair recommendations for identified issues.
    
    Args:
        analysis: Equipment analysis result
        
    Returns:
        List of repair recommendations
    """
    if not analysis.get('issues'):
        return []
    
    model_name = get_gemini_model()
    
    repair_prompt = f"""Based on the identified issues in this equipment, provide detailed repair recommendations.

Equipment: {analysis.get('equipment_name')}
Type: {analysis.get('equipment_type')}
Issues: {json.dumps(analysis.get('issues', []), indent=2)}

Return a JSON array of repair recommendations ONLY (no markdown, no code blocks):
[
    {{
        "issue_name": "Name of the issue being addressed",
        "repair_type": "diy|professional",
        "steps": [
            "Step 1: Description",
            "Step 2: Description"
        ],
        "tools_required": ["Tool 1", "Tool 2"],
        "estimated_cost": "₹500-1000",
        "estimated_time": "2-3 hours",
        "parts_needed": ["Part 1", "Part 2"],
        "safety_warnings": ["Warning 1", "Warning 2"]
    }}
]

Guidelines:
- For low/medium severity issues: Recommend DIY if feasible
- For high/critical severity: Recommend professional help
- Include safety warnings for any potentially dangerous repairs
- Provide cost estimates in Indian Rupees (₹)
- Be specific with steps - farmers should be able to follow them"""

    try:
        client = get_client()
        response = await asyncio.wait_for(
            asyncio.to_thread(
                client.models.generate_content,
                model=model_name,
                contents=repair_prompt
            ),
            timeout=GEMINI_TIMEOUT
        )
        response_text = response.text.strip()
        
        # Clean up response
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
            
        recommendations = json.loads(response_text.strip())
        return recommendations
        
    except Exception as e:
        return [{
            "issue_name": "General Maintenance Required",
            "repair_type": "professional",
            "steps": ["Contact a local equipment service center for inspection"],
            "tools_required": [],
            "estimated_cost": "Varies",
            "estimated_time": "Depends on issues",
            "parts_needed": [],
            "safety_warnings": ["Always disconnect power before any inspection"]
        }]


async def identify_damaged_parts(analysis: dict) -> list[dict]:
    """
    Identify parts that need replacement from the analysis.
    
    Args:
        analysis: Equipment analysis result
        
    Returns:
        List of damaged parts that need replacement
    """
    if not analysis.get('issues'):
        return []
    
    # Filter for high/critical severity issues that likely need parts
    critical_issues = [
        issue for issue in analysis.get('issues', [])
        if issue.get('severity') in ['high', 'critical']
    ]
    
    if not critical_issues:
        return []
    
    model_name = get_gemini_model()
    
    parts_prompt = f"""Based on these critical issues, identify parts that may need replacement.

Equipment: {analysis.get('equipment_name')}
Type: {analysis.get('equipment_type')}
Brand: {analysis.get('brand', 'Unknown')}
Model: {analysis.get('model', 'Unknown')}
Critical Issues: {json.dumps(critical_issues, indent=2)}

Return a JSON array of parts that likely need replacement ONLY (no markdown, no code blocks):
[
    {{
        "part_name": "Specific part name",
        "original_equipment": "Equipment this part belongs to",
        "urgency": "immediate|soon|can_wait"
    }}
]

Be specific with part names so they can be searched on e-commerce sites."""

    try:
        client = get_client()
        response = await asyncio.wait_for(
            asyncio.to_thread(
                client.models.generate_content,
                model=model_name,
                contents=parts_prompt
            ),
            timeout=GEMINI_TIMEOUT
        )
        response_text = response.text.strip()
        
        # Clean up response
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
            
        parts = json.loads(response_text.strip())
        return parts
        
    except Exception as e:
        return []


def get_analysis_history() -> list[dict]:
    """Get all previous equipment analyses."""
    return equipment_history


def get_maintenance_schedules() -> list[dict]:
    """Get all maintenance schedules."""
    return maintenance_schedules
