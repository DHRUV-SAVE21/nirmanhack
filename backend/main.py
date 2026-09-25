from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173",  # Vite local
    "http://localhost:3000",
    "https://your-production-app.vercel.app" # Add your Vercel URL later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from Let Go 3.0 Backend!"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
