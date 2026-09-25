from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any

class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "farmer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ActivityLogRequest(BaseModel):
    user_id: str
    action_type: str
    resource_accessed: str
    details: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    created_at: str

class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UserResponse] = None
    session_id: Optional[str] = None
