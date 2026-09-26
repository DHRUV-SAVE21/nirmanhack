import os
import torch
import numpy as np
from torch.utils.data import TensorDataset, DataLoader
from stable_baselines3 import PPO, DQN, SAC
from stable_baselines3.common.env_checker import check_env

from world_model import WorldModel, train_world_model
from farm_env import FarmEnv
from database import get_real_dataset

def main():
    print("1. Fetching Real Farm Data from Supabase Database...")
    try:
        X, y = get_real_dataset()
    except Exception as e:
        print(f"\\n[ERROR] Failed to fetch real data: {e}")
        print("Please ensure your 'farm_data' and 'farm_actions' tables exist and have recorded data in Supabase!")
        return
    dataset = TensorDataset(X, y)
    dataloader = DataLoader(dataset, batch_size=64, shuffle=True)
    
    print("2. Training World Model (Neural Network)...")
    world_model = WorldModel()
    world_model = train_world_model(world_model, dataloader, epochs=50)
    
    # Save world model
    os.makedirs('models', exist_ok=True)
    torch.save(world_model.state_dict(), 'models/world_model.pth')
    print("-> World Model saved to models/world_model.pth\\n")
    
    print("3. Initializing RL Environment...")
    env = FarmEnv(world_model)
    check_env(env)
    
    print("4. Training RL Agent (PPO Baseline)...")
    model = PPO("MlpPolicy", env, verbose=0)
    model.learn(total_timesteps=20000)
    
    # Save RL model
    model.save("models/ppo_farm_agent")
    print("-> RL Agent saved to models/ppo_farm_agent.zip\\n")
    
    print("System Training Complete! Run inference.py to generate recommendations.")

if __name__ == "__main__":
    main()
