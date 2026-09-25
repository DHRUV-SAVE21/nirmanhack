"""
Decision Intelligence Engine
=============================
Multi-signal causal reasoning engine that cross-references:
  - NDVI (vegetation health)
  - Soil Moisture
  - NPK (Nitrogen, Phosphorus, Potassium)
  - pH
  - Temperature
  - Weather forecasts

Provides causal inference: WHY is the crop stressed, not just THAT it's stressed.
"""

import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

# Thresholds for each signal
THRESHOLDS = {
    "ndvi": {"critical": 0.25, "stressed": 0.50, "healthy": 0.65},
    "soil_moisture": {"critical": 20, "low": 35, "optimal_low": 45, "optimal_high": 70, "waterlogged": 85},
    "nitrogen": {"deficient": 20, "low": 40, "optimal": 80, "excess": 140},
    "phosphorus": {"deficient": 10, "low": 25, "optimal": 50, "excess": 80},
    "potassium": {"deficient": 15, "low": 30, "optimal": 60, "excess": 100},
    "ph": {"too_acidic": 5.0, "acidic": 5.5, "optimal_low": 6.0, "optimal_high": 7.5, "alkaline": 8.0, "too_alkaline": 8.5},
    "temperature": {"frost": 5, "cold": 15, "optimal_low": 20, "optimal_high": 35, "heat_stress": 40, "extreme": 45},
}


def classify_signal(value: float, signal_type: str) -> Dict:
    """Classify a single signal value into status and severity."""
    thresholds = THRESHOLDS.get(signal_type, {})
    
    if signal_type == "ndvi":
        if value < thresholds["critical"]:
            return {"status": "critical", "severity": 1.0, "label": "Critical", "color": "#ef4444"}
        elif value < thresholds["stressed"]:
            return {"status": "stressed", "severity": 0.6, "label": "Stressed", "color": "#f59e0b"}
        elif value < thresholds["healthy"]:
            return {"status": "moderate", "severity": 0.3, "label": "Moderate", "color": "#84cc16"}
        else:
            return {"status": "healthy", "severity": 0.0, "label": "Healthy", "color": "#22c55e"}
    
    elif signal_type == "soil_moisture":
        if value < thresholds["critical"]:
            return {"status": "critically_dry", "severity": 1.0, "label": "Critically Dry", "color": "#ef4444"}
        elif value < thresholds["low"]:
            return {"status": "dry", "severity": 0.7, "label": "Dry", "color": "#f59e0b"}
        elif value <= thresholds["optimal_high"]:
            return {"status": "optimal", "severity": 0.0, "label": "Optimal", "color": "#22c55e"}
        elif value <= thresholds["waterlogged"]:
            return {"status": "wet", "severity": 0.4, "label": "Too Wet", "color": "#3b82f6"}
        else:
            return {"status": "waterlogged", "severity": 0.8, "label": "Waterlogged", "color": "#6366f1"}
    
    elif signal_type in ["nitrogen", "phosphorus", "potassium"]:
        if value < thresholds["deficient"]:
            return {"status": "deficient", "severity": 1.0, "label": "Deficient", "color": "#ef4444"}
        elif value < thresholds["low"]:
            return {"status": "low", "severity": 0.6, "label": "Low", "color": "#f59e0b"}
        elif value <= thresholds["optimal"]:
            return {"status": "optimal", "severity": 0.0, "label": "Optimal", "color": "#22c55e"}
        else:
            return {"status": "excess", "severity": 0.4, "label": "Excess", "color": "#a855f7"}
    
    elif signal_type == "ph":
        if value < thresholds["too_acidic"]:
            return {"status": "too_acidic", "severity": 0.9, "label": "Very Acidic", "color": "#ef4444"}
        elif value < thresholds["acidic"]:
            return {"status": "acidic", "severity": 0.5, "label": "Acidic", "color": "#f59e0b"}
        elif value <= thresholds["optimal_high"]:
            return {"status": "optimal", "severity": 0.0, "label": "Optimal", "color": "#22c55e"}
        elif value <= thresholds["alkaline"]:
            return {"status": "alkaline", "severity": 0.5, "label": "Alkaline", "color": "#f59e0b"}
        else:
            return {"status": "too_alkaline", "severity": 0.9, "label": "Very Alkaline", "color": "#ef4444"}
    
    elif signal_type == "temperature":
        if value < thresholds["frost"]:
            return {"status": "frost", "severity": 1.0, "label": "Frost Risk", "color": "#3b82f6"}
        elif value < thresholds["cold"]:
            return {"status": "cold", "severity": 0.5, "label": "Cold", "color": "#60a5fa"}
        elif value <= thresholds["optimal_high"]:
            return {"status": "optimal", "severity": 0.0, "label": "Optimal", "color": "#22c55e"}
        elif value <= thresholds["heat_stress"]:
            return {"status": "hot", "severity": 0.6, "label": "Heat Stress", "color": "#f59e0b"}
        else:
            return {"status": "extreme_heat", "severity": 1.0, "label": "Extreme Heat", "color": "#ef4444"}
    
    return {"status": "unknown", "severity": 0.5, "label": "Unknown", "color": "#6b7280"}


def run_causal_inference(signals: Dict) -> Dict:
    """
    Multi-signal causal inference engine.
    Cross-references all signals to determine WHY the crop is stressed.
    
    Returns a list of hypotheses ranked by confidence.
    """
    ndvi_status = signals.get("ndvi", {}).get("status", "unknown")
    moisture_status = signals.get("soil_moisture", {}).get("status", "unknown")
    n_status = signals.get("nitrogen", {}).get("status", "unknown")
    p_status = signals.get("phosphorus", {}).get("status", "unknown")
    k_status = signals.get("potassium", {}).get("status", "unknown")
    ph_status = signals.get("ph", {}).get("status", "unknown")
    temp_status = signals.get("temperature", {}).get("status", "unknown")
    
    hypotheses = []
    
    # --- RULE 1: Water Stress ---
    # NDVI ↓ + Soil Moisture ↓ → Water stress likely
    if ndvi_status in ["critical", "stressed"] and moisture_status in ["critically_dry", "dry"]:
        confidence = 0.92
        if temp_status in ["hot", "extreme_heat"]:
            confidence = 0.97  # Heat amplifies water stress
        hypotheses.append({
            "id": "water_stress",
            "cause": "Water Stress (Drought)",
            "confidence": confidence,
            "icon": "💧",
            "color": "#ef4444",
            "gradient": "from-red-500 to-orange-500",
            "reasoning": "NDVI indicates vegetation decline while soil moisture is critically low. The plant is unable to maintain photosynthesis due to insufficient water availability.",
            "reason": "Vegetation index (NDVI) is falling in tandem with critically low soil moisture readings, indicating a high-confidence water stress event.",
            "data_source": "NDVI Satellite Time-Series + IoT Soil Probe",
            "last_updated": datetime.now().isoformat(),
            "signals_used": ["NDVI ↓", "Soil Moisture ↓"] + (["Temperature ↑"] if temp_status in ["hot", "extreme_heat"] else []),
            "immediate_action": "Begin emergency irrigation immediately. Apply 25mm water depth.",
            "severity": "critical" if moisture_status == "critically_dry" else "high",
            "detailed_steps": [
                "Start drip irrigation at 2L/hr per plant immediately",
                "Apply mulch (4-6cm) to reduce evaporation by 40%",
                "Spray anti-transpirant (Kaolin 6%) on leaves",
                "Monitor soil moisture every 4 hours until > 40%"
            ]
        })
    
    # --- RULE 2: Nutrient Deficiency ---
    # NDVI ↓ + Moisture Normal + N/P/K Low → Nutrient deficiency
    if ndvi_status in ["critical", "stressed"] and moisture_status in ["optimal", "wet"]:
        nutrient_issues = []
        if n_status in ["deficient", "low"]:
            nutrient_issues.append("Nitrogen")
        if p_status in ["deficient", "low"]:
            nutrient_issues.append("Phosphorus")
        if k_status in ["deficient", "low"]:
            nutrient_issues.append("Potassium")
        
        if nutrient_issues:
            confidence = 0.85 + (len(nutrient_issues) * 0.03)
            hypotheses.append({
                "id": "nutrient_deficiency",
                "cause": f"Nutrient Deficiency ({', '.join(nutrient_issues)})",
                "confidence": min(confidence, 0.95),
                "icon": "🧪",
                "color": "#f59e0b",
                "gradient": "from-amber-500 to-yellow-500",
                "reasoning": f"NDVI shows vegetation stress but soil moisture is adequate. {', '.join(nutrient_issues)} levels are below optimal thresholds, indicating the plant cannot synthesize sufficient chlorophyll.",
                "reason": f"Detected {', '.join(nutrient_issues)} levels are below critical crop thresholds while moisture is sufficient. This indicates stress is nutrient-driven rather than water-driven.",
                "data_source": "NPK Ground Sensors + Satellite NDVI",
                "last_updated": datetime.now().isoformat(),
                "signals_used": ["NDVI ↓", "Moisture ✓"] + [f"{n} ↓" for n in nutrient_issues],
                "immediate_action": f"Apply balanced fertilizer focusing on {', '.join(nutrient_issues)}.",
                "severity": "high" if "Nitrogen" in nutrient_issues else "medium",
                "detailed_steps": _get_nutrient_steps(nutrient_issues)
            })
    
    # --- RULE 3: Disease Onset ---
    # NDVI ↓ + Moisture Normal + NPK Normal → Disease/Pest
    if ndvi_status in ["critical", "stressed"] and moisture_status in ["optimal", "wet"]:
        npk_ok = all(s in ["optimal", "excess"] for s in [n_status, p_status, k_status])
        if npk_ok:
            confidence = 0.78
            if moisture_status == "wet":
                confidence = 0.88  # Excess moisture promotes fungal disease
            hypotheses.append({
                "id": "disease_onset",
                "cause": "Possible Disease / Pest Infestation",
                "confidence": confidence,
                "icon": "🦠",
                "color": "#a855f7",
                "gradient": "from-purple-500 to-pink-500",
                "reasoning": "NDVI indicates vegetation decline but both soil moisture and NPK levels are within normal ranges. This pattern strongly suggests biotic stress — likely fungal infection or pest damage affecting leaf tissue.",
                "reason": "Vegetation decline detected without corresponding drop in water or nutrients. High soil moisture ({0}%) creates conditions ripe for fungal spread.".format(signals.get('soil_moisture', {}).get('raw_value', 'N/A')),
                "data_source": "Multi-Sensor Causal Matrix",
                "last_updated": datetime.now().isoformat(),
                "signals_used": ["NDVI ↓", "Moisture ✓", "NPK ✓"],
                "immediate_action": "Inspect crops visually for lesions, discoloration, or insects. Use camera diagnosis for confirmation.",
                "severity": "high",
                "detailed_steps": [
                    "Physically inspect leaves for spots, lesions, or wilting patterns",
                    "Use the Camera Diagnose feature for AI-powered disease ID",
                    "Apply preventive Neem Oil spray (5ml/L) as organic first defense",
                    "If fungal: Apply Mancozeb 75 WP (2.5g/L) within 24 hours",
                    "Isolate severely affected plants to prevent spread"
                ]
            })
    
    # --- RULE 4: Waterlogging Stress ---
    if ndvi_status in ["critical", "stressed"] and moisture_status in ["waterlogged"]:
        hypotheses.append({
            "id": "waterlogging",
            "cause": "Waterlogging / Root Asphyxiation",
            "confidence": 0.90,
            "icon": "🌊",
            "color": "#3b82f6",
            "gradient": "from-blue-500 to-cyan-500",
            "reasoning": "Soil is waterlogged causing root oxygen deprivation. Plants show stress despite excess water because roots cannot function in anaerobic conditions.",
            "reason": "Soil moisture is at a dangerous {0}% (threshold: 85%). This is preventing root respiration, causing NDVI to drop despite no water shortage.".format(signals.get('soil_moisture',{}).get('raw_value','N/A')),
            "data_source": "Ground Moisture Probes",
            "last_updated": datetime.now().isoformat(),
            "signals_used": ["NDVI ↓", "Moisture ↑↑"],
            "immediate_action": "Stop all irrigation. Improve drainage immediately.",
            "severity": "critical",
            "detailed_steps": [
                "Stop all irrigation immediately",
                "Create drainage channels (15cm deep) between rows",
                "If possible, use pumps to remove standing water",
                "Apply gypsum (500kg/ha) to improve soil structure",
                "Once drained, apply Trichoderma (10g/L) to prevent root rot"
            ]
        })
    
    # --- RULE 5: pH Imbalance ---
    if ndvi_status in ["critical", "stressed"] and ph_status in ["too_acidic", "too_alkaline"]:
        hypotheses.append({
            "id": "ph_imbalance",
            "cause": f"Soil pH Imbalance ({'Too Acidic' if 'acid' in ph_status else 'Too Alkaline'})",
            "confidence": 0.75,
            "icon": "⚗️",
            "color": "#ec4899",
            "gradient": "from-pink-500 to-rose-500",
            "reasoning": f"Soil pH is {'too low (acidic)' if 'acid' in ph_status else 'too high (alkaline)'}, which locks out essential nutrients even if they are present in the soil. This causes effective nutrient starvation.",
            "reason": f"Soil pH reading of {signals.get('ph', {}).get('raw_value', 'N/A')} is outside the optimal range (6.0-7.5). This causes nutrient lockout.",
            "data_source": "pH Sensor Readings",
            "last_updated": datetime.now().isoformat(),
            "signals_used": ["NDVI ↓", f"pH {'↓' if 'acid' in ph_status else '↑'}"],
            "immediate_action": f"{'Apply agricultural lime (2-3 tons/ha) to raise pH' if 'acid' in ph_status else 'Apply sulphur or gypsum to lower pH'}.",
            "severity": "medium",
            "detailed_steps": [
                "Get detailed soil test from nearest Krishi Vigyan Kendra",
                f"{'Apply Dolomite Lime at 2 tons/hectare' if 'acid' in ph_status else 'Apply Elemental Sulphur at 500kg/hectare'}",
                "Retest soil pH after 2 weeks",
                "Apply organic compost to buffer pH naturally"
            ]
        })
    
    # --- RULE 6: Heat Stress ---
    if ndvi_status in ["critical", "stressed"] and temp_status in ["hot", "extreme_heat"] and moisture_status in ["optimal"]:
        hypotheses.append({
            "id": "heat_stress",
            "cause": "Heat Stress / Thermal Damage",
            "confidence": 0.82,
            "icon": "🔥",
            "color": "#f97316",
            "gradient": "from-orange-500 to-red-500",
            "reasoning": "High temperature is causing excessive transpiration and potential protein denaturation in leaf cells, even though water is available. The plant's cooling mechanism is overwhelmed.",
            "reason": f"Current temperature {signals.get('temperature', {}).get('raw_value', 'N/A')}°C exceeds the heat stress threshold while moisture is available.",
            "data_source": "Weather Forecast + Ambience Sensor",
            "last_updated": datetime.now().isoformat(),
            "signals_used": ["NDVI ↓", "Temperature ↑", "Moisture ✓"],
            "immediate_action": "Increase irrigation frequency (not volume). Consider shade nets.",
            "severity": "high",
            "detailed_steps": [
                "Increase irrigation frequency to 3x daily (early morning, noon, evening)",
                "Install 35% shade nets if available",
                "Apply Kaolin clay spray (6%) as leaf sunscreen",
                "Mulch heavily (6cm) to cool root zone",
                "Avoid all chemical spraying during peak heat hours"
            ]
        })
    
    # --- RULE 7: Healthy Assessment ---
    if ndvi_status in ["healthy", "moderate"] and not hypotheses:
        hypotheses.append({
            "id": "healthy",
            "cause": "Crop is Healthy",
            "confidence": 0.95,
            "icon": "✅",
            "color": "#22c55e",
            "gradient": "from-green-500 to-emerald-500",
            "reasoning": "All signals are within normal parameters. Vegetation index shows strong photosynthetic activity. No intervention needed.",
            "reason": "All monitored signals (NDVI, Moisture, NPK, pH, Temp) are within optimal ranges for your crop type.",
            "data_source": "Full Sensor Calibration Matrix",
            "last_updated": datetime.now().isoformat(),
            "signals_used": ["NDVI ✓", "All Parameters Normal"],
            "immediate_action": "Continue current management practices.",
            "severity": "none",
            "detailed_steps": [
                "Maintain current irrigation schedule",
                "Next soil test recommended in 15 days",
                "Continue pest monitoring with weekly inspections"
            ]
        })
    
    # Sort by confidence (highest first)
    hypotheses.sort(key=lambda x: x["confidence"], reverse=True)
    
    return hypotheses



def _get_nutrient_steps(nutrients: List[str]) -> List[str]:
    """Generate specific nutrient remediation steps."""
    steps = []
    if "Nitrogen" in nutrients:
        steps.extend([
            "Apply Urea (46-0-0) at 50kg/hectare as top dressing",
            "Alternatively: Apply DAP (18-46-0) for combined N+P",
            "For organic: Apply Vermicompost (5 tons/ha) + Azotobacter biofertilizer"
        ])
    if "Phosphorus" in nutrients:
        steps.extend([
            "Apply Single Super Phosphate (SSP) at 100kg/hectare",
            "Or use Rock Phosphate for slow-release P supplementation"
        ])
    if "Potassium" in nutrients:
        steps.extend([
            "Apply Muriate of Potash (MOP) at 40kg/hectare",
            "For deficiency: Foliar spray of KCl (1%) for quick absorption"
        ])
    steps.append("Retest NPK levels after 10 days to verify improvement")
    return steps


def calculate_crop_risk_score(signals: Dict) -> Dict:
    """
    Calculate an overall crop risk score (0-100) from all signals.
    Also returns a breakdown of each signal's contribution.
    """
    weights = {
        "ndvi": 0.35,
        "soil_moisture": 0.25,
        "nitrogen": 0.10,
        "phosphorus": 0.08,
        "potassium": 0.07,
        "ph": 0.08,
        "temperature": 0.07,
    }
    
    total_risk = 0
    breakdown = []
    
    for signal_name, weight in weights.items():
        signal_data = signals.get(signal_name)
        if signal_data:
            severity = signal_data.get("severity", 0)
            contribution = severity * weight * 100
            total_risk += contribution
            breakdown.append({
                "signal": signal_name,
                "value": signal_data.get("raw_value", 0),
                "status": signal_data.get("label", "Unknown"),
                "severity": severity,
                "weight": weight,
                "contribution": round(contribution, 1),
                "color": signal_data.get("color", "#6b7280")
            })
    
    risk_level = "Low"
    risk_color = "#22c55e"
    if total_risk > 60:
        risk_level = "Critical"
        risk_color = "#ef4444"
    elif total_risk > 40:
        risk_level = "High"
        risk_color = "#f59e0b"
    elif total_risk > 20:
        risk_level = "Moderate"
        risk_color = "#84cc16"
    
    return {
        "score": round(total_risk, 1),
        "level": risk_level,
        "color": risk_color,
        "breakdown": sorted(breakdown, key=lambda x: x["contribution"], reverse=True)
    }


def generate_intelligence_report(
    ndvi_value: float,
    sensor_data: Optional[Dict] = None,
    weather_data: Optional[Dict] = None
) -> Dict:
    """
    Main entry point for the Decision Intelligence Engine.
    
    Combines NDVI satellite data with ground-truth sensor data
    to produce a causal diagnosis report.
    """
    # 1. Parse sensor data (from IoT hardware or defaults)
    if sensor_data and isinstance(sensor_data, dict):
        # Handle nested 'data' key from Supabase format
        raw = sensor_data.get("data", sensor_data) if "data" in sensor_data else sensor_data
    else:
        raw = {}
    
    soil_moisture = raw.get("soil_moisture", None)
    nitrogen = raw.get("nitrogen", None)
    phosphorus = raw.get("phosphorus", None)
    potassium = raw.get("potassium", None)
    ph = raw.get("ph", None)
    temperature = raw.get("soil_temperature", None) or raw.get("temperature", None)
    
    # 2. Classify each signal
    signals = {}
    
    # NDVI is always available (from satellite)
    ndvi_class = classify_signal(ndvi_value, "ndvi")
    ndvi_class["raw_value"] = round(ndvi_value, 3)
    signals["ndvi"] = ndvi_class
    
    # Sensor data may or may not be available
    has_sensor_data = False
    
    if soil_moisture is not None:
        has_sensor_data = True
        mc = classify_signal(float(soil_moisture), "soil_moisture")
        mc["raw_value"] = float(soil_moisture)
        signals["soil_moisture"] = mc
    
    if nitrogen is not None:
        has_sensor_data = True
        nc = classify_signal(float(nitrogen), "nitrogen")
        nc["raw_value"] = float(nitrogen)
        signals["nitrogen"] = nc
    
    if phosphorus is not None:
        has_sensor_data = True
        pc = classify_signal(float(phosphorus), "phosphorus")
        pc["raw_value"] = float(phosphorus)
        signals["phosphorus"] = pc
    
    if potassium is not None:
        has_sensor_data = True
        kc = classify_signal(float(potassium), "potassium")
        kc["raw_value"] = float(potassium)
        signals["potassium"] = kc
    
    if ph is not None:
        has_sensor_data = True
        phc = classify_signal(float(ph), "ph")
        phc["raw_value"] = float(ph)
        signals["ph"] = phc
    
    if temperature is not None:
        has_sensor_data = True
        tc = classify_signal(float(temperature), "temperature")
        tc["raw_value"] = float(temperature)
        signals["temperature"] = tc
    
    # 3. Run causal inference
    hypotheses = run_causal_inference(signals)
    
    # 4. Calculate risk score
    risk = calculate_crop_risk_score(signals)
    
    # 5. Generate signal correlation matrix
    correlations = _generate_correlation_insights(signals)
    
    # 6. AI-enhanced summary (if Gemini is available)
    ai_summary = None
    if hypotheses and hypotheses[0]["id"] != "healthy":
        ai_summary = _generate_ai_summary(signals, hypotheses)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "signals": signals,
        "has_sensor_data": has_sensor_data,
        "hypotheses": hypotheses,
        "primary_diagnosis": hypotheses[0] if hypotheses else None,
        "risk_score": risk,
        "correlations": correlations,
        "ai_summary": ai_summary,
        "engine_version": "2.0-CAUSAL"
    }


def _generate_correlation_insights(signals: Dict) -> List[Dict]:
    """Generate signal-to-signal correlation insights."""
    insights = []
    
    ndvi_s = signals.get("ndvi", {}).get("severity", 0)
    moisture_s = signals.get("soil_moisture", {}).get("severity", 0)
    
    if ndvi_s > 0.3 and moisture_s > 0.3:
        insights.append({
            "signals": ["NDVI", "Soil Moisture"],
            "correlation": "negative",
            "strength": "strong",
            "insight": "Both vegetation health and soil moisture are declining together — classic water stress pattern."
        })
    
    n_s = signals.get("nitrogen", {}).get("severity", 0)
    if ndvi_s > 0.3 and n_s > 0.3 and moisture_s < 0.3:
        insights.append({
            "signals": ["NDVI", "Nitrogen"],
            "correlation": "linked",
            "strength": "strong",
            "insight": "Vegetation decline correlates with nitrogen deficiency while moisture is adequate — nutrient-driven stress."
        })
    
    ph_s = signals.get("ph", {}).get("severity", 0)
    if ph_s > 0.5 and n_s > 0.3:
        insights.append({
            "signals": ["pH", "Nitrogen"],
            "correlation": "causal",
            "strength": "moderate",
            "insight": "Extreme pH is likely locking out nutrients — fixing pH will improve nutrient availability."
        })
    
    return insights


def _generate_ai_summary(signals: Dict, hypotheses: List[Dict]) -> Optional[str]:
    """Use Gemini to generate a human-readable summary."""
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None
        
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
        
        signal_summary = "\n".join([
            f"- {name.upper()}: {data.get('raw_value', 'N/A')} ({data.get('label', 'Unknown')})"
            for name, data in signals.items()
        ])
        
        hypothesis_summary = "\n".join([
            f"- {h['cause']} (Confidence: {h['confidence']*100:.0f}%)"
            for h in hypotheses[:3]
        ])
        
        prompt = f"""You are a senior agronomist AI. Based on the following multi-signal analysis, provide a 3-sentence briefing for a farmer. Be direct, actionable, and specific.

SIGNALS:
{signal_summary}

TOP HYPOTHESES:
{hypothesis_summary}

Write exactly 3 sentences:
1. What is happening (diagnosis)
2. Why it's happening (cause/reasoning) 
3. What to do RIGHT NOW (urgent action)

Keep it under 80 words total. Use simple language a farmer would understand."""

        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content.strip()
    except Exception as e:
        print(f"AI Summary Error: {e}")
        return None
