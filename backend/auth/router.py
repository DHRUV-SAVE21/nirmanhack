from fastapi import APIRouter, HTTPException, Depends, Request
from .email_service import auth_service
from .session_manager import session_manager
from .models import SignupRequest, LoginRequest, AuthResponse
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest, req: Request):
    try:
        # Map 'user' role to 'farmer' for database compatibility
        db_role = request.role
        if request.role == 'user':
            db_role = 'farmer'

        user_data = auth_service.register_user(
            full_name=request.full_name,
            email=request.email,
            password=request.password,
            role=db_role
        )

        # Create session
        user_agent = req.headers.get('user-agent')
        ip = req.client.host
        session_id = session_manager.create_session(user_data["id"], user_agent, ip)
        
        # Log
        session_manager.log_activity(user_data["id"], "SIGNUP", "/auth/signup", {}, session_id)

        return {
            "success": True,
            "message": "User registered successfully.",
            "user": user_data,
            "session_id": session_id
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Signup Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, req: Request):
    try:
        user = auth_service.authenticate_user(request.email, request.password)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        
        # Create Session
        user_agent = req.headers.get('user-agent')
        ip = req.client.host
        session_id = session_manager.create_session(user["id"], user_agent, ip)
        
        session_manager.log_activity(user["id"], "LOGIN", "/auth/login", {}, session_id)

        return {
            "success": True,
            "message": f"Welcome back, {user['full_name']}",
            "user": user,
            "session_id": session_id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login Error: {e}")
        raise HTTPException(status_code=500, detail="Login failed.")

@router.post("/logout")
async def logout(req: Request):
    auth_header = req.headers.get("Authorization")
    if not auth_header:
         return {"success": False, "message": "No session provided"}
    
    token = auth_header.replace("Bearer ", "")
    success = session_manager.logout(token)
    return {"success": success}

@router.get("/me")
async def get_current_user(req: Request):
    auth_header = req.headers.get("Authorization")
    if not auth_header:
         raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.replace("Bearer ", "")
    session = session_manager.validate_session(token)
    
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    user_data = session.get('users') # Supabase join returns nested dict
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    # Clean user data
    if "password_hash" in user_data:
        del user_data["password_hash"]

    return {
        "success": True,
        "user": user_data
    }
