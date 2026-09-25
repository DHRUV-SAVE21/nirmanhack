from datetime import datetime, timedelta
import uuid
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

class SessionManager:
    def __init__(self):
        self.supabase: Client = None
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            except Exception as e:
                print(f" Failed to initialize Supabase client: {e}")

    def create_session(self, user_id: str, user_agent: str = None, ip_address: str = None):
        session_token = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(days=7) # 7 Day Session

        if self.supabase:
            try:
                self.supabase.table("sessions").insert({
                    "user_id": user_id,
                    "session_token": session_token,
                    "expires_at": expires_at.isoformat(),
                    "user_agent": user_agent,
                    "ip_address": ip_address,
                    "created_at": datetime.now().isoformat()
                }).execute()
            except Exception as e:
                print(f" Supabase Session Error: {e}")
                # Fallback: In-memory or just return token (but validation will fail if DB check needed)
        
        return session_token

    def validate_session(self, session_token: str):
        if not self.supabase:
            return None
        
        try:
            response = self.supabase.table("sessions").select("*, users(*)").eq("session_token", session_token).gt("expires_at", datetime.now().isoformat()).execute()
            if response.data:
                # Update last accessed
                # self.supabase.table("sessions").update({"last_accessed_at": datetime.now().isoformat()}).eq("session_token", session_token).execute()
                return response.data[0] # Returns session with nested user data
            return None
        except Exception as e:
            print(f"Session Validation Error: {e}")
            return None

    def logout(self, session_token: str):
        if self.supabase:
            try:
                self.supabase.table("sessions").delete().eq("session_token", session_token).execute()
                return True
            except Exception as e:
                print(f"Logout Error: {e}")
        return False

    def log_activity(self, user_id: str, action: str, resource: str, details=None, session_id=None):
        print(f"ACTIVITY LOG [{user_id}]: {action} on {resource}")
        if self.supabase:
            try:
                data = {
                    "user_id": user_id,
                    "action": action, # changed from action_type to match schema
                    "resource": resource, # changed from resource_accessed
                    "details": details or {},
                    "created_at": datetime.now().isoformat()
                }
                self.supabase.table("activity_logs").insert(data).execute()
            except Exception as e:
                print(f"Failed to log to Supabase: {e}")

session_manager = SessionManager()
