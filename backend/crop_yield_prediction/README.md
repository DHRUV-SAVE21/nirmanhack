# Crop Yield Prediction & Decision Intelligence System

This module implements a data-driven, personalized agricultural decision intelligence system using deep learning and reinforcement learning.

## Architecture

1. **Storage Layer**: Time-series historical DB schemas (`database.py`)
2. **Learning Layer**: Neural Network World Model simulating farm dynamics (`world_model.py`)
3. **Decision Layer**: Reinforcement Learning with PPO (`farm_env.py` and `train.py`)
4. **Prediction Layer**: Inference generation translating numerical actions into human-readable advice (`inference.py`)

## Usage

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Train the models (Phase 1):
   ```bash
   python train.py
   ```
3. Test the inference endpoint:
   ```bash
   python inference.py
   ```
