
import os
import sys
import logging

# Setup logging to print to console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add parent directory to path to allow imports if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

print("="*50)
print("DEBUG: Testing CropRecommender Initialization")
print("="*50)

try:
    # Import the class
    from pipeline import CropRecommender
    
    # Define paths exactly as they are in pipeline.py
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(current_dir, "crop_recommendation_models")
    dataset_path = os.path.join(current_dir, "enhanced_agriculture_dataset.csv")
    
    print(f"Current Dir: {current_dir}")
    print(f"Model Dir: {model_dir}")
    print(f"Dataset Path: {dataset_path}")
    
    # Check if files exist
    print(f"Model Dir Exists: {os.path.exists(model_dir)}")
    if os.path.exists(model_dir):
        print(f"Contents of Model Dir: {os.listdir(model_dir)}")
    
    print(f"Dataset Exists: {os.path.exists(dataset_path)}")
    
    # Attempt initialization
    print("\nAttempting to initialize CropRecommender...")
    recommender = CropRecommender(model_dir, dataset_path)
    
    if recommender.initialized:
        print("\n SUCCESS: Recommender initialized successfully!")
    else:
        print("\n FAILED: Recommender not initialized (unknown reason).")

except ImportError as e:
    print(f"\n IMPORT ERROR: {e}")
except Exception as e:
    print(f"\n RUNTIME ERROR: {e}")
    import traceback
    traceback.print_exc()
