import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { AVAILABLE_ROUTES } from "../utils/routeConfig";

// Initialize the ChatOpenAI client with OpenRouter configuration
const llm = new ChatOpenAI({
    modelName: "google/gemini-2.0-flash-exp:free", // Use free tier Gemini 2.0 Flash
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    },
    temperature: 0,
});

// Create a string representation of available routes for the prompt
const routesContext = AVAILABLE_ROUTES.map(
    (r) => `- "${r.path}": ${r.description} (Keywords: ${r.keywords.join(", ")})`
).join("\n");

const template = `You are a helpful AI assistant for a smart farming application.
Your goal is to understand the user's intent from their spoken command and map it to either a navigation action or a UI action on the current page.

Available Routes for Navigation:
{routes_context}

Current Page Context:
- Current Path: "{current_path}"
- User Command: "{transcript}"

Instructions:
1. Analyze the user command.
2. If the user wants to go to a different page, return "targetPath" with the route.
3. If the user wants to perform an action on the CURRENT page (like filling a form field, clicking a button, or asking for information), return an "action".
   - Actions for form filling: {{ "type": "fill", "selector": "input[name='field_name']", "value": "extracted_value" }}
   - Actions for clicking: {{ "type": "click", "selector": "button_text_or_selector" }}
4. For form filling, look for common patterns like "my name is [name]", "set height to [value]", etc.
5. Provide a brief, friendly "feedback" message to be spoken back to the user.

Return ONLY a valid JSON object with the following format, no markdown formatting:
{{
  "targetPath": "/path/to/route" || null,
  "action": {{ "type": "fill" | "click" | "scroll", "selector": "string", "value": "string" }} || null,
  "feedback": "Your friendly feedback message here"
}}
`;

const prompt = PromptTemplate.fromTemplate(template);

export const getVoiceIntent = async (transcript, currentPath) => {
    try {
        const formattedPrompt = await prompt.format({
            routes_context: routesContext,
            current_path: currentPath,
            transcript: transcript,
        });

        const response = await llm.invoke(formattedPrompt);

        // Clean JSON response from potential markdown wrapping
        const cleanContent = response.content.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            return JSON.parse(cleanContent);
        } catch (parseError) {
            console.error("Failed to parse LLM response:", response.content);
            return {
                targetPath: null,
                action: null,
                feedback: "Sorry, I couldn't understand that command.",
            };
        }

    } catch (error) {
        console.error("Error in getVoiceIntent:", error);
        return {
            targetPath: null,
            action: null,
            feedback: "Sorry, something went wrong. Please try again.",
        };
    }
};
