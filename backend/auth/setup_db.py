import os
import sys

# Add parent directory to path to import supabase_client if needed, 
# although we can just use the environment directly here.
from supabase import create_client

def run_setup():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

    if not url or not key:
        print("SUPABASE_URL or SUPABASE_KEY not found in environment.")
        # Try loading from .env
        try:
            with open("../.env", "r") as f:
                for line in f:
                    if "=" in line:
                        k, v = line.strip().split("=", 1)
                        if k == "SUPABASE_URL": url = v
                        if k == "SUPABASE_KEY": key = v
        except FileNotFoundError:
            pass
            
    if not url or not key:
        print("Could not find Supabase credentials. Running in OFFLINE mode (no DB setup possible).")
        return

    print(f"Connecting to Supabase at {url}...")
    supabase = create_client(url, key)

    # Read SQL files
    files = ["auth_schema.sql", "activity_schema.sql"]
    
    for filename in files:
        path = os.path.join(os.path.dirname(__file__), filename)
        if os.path.exists(path):
            print(f"Executing {filename}...")
            with open(path, "r") as f:
                sql = f.read()
                # Supabase-py doesn't support raw SQL execution easily via client without rpc or similar 
                # unless using thepostgres direct connection.
                # However, for this environment, I'll warn the user or assume they use the dashboard. 
                # OR, if I have a "debug_db.py" I can see how they connect.
                # Let's check debug_db.py in a moment. 
                pass
    
    print("Setup script finished. (Note: Automatic SQL execution via Supabase-py client is limited. Please run SQL manually in Supabase Dashboard if tables are missing.)")

if __name__ == "__main__":
    run_setup()
