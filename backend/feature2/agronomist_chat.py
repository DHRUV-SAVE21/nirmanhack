from typing import Dict, List, Optional
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

# Language name mapping for prompts
LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi"
}

class AgronomistChatAgent:
    """
    Handles conversational interaction for the AI Agronomist.
    """
    
    @staticmethod
    def chat(message: str, history: List[Dict], context: Dict, lang: str = "en") -> Dict:
        """
        Processes a user message in the context of a specific diagnosis.
        """
        
        disease = context.get("disease", "Unknown")
        confidence = context.get("confidence", 0)
        initial_analysis = context.get("analysis", "")
        lang_name = LANGUAGE_NAMES.get(lang, "English")
        
        # Initialize Gemini
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.7
        )
        
        # Construct System Prompt with Context
        system_prompt = f"""
        You are an expert AI Agronomist assistant.
        
        IMPORTANT: You MUST respond ENTIRELY in {lang_name} language. All your responses must be in {lang_name}.
        
        Current Context:
        - The farmer has uploaded an image of a crop.
        - Diagnosis: {disease} (Confidence: {confidence*100:.1f}%)
        - Initial Analysis: {initial_analysis}
        
        Your Goal:
        - Answer the farmer's follow-up questions about this diagnosis.
        - Advice on specific treatments (organic/chemical).
        - If asked about Government Schemes, suggest relevant ones.
        
        Tone:
        - Empathetic, professional, and practical.
        - Use simple language suitable for a farmer.
        
        Keep answers concise (under 3-4 sentences) unless asked for details.
        Remember: RESPOND IN {lang_name} ONLY.
        """
        
        # Build Message History
        messages = [SystemMessage(content=system_prompt)]
        
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "ai":
                messages.append(AIMessage(content=msg["content"]))
                
        # Add current message
        if not message or not message.strip():
             # Handle empty message (Start of Session)
             # Use a hidden prompt to trigger the welcome message
             messages.append(HumanMessage(content="Please explain the diagnosis and next steps based on the context."))
        else:
            messages.append(HumanMessage(content=message))
        
        try:
            response = llm.invoke(messages)
            return {
                "response": response.content,
                "history": history + [
                    {"role": "user", "content": message},
                    {"role": "ai", "content": response.content}
                ]
            }
        except Exception as e:
            print(f"Agronomist Chat Error: {e}")
            return {
                "response": "I'm having trouble connecting to the knowledge base. Please try again.",
                "history": history
            }
