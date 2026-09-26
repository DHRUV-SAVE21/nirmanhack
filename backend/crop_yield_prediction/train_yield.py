import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
import os

from crop_model import CropYieldModel, CROPS, CROPS_DB

def generate_strict_agronomic_dataset(num_samples=80000):
    """
    Biological data generator. STRICTLY enforces 0 yield if parameters fall out of bounding box.
    """
    X = np.random.rand(num_samples, 5).astype(np.float32)
    y = np.zeros((num_samples, len(CROPS)), dtype=np.float32)
    
    for i in range(num_samples):
        n, m, ni, t, r = X[i]
        yields = np.zeros(len(CROPS))
        
        for c_idx, crop in enumerate(CROPS):
            reqs = CROPS_DB[crop]
            # STRICT FILTER: if outside moisture or temp bounds by even a little, yield is 0 (crop dies)
            if m < reqs["min_m"] or m > reqs["max_m"] or t < reqs["min_t"] or t > reqs["max_t"]:
                yields[c_idx] = 0.0
            else:
                # Inside optimal range: calculate standard deviation penalty
                opt_m = (reqs["min_m"] + reqs["max_m"]) / 2.0
                opt_t = (reqs["min_t"] + reqs["max_t"]) / 2.0
                
                penalty = abs(m - opt_m) * 2 + abs(t - opt_t) * 2 - (ni * 0.5)
                raw_yield = reqs["base_yield"] * (1 - penalty)
                final_yield = max(0.0, raw_yield) * (0.4 + 0.6 * n) # Scale by NDVI greenness
                yields[c_idx] = final_yield
                
        y[i] = yields

    return torch.tensor(X), torch.tensor(y)

def main():
    print("1. Crafting Agronomic Training Dataset (Strict Bounding Boxes)...")
    X, y = generate_strict_agronomic_dataset(80000)
    dataset = TensorDataset(X, y)
    dataloader = DataLoader(dataset, batch_size=256, shuffle=True)
    
    print("2. Initializing Regression Neural Network...")
    model = CropYieldModel()
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.005)
    
    print("3. Training Model to predict Yield across 55 crops strictly...")
    epochs = 40
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        for batch_X, batch_y in dataloader:
            optimizer.zero_grad()
            preds = model(batch_X)
            loss = criterion(preds, batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1}/{epochs} | MSE Error: {total_loss/len(dataloader):.4f}")
            
    os.makedirs('models', exist_ok=True)
    torch.save(model.state_dict(), 'models/crop_yield_model.pth')
    print("✅ Model successfully trained and saved: models/crop_yield_model.pth")

if __name__ == "__main__":
    main()
