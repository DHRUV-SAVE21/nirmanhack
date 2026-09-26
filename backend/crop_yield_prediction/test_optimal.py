import asyncio
from inference import predict_top_crops

async def test_optimal():
    print("Testing Optimal Alluvial for Rice/Wheat...")
    res = await predict_top_crops(ndvi=0.9, moisture=0.8, nitrogen=0.9, temp=0.5, rainfall=0.8, soil_type="Alluvial")
    for crop in res['top_3_crops']:
        print(f"Crop: {crop['crop']} | Yield: {crop['yield_tons_ha']} | ROI: {crop['profit_margin_pct']}% | Net: {crop['profit_ha']}")

if __name__ == "__main__":
    asyncio.run(test_optimal())
