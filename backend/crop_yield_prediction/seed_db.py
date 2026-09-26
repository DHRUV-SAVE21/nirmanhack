import os
import random
import uuid
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY inside .env")

supabase: Client = create_client(supabase_url, supabase_key)

def seed_database(num_days=3000, farm_id="mock_farm_001"):
    print(f"Adding {num_days} days of realistic timeline data for farm {farm_id}...")
    
    start_time = datetime.now() - timedelta(days=num_days)
    
    # Starting state
    ndvi = 0.3
    moisture = 0.5
    nitrogen = 0.4
    temp = 0.6
    rainfall = 0.1
    
    farm_data_list = []
    farm_actions_list = []
    
    for day in range(num_days):
        current_time = start_time + timedelta(days=day)
        
        # Decide action based on state to create correlation
        action_type = "none"
        if moisture < 0.25:
            action_type = "irrigate"
        elif nitrogen < 0.25:
            action_type = "fertilize"
            
        # Log action if taken
        if action_type != "none":
            farm_actions_list.append({
                "id": str(uuid.uuid4()),
                "farm_id": farm_id,
                "timestamp": current_time.isoformat(),
                "action_type": action_type,
                "action_value": 1.0 # simple normalized value
            })
            
        # 1. Store state at day t
        farm_data_list.append({
            "id": str(uuid.uuid4()),
            "farm_id": farm_id,
            "timestamp": current_time.isoformat(),
            "ndvi": round(ndvi, 3),
            "moisture": round(moisture, 3),
            "nitrogen": round(nitrogen, 3),
            "phosphorus": round(random.uniform(0.2, 0.6), 3),
            "potassium": round(random.uniform(0.3, 0.7), 3),
            "ec": round(random.uniform(1.0, 2.5), 3),
            "temperature": round(temp, 3),
            "rainfall": round(rainfall, 3),
            "humidity": round(random.uniform(0.4, 0.9), 3),
            "crop_type": "wheat",
            "crop_stage": "vegetative"
        })
        
        # 2. Transition state for day t+1
        if action_type == "irrigate":
            moisture = min(1.0, moisture + 0.4)
        else:
            moisture = max(0.0, moisture - random.uniform(0.01, 0.05))
            
        if action_type == "fertilize":
            nitrogen = min(1.0, nitrogen + 0.4)
            ndvi = min(1.0, ndvi + 0.1)
        else:
            nitrogen = max(0.0, nitrogen - random.uniform(0.01, 0.03))
            ndvi = min(1.0, max(0.0, ndvi + random.uniform(-0.02, 0.02)))
            
        # Add random noise
        temp = max(0.0, min(1.0, temp + random.uniform(-0.1, 0.1)))
        rainfall = max(0.0, min(1.0, rainfall + random.uniform(-0.05, 0.05)))

    # Batch insert into supabase
    print("Inserting telemetry into 'farm_data'...")
    # Supabase limits insert array size
    for i in range(0, len(farm_data_list), 500):
        supabase.table("farm_data").insert(farm_data_list[i:i+500]).execute()
        
    print("Inserting operations into 'farm_actions'...")
    for i in range(0, len(farm_actions_list), 500):
        supabase.table("farm_actions").insert(farm_actions_list[i:i+500]).execute()
        
    print(f"✅ Success! Seeded Database with {len(farm_data_list)} telemetry logs and {len(farm_actions_list)} executed actions.")
    print("You can now securely run 'python train.py'!")

if __name__ == "__main__":
    seed_database(num_days=2500, farm_id="test_farm_001")
