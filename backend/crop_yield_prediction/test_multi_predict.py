import requests
import json
import random

url = "http://localhost:8000/api/crop-yield/predict"
soil_types = ["Alluvial", "Black", "Red", "Laterite", "Desert", "Montane"]

for i in range(3):
    payload = {
        "ndvi": random.random(),
        "moisture": random.random(),
        "nitrogen": random.random(),
        "temp": random.random(),
        "rainfall": random.random(),
        "soil_type": random.choice(soil_types)
    }
    print(f"\nTest {i+1} with payload: {payload}")
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Top 1 Crop: {data['top_3_crops'][0]['crop'] if data['top_3_crops'] else 'NONE'}")
            print(f"Total analysis count: {len(data['raw_analysis'])}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Failed: {e}")
