import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

# Phase 1: 5 features + action = 6 inputs
# Features: ndvi, moisture, nitrogen, temp, rainfall, action
class WorldModel(nn.Module):
    def __init__(self, input_dim=6, hidden1=64, hidden2=32, output_dim=2):
        super(WorldModel, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden1),
            nn.ReLU(),
            nn.Linear(hidden1, hidden2),
            nn.ReLU(),
            nn.Linear(hidden2, output_dim)
        )

    def forward(self, x):
        # x is [batch_size, input_dim]
        # output is [batch_size, output_dim] (next_ndvi, next_moisture)
        return self.net(x)

def train_world_model(model, dataloader, epochs=50):
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    for epoch in range(epochs):
        total_loss = 0
        for batch_X, batch_y in dataloader:
            optimizer.zero_grad()
            predictions = model(batch_X)
            loss = criterion(predictions, batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1}/{epochs}, Loss: {total_loss/len(dataloader):.4f}")
    return model
