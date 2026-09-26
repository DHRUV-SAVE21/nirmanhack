from typing import Annotated, TypedDict, List, Dict, Any, Literal
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from dotenv import load_dotenv
import os
import json
from feature4.tools import (
    search_local_schemes, 
    calculate_benefits, 
    auto_fill_application, 
    submit_scheme_application,
    ALL_TOOLS
)

# Load environment variables from .env file
load_dotenv()

# --- State Definition ---
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    user_profile: Dict[str, Any]  # {state: str, land_size: float, crop: str, category: str}
    found_schemes: List[Dict]
    selected_scheme: Dict
    application_status: str
    application_details: Dict  # New: store application submission details
    intent: str  # "search", "apply", "auto_apply", "chat"

# --- LLM Setup with Tool Binding ---
# Include all tools including the new auto-fill and submit tools
tools = ALL_TOOLS

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.3,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# LLM with tools bound for dynamic tool calling
llm_with_tools = llm.bind_tools(tools)

# --- System Prompts ---
SYSTEM_PROMPT = """You are a helpful agricultural advisor assisting Indian farmers with government schemes and subsidies.

Your capabilities:
1. Search for relevant government schemes using the search_local_schemes tool
2. Calculate exact subsidy amounts using the calculate_benefits tool
3. Help farmers understand eligibility requirements
4. **AUTO-FILL and SUBMIT applications** using auto_fill_application and submit_scheme_application tools
5. Guide farmers through the application process

Guidelines:
- Always be helpful and explain schemes in simple terms
- When a farmer asks about schemes/subsidies, USE the search_local_schemes tool to find relevant options
- When they want to know how much subsidy they can get, USE the calculate_benefits tool
- **When they want to apply for a scheme, USE auto_fill_application to prepare the form, then submit_scheme_application to submit it**
- Remember the farmer's profile details from conversation

When calling search_local_schemes:
- Extract the equipment type or scheme type from the query (e.g., "tractor", "solar pump", "irrigation")
- If the farmer mentioned their state, include it in the search

When calling auto_fill_application:
- Extract the scheme name from the conversation
- Pass the user_profile with all known details (name, state, land_size, category, etc.)

When calling submit_scheme_application:
- Only call this if auto_fill_application returned can_submit=True
- Pass the scheme name, filled_fields from auto_fill result, and user_profile

When responding about schemes:
- Mention scheme name, subsidy percentage, and maximum amount
- Explain eligibility briefly
- Ask if they want to apply or know more

80: When an application is submitted:
81: - Clearly mention the reference number
82: - List the next steps
83: - Mention the helpline number
84: 
85: **LANGUAGE RULES:**
86: - Detect if the farmer is speaking in Hindi, Marathi, or English.
87: - ALWAYS respond in the SAME language as the farmer. 
88: - Use simple, regional vocabulary common in Indian farming.
89: - If the user provides details in one language and asks a question in another, prioritize the question's language for the response.
90: """

# --- Nodes ---

def route_intent(state: AgentState) -> Dict:
    """
    Analyze the last user message to determine intent.
    Returns: search, apply, auto_apply, or chat
    """
    messages = state["messages"]
    last_message = messages[-1].content.lower() if messages else ""
    
    # Check for AUTO-APPLY intent (explicit request for automated submission)
    auto_apply_keywords = [
        "apply for me", "apply on my behalf", "fill the form", "fill form", 
        "auto fill", "autofill", "submit for me", "submit application",
        "complete the application", "do it for me", "fill and submit",
        "apply automatically", "register me", "enroll me for"
    ]
    if any(kw in last_message for kw in auto_apply_keywords):
        return {"intent": "auto_apply"}
    
    # Check for regular application intent
    apply_keywords = ["apply", "register", "submit", "application", "sign up", "enroll"]
    if any(kw in last_message for kw in apply_keywords):
        return {"intent": "apply"}
    
    # Check for search intent
    search_keywords = ["scheme", "subsidy", "loan", "benefit", "grant", "policy", 
                      "tractor", "pump", "solar", "equipment", "what", "which", 
                      "available", "eligible", "find", "help me", "suggest", "recommend"]
    if any(kw in last_message for kw in search_keywords):
        return {"intent": "search"}
    
    # Default to chat
    return {"intent": "chat"}

def call_model(state: AgentState) -> Dict:
    """
    Call the LLM with tools to handle search queries.
    The LLM can decide to call tools based on the user's message.
    """
    messages = state["messages"]
    profile = state.get("user_profile", {})
    
    # Create a system message with context (escape braces for consistency)
    profile_str = json.dumps(profile)
    system_msg = SystemMessage(content=SYSTEM_PROMPT + f"\n\nFarmer Profile: {profile_str}")
    
    try:
        # Call LLM with tools bound
        response = llm_with_tools.invoke([system_msg] + list(messages))
        return {"messages": [response]}
    except Exception as e:
        print(f"Feature 4 Agent Error: {e}")
        return {"messages": [AIMessage(content="I'm having trouble connecting to my knowledge base right now. Please try again later or check your connection.")]}


def process_tool_calls(state: AgentState) -> Dict:
    """
    Process tool calls if the LLM decided to use tools.
    Uses the ToolNode pattern from LangGraph.
    """
    messages = state["messages"]
    last_message = messages[-1]
    
    # Check if there are tool calls to process
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        # Create ToolNode with our tools
        tool_node = ToolNode(tools)
        
        # Execute tools
        tool_result = tool_node.invoke({"messages": messages})
        tool_messages = tool_result.get("messages", [])
        
        # Extract scheme data and application data from tool results for state
        found_schemes = []
        application_details = {}
        application_status = None
        
        for msg in tool_messages:
            if hasattr(msg, 'content'):
                try:
                    content = msg.content
                    if isinstance(content, str):
                        content = json.loads(content)
                    if isinstance(content, dict):
                        # Extract schemes from search results
                        found_schemes.extend(content.get("central_subsidies", []))
                        found_schemes.extend(content.get("state_subsidies", []))
                        
                        # Extract application submission details
                        if content.get("reference_no"):
                            application_status = content.get("status", "submitted")
                            application_details = content.get("application_details", content)
                except:
                    pass
        
        result = {"messages": tool_messages, "found_schemes": found_schemes}
        if application_status:
            result["application_status"] = application_status
            result["application_details"] = application_details
        
        return result
    
    return {}

def generate_response(state: AgentState) -> Dict:
    """
    Generate final response after tool execution.
    """
    messages = state["messages"]
    profile = state.get("user_profile", {})
    schemes = state.get("found_schemes", [])
    app_details = state.get("application_details", {})
    
    # Check if the last message is already from AI (no tools were called)
    if messages and isinstance(messages[-1], AIMessage) and not getattr(messages[-1], 'tool_calls', None):
        return {}  # Response already generated
    
    # Build context for final response
    # Escape curly braces in JSON to prevent template variable interpretation
    profile_str = json.dumps(profile).replace("{", "{{").replace("}", "}}")
    context = f"Farmer Profile: {profile_str}\n"
    
    if schemes:
        schemes_info = []
        for s in schemes[:5]:  # Limit to top 5
            schemes_info.append({
                "name": s.get("scheme_name"),
                "subsidy": f"{s.get('subsidy_percentage')}%",
                "max_amount": s.get("formatted_max_amount"),
                "equipment": s.get("applicable_equipment", [])[:3]
            })
        schemes_str = json.dumps(schemes_info, indent=2).replace("{", "{{").replace("}", "}}")
        context += f"\nFound Schemes:\n{schemes_str}"
    
    if app_details:
        app_str = json.dumps(app_details, indent=2).replace("{", "{{").replace("}", "}}")
        context += f"\n\nApplication Submitted:\n{app_str}"
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT + "\n\n" + context),
        MessagesPlaceholder(variable_name="messages")
    ])
    
    try:
        chain = prompt | llm
        response = chain.invoke({"messages": messages})
        return {"messages": [response]}
    except Exception as e:
        print(f"Feature 4 Agent Gen Error: {e}")
        return {"messages": [AIMessage(content="I found some information but couldn't summarize it properly due to a service error.")]}

def create_application(state: AgentState) -> Dict:
    """
    Handle application creation requests with auto-fill capability.
    This is the FALLBACK path when auto_apply is not explicitly requested.
    """
    messages = state["messages"]
    last_message = messages[-1].content.lower() if messages else ""
    profile = state.get("user_profile", {})
    schemes = state.get("found_schemes", []) or []  # Ensure it's a list, not None
    
    print(f"[DEBUG] create_application: profile={profile}, schemes_count={len(schemes)}")
    
    
    # Try to identify which scheme they want to apply for from the message
    scheme_name = None
    selected_scheme = None
    
    # First check for scheme keywords in the message
    scheme_keywords = ["kusum", "pm-kusum", "smam", "tractor", "solar", "pump", "kisan"]
    for kw in scheme_keywords:
        if kw in last_message:
            # Search for this scheme
            # Note: search_local_schemes is a tool, invoke returns a string or tool message content
            try:
                search_result = search_local_schemes.invoke({"query": kw, "state": profile.get("state")})
                if isinstance(search_result, str):
                    try:
                        search_result = json.loads(search_result)
                    except:
                        search_result = {}
                
                # Get schemes from search result
                all_schemes = search_result.get("central_subsidies", []) + search_result.get("state_subsidies", [])
                if all_schemes:
                    selected_scheme = all_schemes[0]
                    scheme_name = selected_scheme.get("scheme_name")
                    print(f"[DEBUG] Found scheme from keyword '{kw}': {scheme_name}")
                    break
            except Exception as e:
                print(f"Search tool error: {e}")
                pass
    
    # If still no scheme, try from previously found schemes
    if not scheme_name and schemes:
        for s in schemes:
            name = s.get("scheme_name", "").lower()
            name_words = name.split()[:4]
            if any(word in last_message for word in name_words if len(word) > 3):
                scheme_name = s.get("scheme_name")
                selected_scheme = s
                break
        
        if not scheme_name:
            scheme_name = schemes[0].get("scheme_name", "Selected Scheme")
            selected_scheme = schemes[0]
    
    # If STILL no scheme, do a general search
    if not scheme_name:
        print("[DEBUG] No scheme found, doing general search")
        try:
            search_result = search_local_schemes.invoke({"query": "subsidy", "state": profile.get("state")})
            if isinstance(search_result, str):
                try:
                    search_result = json.loads(search_result)
                except:
                    search_result = {}
            
            all_schemes = search_result.get("central_subsidies", []) + search_result.get("state_subsidies", [])
            if all_schemes:
                selected_scheme = all_schemes[0]
                scheme_name = selected_scheme.get("scheme_name")
                print(f"[DEBUG] Using default scheme: {scheme_name}")
            else:
                scheme_name = "Government Agriculture Scheme"
        except Exception as e:
            scheme_name = "Government Agriculture Scheme"
    
    # Check if we have enough profile data for a basic application
    has_basic_profile = profile.get("name") and profile.get("state")
    print(f"[DEBUG] has_basic_profile={has_basic_profile}, selected_scheme={scheme_name}")
    
    if has_basic_profile and selected_scheme:
        # We have enough data - AUTOMATICALLY SUBMIT the application
        # Use the same logic as auto_apply_node
        
        # Step 1: Auto-fill the application
        try:
            fill_result = auto_fill_application.invoke({
                "scheme_name": scheme_name,
                "user_profile": profile
            })
            
            # Parse the result
            if isinstance(fill_result, str):
                try:
                    fill_result = json.loads(fill_result)
                except:
                    fill_result = {"success": False, "error": fill_result}
            
            # Check if we can proceed with submission
            if fill_result.get("success") and fill_result.get("can_submit"):
                # Step 2: Submit the application
                submit_result = submit_scheme_application.invoke({
                    "scheme_name": scheme_name,
                    "filled_fields": fill_result.get("filled_fields", {}),
                    "user_profile": profile
                })
                
                # Parse the result
                if isinstance(submit_result, str):
                    try:
                        submit_result = json.loads(submit_result)
                    except:
                        submit_result = {"success": False, "error": submit_result}
                
                if submit_result.get("success"):
                    # Success! Application submitted
                    app_details = submit_result.get("application_details", {})
                    next_steps = submit_result.get("next_steps", [])
                    
                    response = f"""[OK] **Application Submitted Successfully!**
    
     Your application has been automatically submitted!
    
    **Reference Number:** `{submit_result.get('reference_no')}`
    
    **Application Details:**
    • **Scheme:** {app_details.get('scheme_name')}
    • **Applicant:** {app_details.get('applicant_name')}
    • **State:** {app_details.get('applicant_state')}
    • **Category:** {app_details.get('applicant_category', 'General')}
    • **Subsidy:** {app_details.get('subsidy_percentage')}% (up to {app_details.get('max_subsidy_amount')})
    • **Status:**  Submitted
    
    ** Next Steps:**
    {chr(10).join(f"• {step}" for step in next_steps)}
    
    **Track Your Application:**
    Portal: {app_details.get('portal_url')}
    
     **Helpline:** {submit_result.get('helpline', '1800-180-1551')}
    
    ---
    *This application is now visible in your "My Applications" tab.*
    
    Would you like to apply for any other schemes?"""
                    
                    return {
                        "application_status": "submitted",
                        "application_details": app_details,
                        "messages": [AIMessage(content=response)]
                    }
        except Exception as e:
            print(f"Auto Apply Error: {e}")
            pass
        
        # Fallback: Could not auto-submit, show guidance
        response = f""" **Application Process Started!**
    
    **Scheme:** {scheme_name}
    **Applicant:** {profile.get('name', 'Farmer')}
    **State:** {profile.get('state', 'Not specified')}
    **Category:** {profile.get('category', 'General')}
    **Land Size:** {profile.get('land_size', 'Not specified')} acres
    
     **Your Profile Data is Ready!**
    
    I tried to auto-submit but encountered an issue. Please visit the official portal to complete your application:
    Portal: {selected_scheme.get('application_url', 'https://agrimachinery.nic.in/') if selected_scheme else 'https://agrimachinery.nic.in/'}
    
     **Helpline:** 1800-180-1551 (Kisan Call Center)"""
    else:
        # Missing profile data - ask user to complete profile first
        missing = []
        if not profile.get("name"):
            missing.append("Name")
        if not profile.get("state"):
            missing.append("State")
        
        response = f"""[WARN] **Profile Information Needed**
    
    To apply for **{scheme_name}**, I need some more information:
    
    **Missing Details:** {', '.join(missing) if missing else 'Basic profile information'}
    
    Please tell me:
    1. Your full name
    2. Your state (e.g., Maharashtra, Punjab)
    3. Your land size in acres
    4. Your category (General/SC/ST/OBC)
    
    Once you provide these details, I can **automatically fill and submit** the application for you!
    
     *Tip: You can also complete your profile in the "My Profile" tab for faster applications.*"""
    
    return {
        "application_status": "profile_check",
        "messages": [AIMessage(content=response)]
    }

def auto_apply_node(state: AgentState) -> Dict:
    """
    Handle automated application filling and submission.
    Uses the auto_fill_application and submit_scheme_application tools.
    """
    messages = state["messages"]
    last_message = messages[-1].content.lower() if messages else ""
    profile = state.get("user_profile", {})
    schemes = state.get("found_schemes", [])
    
    # Identify the scheme to apply for
    scheme_name = None
    selected_scheme = None
    
    # Check for explicit scheme mentions in the message
    scheme_keywords = {
        "pm-kusum": "PM-KUSUM",
        "kusum": "PM-KUSUM", 
        "solar": "PM-KUSUM",
        "smam": "Sub-Mission on Agricultural Mechanization (SMAM)",
        "mechanization": "Sub-Mission on Agricultural Mechanization (SMAM)",
        "tractor": "Sub-Mission on Agricultural Mechanization (SMAM)",
        "rkvy": "Rashtriya Krishi Vikas Yojana (RKVY)",
        "nfsm": "National Food Security Mission (NFSM)",
        "aif": "Agriculture Infrastructure Fund (AIF)",
        "cold storage": "Agriculture Infrastructure Fund (AIF)",
        "warehouse": "Agriculture Infrastructure Fund (AIF)",
    }
    
    for keyword, name in scheme_keywords.items():
        if keyword in last_message:
            scheme_name = name
            break
    
    # If no explicit mention, try from found schemes
    if not scheme_name and schemes:
        for s in schemes:
            name = s.get("scheme_name", "").lower()
            name_words = name.split()[:4]
            if any(word in last_message for word in name_words if len(word) > 3):
                scheme_name = s.get("scheme_name")
                selected_scheme = s
                break
        
        if not scheme_name:
            scheme_name = schemes[0].get("scheme_name")
            selected_scheme = schemes[0]
    
    if not scheme_name:
        scheme_name = "Sub-Mission on Agricultural Mechanization (SMAM)"  # Default
    
    try:
        # Step 1: Auto-fill the application
        fill_result = auto_fill_application.invoke({
            "scheme_name": scheme_name,
            "user_profile": profile
        })
        
        # Parse the result
        if isinstance(fill_result, str):
            try:
                fill_result = json.loads(fill_result)
            except:
                fill_result = {"success": False, "error": fill_result}
        
        # Check if we can proceed with submission
        if not fill_result.get("success"):
            # Scheme not found - fallback
            response = f""" **Scheme Not Found**
    
    I couldn't find the scheme you're looking for in my database.
    
    **What I can help with:**
    - Search for available schemes by saying "What schemes are available for tractors?"
    - Tell me about your farming needs and I'll recommend suitable schemes
    
    Would you like me to search for government schemes for you?"""
            return {
                "application_status": "scheme_not_found",
                "messages": [AIMessage(content=response)]
            }
        
        if not fill_result.get("can_submit"):
            # Missing required fields - fallback with guidance
            missing_fields = fill_result.get("missing_fields", [])
            scheme_info = fill_result.get("scheme", {})
            
            response = f""" **Additional Information Needed**
    
    To auto-submit your application for **{scheme_info.get('scheme_name', scheme_name)}**, I need:
    
    **Missing Details:** {', '.join(missing_fields)}
    
    **Already Filled:**
    {chr(10).join(f" {k}: {v}" for k, v in fill_result.get('filled_fields', {}).items())}
    
    Please provide the missing information, or you can apply manually at:
    Portal: {scheme_info.get('application_url', 'https://agrimachinery.nic.in/')}
    
     **Helpline:** 1800-180-1551"""
            
            return {
                "application_status": "incomplete",
                "messages": [AIMessage(content=response)]
            }
        
        # Step 2: Submit the application
        submit_result = submit_scheme_application.invoke({
            "scheme_name": scheme_name,
            "filled_fields": fill_result.get("filled_fields", {}),
            "user_profile": profile
        })
        
        # Parse the result
        if isinstance(submit_result, str):
            try:
                submit_result = json.loads(submit_result)
            except:
                submit_result = {"success": False, "error": submit_result}
        
        if not submit_result.get("success"):
            # Submission failed - fallback
            scheme_info = fill_result.get("scheme", {})
            response = f""" **Submission Failed**
    
    I couldn't submit the application automatically.
    
    **Reason:** {submit_result.get('error', 'Unknown error')}
    
    **Alternative:** You can apply manually at:
    Portal: {scheme_info.get('application_url', submit_result.get('fallback_url', 'https://agrimachinery.nic.in/'))}
    
    Would you like me to help you with the application process?
    
     **Helpline:** 1800-180-1551"""
            
            return {
                "application_status": "failed",
                "messages": [AIMessage(content=response)]
            }
        
        # Success! Application submitted
        app_details = submit_result.get("application_details", {})
        next_steps = submit_result.get("next_steps", [])
        
        response = f""" **Application Submitted Successfully!**
    
     Your application has been automatically submitted!
    
    **Reference Number:** `{submit_result.get('reference_no')}`
    
    **Application Details:**
    • **Scheme:** {app_details.get('scheme_name')}
    • **Applicant:** {app_details.get('applicant_name')}
    • **State:** {app_details.get('applicant_state')}
    • **Category:** {app_details.get('applicant_category', 'General')}
    • **Subsidy:** {app_details.get('subsidy_percentage')}% (up to {app_details.get('max_subsidy_amount')})
    • **Status:**  Submitted
    
    ** Next Steps:**
    {chr(10).join(f"• {step}" for step in next_steps)}
    
    **Track Your Application:**
    Portal: {app_details.get('portal_url')}
    
     **Helpline:** {submit_result.get('helpline', '1800-180-1551')}
    
    ---
    *This application is now visible in your "My Applications" tab.*
    
    Would you like to apply for any other schemes?"""
        
        return {
            "application_status": "submitted",
            "application_details": app_details,
            "messages": [AIMessage(content=response)]
        }
        
    except Exception as e:
        print(f"Auto Apply Crit Error: {e}")
        return {
             "application_status": "error",
             "messages": [AIMessage(content="I encountered a technical error while processing your request. Please try again later.")]
        }

def general_chat(state: AgentState) -> Dict:
    """
    Handle general conversational queries.
    """
    messages = state["messages"]
    profile = state.get("user_profile", {})
    
    # Escape curly braces in JSON to prevent template variable interpretation
    profile_str = json.dumps(profile).replace("{", "{{").replace("}", "}}")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", f"""You are a friendly agricultural advisor chatbot. Respond helpfully to the farmer's query.
        
Farmer Profile: {profile_str}

If they ask about schemes or subsidies, encourage them to ask specific questions like:
- "What subsidies are available for tractors?"
- "I need help with solar pump installation"
- "What schemes are available in [state]?"

If they want to apply, tell them they can say "apply for [scheme name] for me" to auto-submit.

Keep responses concise and helpful."""),
        MessagesPlaceholder(variable_name="messages")
    ])
    
    try:
        chain = prompt | llm
        response = chain.invoke({"messages": messages})
        return {"messages": [response]}
    except Exception as e:
        print(f"Chat Error: {e}")
        return {"messages": [AIMessage(content="I'm currently undergoing maintenance. Please check back later for chat support.")]}


def extract_profile(state: AgentState) -> Dict:
    """
    Extract user profile information from conversation history.
    Run this on every turn to update profile.
    """
    messages = state["messages"]
    current_profile = state.get("user_profile", {}) or {}
    
    # Quick extraction from last message
    last_msg = messages[-1].content.lower() if messages else ""
    
    # Extract state mentions
    states = ["maharashtra", "punjab", "haryana", "uttar pradesh", "madhya pradesh", 
              "rajasthan", "gujarat", "karnataka", "tamil nadu", "andhra pradesh",
              "telangana", "bihar", "west bengal", "odisha", "kerala"]
    for state in states:
        if state in last_msg:
            current_profile["state"] = state.title()
            break
    
    # Extract category mentions
    categories = ["sc", "st", "obc", "general"]
    for cat in categories:
        if cat in last_msg.split():
            current_profile["category"] = cat.upper()
            break
    
    # Try to extract name if mentioned (simple heuristic)
    name_patterns = ["my name is", "i am", "i'm", "this is"]
    for pattern in name_patterns:
        if pattern in last_msg:
            # Extract word after pattern
            idx = last_msg.find(pattern) + len(pattern)
            remaining = last_msg[idx:].strip()
            words = remaining.split()
            if words and len(words[0]) > 2:
                current_profile["name"] = words[0].title()
                break
    
    # Extract land size if mentioned
    import re
    land_patterns = [
        r'(\d+(?:\.\d+)?)\s*(?:acre|acres|hectare|hectares)',
        r'land\s*(?:size|area)?\s*(?:is|of)?\s*(\d+(?:\.\d+)?)',
    ]
    for pattern in land_patterns:
        match = re.search(pattern, last_msg)
        if match:
            current_profile["land_size"] = float(match.group(1))
            break
    
    return {"user_profile": current_profile}

# --- Routing Functions ---

def should_call_tools(state: AgentState) -> Literal["process_tools", "generate"]:
    """Check if the last message has tool calls to process."""
    messages = state.get("messages", [])
    if messages:
        last_msg = messages[-1]
        if hasattr(last_msg, 'tool_calls') and last_msg.tool_calls:
            return "process_tools"
    return "generate"

def route_by_intent(state: AgentState) -> Literal["search", "apply", "auto_apply", "chat"]:
    """Route based on detected intent."""
    intent = state.get("intent", "chat")
    if intent == "auto_apply":
        return "auto_apply"
    elif intent == "apply":
        return "apply"
    elif intent == "search":
        return "search"
    return "chat"

# --- Graph Construction ---
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("extract_profile", extract_profile)
workflow.add_node("route_intent", route_intent)
workflow.add_node("call_model", call_model)
workflow.add_node("process_tools", process_tool_calls)
workflow.add_node("generate", generate_response)
workflow.add_node("apply", create_application)
workflow.add_node("auto_apply", auto_apply_node)  # New node for automated applications
workflow.add_node("chat", general_chat)

# Set entry point
workflow.set_entry_point("extract_profile")

# Add edges
workflow.add_edge("extract_profile", "route_intent")

# Route based on intent
workflow.add_conditional_edges(
    "route_intent",
    route_by_intent,
    {
        "search": "call_model",
        "apply": "apply",
        "auto_apply": "auto_apply",  # New route
        "chat": "chat"
    }
)

# After call_model, check if tools need to be processed
workflow.add_conditional_edges(
    "call_model",
    should_call_tools,
    {
        "process_tools": "process_tools",
        "generate": "generate"
    }
)

# After processing tools, generate final response
workflow.add_edge("process_tools", "generate")

# All terminal nodes go to END
workflow.add_edge("generate", END)
workflow.add_edge("apply", END)
workflow.add_edge("auto_apply", END)  # New edge
workflow.add_edge("chat", END)

# Compile the graph
agent_app = workflow.compile()
