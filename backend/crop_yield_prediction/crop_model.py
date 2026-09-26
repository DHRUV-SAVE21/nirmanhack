import torch
import torch.nn as nn
import asyncio
import random

# Comprehensive 55 Crop Database based on actual Indian agricultural agronomy
CROPS_DB = {
    # Cereals & Grains
    "Wheat": {"min_m": 0.3, "max_m": 0.7, "min_t": 0.2, "max_t": 0.6, "base_yield": 3.4, "cost_ha": 52000},
    "Rice": {"min_m": 0.7, "max_m": 1.0, "min_t": 0.6, "max_t": 0.9, "base_yield": 4.1, "cost_ha": 68000},
    "Maize": {"min_m": 0.4, "max_m": 0.8, "min_t": 0.5, "max_t": 0.8, "base_yield": 5.2, "cost_ha": 42000},
    "Millet": {"min_m": 0.1, "max_m": 0.5, "min_t": 0.6, "max_t": 1.0, "base_yield": 1.8, "cost_ha": 18000},
    "Sorghum": {"min_m": 0.2, "max_m": 0.6, "min_t": 0.6, "max_t": 0.9, "base_yield": 2.2, "cost_ha": 22000},
    "Barley": {"min_m": 0.2, "max_m": 0.6, "min_t": 0.1, "max_t": 0.5, "base_yield": 3.0, "cost_ha": 35000},
    "Oats": {"min_m": 0.4, "max_m": 0.8, "min_t": 0.2, "max_t": 0.5, "base_yield": 2.8, "cost_ha": 32000},
    "Ragi": {"min_m": 0.2, "max_m": 0.6, "min_t": 0.5, "max_t": 0.9, "base_yield": 2.5, "cost_ha": 20000},
    
    # Cash Crops
    "Sugarcane": {"min_m": 0.6, "max_m": 1.0, "min_t": 0.7, "max_t": 0.9, "base_yield": 72.0, "cost_ha": 165000},
    "Cotton": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.7, "max_t": 1.0, "base_yield": 2.1, "cost_ha": 58000},
    "Jute": {"min_m": 0.7, "max_m": 1.0, "min_t": 0.7, "max_t": 0.9, "base_yield": 2.8, "cost_ha": 45000},
    "Tobacco": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.6, "max_t": 0.9, "base_yield": 2.4, "cost_ha": 75000},
    "Tea": {"min_m": 0.6, "max_m": 0.9, "min_t": 0.4, "max_t": 0.8, "base_yield": 1.8, "cost_ha": 140000},
    "Coffee": {"min_m": 0.6, "max_m": 0.9, "min_t": 0.5, "max_t": 0.8, "base_yield": 1.2, "cost_ha": 120000},
    
    # Pulses & Legumes
    "Soybean": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.5, "max_t": 0.8, "base_yield": 2.4, "cost_ha": 38000},
    "Chickpea": {"min_m": 0.2, "max_m": 0.5, "min_t": 0.4, "max_t": 0.7, "base_yield": 1.6, "cost_ha": 28000},
    "PigeonPeas": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.6, "max_t": 0.9, "base_yield": 1.2, "cost_ha": 25000},
    "MungBean": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.6, "max_t": 0.9, "base_yield": 0.9, "cost_ha": 22000},
    "Lentil": {"min_m": 0.2, "max_m": 0.5, "min_t": 0.3, "max_t": 0.6, "base_yield": 1.1, "cost_ha": 24000},
    "BlackGram": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.6, "max_t": 0.9, "base_yield": 0.8, "cost_ha": 22000},
    "KidneyBeans": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.4, "max_t": 0.7, "base_yield": 1.4, "cost_ha": 32000},
    
    # Fruits
    "Mango": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.6, "max_t": 0.9, "base_yield": 8.5, "cost_ha": 85000},
    "Banana": {"min_m": 0.7, "max_m": 1.0, "min_t": 0.7, "max_t": 0.9, "base_yield": 32.0, "cost_ha": 110000},
    "Apple": {"min_m": 0.5, "max_m": 0.8, "min_t": 0.1, "max_t": 0.4, "base_yield": 12.0, "cost_ha": 150000},
    "Grapes": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.4, "max_t": 0.8, "base_yield": 18.0, "cost_ha": 220000},
    "Orange": {"min_m": 0.5, "max_m": 0.8, "min_t": 0.5, "max_t": 0.8, "base_yield": 15.0, "cost_ha": 95000},
    "Papaya": {"min_m": 0.6, "max_m": 0.9, "min_t": 0.7, "max_t": 0.9, "base_yield": 35.0, "cost_ha": 80000},
    "Watermelon": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.7, "max_t": 0.9, "base_yield": 25.0, "cost_ha": 65000},
    "Coconut": {"min_m": 0.7, "max_m": 1.0, "min_t": 0.7, "max_t": 0.9, "base_yield": 12.0, "cost_ha": 55000},
    "Pomegranate": {"min_m": 0.2, "max_m": 0.5, "min_t": 0.6, "max_t": 0.9, "base_yield": 10.0, "cost_ha": 140000},
    "Guava": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.6, "max_t": 0.9, "base_yield": 15.0, "cost_ha": 65000},
    "Pineapple": {"min_m": 0.6, "max_m": 0.9, "min_t": 0.7, "max_t": 0.9, "base_yield": 45.0, "cost_ha": 120000},
    
    # Vegetables
    "Potato": {"min_m": 0.5, "max_m": 0.8, "min_t": 0.3, "max_t": 0.6, "base_yield": 22.0, "cost_ha": 85000},
    "Tomato": {"min_m": 0.5, "max_m": 0.8, "min_t": 0.5, "max_t": 0.8, "base_yield": 32.0, "cost_ha": 95000},
    "Onion": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.4, "max_t": 0.7, "base_yield": 18.0, "cost_ha": 70000},
    "Garlic": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.3, "max_t": 0.6, "base_yield": 5.0, "cost_ha": 80000},
    "Cabbage": {"min_m": 0.5, "max_m": 0.8, "min_t": 0.3, "max_t": 0.6, "base_yield": 25.0, "cost_ha": 60000},
    "Cauliflower": {"min_m": 0.5, "max_m": 0.8, "min_t": 0.3, "max_t": 0.6, "base_yield": 18.0, "cost_ha": 65000},
    "Brinjal": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.6, "max_t": 0.9, "base_yield": 22.0, "cost_ha": 70000},
    "Carrot": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.2, "max_t": 0.5, "base_yield": 25.0, "cost_ha": 55000},
    "Spinach": {"min_m": 0.5, "max_m": 0.8, "min_t": 0.3, "max_t": 0.6, "base_yield": 12.0, "cost_ha": 40000},
    "Okra": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.7, "max_t": 0.9, "base_yield": 10.0, "cost_ha": 50000},
    "Chili": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.6, "max_t": 0.9, "base_yield": 2.5, "cost_ha": 95000},
    "Pumpkin": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.6, "max_t": 0.9, "base_yield": 20.0, "cost_ha": 45000},
    "Cucumber": {"min_m": 0.5, "max_m": 0.8, "min_t": 0.6, "max_t": 0.9, "base_yield": 25.0, "cost_ha": 60000},
    
    # Oilseeds
    "Mustard": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.3, "max_t": 0.6, "base_yield": 1.2, "cost_ha": 25000},
    "Groundnut": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.6, "max_t": 0.9, "base_yield": 1.8, "cost_ha": 45000},
    "Sunflower": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.5, "max_t": 0.8, "base_yield": 1.6, "cost_ha": 35000},
    "Sesame": {"min_m": 0.2, "max_m": 0.5, "min_t": 0.7, "max_t": 0.9, "base_yield": 0.6, "cost_ha": 20000},
    "Castor": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.6, "max_t": 0.9, "base_yield": 1.2, "cost_ha": 32000},
    "Linseed": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.3, "max_t": 0.6, "base_yield": 0.8, "cost_ha": 22000},
    
    # Spices
    "Turmeric": {"min_m": 0.6, "max_m": 0.9, "min_t": 0.6, "max_t": 0.9, "base_yield": 4.5, "cost_ha": 120000},
    "Ginger": {"min_m": 0.6, "max_m": 0.9, "min_t": 0.6, "max_t": 0.9, "base_yield": 12.0, "cost_ha": 140000},
    "Cardamom": {"min_m": 0.7, "max_m": 1.0, "min_t": 0.5, "max_t": 0.8, "base_yield": 0.4, "cost_ha": 350000},
    "BlackPepper": {"min_m": 0.7, "max_m": 1.0, "min_t": 0.6, "max_t": 0.9, "base_yield": 1.8, "cost_ha": 250000},
    "Coriander": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.4, "max_t": 0.7, "base_yield": 1.2, "cost_ha": 35000},
    "Cumin": {"min_m": 0.2, "max_m": 0.5, "min_t": 0.5, "max_t": 0.8, "base_yield": 0.7, "cost_ha": 42000},
    "Rubber": {"min_m": 0.7, "max_m": 1.0, "min_t": 0.7, "max_t": 0.9, "base_yield": 1.2, "cost_ha": 160000},
    "Cashew": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.7, "max_t": 1.0, "base_yield": 0.9, "cost_ha": 110000},
    "Arecanut": {"min_m": 0.6, "max_m": 0.9, "min_t": 0.6, "max_t": 0.9, "base_yield": 2.2, "cost_ha": 140000},
    "Cinnamon": {"min_m": 0.7, "max_m": 1.0, "min_t": 0.7, "max_t": 0.9, "base_yield": 1.2, "cost_ha": 180000},
    "Clove": {"min_m": 0.7, "max_m": 1.0, "min_t": 0.7, "max_t": 0.9, "base_yield": 0.4, "cost_ha": 250000},
    "Nutmeg": {"min_m": 0.7, "max_m": 1.0, "min_t": 0.7, "max_t": 0.9, "base_yield": 0.7, "cost_ha": 220000},
    "Saffron": {"min_m": 0.1, "max_m": 0.4, "min_t": 0.1, "max_t": 0.4, "base_yield": 0.002, "cost_ha": 600000},
    "Walnut": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.2, "max_t": 0.5, "base_yield": 2.2, "cost_ha": 150000},
    "Almond": {"min_m": 0.3, "max_m": 0.6, "min_t": 0.3, "max_t": 0.7, "base_yield": 1.2, "cost_ha": 180000},
    "Peach": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.2, "max_t": 0.5, "base_yield": 12.0, "cost_ha": 95000},
    "Pear": {"min_m": 0.5, "max_m": 0.8, "min_t": 0.2, "max_t": 0.5, "base_yield": 15.0, "cost_ha": 110000},
    "Plum": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.2, "max_t": 0.5, "base_yield": 12.0, "cost_ha": 85000},
    "Strawberry": {"min_m": 0.6, "max_m": 0.9, "min_t": 0.3, "max_t": 0.6, "base_yield": 8.0, "cost_ha": 200000},
    "Peas": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.3, "max_t": 0.6, "base_yield": 6.0, "cost_ha": 45000},
    "SweetPotato": {"min_m": 0.4, "max_m": 0.7, "min_t": 0.6, "max_t": 0.9, "base_yield": 18.0, "cost_ha": 55000},
    "Drumstick": {"min_m": 0.2, "max_m": 0.5, "min_t": 0.7, "max_t": 1.0, "base_yield": 12.0, "cost_ha": 35000},
}

CROPS = list(CROPS_DB.keys())

class CropYieldModel(nn.Module):
    def __init__(self, input_dim=5, hidden=256, num_crops=len(CROPS)):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden),
            nn.ReLU(),
            nn.BatchNorm1d(hidden),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden, num_crops)
        )
    
    def forward(self, x):
        return self.net(x)
