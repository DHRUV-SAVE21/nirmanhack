from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Using key: {api_key}")

client = genai.Client(api_key=api_key)
try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents='Hello'
    )
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
