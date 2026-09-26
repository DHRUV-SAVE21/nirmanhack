import torch
import numpy as np
import os
import asyncio
import hashlib

try:
    from crop_model import CropYieldModel, CROPS, CROPS_DB
except (ImportError, ValueError):
    from .crop_model import CropYieldModel, CROPS, CROPS_DB

SOIL_CROP_MAP = {
    "Alluvial": ["Wheat", "Rice", "Maize", "Sugarcane", "Soybean", "Barley", "Potato", "Tomato", "Onion", "Garlic", "Cabbage", "Cauliflower", "Brinjal", "Carrot", "Spinach", "Okra", "Chili", "Pumpkin", "Cucumber", "Mustard", "Sunflower", "Sesame", "Linseed", "Coriander", "Cumin"],
    "Black": ["Cotton", "Wheat", "Sugarcane", "Sorghum", "Millet", "Groundnut", "Sunflower", "Castor", "Tobacco", "Chickpea", "PigeonPeas", "MungBean", "BlackGram", "Turmeric", "Ginger", "Chili", "Onion", "Garlic"],
    "Red": ["Rice", "Wheat", "Sugarcane", "Cotton", "Millet", "Potato", "Groundnut", "Castor", "Tobacco", "Mango", "Papaya", "Watermelon", "Tomato", "Brinjal", "Chili", "Turmeric", "Ginger", "Coffee", "Tea"],
    "Laterite": ["Rice", "Sugarcane", "Tea", "Coffee", "Mango", "Banana", "Coconut", "Pineapple", "BlackPepper", "Cardamom", "Rubber", "Cashew", "Arecanut", "Cinnamon", "Clove", "Nutmeg"],
    "Desert": ["Millet", "Sorghum", "Barley", "Mustard", "Sesame", "Cumin", "Coriander", "Watermelon", "Onion", "Drumstick"],
    "Montane": ["Wheat", "Barley", "Potato", "Apple", "Pear", "Peach", "Plum", "Walnut", "Almond", "Saffron", "Strawberry", "Peas"]
}

CROP_NAME_MAPPING = {
    "Rice": "Paddy(Dhan)", "Wheat": "Wheat", "Maize": "Maize",
    "Soybean": "Soyabean", "Cotton": "Cotton", "Sugarcane": "Sugarcane",
    "Groundnut": "Groundnut", "Mustard": "Mustard", "Chickpea": "Gram(Gram)",
    "PigeonPeas": "Arhar (Tur/Red Gram)", "MungBean": "Moong(Green Gram)",
    "Lentil": "Masur Dal", "BlackGram": "Urad Dal", "Tomato": "Tomato",
    "Potato": "Potato", "Onion": "Onion", "Garlic": "Garlic",
    "Ginger": "Ginger(Fresh)", "Turmeric": "Turmeric", "Mango": "Mango",
    "Banana": "Banana", "Orange": "Orange", "Apple": "Apple", "Grapes": "Grapes"
}

def _get_mandi_fallback_price(crop_name):
    """Deterministic fallback Mandi price based on crop name."""
    seed = int(hashlib.md5(crop_name.encode()).hexdigest(), 16) % 1000
    if crop_name in ["Sugarcane"]: 
        return 300 + (seed % 50)
    elif crop_name in ["Wheat", "Rice", "Maize", "Barley", "Ragi", "Millet"]: 
        return 2000 + (seed % 600)
    elif crop_name in ["Turmeric", "Ginger", "Cardamom", "BlackPepper", "Clove", "Saffron"]: 
        return 8000 + (seed % 10000)
    elif crop_name in ["Soybean", "Groundnut", "Sunflower", "Mustard"]: 
        return 5000 + (seed % 1500)
    elif crop_name in ["Mango", "Banana", "Apple", "Grapes", "Orange", "Papaya"]: 
        return 3000 + (seed % 2000)
    else: 
        return 2500 + (seed % 2000)

async def predict_top_crops(ndvi, moisture, nitrogen, temp, rainfall, soil_type, state="Maharashtra"):
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    model_path = os.path.join(models_dir, 'crop_yield_model.pth')
    
    try:
        model = CropYieldModel()
        model.load_state_dict(torch.load(model_path, map_location='cpu', weights_only=True))
        model.eval()
    except Exception as e:
        return {"error": f"Crop model not trained yet. Run 'python train_yield.py' first!"}
        
    x = torch.tensor([[ndvi, moisture, nitrogen, temp, rainfall]], dtype=torch.float32)
    with torch.no_grad():
        preds = model(x).flatten().numpy()
        
    valid_crops = SOIL_CROP_MAP.get(soil_type, CROPS)
    
    results = []
    try:
        from services.mandi_service import MandiService
        from_mandi = True
    except ImportError:
        from_mandi = False

    for i, crop in enumerate(CROPS):
        yld = round(float(preds[i]), 2)
        if crop in valid_crops and yld > 0.1:
            results.append({
                "crop": crop,
                "yield_tons_ha": yld
            })

    # Enrich ALL valid crops with pricing (needed for ROI sorting)
    for item in results:
        crop_name = item["crop"]
        harvest_yield = item["yield_tons_ha"]
        cost_of_cultivation = CROPS_DB[crop_name]["cost_ha"]
        
        mandi_price = None
        if from_mandi:
            try:
                api_crop_name = CROP_NAME_MAPPING.get(crop_name, crop_name)
                mandi_price = await MandiService.get_price_for_crop(api_crop_name, state)
            except Exception:
                pass
                
        if not mandi_price:
            mandi_price = _get_mandi_fallback_price(crop_name)
            
        mandi_price = float(mandi_price)
        revenue = harvest_yield * 10 * mandi_price
        profit = revenue - cost_of_cultivation
        profit_margin = (profit / cost_of_cultivation) * 100 if cost_of_cultivation > 0 else 0
        profit_margin = min(profit_margin, 100.0)
        
        item["mandi_price_quintal"] = round(mandi_price, 2)
        item["revenue_ha"] = round(revenue, 2)
        item["cost_ha"] = round(cost_of_cultivation, 2)
        item["profit_ha"] = round(profit, 2)
        item["profit_margin_pct"] = round(profit_margin, 2)

    # Sort by ROI (profit margin) descending
    results.sort(key=lambda x: x.get("profit_margin_pct", 0), reverse=True)
    # Only recommend profitable crops (ROI >= 0)
    profitable = [r for r in results if r.get("profit_margin_pct", 0) >= 0]
    top_3 = profitable[:3]

    return {
        "top_3_crops": top_3,
        "raw_analysis": results
    }

if __name__ == "__main__":
    import asyncio
    test_state = (0.2, 0.1, 0.4, 0.9, 0.05) 
    result = asyncio.run(predict_top_crops(*test_state, soil_type="Desert"))
    print("DROUGHT ON DESERT PREDICTION RESULTS:")
    print(result)
