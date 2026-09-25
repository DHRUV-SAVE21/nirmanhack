import json
from core.supabase_client import supabase

class Database:
    @staticmethod
    def get_sensor_data(user_id):
        try:
            response = supabase.table("autonomous_sensors").select("*").eq("user_id", user_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]["data"]
            return None
        except Exception as e:
            print(f"DB Error (get_sensor_data): {e}")
            return None

    @staticmethod
    def upsert_sensor_data(user_id, sensor_data):
        try:
            payload = {
                "user_id": user_id,
                "data": sensor_data
            }
            supabase.table("autonomous_sensors").upsert(payload).execute()
        except Exception as e:
            print(f"DB Error (upsert_sensor_data): {e}")

    @staticmethod
    def log_event(hash_val, user_id, event_type, details, timestamp, previous_hash):
        try:
            payload = {
                "hash": hash_val,
                "user_id": user_id,
                "event_type": event_type,
                "details": details,
                "timestamp": timestamp,
                "previous_hash": previous_hash
            }
            supabase.table("autonomous_ledger").insert(payload).execute()
        except Exception as e:
             # If table missing, print warning
            print(f"DB Error (log_event): {e}")

    @staticmethod
    def get_ledger(user_id):
        try:
            response = supabase.table("autonomous_ledger").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(50).execute()
            
            # Format to match frontend expectation (list of objects)
            history = []
            for row in response.data:
                history.append({
                    "hash": row["hash"],
                    "index": 0, # DB doesn't track sequential index easily, UI can infer or we ignore
                    "data": {
                        "event_type": row["event_type"],
                        "details": row["details"],
                        "timestamp": row["timestamp"],
                        "previous_hash": row["previous_hash"]
                    }
                })
            return history
        except Exception as e:
            print(f"DB Error (get_ledger): {e}")
            return []

db = Database()
