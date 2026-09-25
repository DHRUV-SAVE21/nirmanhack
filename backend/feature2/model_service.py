import os
# Suppress TensorFlow info/warning messages (must be set before importing TF)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress all logs except errors
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN custom operations

import numpy as np
import io
from PIL import Image

# Global Variables
_interpreter = None
_input_details = None
_output_details = None

# Plant disease classes (Reference from User)
CLASS_NAMES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_", "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy",
]

def load_model():
    global _interpreter, _input_details, _output_details
    # Look for the .tflite file in the current directory (backend/feature2/)
    model_path = os.path.join(os.path.dirname(__file__), "ensemble_model.tflite")
    
    if os.path.exists(model_path):
        try:
            # Try tflite_runtime first (lightweight), fallback to tensorflow
            try:
                import tflite_runtime.interpreter as tflite
                print(f"[RETRY] Loading TFLite model from {model_path}...")
                _interpreter = tflite.Interpreter(model_path=model_path)
            except ImportError:
                import tensorflow as tf
                print(f" Loading TFLite model (tensorflow) from {model_path}...")
                _interpreter = tf.lite.Interpreter(model_path=model_path)
            
            _interpreter.allocate_tensors()
            
            _input_details = _interpreter.get_input_details()
            _output_details = _interpreter.get_output_details()
            
            print("[OK] TFLite model loaded successfully.")
        except ImportError:
            print("[WARN] TensorFlow/TFLite not installed. Using Mock Model.")
        except Exception as e:
            print(f"[ERROR] Failed to load model: {e}")
    else:
        print(f"[WARN] Model file not found at {model_path}. Using Mock Prediction.")

def format_class_name(class_name):
    """Format class name for display (e.g. 'Tomato___Bacterial_spot' -> 'Tomato - Bacterial Spot')"""
    return class_name.replace("___", " - ").replace("__", " ").replace("_", " ").title()

def preprocess_image(image_bytes):
    """Preprocess image bytes for TFLite model"""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        # Resize to 224x224 (User Requirement)
        image = image.resize((224, 224))
        
        # Normalize to [0, 1] (User Requirement)
        img_array = np.array(image) / 255.0
        
        # Add batch dimension and ensure float32 (User Requirement)
        img_array = np.expand_dims(img_array, axis=0).astype(np.float32)
        
        return img_array
    except Exception as e:
        print(f"Error processing image: {e}")
        return None

def analyze_image_quality(image_bytes):
    """
    Checks for Blur and Brightness using OpenCV.
    """
    try:
        import cv2
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"valid": False, "message": "Could not decode image"}

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 1. Blur Detection (Laplacian Variance)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        is_blur = laplacian_var < 100 # Threshold
        
        # 2. Brightness Check
        mean_brightness = np.mean(gray)
        is_dark = mean_brightness < 50 # Threshold
        
        messages = []
        if is_blur: messages.append("Image is blurry. Please hold steady.")
        if is_dark: messages.append("Image is too dark. Use flash or better lighting.")
        
        return {
            "valid": not (is_blur or is_dark),
            "is_blur": bool(is_blur),
            "is_dark": bool(is_dark),
            "message": " & ".join(messages) if messages else "Image Quality: Good",
            "score": laplacian_var
        }
    except ImportError:
        print(" OpenCV not available, skipping quality check")
        return {"valid": True, "message": "Quality check unavailable"}
    except Exception as e:
        print(f"Quality Check Error: {e}")
        return {"valid": True, "message": "Skipped quality check"}

def generate_stress_heatmap(image_bytes):
    """
    Generates a heatmap highlighting potential disease areas (non-green).
    Returns Base64 string of the processed image.
    """
    try:
        import cv2
        import base64
        
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None
        
        # Convert to HSV
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Define Green Range (Healthy)
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        
        # Mask: Find Green
        mask_green = cv2.inRange(hsv, lower_green, upper_green)
        
        # Invert Mask: Finding NON-Green (Disease/Stress)
        mask_stress = cv2.bitwise_not(mask_green)
        
        # Create Heatmap (Red/Yellow for stress)
        heatmap_img = cv2.applyColorMap(mask_stress, cv2.COLORMAP_JET)
        
        # Overlay heatmap on original image (weighted)
        overlay = cv2.addWeighted(img, 0.7, heatmap_img, 0.3, 0)
        
        # Encode to Base64
        _, buffer = cv2.imencode('.jpg', overlay)
        img_str = base64.b64encode(buffer).decode('utf-8')
        
        return f"data:image/jpeg;base64,{img_str}"
        
    except ImportError:
        print(" OpenCV not available, skipping heatmap generation")
        return None
    except Exception as e:
        print(f"Heatmap Error: {e}")
        return None

def predict_disease(image_bytes: bytes):
    """
    Predicts disease from image bytes using TFLite.
    Returns: {"class": str, "confidence": float, "quality": dict, "heatmap": str}
    """
    global _interpreter
    
    print(f" Starting prediction for image of size {len(image_bytes)} bytes")
    
    # Lazy load model on first use (saves memory on startup)
    if _interpreter is None:
        print("[INFO] Model not loaded, loading now...")
        load_model()
    
    # 0. Run Quality Check & Heatmap (with error protection)
    try:
        quality = analyze_image_quality(image_bytes)
        print(f"[INFO] Quality check: {quality.get('message', 'Done')}")
    except Exception as e:
        print(f"[WARN] Quality check failed: {e}")
        quality = {"valid": True, "message": "Quality check skipped"}
    
    try:
        heatmap = generate_stress_heatmap(image_bytes)
        print(f"[INFO] Heatmap generated: {'Yes' if heatmap else 'No'}")
    except Exception as e:
        print(f"[WARN] Heatmap generation failed: {e}")
        heatmap = None
    
    # 1. Preprocess
    img_array = preprocess_image(image_bytes)
    if img_array is None:
        print("[ERROR] Image preprocessing failed")
        return {"error": "Invalid Image"}
    
    print(f" Image preprocessed: shape {img_array.shape}")

    # 2. Run TFLite Prediction
    prediction_result = {}
    if _interpreter:
        try:
            print("[INFO] Running model inference...")
            # Set input tensor
            _interpreter.set_tensor(_input_details[0]["index"], img_array)
            _interpreter.invoke()
            
            # Get output
            output_data = _interpreter.get_tensor(_output_details[0]["index"])
            predictions = output_data[0]
            
            # Get Top Prediction
            top_idx = np.argmax(predictions)
            confidence = float(predictions[top_idx])
            class_name = CLASS_NAMES[top_idx] if top_idx < len(CLASS_NAMES) else "Unknown"
            
            prediction_result = {
                "class": format_class_name(class_name),
                "raw_class": class_name,
                "confidence": confidence,
                "is_mock": False
            }
            print(f"[OK] Prediction: {class_name} ({confidence:.2%})")
        except Exception as e:
            print(f"[ERROR] Model inference error: {e}")
            import traceback
            print(traceback.format_exc())
    
    if not prediction_result:
        # DO NOT SIMULATE: Return error so user knows AI is offline
        print("[ERROR] Prediction failed and simulations are disabled.")
        return {
            "error": "AI Model Offline",
            "class": "Analysis Unavailable",
            "confidence": 0.0,
            "is_mock": False,
            "note": "Real AI model is missing or failed to initialize. Consult an agronomist."
        }
    
    # Attach extra metadata
    prediction_result["quality"] = quality
    prediction_result["heatmap"] = heatmap
    
    return prediction_result

# Model will be loaded lazily on first prediction (not on import)
# This saves memory during startup

