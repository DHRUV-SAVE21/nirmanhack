# pip install pandas numpy requests tqdm geopy

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from geopy.geocoders import Nominatim
import os
from dotenv import load_dotenv
load_dotenv()
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
def get_lat_lon(location_name):
    try:
        geolocator = Nominatim(user_agent="farm_ai_engine")
        loc = geolocator.geocode(location_name, timeout=10)
        return loc.latitude, loc.longitude
    except:
        return 23.5, 78.5
def fetch_nasa_weather(lat, lon):
    try:
        url = (
            "https://power.larc.nasa.gov/api/temporal/daily/point"
            f"?parameters=PRECTOTCORR,T2M_MAX,T2M_MIN,RH2M,WS2M"
            f"&community=AG&longitude={lon}&latitude={lat}"
            f"&start=20230101&end=20231231&format=JSON"
        )
        r = requests.get(url, timeout=30)
        data = r.json()["properties"]["parameter"]
        rainfall = np.mean(list(data["PRECTOTCORR"].values()))
        tmax = np.mean(list(data["T2M_MAX"].values()))
        tmin = np.mean(list(data["T2M_MIN"].values()))
        humidity = np.mean(list(data["RH2M"].values()))
        wind = np.mean(list(data["WS2M"].values()))
        return rainfall, tmax, tmin, humidity, wind
    except:
        return 50, 32, 22, 65, 3
def fetch_forecast(lat, lon):
    try:
        url = (
            f"https://api.openweathermap.org/data/2.5/forecast"
            f"?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        )
        r = requests.get(url, timeout=30)
        data = r.json()["list"][:8]
        rain_vals = []
        tmax_vals = []
        tmin_vals = []
        for d in data:
            tmax_vals.append(d["main"]["temp_max"])
            tmin_vals.append(d["main"]["temp_min"])
            rain_vals.append(d.get("rain", {}).get("3h", 0))
        return np.mean(rain_vals), np.mean(tmax_vals), np.mean(tmin_vals)
    except:
        return 10, 30, 22
def fetch_soil(lat, lon):
    try:
        url = (
            "https://rest.isric.org/soilgrids/v2.0/properties/query"
            f"?lon={lon}&lat={lat}"
            "&property=phh2o&property=ocd&property=nitrogen"
            "&depth=0-5cm&value=mean"
        )
        r = requests.get(url, timeout=30)
        layers = r.json()["properties"]["layers"]

        soil_ph = layers[0]["depths"][0]["values"]["mean"] / 10
        organic_carbon = layers[1]["depths"][0]["values"]["mean"] / 100
        nitrogen = layers[2]["depths"][0]["values"]["mean"]

        phosphorus = nitrogen * 0.5
        potassium = nitrogen * 0.7
        return nitrogen, phosphorus, potassium, soil_ph, organic_carbon
    except:
        return 250, 120, 150, 6.5, 0.7
def engineer_features(rainfall, tmax, soil_ph, oc, N, P, K):
    rolling7 = rainfall * 0.8
    rolling30 = rainfall * 3
    heat_days = max(0, int((tmax - 34)))
    gdd = max(200, (tmax + 10) * 30)
    rain_anom = rainfall - 50
    spi = (rainfall - 60) / 20
    npk_ratio = (N + P + K) / 300
    fertility = np.clip((oc + (7.5 - abs(soil_ph - 7))) / 3, 0, 1)
    drought = int(spi < -1)
    flood = int(rainfall > 200)
    return (
        rolling7, rolling30, heat_days, gdd,
        rain_anom, spi, npk_ratio, fertility,
        drought, flood
    )
def main():
    location_name = input("Enter farm location (village/city/state): ")
    crop = input("Enter current crop: ").lower().strip()
    prev_crop = input("Enter previous crop: ").lower().strip()
    lat, lon = get_lat_lon(location_name)
    rain, tmax, tmin, hum, wind = fetch_nasa_weather(lat, lon)
    frain, ftmax, ftmin = fetch_forecast(lat, lon)
    N, P, K, ph, oc = fetch_soil(lat, lon)
    (
        roll7, roll30, heat_days, gdd,
        rain_anom, spi, npk_ratio, fertility,
        drought, flood
    ) = engineer_features(rain, tmax, ph, oc, N, P, K)
    farm_id = int(datetime.now().timestamp())
    row = {
        "farm_id": farm_id,
        "date": datetime.today().strftime("%Y-%m-%d"),
        "location_lat": lat,
        "location_lon": lon,
        "crop_name": crop,
        "previous_crop": prev_crop,
        "sowing_date": datetime.today().strftime("%Y-%m-%d"),
        "harvest_date": (datetime.today() + timedelta(days=120)).strftime("%Y-%m-%d"),
        "yield_ton_per_acre": 0,  
        "area_acre": 2.5,
        "season": "kharif",
        "month": datetime.today().month,
        "rainfall_mm": rain,
        "temp_max_c": tmax,
        "temp_min_c": tmin,
        "humidity_pct": hum,
        "wind_speed_mps": wind,
        "forecast_rainfall_mm_7d": frain,
        "forecast_temp_max_c_7d": ftmax,
        "forecast_temp_min_c_7d": ftmin,
        "rolling_rain_7d": roll7,
        "rolling_rain_30d": roll30,
        "heat_stress_days_30d": heat_days,
        "growing_degree_days": gdd,
        "rainfall_anomaly": rain_anom,
        "spi_index": spi,
        "nitrogen": N,
        "phosphorus": P,
        "potassium": K,
        "soil_ph": ph,
        "organic_carbon": oc,
        "npk_ratio": npk_ratio,
        "soil_fertility_score": fertility,
        "monocrop_count": 1,
        "drought_risk_label": drought,
        "flood_risk_label": flood,
    }
    df = pd.DataFrame([row])
    df = df.fillna(method="ffill").fillna(method="bfill").fillna(0)
    df.to_csv("real_time_farm_dataset.csv", index=False)
if __name__ == "__main__":
    main()