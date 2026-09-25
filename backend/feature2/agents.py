import os
import json
from datetime import datetime
from typing import TypedDict, Annotated, List
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from .model_service import predict_disease

def last_value(a, b):
    return b

# Define the State of the Agent Workflow
class AgentState(TypedDict):
    image_bytes: bytes
    disease_class: str
    confidence: float
    analysis_report: Annotated[str, last_value]
    treatment_plan: Annotated[str, last_value]
    subsidy_info: Annotated[str, last_value]
    is_mock: bool
    lang: str  # Language code: en, hi, mr

# Language name mapping for prompts
LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi"
}

# Initialize Gemini Model
# Initialize Gemini Model
api_key = os.getenv("GEMINI_API_KEY")
llm = None
if api_key:
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
    except Exception as e:
        print(f" Failed to initialize Gemini: {e}")

if not llm:
    print(" GEMINI_API_KEY missing or invalid. Using Mock Responses.")

# --- nodes ---

def vision_node(state: AgentState):
    """
    Vision Node: Runs the .keras CNN model to detect disease.
    This is NOT an LLM Agent. It is a deterministic Model call.
    """
    print(" CNN Model Scanning Image...")
    result = predict_disease(state["image_bytes"])
    
    return {
        "disease_class": result["class"],
        "confidence": result["confidence"],
        "is_mock": result.get("is_mock", False)
    }

def agronomist_node(state: AgentState):
    """
    Agronomist Agent: Explains the disease and suggests remedies.
    """
    print(" Agronomist Agent Reasoning...")
    disease = state["disease_class"]
    confidence = state["confidence"]
    lang = state.get("lang", "en")
    lang_name = LANGUAGE_NAMES.get(lang, "English")
    
    if disease == "Healthy":
        return {
            "analysis_report": "The crop appears healthy and vigorous.",
            "treatment_plan": "Continue current irrigation and monitoring practices. No intervention needed."
        }

    prompt = f"""
    You are an expert Agronomist Agent. 
    The computer vision system has detected '{disease}' in a crop with {confidence*100:.1f}% confidence.
    
    IMPORTANT: Respond ENTIRELY in {lang_name} language. All text values in the JSON must be in {lang_name}.
    
    Task: Provide a comprehensive crop health assessment.
    
    RETURN ONLY RAW JSON. DO NOT USE MARKDOWN.
    
    IMPORTANT: 
    1. "explanation": Provide a short 2-sentence explanation of WHY this disease is detected based on typical visual symptoms (e.g., "Identified by characteristic brown lesions with yellow halos on lower leaves.").
    2. In 'treatment', 'item' MUST be the exact chemical/product name (e.g., "Captan").
    3. 'description' is the type (e.g., "Fungicide"). 'usage' is dosage (e.g., "2g/L").
    
    Structure:
    {{
        "explanation": "Visual reasoning for the diagnosis.",
        "reason": "Explicit justification for the advice.",
        "confidence": {confidence},
        "data_source": "Computer Vision Scan + Agronomic Database",
        "last_updated": "{datetime.now().isoformat()}",
        "severity": "High", 
        "immediate_action": ["Step 1", "Step 2"],
        "treatment": {{
            "organic": [
                {{"item": "Neem Oil", "description": "Azadirachtin", "usage": "5ml per liter"}},
                {{"item": "Trichoderma", "description": "Bio-fungicide", "usage": "10g per liter"}}
            ],
            "chemical": [
                {{"item": "Captan 50 WP", "description": "Contact Fungicide", "usage": "2g per liter"}},
                {{"item": "Miclobutanil", "description": "Systemic Fungicide", "usage": "0.5ml per liter"}}
            ]
        }},
        "timeline": [
            {{"day": "Day 1", "title": "Immediate Action", "task": "Task details..."}}
        ],
        "recovery_forecast": [10, 20, 50]
    }}
    """
    
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        print(f" Gemini Raw Output: {content}") # Debug Log

        # Robust JSON Extraction
        try:
            # Find the first '{' and last '}'
            start_idx = content.find('{')
            end_idx = content.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = content[start_idx : end_idx + 1]
                data = json.loads(json_str)
                
                # Format into a readable string for the state (Keep JSON structure ideally, but existing UI expects string)
                # But wait, frontend can parse JSON if we send it via the API.
                # For compatibility with AgentState (str), let's serialise it or keep it as text for now.
                # Actually, the user wants structured output. Let's return the DICT in the state and update existing UI code to handle it.
                # Wait, AgentState defines fields as 'str'. I should stick to 'str' but make it JSON str or formatted markdown.
                
                # Let's stringify the JSON so the frontend can parse it back if needed, OR format it nicely here.
                # Given user request for "Visual Timeline", I should pass the DATA. 
                # I will store the JSON string in 'treatment_plan' and parse it in frontend.
                
                return {
                    "analysis_report": data.get('explanation', ''),
                    "treatment_plan": json.dumps(data) # Store full JSON string here for frontend to parse
                }
            else:
                raise ValueError("No JSON found")
                
        except json.JSONDecodeError:
            print(" JSON Parsing Failed.")
            return {
                "analysis_report": content,
                "treatment_plan": json.dumps({"error": "Failed to parse AI response", "raw": content})
            }
            
    except Exception as e:
        print(f"Agronomist Error: {e}")
        fallback_plan = {
            "explanation": f"AI Analysis Unavailable: {str(e)}. Please consult a local expert.",
            "severity": "Unknown",
            "immediate_action": ["Consult Local Agronomist", "Check Manual Guides"],
            "treatment": {
                "organic": [{"item": "Consult Expert", "description": "Manual Diagnosis Required", "usage": "-"}],
                "chemical": []
            },
            "timeline": [],
            "recovery_forecast": [0, 0, 0]
        }
        return {
            "analysis_report": f"Detected {disease}. AI offline.", 
            "treatment_plan": json.dumps(fallback_plan)
        }

def gov_agent_node(state: AgentState):
    """
    Gov Agent: Checks for subsidies and schemes.
    """
    print(" Government Agent Checking Schemes...")
    disease = state["disease_class"]
    lang = state.get("lang", "en")
    lang_name = LANGUAGE_NAMES.get(lang, "English")
    
    # Enhanced Prompt for Multi-Scheme + Web Links
    prompt = f"""
    You are a Government Schemes Expert for Indian Agriculture.
    A farmer is checking their crop health via satellite scan. Current status: '{disease}'.
    
    IMPORTANT: Respond ENTIRELY in {lang_name} language. All text values in the JSON must be in {lang_name}.
    
    Task: 
    1. Identify relevant Indian government schemes (Central & State) that could help the farmer.
    2. If the crop is NOT healthy, prioritize insurance (PMFBY) and disaster relief.
    3. If the crop IS healthy, prioritize standard support schemes like PM-KISAN, Soil Health Card, KCC (Kisan Credit Card), or Paramparagat Krishi Vikas Yojana (PKVY).
    4. Provide the OFFICIAL website URL for each scheme.
    
    RETURN ONLY RAW JSON.
    
    Structure:
    {{
        "schemes": [
            {{
                "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                "type": "Insurance",
                "details": "Covers yield losses due to non-preventable risks.",
                "benefits": "Premium subsidy + Claim settlement.",
                "priority": "High",
                "website_url": "https://pmfby.gov.in/"
            }}
        ]
    }}
    """
    
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        print(f" Gov Agent Output: {content}")

        start_idx = content.find('{')
        end_idx = content.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_str = content[start_idx : end_idx + 1]
            data = json.loads(json_str)
            return {"subsidy_info": json.dumps(data)} # Return JSON string
        else:
             return {"subsidy_info": content} # Fallback to raw text
             
    except Exception as e:
        print(f"Gov Agent Error: {e}")
        return {"subsidy_info": "Could not fetch subsidy info."}

# --- graph definition ---

workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("vision", vision_node)
workflow.add_node("agronomist", agronomist_node)
workflow.add_node("gov", gov_agent_node)

# Add Edges (Parallel Execution)
workflow.set_entry_point("vision")

# Branching: After Vision, run both Agronomist and Gov in parallel
workflow.add_edge("vision", "agronomist")
workflow.add_edge("vision", "gov")

# Both end the workflow (LangGraph merges the state results)
# Both end the workflow (LangGraph merges the state results)
workflow.add_edge("agronomist", END)
workflow.add_edge("gov", END)

# Compile
crop_agent_app = workflow.compile()

# --- Analysis Only Graph (For Step 2) ---
analysis_workflow = StateGraph(AgentState)
analysis_workflow.add_node("agronomist", agronomist_node)
analysis_workflow.add_node("gov", gov_agent_node)

# Start directly with parallel agents (skipping vision)
analysis_workflow.set_entry_point("agronomist") # LangGraph needs single entry, but we want parallel.
# Trick: specific entry point node that does nothing or just broadcast? 
# Easier: Just run them sequentially for simple setup or use a dummy start node.
# Let's use a dummy start node to broadcast.

def start_node(state: AgentState):
    return state

analysis_workflow.add_node("start", start_node)
analysis_workflow.set_entry_point("start")
analysis_workflow.add_edge("start", "agronomist")
analysis_workflow.add_edge("start", "gov")
analysis_workflow.add_edge("agronomist", END)
analysis_workflow.add_edge("gov", END)

analysis_agent_app = analysis_workflow.compile()
