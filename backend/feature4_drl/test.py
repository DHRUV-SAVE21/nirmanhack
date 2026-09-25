# ============================
# CROP RECOMMENDATION TESTING FILE
# Uses saved pickle models
# ============================

import pandas as pd
import numpy as np
import pickle
import os
import json

print("="*80)
print("CROP RECOMMENDATION TESTER")
print("="*80)

# ============================
# 1. LOAD SAVED MODELS
# ============================
MODEL_DIR = "crop_recommendation_models"

print("\n Loading saved models...")

try:
    # Load all saved components
    with open(os.path.join(MODEL_DIR, "yield_model.pkl"), "rb") as f:
        yield_model = pickle.load(f)
    
    with open(os.path.join(MODEL_DIR, "risk_model.pkl"), "rb") as f:
        risk_model = pickle.load(f)
    
    with open(os.path.join(MODEL_DIR, "label_encoders.pkl"), "rb") as f:
        label_encoders = pickle.load(f)
    
    with open(os.path.join(MODEL_DIR, "system_metadata.pkl"), "rb") as f:
        metadata = pickle.load(f)
    
    # Load dataset
    df = pd.read_csv('enhanced_agriculture_dataset.csv')
    
    print(" All models loaded successfully!")
    print(f" Dataset: {len(df)} samples")
    print(f" Available crops: {len(label_encoders['crop_name'].classes_)}")
    print(f" Yield Model R²: {metadata['model_performance']['yield_model']['r2']:.4f}")
    print(f"  Risk Model R²: {metadata['model_performance']['risk_model']['r2']:.4f}")
    
except Exception as e:
    print(f" Error loading models: {e}")
    print("Please run the main script first to generate models.")
    exit()

# ============================
# 2. DEFINE RECOMMENDER CLASS
# ============================
class CropRecommender:
    """Crop recommendation system"""
    
    def __init__(self, yield_model, risk_model, label_encoders, all_features, df_original):
        self.yield_model = yield_model
        self.risk_model = risk_model
        self.label_encoders = label_encoders
        self.all_features = all_features
        self.df_original = df_original
        self.available_crops = label_encoders['crop_name'].classes_
        self.crop_info = self._extract_crop_info()
    
    def _extract_crop_info(self):
        """Extract information about each crop from the dataset"""
        crop_info = {}
        for crop in self.available_crops:
            crop_data = self.df_original[self.df_original['crop_name'] == crop]
            if len(crop_data) > 0:
                crop_info[crop] = {
                    'avg_yield': crop_data['yield_tonnes_per_hectare'].mean(),
                    'avg_risk': crop_data['risk_score'].mean(),
                    'avg_duration': crop_data['crop_duration_days'].mean(),
                    'water_req': crop_data['crop_water_requirement'].iloc[0]
                }
        return crop_info
    
    def prepare_input(self, input_data):
        """Prepare input data for model prediction"""
        prepared_data = input_data.copy()
        
        # Encode categorical variables
        for col in ['district', 'state', 'soil_type', 'climate_season',
                   'previous_crop', 'crop_name', 'crop_water_requirement']:
            if col in prepared_data:
                try:
                    prepared_data[col + '_encoded'] = self.label_encoders[col].transform([prepared_data[col]])[0]
                except ValueError:
                    # Use most common value if not seen during training
                    prepared_data[col + '_encoded'] = 0
        
        # Create feature vector
        feature_vector = {}
        for feature in self.all_features:
            if feature in prepared_data:
                feature_vector[feature] = prepared_data[feature]
            elif feature.replace('_encoded', '') in prepared_data:
                orig_col = feature.replace('_encoded', '')
                feature_vector[feature] = prepared_data.get(orig_col + '_encoded', 0)
            else:
                # Use median from dataset
                feature_vector[feature] = self.df_original[feature].median() if feature in self.df_original.columns else 0
        
        return pd.DataFrame([feature_vector])[self.all_features]
    
    def predict_single_crop(self, environmental_data, crop_name):
        """Predict yield and risk for a specific crop"""
        input_data = environmental_data.copy()
        input_data['crop_name'] = crop_name
        
        # Add water requirement if not provided
        if 'crop_water_requirement' not in input_data:
            if crop_name in self.crop_info:
                input_data['crop_water_requirement'] = self.crop_info[crop_name]['water_req']
            else:
                input_data['crop_water_requirement'] = 'Medium'
        
        X_input = self.prepare_input(input_data)
        
        predicted_yield = self.yield_model.predict(X_input)[0]
        predicted_risk = self.risk_model.predict(X_input)[0]
        
        return predicted_yield, predicted_risk
    
    def get_top_recommendations(self, environmental_data, top_n=3):
        """Get top crop recommendations with yield percentage and risk score"""
        recommendations = []
        
        for crop in self.available_crops:
            try:
                yield_pred, risk_pred = self.predict_single_crop(environmental_data, crop)
                
                # Calculate yield percentage compared to average
                avg_yield = self.crop_info[crop]['avg_yield'] if crop in self.crop_info else yield_pred
                if avg_yield > 0:
                    yield_pct = (yield_pred / avg_yield) * 100
                else:
                    yield_pct = 100
                
                # Determine risk level
                if risk_pred < 0.3:
                    risk_level = " Low"
                elif risk_pred < 0.5:
                    risk_level = " Medium"
                elif risk_pred < 0.7:
                    risk_level = " High"
                else:
                    risk_level = " Very High"
                
                # Calculate recommendation score (higher is better)
                score = yield_pred * (1 - risk_pred)
                
                recommendations.append({
                    'Crop': crop,
                    'Predicted Yield': yield_pred,
                    'Yield %': yield_pct,
                    'Predicted Risk': risk_pred,
                    'Risk Level': risk_level,
                    'Score': score
                })
            except Exception as e:
                continue
        
        # Sort by score (higher is better)
        recommendations.sort(key=lambda x: x['Score'], reverse=True)
        
        # Format output for top N
        top_recommendations = []
        for i, rec in enumerate(recommendations[:top_n], 1):
            top_recommendations.append({
                'Rank': i,
                'Crop': rec['Crop'],
                'Yield': f"{rec['Predicted Yield']:.1f} t/ha",
                'Yield %': f"{rec['Yield %']:.0f}%",
                'Risk': f"{rec['Predicted Risk']:.2f}",
                'Risk Level': rec['Risk Level']
            })
        
        return pd.DataFrame(top_recommendations)

# Initialize recommender
recommender = CropRecommender(
    yield_model, 
    risk_model, 
    label_encoders, 
    metadata['all_features'], 
    df
)

print("\n Recommendation system initialized!")

# ============================
# 3. TEST WITH SAMPLE DATA
# ============================
print("\n" + "="*80)
print("TESTING WITH SAMPLE DATA")
print("="*80)

# Sample test cases
test_cases = [
    {
        'name': "Case 1: Ideal Farming Conditions",
        'conditions': {
            'soil_n': 65,
            'soil_p': 45,
            'soil_k': 55,
            'soil_ph': 6.8,
            'soil_moisture': 60,
            'humidity': 65,
            'avg_temperature': 25,
            'seasonal_rainfall': 900,
            'crop_duration_days': 120,
            'district': 'Ludhiana',
            'state': 'Punjab',
            'soil_type': 'Alluvial',
            'climate_season': 'Rabi',
            'previous_crop': 'Rice',
            'crop_water_requirement': 'Medium'
        }
    },
    {
        'name': "Case 2: Dry Region with Limited Water",
        'conditions': {
            'soil_n': 35,
            'soil_p': 25,
            'soil_k': 30,
            'soil_ph': 7.5,
            'soil_moisture': 30,
            'humidity': 45,
            'avg_temperature': 32,
            'seasonal_rainfall': 400,
            'crop_duration_days': 90,
            'district': 'Jodhpur',
            'state': 'Rajasthan',
            'soil_type': 'Sandy',
            'climate_season': 'Zaid',
            'previous_crop': 'Groundnut',
            'crop_water_requirement': 'Low'
        }
    },
    {
        'name': "Case 3: High Rainfall Area",
        'conditions': {
            'soil_n': 55,
            'soil_p': 40,
            'soil_k': 45,
            'soil_ph': 6.5,
            'soil_moisture': 75,
            'humidity': 85,
            'avg_temperature': 28,
            'seasonal_rainfall': 1200,
            'crop_duration_days': 150,
            'district': 'Kochi',
            'state': 'Kerala',
            'soil_type': 'Laterite',
            'climate_season': 'Kharif',
            'previous_crop': 'Fallow',
            'crop_water_requirement': 'High'
        }
    }
]

# Test each case
for i, test_case in enumerate(test_cases, 1):
    print(f"\n{'='*60}")
    print(f"TEST {i}: {test_case['name']}")
    print(f"{'='*60}")
    
    conditions = test_case['conditions']
    
    print("\n Environmental Conditions:")
    print("-" * 40)
    for key, value in conditions.items():
        if key in ['soil_n', 'soil_p', 'soil_k']:
            print(f"{key:20s}: {value:>5} kg/ha")
        elif key == 'soil_ph':
            print(f"{key:20s}: {value:>5}")
        elif key == 'seasonal_rainfall':
            print(f"{key:20s}: {value:>5} mm")
        elif key == 'avg_temperature':
            print(f"{key:20s}: {value:>5}°C")
        elif 'moisture' in key or key == 'humidity':
            print(f"{key:20s}: {value:>5}%")
        elif key == 'crop_duration_days':
            print(f"{key:20s}: {value:>5} days")
        else:
            print(f"{key:20s}: {value}")
    
    # Get recommendations
    recommendations = recommender.get_top_recommendations(conditions, top_n=3)
    
    print(f"\n TOP 3 RECOMMENDED CROPS:")
    print("="*70)
    print(recommendations.to_string(index=False))
    print("="*70)
    
    # Show details for top crop
    top_crop = recommendations.iloc[0]['Crop']
    print(f"\n DETAILS FOR TOP CROP ({top_crop}):")
    print("-" * 40)
    
    if top_crop in recommender.crop_info:
        info = recommender.crop_info[top_crop]
        print(f"Average Yield in Database: {info['avg_yield']:.1f} t/ha")
        print(f"Average Risk in Database: {info['avg_risk']:.3f}")
        print(f"Typical Duration: {info['avg_duration']:.0f} days")
        print(f"Water Requirement: {info['water_req']}")

# ============================
# 4. TEST SPECIFIC CROP PREDICTIONS
# ============================
print("\n" + "="*80)
print("INDIVIDUAL CROP PREDICTIONS")
print("="*80)

# Test specific crops with standard conditions
standard_conditions = {
    'soil_n': 50,
    'soil_p': 35,
    'soil_k': 40,
    'soil_ph': 6.5,
    'soil_moisture': 55,
    'humidity': 65,
    'avg_temperature': 28,
    'seasonal_rainfall': 850,
    'crop_duration_days': 120,
    'district': 'Sample',
    'state': 'Sample',
    'soil_type': 'Alluvial',
    'climate_season': 'Kharif',
    'previous_crop': 'Rice',
    'crop_water_requirement': 'Medium'
}

crops_to_test = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane']

print(f"\n Predicting yields for specific crops:")
print("-" * 60)
print(f"{'Crop':<12} {'Yield (t/ha)':<15} {'Risk':<10} {'Yield %':<10}")
print("-" * 60)

for crop in crops_to_test:
    try:
        yield_pred, risk_pred = recommender.predict_single_crop(standard_conditions, crop)
        
        # Get average yield for comparison
        if crop in recommender.crop_info:
            avg_yield = recommender.crop_info[crop]['avg_yield']
            yield_pct = (yield_pred / avg_yield) * 100 if avg_yield > 0 else 100
        else:
            yield_pct = 100
        
        print(f"{crop:<12} {yield_pred:<15.2f} {risk_pred:<10.3f} {yield_pct:<10.0f}%")
    except Exception as e:
        print(f"{crop:<12} Error: {str(e)[:30]}")

print("-" * 60)

# ============================
# 5. BATCH PREDICTION FROM CSV FILE
# ============================
print("\n" + "="*80)
print("BATCH PREDICTION FROM CSV")
print("="*80)

# Create a sample CSV file for batch prediction
sample_batch_data = [
    {
        'id': 1,
        'soil_n': 60, 'soil_p': 45, 'soil_k': 50, 'soil_ph': 6.8,
        'soil_moisture': 60, 'humidity': 70, 'avg_temperature': 26,
        'seasonal_rainfall': 900, 'crop_duration_days': 120,
        'district': 'Ludhiana', 'state': 'Punjab', 'soil_type': 'Alluvial',
        'climate_season': 'Rabi', 'previous_crop': 'Rice',
        'crop_water_requirement': 'Medium'
    },
    {
        'id': 2,
        'soil_n': 40, 'soil_p': 30, 'soil_k': 35, 'soil_ph': 7.2,
        'soil_moisture': 40, 'humidity': 50, 'avg_temperature': 30,
        'seasonal_rainfall': 600, 'crop_duration_days': 100,
        'district': 'Bengaluru', 'state': 'Karnataka', 'soil_type': 'Red',
        'climate_season': 'Kharif', 'previous_crop': 'Fallow',
        'crop_water_requirement': 'Medium'
    },
    {
        'id': 3,
        'soil_n': 30, 'soil_p': 20, 'soil_k': 25, 'soil_ph': 8.0,
        'soil_moisture': 30, 'humidity': 40, 'avg_temperature': 34,
        'seasonal_rainfall': 350, 'crop_duration_days': 90,
        'district': 'Jodhpur', 'state': 'Rajasthan', 'soil_type': 'Sandy',
        'climate_season': 'Zaid', 'previous_crop': 'Groundnut',
        'crop_water_requirement': 'Low'
    }
]

# Save to CSV
batch_csv_path = 'batch_test_data.csv'
batch_df = pd.DataFrame(sample_batch_data)
batch_df.to_csv(batch_csv_path, index=False)
print(f" Sample batch data saved to: {batch_csv_path}")

# Load and process batch data
print(f"\n Processing batch predictions...")
batch_results = []

for idx, row in batch_df.iterrows():
    conditions = row.to_dict()
    record_id = conditions.pop('id')
    
    try:
        # Get top 2 recommendations for each record
        recommendations = recommender.get_top_recommendations(conditions, top_n=2)
        
        # Add to results
        for _, rec in recommendations.iterrows():
            batch_results.append({
                'ID': record_id,
                'Rank': rec['Rank'],
                'Recommended Crop': rec['Crop'],
                'Yield': rec['Yield'],
                'Yield %': rec['Yield %'],
                'Risk': rec['Risk'],
                'Risk Level': rec['Risk Level']
            })
    except Exception as e:
        batch_results.append({
            'ID': record_id,
            'Rank': 'Error',
            'Recommended Crop': f'Error: {str(e)[:30]}',
            'Yield': 'N/A',
            'Yield %': 'N/A',
            'Risk': 'N/A',
            'Risk Level': 'N/A'
        })

# Convert to DataFrame and display
batch_results_df = pd.DataFrame(batch_results)
print(f"\n BATCH PREDICTION RESULTS:")
print("="*80)
print(batch_results_df.to_string(index=False))
print("="*80)

# ============================
# 6. INTERACTIVE MODE
# ============================
print("\n" + "="*80)
print("INTERACTIVE TESTING MODE")
print("="*80)

def get_user_input():
    """Get environmental conditions from user"""
    print("\n Enter environmental conditions (press Enter for defaults):")
    
    conditions = {}
    
    # Soil parameters
    conditions['soil_n'] = float(input("Soil Nitrogen (kg/ha) [50]: ") or 50)
    conditions['soil_p'] = float(input("Soil Phosphorus (kg/ha) [35]: ") or 35)
    conditions['soil_k'] = float(input("Soil Potassium (kg/ha) [40]: ") or 40)
    conditions['soil_ph'] = float(input("Soil pH [6.5]: ") or 6.5)
    conditions['soil_moisture'] = float(input("Soil Moisture (%) [55]: ") or 55)
    
    # Climate parameters
    conditions['avg_temperature'] = float(input("Average Temperature (°C) [28]: ") or 28)
    conditions['seasonal_rainfall'] = float(input("Seasonal Rainfall (mm) [850]: ") or 850)
    conditions['humidity'] = float(input("Humidity (%) [65]: ") or 65)
    
    # Crop parameters
    conditions['crop_duration_days'] = float(input("Crop Duration (days) [120]: ") or 120)
    
    # Optional parameters
    print("\n Optional Parameters:")
    conditions['district'] = input("District [Sample]: ") or 'Sample'
    conditions['state'] = input("State [Sample]: ") or 'Sample'
    conditions['soil_type'] = input("Soil Type [Alluvial]: ") or 'Alluvial'
    conditions['climate_season'] = input("Season [Kharif]: ") or 'Kharif'
    conditions['previous_crop'] = input("Previous Crop [Rice]: ") or 'Rice'
    conditions['crop_water_requirement'] = input("Water Requirement [Medium]: ") or 'Medium'
    
    return conditions

# Ask user if they want to test
user_choice = input("\nDo you want to test with custom conditions? (y/n): ").lower()

if user_choice == 'y':
    user_conditions = get_user_input()
    
    print("\n" + "="*80)
    print("YOUR CROP RECOMMENDATIONS")
    print("="*80)
    
    # Get recommendations
    recommendations = recommender.get_top_recommendations(user_conditions, top_n=3)
    
    print(f"\n TOP 3 RECOMMENDED CROPS:")
    print("="*70)
    print(recommendations.to_string(index=False))
    print("="*70)
    
    # Also test specific crop if user wants
    test_specific = input("\nTest a specific crop? (enter crop name or press Enter to skip): ").strip()
    
    if test_specific:
        try:
            if test_specific in recommender.available_crops:
                yield_pred, risk_pred = recommender.predict_single_crop(user_conditions, test_specific)
                
                print(f"\n PREDICTION FOR {test_specific.upper()}:")
                print("-" * 40)
                print(f"Predicted Yield: {yield_pred:.2f} tonnes/hectare")
                print(f"Predicted Risk: {risk_pred:.3f}")
                
                if test_specific in recommender.crop_info:
                    info = recommender.crop_info[test_specific]
                    yield_pct = (yield_pred / info['avg_yield']) * 100 if info['avg_yield'] > 0 else 100
                    print(f"Compared to average: {yield_pct:.0f}%")
                    print(f"Water Requirement: {info['water_req']}")
            else:
                print(f" Crop '{test_specific}' not in available crops.")
                print(f"Available crops: {', '.join(recommender.available_crops[:10])}...")
        except Exception as e:
            print(f" Error predicting for {test_specific}: {e}")

# ============================
# 7. SYSTEM STATISTICS
# ============================
print("\n" + "="*80)
print("SYSTEM STATISTICS")
print("="*80)

print(f"\n DATABASE STATISTICS:")
print(f"   Total samples: {len(df):,}")
print(f"   Unique crops: {df['crop_name'].nunique()}")
print(f"   States covered: {df['state'].nunique()}")
print(f"   Soil types: {df['soil_type'].nunique()}")

print(f"\n MODEL PERFORMANCE:")
print(f"   Yield Model R²: {metadata['model_performance']['yield_model']['r2']:.4f}")
print(f"   Yield Model MAE: {metadata['model_performance']['yield_model']['mae']:.4f} t/ha")
print(f"   Risk Model R²: {metadata['model_performance']['risk_model']['r2']:.4f}")
print(f"   Risk Model MAE: {metadata['model_performance']['risk_model']['mae']:.4f}")

print(f"\n AVAILABLE CROPS ({len(recommender.available_crops)}):")
crops_per_line = 5
for i in range(0, len(recommender.available_crops), crops_per_line):
    crop_line = recommender.available_crops[i:i+crops_per_line]
    print(f"   {', '.join(crop_line)}")

print(f"\n LOADED FROM:")
print(f"   Models: {MODEL_DIR}/")
print(f"   Dataset: enhanced_agriculture_dataset.csv")

print(f"\n TESTING COMPLETE!")
print("="*80)
