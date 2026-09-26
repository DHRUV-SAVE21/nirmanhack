import os
import torch
import numpy as np
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Store ALL data with timestamps
FARM_DATA_SCHEMA = """
CREATE TABLE IF NOT EXISTS farm_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id text NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    ndvi numeric,
    nitrogen numeric,
    phosphorus numeric,
    potassium numeric,
    moisture numeric,
    ec numeric,
    temperature numeric,
    rainfall numeric,
    humidity numeric,
    crop_type text,
    crop_stage text
);
"""

# Action Log Table
FARM_ACTIONS_SCHEMA = """
CREATE TABLE IF NOT EXISTS farm_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id text NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    action_type text CHECK (action_type IN ('irrigate', 'fertilize', 'none')),
    action_value numeric
);
"""

def get_real_dataset():
    """
    Fetches ACTUAL recorded farm data from your Supabase PostgreSQL tables 
    and transforms it into (X, y) tensors for Neural Network Training.
    Maps state at time t -> time t+1
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env")
        
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # 1. Fetch Farm Data
    print("Fetching real telemetry data from 'farm_data' table...")
    farm_response = supabase.table("farm_data").select("*").order("timestamp", desc=False).execute()
    farm_df = pd.DataFrame(farm_response.data)
    
    if len(farm_df) < 2:
        raise ValueError("Not enough real data in 'farm_data' table to train the model. Need at least 2 consecutive timestamp records!")
    
    # 2. Fetch Actions 
    print("Fetching recorded actions from 'farm_actions' table...")
    actions_response = supabase.table("farm_actions").select("*").order("timestamp", desc=False).execute()
    actions_df = pd.DataFrame(actions_response.data)
    
    # Ensure datetime format for merging
    farm_df['timestamp'] = pd.to_datetime(farm_df['timestamp'])
    
    # Map actions text to discrete INT
    # 0 = none, 1 = irrigate, 2 = fertilize
    def map_action(row):
        action = row.get("action_type", "none").lower()
        if action == "irrigate": return 1
        if action == "fertilize": return 2
        return 0
        
    if not actions_df.empty:
        actions_df['timestamp'] = pd.to_datetime(actions_df['timestamp'])
        actions_df['action_code'] = actions_df.apply(map_action, axis=1)
        # Merge action on closest timestamp or forward fill (simplified merge)
        df = pd.merge_asof(farm_df, actions_df[['timestamp', 'action_code']], on='timestamp', direction='backward')
    else:
        # Default action 0 if no actions recorded yet
        df = farm_df.copy()
        df['action_code'] = 0
        
    df['action_code'] = df['action_code'].fillna(0)
        
    # 3. Create t -> t+1 mapping
    X_list = []
    y_list = []
    
    print("Structuring time-series data into supervised datasets (t -> t+1)...")
    for farm_id, group in df.groupby('farm_id'):
        group = group.sort_values('timestamp').reset_index(drop=True)
        for i in range(len(group) - 1):
            row_t = group.iloc[i]
            row_t_next = group.iloc[i+1]
            
            # X: ndvi_t, moisture_t, nitrogen_t, temp_t, rainfall_t, action_t
            X_list.append([
                float(row_t.get('ndvi') or 0.5), 
                float(row_t.get('moisture') or 0.5), 
                float(row_t.get('nitrogen') or 0.5), 
                float(row_t.get('temperature') or 0.5), 
                float(row_t.get('rainfall') or 0.1),
                float(row_t.get('action_code') or 0)
            ])
            
            # y: next_ndvi, next_moisture
            y_list.append([
                float(row_t_next.get('ndvi') or 0.5),
                float(row_t_next.get('moisture') or 0.5)
            ])
            
    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.float32)
    
    print(f"Successfully processed {len(X)} actual historical transitions.")
    return torch.tensor(X), torch.tensor(y)
