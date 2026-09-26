import gymnasium as gym
from gymnasium import spaces
import numpy as np
import torch

class FarmEnv(gym.Env):
    """
    A unified RL environment simulating a farm.
    Uses the trained World Model (Neural Net) to predict state transitions.
    """
    def __init__(self, world_model):
        super(FarmEnv, self).__init__()
        self.world_model = world_model
        
        # State: [ndvi, moisture, nitrogen, temp, rainfall]
        self.observation_space = spaces.Box(low=0.0, high=1.0, shape=(5,), dtype=np.float32)
        
        # Actions: 0 -> do_nothing, 1 -> irrigate, 2 -> fertilize
        self.action_space = spaces.Discrete(3)
        
        self.state = None
        self.current_step = 0
        self.max_steps = 30 # A season
        
    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.current_step = 0
        # Initialize with random healthy-ish state
        self.state = np.array([
            0.5, # ndvi
            0.5, # moisture
            0.5, # nitrogen
            0.5, # temp (normalized)
            0.1  # rainfall (normalized)
        ], dtype=np.float32)
        return self.state, {}

    def step(self, action):
        self.current_step += 1
        
        # Prepare input for world model: [state..., action]
        wm_input = np.append(self.state, action).astype(np.float32)
        wm_input_tensor = torch.tensor(wm_input).unsqueeze(0)
        
        # Predict next ndvi and moisture
        with torch.no_grad():
            preds = self.world_model(wm_input_tensor).squeeze(0).numpy()
            
        next_ndvi = np.clip(preds[0], 0.0, 1.0)
        next_moisture = np.clip(preds[1], 0.0, 1.0)
        
        # Simulate simple weather/nutrient changes
        next_nitrogen = max(0.0, self.state[2] - 0.02)
        if action == 2: # Fertilize
            next_nitrogen = min(1.0, next_nitrogen + 0.3)
            
        next_temp = self.state[3] # Keep static for simple simulation
        next_rainfall = self.state[4] # Keep static
        
        self.state = np.array([next_ndvi, next_moisture, next_nitrogen, next_temp, next_rainfall], dtype=np.float32)
        
        # Reward Function
        irrigation_cost = 0.1 if action == 1 else 0.0
        fertilizer_cost = 0.2 if action == 2 else 0.0
        stress_penalty = 0.5 if next_moisture < 0.3 else 0.0
        
        reward = (next_ndvi * 1.0) - irrigation_cost - fertilizer_cost - stress_penalty
        
        terminated = self.current_step >= self.max_steps
        truncated = False
        
        return self.state, reward, terminated, truncated, {}
