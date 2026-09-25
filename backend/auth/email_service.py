import os
import bcrypt
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

class AuthService:
    def __init__(self):
        self.supabase: Client = None
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            except Exception as e:
                print(f" Failed to initialize Supabase client: {e}")

    def get_password_hash(self, password: str) -> str:
        pwd_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(pwd_bytes, salt)
        return hashed_password.decode('utf-8')

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            pwd_bytes = plain_password.encode('utf-8')
            hashed_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(pwd_bytes, hashed_bytes)
        except Exception:
            return False

    def get_user_by_email(self, email: str):
        if not self.supabase:
            print(" Supabase not connected")
            return None
        try:
            response = self.supabase.table("users").select("*").eq("email", email).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f" DB Error (get_user): {e}")
            return None

    def register_user(self, full_name, email, password, role="farmer"):
        if not self.supabase:
            raise Exception("Database connection unavailable")

        # Check existing
        existing = self.get_user_by_email(email)
        if existing:
            raise ValueError("User with this email already exists.")

        hashed_pw = self.get_password_hash(password)

        new_user = {
            "full_name": full_name,
            "email": email,
            "password_hash": hashed_pw,
            "role": role,
            "created_at": datetime.now().isoformat(),
            "is_active": True
        }

        try:
            response = self.supabase.table("users").insert(new_user).execute()
            if response.data:
                user = response.data[0]
                # Return without password
                return {k: v for k, v in user.items() if k != "password_hash"}
            raise Exception("Insert failed")
        except Exception as e:
            print(f" Registration Error: {e}")
            raise Exception(f"Registration failed: {str(e)}")

    def authenticate_user(self, email, password):
        if not self.supabase:
            raise Exception("Database connection unavailable")

        user = self.get_user_by_email(email)
        if not user:
            return None
        
        if self.verify_password(password, user["password_hash"]):
            return {k: v for k, v in user.items() if k != "password_hash"}
        
        return None

# Export singleton
auth_service = AuthService()
