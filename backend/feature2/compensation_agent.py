from typing import Dict, List
import random
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

# Language name mapping for prompts
LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi"
}

# Context for the Agent - Template with language placeholder
PMFBY_CONTEXT_TEMPLATE = """
You are an AI Agronomist and expert on the Pradhan Mantri Fasal Bima Yojana (PMFBY) Scheme.

IMPORTANT: You MUST respond ENTIRELY in {lang_name} language. All your responses must be in {lang_name}.

Answer questions based on this official checklist:

1. Essential Documentation
- Duly Completed Claim Form.
- Aadhaar Card (Mandatory).
- Proof of Land Records/Ownership (RoR, LPC).
- Bank Account Details (Passbook/Cancelled Cheque for DBT).
- Photo ID (Voter ID, PAN, etc.).
- Sowing Declaration/Certificate.

2. Proof of Crop Loss
- Evidence of Damage (Photos/Videos).
- Intimation Details (Survey No, Acreage).
- Local Authority Verification (Sarpanch/Revenue Officer).
- Policy/Proposal Number.

3. Important Deadlines
- Intimation Timeline: Loss must be reported within 72 hours.
- Crop Cutting Experiments (CCE): Cooperation required.

If the user asks about the claim process, documents, or eligibility, answer helpful and concisely.
If the user seems to be following the compensation flow (confirming cause, submitting), keep answers short.
Remember: RESPOND IN {lang_name} ONLY.
"""

class CompensationAgent:
    """
    Handles the interaction flow for Crop Loss Compensation.
    Now enhanced with Gemini for dynamic Q&A.
    """
    
    @staticmethod
    def process_message(state: Dict, user_input: str, lang: str = "en") -> Dict:
        step = state.get("step", "START")
        history = state.get("history", [])
        ndvi_val = state.get("ndvi", 0.0)
        lang_name = LANGUAGE_NAMES.get(lang, "English")
        
        response_text = ""
        next_step = step
        
        # --- LLM HELPERS ---
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.getenv("GEMINI_API_KEY"))
        
        def ask_gemini(query):
            try:
                context = PMFBY_CONTEXT_TEMPLATE.format(lang_name=lang_name)
                messages = [
                    SystemMessage(content=context),
                    HumanMessage(content=f"User Query: {query}")
                ]
                res = llm.invoke(messages)
                return res.content
            except Exception as e:
                print(f"LLM Error: {e}")
                return "I'm having trouble accessing the scheme database right now."

        # --- STATE MACHINE LOGIC ---
        
        # 0. Check for General Questions (Interrupt Logic)
        # If the user asks a specific question about docs/schemes, we answer regardless of state
        if "?" in user_input or "document" in user_input.lower() or "scheme" in user_input.lower() or "deadline" in user_input.lower():
            response_text = ask_gemini(user_input)
            # We don't change 'next_step' so the user stays in the current flow context
            return {
                "step": step,
                "response": response_text,
                "history": history + [{"role": "user", "content": user_input}, {"role": "agent", "content": response_text}]
            }

        # 1. Normal Flow Logic
        if step == "START":
            # Initial Trigger (System initiated)
            
            # Logic: Check NDVI Ranges
            
            # Use Gemini to generate the initial assessment dynamically
            prompt = f"""
            You are an AI Agronomist analyzing satellite data for a farmer.
            The detected NDVI (Normalized Difference Vegetation Index) is {ndvi_val}.
            
            Interpretation Guide:
            - NDVI > 0.6: Healthy, dense vegetation. (Optimistic tone, offer yield forecast)
            - NDVI 0.4 - 0.6: Moderate stress, possible water/nutrient issues. (Concerned tone, ask about leaf yellowing or dry patches)
            - NDVI < 0.4: Critical stress/crop loss. (Urgent tone, ask if there was a recent weather event like Drought/Flood to check insurance eligibility)
            
            Generate a short, friendly message to the farmer explaining this status.
            If critical, Ask a Yes/No question about recent weather events.
            If moderate, Ask about visual symptoms.
            If healthy, Ask if they want a yield forecast.
            
            Keep the message under 3 sentences. Use emojis.
            """
            
            response_text = ask_gemini(prompt)

            if ndvi_val >= 0.6:
                next_step = "HEALTHY_FOLLOWUP"
            elif ndvi_val >= 0.4:
                next_step = "DIAGNOSE_STRESS"
            else:
                next_step = "CONFIRM_CAUSE"
            
        # --- HEALTHY BRANCH ---
        elif step == "HEALTHY_FOLLOWUP":
            if "yield" in user_input.lower() or "forecast" in user_input.lower():
                response_text = " **Yield Forecast**: Based on current biomass, we predict a yield of **4.2 tons/hectare**, which is 15% higher than last year! Keep up the good irrigation schedule."
            else:
                response_text = ask_gemini(user_input) # Fallback to generic chat
            next_step = "END"

        # --- MODERATE BRANCH ---
        elif step == "DIAGNOSE_STRESS":
             if "yes" in user_input.lower():
                 response_text = "I see. It could be **Nitrogen deficiency** or fungal start. \n\nI recommend applying a foliar spray of **NPK 19:19:19 (5g/liter)** to boost recovery. Would you like a list of nearby shops?"
             else:
                 response_text = "Okay. It might just be temporary heat stress. Please ensure soil moisture is maintained. I will scan again in 24 hours."
             next_step = "END"

        # --- CRITICAL BRANCH (Insurance) ---
        elif step == "CONFIRM_CAUSE":
            # User answered "Yes, flood" etc.
            if "no" in user_input.lower():
                response_text = "Understood. The system will continue monitoring, but no claim will be filed at this time."
                next_step = "END"
            else:
                response_text = (
                    "Thank you. Based on your location and the detected stress, you are eligible for the **Pradhan Mantri Fasal Bima Yojana (PMFBY)** for 'Mid-Season Adversity'.\n\n"
                    "To apply, you will need documents like **Aadhaar, Land Record (RoR), and Sowing Certificate**.\n"
                    "**Do you want me to help you fill the application form now?**"
                )
                next_step = "FINAL_SUBMIT"
                
        elif step == "FINAL_SUBMIT":
            if "yes" in user_input.lower() or "submit" in user_input.lower() or "fill" in user_input.lower():
                response_text = (
                    " **Redirecting to Application Form...** \n\n"
                    "Please keep your **Aadhaar Card** and **Bank Passbook** handy. \n"
                    "Click the button below or go to the 'Forms' tab to complete your claim."
                )
                # Client-Side will see this final state and could auto-redirect if desired, 
                # but for now we just give info. The user has the "Apply" button on screen anyway.
                next_step = "END"
            else:
                response_text = "Okay. You can access the form later from the Dashboard."
                next_step = "END"
        
        # Fallback for "END" or "GENERAL" if user keeps typing
        elif step == "END":
             response_text = ask_gemini(user_input)
        
        return {
            "step": next_step,
            "response": response_text,
            "history": history + [{"role": "user", "content": user_input}, {"role": "agent", "content": response_text}]
        }
