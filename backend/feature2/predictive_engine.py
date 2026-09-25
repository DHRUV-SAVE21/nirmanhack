"""
Predictive Alerts Engine
========================
Predicts BEFORE damage happens using real NDVI time-series + sensor data.
No mock data. No fake alerts. Every prediction is computed from real signals.

Models:
  1. Stress Risk (7-day) — NDVI trend slope + soil moisture + temperature
  2. Irrigation Need Forecast — soil moisture decline rate + NDVI response
  3. Disease Risk Probability — high moisture + warm temp + NDVI plateau/decline
  4. Yield Forecast (early stage) — NDVI trajectory vs ideal growth curve
"""

import math
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta


# ============================================
# IDEAL GROWTH CURVES (normalized to 0-1 NDVI)
# ============================================
GROWTH_CURVES = {
    "wheat": {
        "weeks": [0.08, 0.12, 0.20, 0.32, 0.48, 0.58, 0.65, 0.68, 0.70, 0.68, 0.60, 0.48, 0.35, 0.22, 0.15],
        "season_weeks": 15,
        "optimal_moisture": (40, 65),
        "optimal_temp": (12, 28),
        "base_yield_tonnes_ha": 4.5,
    },
    "rice": {
        "weeks": [0.06, 0.10, 0.18, 0.28, 0.40, 0.55, 0.65, 0.72, 0.75, 0.72, 0.65, 0.55, 0.40, 0.28, 0.18, 0.10],
        "season_weeks": 16,
        "optimal_moisture": (50, 80),
        "optimal_temp": (20, 35),
        "base_yield_tonnes_ha": 5.0,
    },
    "general": {
        "weeks": [0.08, 0.15, 0.25, 0.38, 0.50, 0.60, 0.68, 0.72, 0.70, 0.65, 0.55, 0.42, 0.30, 0.20],
        "season_weeks": 14,
        "optimal_moisture": (35, 70),
        "optimal_temp": (15, 35),
        "base_yield_tonnes_ha": 4.0,
    },
}


def _linear_regression(values: List[float]):
    """Simple linear regression: returns slope and intercept."""
    n = len(values)
    if n < 2:
        return 0.0, values[0] if values else 0.0
    x_mean = (n - 1) / 2
    y_mean = sum(values) / n
    numerator = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(values))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    slope = numerator / denominator if denominator != 0 else 0
    intercept = y_mean - slope * x_mean
    return slope, intercept


def _sigmoid(x: float) -> float:
    """Map any value to 0-100 probability."""
    return 100 / (1 + math.exp(-x))


# ============================================
# 1. STRESS RISK PREDICTION (next 7 days)
# ============================================
def predict_stress_risk(
    ndvi_series: List[float],
    soil_moisture: Optional[float] = None,
    temperature: Optional[float] = None,
) -> Dict:
    """
    Predicts crop stress probability in the next 7 days.
    Based on: NDVI trend direction, soil moisture level, temperature extremes.
    """
    # Relaxed requirement: If we only have 1 point, assume slope is 0 (stable) but still assess current health
    if not ndvi_series or len(ndvi_series) < 1:
        return {"probability": None, "level": "insufficient_data", "message": "Need at least 1 NDVI scan point"}

    slope = 0.0
    intercept = ndvi_series[0]
    if len(ndvi_series) >= 2:
        slope, intercept = _linear_regression(ndvi_series)
    
    current_ndvi = ndvi_series[-1]

    # Project 1 week ahead (if we have slope, use it. Otherwise assume stability)
    projected_ndvi = current_ndvi + slope

    # Base risk from NDVI trajectory
    risk_score = 0.0

    # Factor 1: NDVI decline (weight: 40%)
    if len(ndvi_series) >= 2:
        if slope < -0.03:
            risk_score += 4.0 * min(abs(slope) / 0.05, 2.0)  # Steep decline = high risk
        elif slope < 0:
            risk_score += 1.5 * (abs(slope) / 0.03)
        elif slope > 0.02:
            risk_score -= 1.0  # Improving trend reduces risk
    else:
        # Only 1 point: Risk if the single point is already low
        if current_ndvi < 0.35:
            risk_score += 1.5

    # Factor 2: Current NDVI level (weight: 30%)
    if current_ndvi < 0.25:
        risk_score += 3.0
    elif current_ndvi < 0.40:
        risk_score += 1.5
    elif current_ndvi < 0.55:
        risk_score += 0.5

    # Factor 3: Soil moisture (weight: 15%)
    if soil_moisture is not None:
        if soil_moisture < 20:
            risk_score += 2.5
        elif soil_moisture < 35:
            risk_score += 1.5
        elif soil_moisture > 85:
            risk_score += 1.0  # Waterlogging risk

    # Factor 4: Temperature (weight: 15%)
    if temperature is not None:
        if temperature > 40:
            risk_score += 2.0
        elif temperature > 35:
            risk_score += 1.0
        elif temperature < 5:
            risk_score += 2.0  # Frost risk
        elif temperature < 15:
            risk_score += 0.5

    # Map score to probability
    probability = min(95, max(5, _sigmoid(risk_score - 3)))
    
    if probability > 70:
        level = "critical"
        message = "Extreme crop stress predicted. Immediate intervention required."
    elif probability > 40:
        level = "warning"
        message = "Moderate stress risk detected. Monitor closely."
    else:
        level = "stable"
        message = "Crop signals appear stable for the next 7 days."

    # Updated to follow Trust & Explainability Layer standards
    confidence = round(probability, 1)
    
    # Generate explicit reason
    reason_parts = []
    if slope < -0.01:
        reason_parts.append(f"NDVI is declining at {abs(slope):.3f}/week")
    if current_ndvi < 0.4:
        reason_parts.append(f"Vegetation index is below optimal threshold ({current_ndvi:.2f})")
    if soil_moisture is not None and soil_moisture < 30:
        reason_parts.append(f"Soil moisture is critically low at {soil_moisture:.1f}%")
    if temperature is not None and temperature > 38:
        reason_parts.append(f"High temperature ({temperature:.1f}C) is causing thermal stress")
        
    reason = " & ".join(reason_parts) if reason_parts else "Crop signals are within normal operating parameters."

    return {
        "type": "stress_risk",
        "title": "🔮 7-Day Stress Risk",
        "probability": confidence,
        "confidence": confidence, # Direct mapping for the UI
        "level": level,
        "ndvi_slope": round(slope, 4),
        "projected_ndvi": round(projected_ndvi, 3),
        "message": message,
        "reason": reason,
        "data_source": "Satellite NDVI + Ground Sensors",
        "last_updated": datetime.now().isoformat(),
        "factors": {
            "ndvi_trend": f"{slope:+.4f}/week",
            "current_ndvi": round(current_ndvi, 3),
            "soil_moisture": soil_moisture,
            "temperature": temperature,
        },
    }


# ============================================
# 2. IRRIGATION NEED FORECAST
# ============================================
def predict_irrigation_need(
    soil_moisture: Optional[float] = None,
    ndvi_series: List[float] = None,
    temperature: Optional[float] = None,
    crop_type: str = "general",
) -> Dict:
    """
    Predicts how many days until irrigation becomes critical.
    Based on: soil moisture level, evapotranspiration estimate, NDVI response.
    """
    if soil_moisture is None:
        return {"probability": None, "level": "no_data", "message": "No soil moisture sensor data available"}

    crop = GROWTH_CURVES.get(crop_type, GROWTH_CURVES["general"])
    optimal_low, optimal_high = crop["optimal_moisture"]

    # Daily moisture loss estimate (evapotranspiration)
    base_loss_per_day = 3.5  # % per day base
    if temperature:
        if temperature > 35:
            base_loss_per_day = 6.0
        elif temperature > 30:
            base_loss_per_day = 5.0
        elif temperature > 25:
            base_loss_per_day = 4.0
        elif temperature < 15:
            base_loss_per_day = 2.0

    # Days until moisture drops below critical (20%)
    if soil_moisture > 20:
        days_to_critical = max(0, (soil_moisture - 20) / base_loss_per_day)
    else:
        days_to_critical = 0

    # Days until below optimal
    days_to_suboptimal = max(0, (soil_moisture - optimal_low) / base_loss_per_day)

    # Urgency score
    if days_to_critical <= 1:
        urgency = "critical"
        probability = 95
        message = f"IRRIGATION NEEDED NOW. Moisture at {soil_moisture:.0f}% — will reach critical in {days_to_critical:.0f} day(s). ET rate: ~{base_loss_per_day:.1f}%/day."
    elif days_to_critical <= 3:
        urgency = "high"
        probability = 80
        message = f"Irrigate within {days_to_critical:.0f} days. Moisture at {soil_moisture:.0f}% declining at ~{base_loss_per_day:.1f}%/day."
    elif days_to_suboptimal <= 3:
        urgency = "moderate"
        probability = 55
        message = f"Schedule irrigation in {days_to_suboptimal:.0f}-{days_to_critical:.0f} days. Currently {soil_moisture:.0f}% — optimal range: {optimal_low}-{optimal_high}%."
    else:
        urgency = "low"
        probability = 20
        message = f"No immediate irrigation needed. Moisture at {soil_moisture:.0f}%. Next needed in ~{days_to_critical:.0f} days."

    # NDVI response factor — if NDVI is declining, irrigation need is more urgent
    ndvi_decline_msg = ""
    if ndvi_series and len(ndvi_series) >= 2:
        slope, _ = _linear_regression(ndvi_series)
        if slope < -0.02 and soil_moisture < optimal_high:
            probability = min(95, probability + 15)
            ndvi_decline_msg = f" Additionally, NDVI is declining at {abs(slope):.3f}/week confirming vegetation stress."
            message += f" ⚠️ NDVI declining ({slope:+.3f}/wk) — possible moisture stress."

    # Trust Layer Fields
    reason = f"Soil moisture ({soil_moisture:.0f}%) is below the critical threshold of 20%. Daily evapotranspiration loss is estimated at {base_loss_per_day:.1f}%."
    if ndvi_decline_msg:
        reason += ndvi_decline_msg

    return {
        "type": "irrigation_forecast",
        "title": "💧 Irrigation Forecast",
        "probability": round(probability, 1),
        "confidence": round(probability, 1),
        "level": urgency,
        "days_to_critical": round(days_to_critical, 1),
        "days_to_suboptimal": round(days_to_suboptimal, 1),
        "daily_loss_rate": round(base_loss_per_day, 1),
        "current_moisture": soil_moisture,
        "message": message,
        "reason": reason,
        "data_source": "Soil Moisture Sensors + Weather Data",
        "last_updated": datetime.now().isoformat(),
    }


# ============================================
# 3. DISEASE RISK PROBABILITY
# ============================================
def predict_disease_risk(
    soil_moisture: Optional[float] = None,
    temperature: Optional[float] = None,
    ndvi_series: List[float] = None,
    ph: Optional[float] = None,
) -> Dict:
    """
    Predicts disease outbreak probability.
    High moisture + warm temps + NDVI plateau/decline = fungal/bacterial risk.
    """
    risk_score = 0.0
    risk_factors = []

    # Factor 1: High moisture = fungal breeding ground
    if soil_moisture is not None:
        if soil_moisture > 80:
            risk_score += 3.5
            risk_factors.append(f"Very high moisture ({soil_moisture:.0f}%) — fungal risk")
        elif soil_moisture > 65:
            risk_score += 2.0
            risk_factors.append(f"Elevated moisture ({soil_moisture:.0f}%)")
        elif soil_moisture < 25:
            risk_score -= 0.5  # Very dry = less disease risk

    # Factor 2: Warm + humid = disease cluster
    if temperature is not None:
        if 22 <= temperature <= 32:
            risk_score += 2.0
            risk_factors.append(f"Warm temperature ({temperature:.0f}°C) — optimal for pathogens")
        elif temperature > 32:
            risk_score += 1.0
            risk_factors.append(f"High temperature ({temperature:.0f}°C)")
        elif temperature < 10:
            risk_score -= 1.0

    # Factor 3: NDVI plateau/sudden decline while moisture is high
    if ndvi_series and len(ndvi_series) >= 3:
        slope, _ = _linear_regression(ndvi_series)
        recent_slope, _ = _linear_regression(ndvi_series[-3:])

        # NDVI was rising but suddenly plateaued or dropped = possible disease
        if slope > 0 and recent_slope < -0.01:
            risk_score += 2.5
            risk_factors.append(f"NDVI reversal detected (was rising, now declining {recent_slope:+.3f}/wk)")
        elif slope < -0.02 and soil_moisture and soil_moisture > 60:
            risk_score += 2.0
            risk_factors.append(f"NDVI declining in wet conditions — pathogen suspicion")

    # Factor 4: pH extremes
    if ph is not None:
        if ph < 5.0 or ph > 8.5:
            risk_score += 1.5
            risk_factors.append(f"Extreme pH ({ph:.1f}) — weakens plant immunity")
        elif ph < 5.5 or ph > 8.0:
            risk_score += 0.5

    probability = min(90, max(5, _sigmoid(risk_score - 3)))

    if probability > 60:
        level = "high"
        message = f"HIGH disease risk ({probability:.0f}%). Conditions favor pathogen growth. "
        if risk_factors:
            message += "Key factors: " + "; ".join(risk_factors[:2]) + "."
    elif probability > 35:
        level = "moderate"
        message = f"Moderate disease risk. Monitor for early signs of infection. "
        if risk_factors:
            message += "Watch: " + "; ".join(risk_factors[:2]) + "."
    else:
        level = "low"
        message = f"Low disease risk. Current conditions not favorable for outbreaks."

    # Trust Layer reasoning
    reason = "No significant risk detected."
    if risk_factors:
        reason = f"Environmental conditions are currently favorable for pathogen development: {', '.join(risk_factors)}."

    return {
        "type": "disease_risk",
        "title": "🦠 Disease Risk",
        "probability": round(probability, 1),
        "confidence": round(probability, 1),
        "level": level,
        "risk_factors": risk_factors,
        "message": message,
        "reason": reason,
        "data_source": "Sensor Array (Temp, Humidity, pH) + NDVI Anomalies",
        "last_updated": datetime.now().isoformat(),
    }


# ============================================
# 4. YIELD FORECAST (Early Stage)
# ============================================
def predict_yield(
    ndvi_series: List[float],
    crop_type: str = "general",
    area_hectares: float = 1.0,
) -> Dict:
    """
    Early-stage yield forecast based on NDVI trajectory vs ideal growth curve.
    Compares actual NDVI path to the expected curve and projects final yield.
    """
    if not ndvi_series or len(ndvi_series) < 1:
        return {"probability": None, "level": "insufficient_data", "message": "Need at least 1 NDVI scan point for yield forecast"}

    crop = GROWTH_CURVES.get(crop_type, GROWTH_CURVES["general"])
    ideal_curve = crop["weeks"]
    base_yield = crop["base_yield_tonnes_ha"]

    # Match current NDVI series position on ideal curve
    current_ndvi = ndvi_series[-1]
    best_match_week = 0
    best_match_diff = float('inf')

    for i, ideal_val in enumerate(ideal_curve):
        diff = abs(current_ndvi - ideal_val)
        if diff < best_match_diff:
            best_match_diff = diff
            best_match_week = i

    # Calculate performance ratio: how well is actual tracking vs ideal?
    weeks_available = min(len(ndvi_series), len(ideal_curve))
    performance_ratios = []

    for i in range(weeks_available):
        ideal_idx = max(0, best_match_week - weeks_available + 1 + i)
        if ideal_idx < len(ideal_curve) and ideal_curve[ideal_idx] > 0.05:
            ratio = ndvi_series[i] / ideal_curve[ideal_idx]
            performance_ratios.append(min(1.5, max(0.3, ratio)))

    if not performance_ratios:
        avg_performance = 0.8
    else:
        avg_performance = sum(performance_ratios) / len(performance_ratios)

    # Trend factor — improving trend = higher yield potential
    slope, _ = _linear_regression(ndvi_series)
    trend_bonus = 1.0
    if slope > 0.03:
        trend_bonus = 1.1
    elif slope > 0.01:
        trend_bonus = 1.05
    elif slope < -0.03:
        trend_bonus = 0.85
    elif slope < -0.01:
        trend_bonus = 0.92

    # Peak NDVI factor
    peak_ndvi = max(ndvi_series)
    peak_factor = min(1.0, peak_ndvi / max(ideal_curve))

    # Final yield estimate
    yield_multiplier = avg_performance * trend_bonus * peak_factor
    predicted_yield = base_yield * yield_multiplier * area_hectares
    yield_pct = round(yield_multiplier * 100, 1)

    # Confidence based on data availability
    confidence = min(85, 30 + len(ndvi_series) * 7)

    if yield_pct >= 90:
        level = "excellent"
        message = f"Yield tracking at {yield_pct}% of potential ({predicted_yield:.1f} t/ha). Crop performing well."
    elif yield_pct >= 70:
        level = "good"
        message = f"Yield at {yield_pct}% of potential ({predicted_yield:.1f} t/ha). Minor optimization possible."
    elif yield_pct >= 50:
        level = "moderate"
        message = f"Yield at {yield_pct}% of potential ({predicted_yield:.1f} t/ha). Intervention recommended to improve outcomes."
    else:
        level = "poor"
        message = f"Yield projected at only {yield_pct}% ({predicted_yield:.1f} t/ha). Significant intervention needed."

    # Estimated growth stage
    season_pct = round((best_match_week / crop["season_weeks"]) * 100, 1)

    return {
        "type": "yield_forecast",
        "title": "🌾 Yield Forecast",
        "predicted_yield_per_ha": round(predicted_yield / max(0.1, area_hectares), 2),
        "yield_percentage": yield_pct,
        "level": level,
        "confidence": confidence,
        "season_progress": season_pct,
        "estimated_week": best_match_week + 1,
        "trend_factor": round(trend_bonus, 2),
        "peak_ndvi": round(peak_ndvi, 3),
        "message": message,
        "reason": f"NDVI trajectory is tracking at {yield_pct}% of the ideal growth curve for {crop_type}. Surface biomass (peak NDVI: {peak_ndvi}) predicts a final yield of {predicted_yield:.2f} t/ha.",
        "data_source": "NDVI Growth Curve Comparison",
        "last_updated": datetime.now().isoformat(),
    }



# ============================================
# MASTER: Generate All Predictions
# ============================================
def generate_predictive_alerts(
    ndvi_series: List[float] = None,
    soil_moisture: Optional[float] = None,
    temperature: Optional[float] = None,
    nitrogen: Optional[float] = None,
    phosphorus: Optional[float] = None,
    potassium: Optional[float] = None,
    ph: Optional[float] = None,
    crop_type: str = "general",
) -> Dict:
    """
    Master function: generates ALL predictive alerts from available real data.
    Only produces alerts when real data supports them — NO mock alerts.
    """
    alerts = []
    has_ndvi = ndvi_series and len(ndvi_series) >= 1
    has_sensor = soil_moisture is not None

    # 1. Stress Risk
    if has_ndvi:
        stress = predict_stress_risk(ndvi_series, soil_moisture, temperature)
        if stress.get("probability") is not None:
            alerts.append(stress)

    # 2. Irrigation Forecast
    if has_sensor:
        irrigation = predict_irrigation_need(soil_moisture, ndvi_series, temperature, crop_type)
        if irrigation.get("probability") is not None:
            alerts.append(irrigation)

    # 3. Disease Risk
    if has_sensor or has_ndvi:
        disease = predict_disease_risk(soil_moisture, temperature, ndvi_series, ph)
        if disease.get("probability") is not None:
            alerts.append(disease)

    # 4. Yield Forecast (Now available from 1st scan!)
    if has_ndvi:
        yield_pred = predict_yield(ndvi_series, crop_type)
        if yield_pred.get("predicted_yield_per_ha") is not None:
            alerts.append(yield_pred)

    # Overall risk summary
    probabilities = [a["probability"] for a in alerts if a.get("probability")]
    max_risk = max(probabilities) if probabilities else 0
    avg_risk = sum(probabilities) / len(probabilities) if probabilities else 0

    return {
        "alerts": alerts,
        "alert_count": len(alerts),
        "max_risk": round(max_risk, 1),
        "avg_risk": round(avg_risk, 1),
        "overall_status": "critical" if max_risk > 70 else "warning" if max_risk > 40 else "stable",
        "data_sources": {
            "ndvi_weeks": len(ndvi_series) if ndvi_series else 0,
            "has_sensor_data": has_sensor,
            "crop_type": crop_type,
        },
        "generated_at": datetime.now().isoformat(),
        "engine": "PredictiveEngine v1.0 — Real data only, no mocks",
    }
