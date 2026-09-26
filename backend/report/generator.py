"""
Soil Health Report Generator — v2
===================================
Professional PDF modelled on Indian Govt. Soil Health Card scheme.
Includes: Header | Farm Details | Soil Type Profile | NPK Table | Recommendations | Legend

Supports: English | Hindi | Marathi
NPK Rating: STCR + ICAR thresholds
Soil Types: Alluvial, Black Cotton, Red, Laterite, Desert/Arid, Loamy, Sandy, Clay
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# ─── Colour Palette ────────────────────────────────────────────────────────
C_GOLD        = colors.HexColor("#D4A017")
C_DARK_GREEN  = colors.HexColor("#1A5E28")
C_MID_GREEN   = colors.HexColor("#2E7D32")
C_LIGHT_GREEN = colors.HexColor("#C8E6C9")
C_PALE_GREEN  = colors.HexColor("#E8F5E9")
C_HEADER_BG   = colors.HexColor("#1B5E20")
C_SUBHDR_BG   = colors.HexColor("#F9A825")
C_ROW_ALT     = colors.HexColor("#F1F8E9")
C_WHITE       = colors.white
C_BLACK       = colors.black
C_STRIPE_BLU  = colors.HexColor("#E3F2FD")   # light blue for soil info rows

# ─── Soil Type Knowledge Base ──────────────────────────────────────────────
SOIL_PROFILES = {
    "Alluvial": {
        "texture":    "Fine to medium loam",
        "color":      "Light grey to brown",
        "ph_range":   "6.5–8.0",
        "organic":    "Low to medium",
        "drainage":   "Good",
        "best_crops": "Wheat, Rice, Sugarcane, Maize, Vegetables",
        "notes":      "Most fertile soil in India. Rich in potash, lime; poor in humus & nitrogen.",
    },
    "Black Cotton": {
        "texture":    "Heavy clay (60–70% clay)",
        "color":      "Deep black",
        "ph_range":   "7.5–8.5",
        "organic":    "Medium",
        "drainage":   "Poor (waterlogging risk)",
        "best_crops": "Cotton, Soybean, Sorghum, Pulse crops, Wheat",
        "notes":      "Also called Regur. High water retention. Good for deep-rooted crops. Needs gypsum if EC is high.",
    },
    "Black (Regur)": {
        "texture":    "Heavy clay",
        "color":      "Deep black",
        "ph_range":   "7.5–8.5",
        "organic":    "Medium",
        "drainage":   "Poor",
        "best_crops": "Cotton, Soybean, Pulse crops",
        "notes":      "Regur (black cotton soil). Swells when wet, cracks when dry. Ideal for cotton.",
    },
    "Red": {
        "texture":    "Sandy loam to loam",
        "color":      "Red/yellowish (iron oxide)",
        "ph_range":   "6.0–7.5",
        "organic":    "Low",
        "drainage":   "Moderate to good",
        "best_crops": "Millets, Groundnuts, Tobacco, Vegetables, Ragi",
        "notes":      "Deficient in N, P, humus. Needs organic matter and NPK amendments.",
    },
    "Laterite": {
        "texture":    "Coarse, gravelly",
        "color":      "Brick red",
        "ph_range":   "5.5–6.5",
        "organic":    "Very low",
        "drainage":   "Excessive",
        "best_crops": "Cashew, Tea, Coffee, Rubber, Coconut",
        "notes":      "Highly leached. Poor in N, P, K and Ca. Needs heavy liming and manure additions.",
    },
    "Desert / Arid": {
        "texture":    "Sandy, coarse",
        "color":      "Light brown / yellowish",
        "ph_range":   "7.5–9.0",
        "organic":    "Very low",
        "drainage":   "Excessive",
        "best_crops": "Bajra, Moth Bean, Guar, Drought-tolerant crops",
        "notes":      "Low water retention, high pH, risk of salinity. Irrigation essential. Apply FYM to build humus.",
    },
    "Desert": {
        "texture":    "Sandy, coarse",
        "color":      "Light brown",
        "ph_range":   "7.5–9.0",
        "organic":    "Very low",
        "drainage":   "Excessive",
        "best_crops": "Bajra, Guar, Drought crops",
        "notes":      "Low water retention, high pH, salinity risk. Heavy irrigation needed.",
    },
    "Loamy": {
        "texture":    "Balanced sand-silt-clay",
        "color":      "Brown",
        "ph_range":   "6.0–7.5",
        "organic":    "Medium to high",
        "drainage":   "Good",
        "best_crops": "Almost all crops — Wheat, Maize, Vegetables, Pulses",
        "notes":      "Most versatile soil type. Good structure, excellent nutrient and water retention.",
    },
    "Sandy": {
        "texture":    "Coarse, gritty",
        "color":      "Light grey/tan",
        "ph_range":   "5.5–7.5",
        "organic":    "Very low",
        "drainage":   "Very fast",
        "best_crops": "Groundnut, Carrot, Cowpea, Sweet Potato",
        "notes":      "Poor nutrient retention. Apply compost & slow-release fertilizers. Frequent irrigation needed.",
    },
    "Clay": {
        "texture":    "Heavy, sticky when wet",
        "color":      "Grey to dark brown",
        "ph_range":   "6.0–8.0",
        "organic":    "Medium",
        "drainage":   "Poor",
        "best_crops": "Rice, Jute, Sugarcane",
        "notes":      "High water retention. Risk of waterlogging. Add organic matter & sand to improve structure.",
    },
}

def get_soil_profile(soil_type: str) -> dict:
    """Return soil profile dict, fuzzy-matching if needed."""
    if soil_type in SOIL_PROFILES:
        return SOIL_PROFILES[soil_type]
    # Fuzzy match
    soil_lower = soil_type.lower()
    for key in SOIL_PROFILES:
        if key.lower() in soil_lower or soil_lower in key.lower():
            return SOIL_PROFILES[key]
    return SOIL_PROFILES["Alluvial"]  # default

# ─── Multilingual Strings ──────────────────────────────────────────────────
LABELS = {
    "en": {
        "title":           "SOIL HEALTH REPORT",
        "subtitle":        "Macronutrient Analysis Card",
        "org":             "Annadata Saathi — Precision Agriculture Platform",
        "sample_details":  "SOIL SAMPLE DETAILS",
        "date":            "Date of Sample",
        "farmer_name":     "Farmer Name",
        "farm_size":       "Farm Size",
        "gps":             "GPS Location",
        "soil_type":       "Soil Type",
        "irrigation":      "Irrigation",
        "soil_profile":    "SOIL TYPE PROFILE",
        "sp_texture":      "Texture",
        "sp_color":        "Colour",
        "sp_ph":           "Natural pH Range",
        "sp_organic":      "Organic Matter",
        "sp_drainage":     "Drainage",
        "sp_crops":        "Best Crops",
        "sp_notes":        "Field Notes",
        "soil_results":    "SOIL TEST RESULTS",
        "macronutrients":  "Macronutrient & Physical Parameters",
        "parameter":       "Parameter",
        "test_value":      "Test Value",
        "unit":            "Unit",
        "rating":          "Rating",
        "normal_level":    "Normal Range",
        "recommendation":  "AGRONOMIC RECOMMENDATIONS",
        "footer":          "Generated by Annadata Saathi | Real-time IoT sensor data | ICAR / STCR standards applied",
        "irrigated":       "Irrigated",
        "rainfed":         "Rainfed",
        "report_id":       "Report ID",
        "params": {
            "ph":    "1.  pH (Soil Reaction)",
            "ec":    "2.  EC (Electrical Conductivity)",
            "n":     "3.  Available Nitrogen (N)",
            "p":     "4.  Available Phosphorus (P₂O₅)",
            "k":     "5.  Available Potassium (K₂O)",
            "moist": "6.  Soil Moisture",
            "temp":  "7.  Soil Temperature",
        },
        "normal": {
            "ph":    "6.5 – 7.5",
            "ec":    "0 – 1 dS/m",
            "n":     "280 – 560 kg/ha",
            "p":     "23 – 57 kg/ha",
            "k":     "145 – 337 kg/ha",
            "moist": "40 – 60 %",
            "temp":  "20 – 30 °C",
        },
    },
    "hi": {
        "title":           "मिट्टी स्वास्थ्य रिपोर्ट",
        "subtitle":        "स्थूल पोषक तत्व विश्लेषण कार्ड",
        "org":             "अन्नदाता साथी — परिशुद्ध कृषि मंच",
        "sample_details":  "मिट्टी नमूना विवरण",
        "date":            "नमूना दिनांक",
        "farmer_name":     "किसान का नाम",
        "farm_size":       "खेत का आकार",
        "gps":             "GPS स्थान",
        "soil_type":       "मिट्टी का प्रकार",
        "irrigation":      "सिंचाई",
        "soil_profile":    "मिट्टी प्रकार परिचय",
        "sp_texture":      "बनावट",
        "sp_color":        "रंग",
        "sp_ph":           "प्राकृतिक pH",
        "sp_organic":      "जैविक पदार्थ",
        "sp_drainage":     "जल निकासी",
        "sp_crops":        "उत्तम फसलें",
        "sp_notes":        "क्षेत्र नोट",
        "soil_results":    "मिट्टी परीक्षण परिणाम",
        "macronutrients":  "स्थूल पोषक एवं भौतिक पैरामीटर",
        "parameter":       "पैरामीटर",
        "test_value":      "परीक्षण मूल्य",
        "unit":            "इकाई",
        "rating":          "श्रेणी",
        "normal_level":    "सामान्य स्तर",
        "recommendation":  "कृषि संबंधी सिफ़ारिशें",
        "footer":          "अन्नदाता साथी द्वारा | IoT सेंसर डेटा | ICAR/STCR मानक",
        "irrigated":       "सिंचित",
        "rainfed":         "वर्षाधारित",
        "report_id":       "रिपोर्ट ID",
        "params": {
            "ph":    "1.  pH (मृदा अभिक्रिया)",
            "ec":    "2.  EC (विद्युत चालकता)",
            "n":     "3.  उपलब्ध नाइट्रोजन (N)",
            "p":     "4.  उपलब्ध फास्फोरस (P₂O₅)",
            "k":     "5.  उपलब्ध पोटेशियम (K₂O)",
            "moist": "6.  मिट्टी की नमी",
            "temp":  "7.  मिट्टी का तापमान",
        },
        "normal": {
            "ph":    "6.5 – 7.5",
            "ec":    "0 – 1 dS/m",
            "n":     "280 – 560 kg/ha",
            "p":     "23 – 57 kg/ha",
            "k":     "145 – 337 kg/ha",
            "moist": "40 – 60 %",
            "temp":  "20 – 30 °C",
        },
    },
    "mr": {
        "title":           "माती आरोग्य अहवाल",
        "subtitle":        "मुख्य पोषकद्रव्य विश्लेषण कार्ड",
        "org":             "अन्नदाता साथी — अचूक शेती व्यासपीठ",
        "sample_details":  "माती नमुना तपशील",
        "date":            "नमुना दिनांक",
        "farmer_name":     "शेतकऱ्याचे नाव",
        "farm_size":       "शेताचा आकार",
        "gps":             "GPS स्थान",
        "soil_type":       "मातीचा प्रकार",
        "irrigation":      "सिंचन",
        "soil_profile":    "माती प्रकार परिचय",
        "sp_texture":      "पोत",
        "sp_color":        "रंग",
        "sp_ph":           "नैसर्गिक pH",
        "sp_organic":      "सेंद्रिय घटक",
        "sp_drainage":     "निचरा",
        "sp_crops":        "उत्तम पिके",
        "sp_notes":        "शेत नोंद",
        "soil_results":    "माती चाचणी निकाल",
        "macronutrients":  "मुख्य पोषकद्रव्ये व भौतिक घटक",
        "parameter":       "घटक",
        "test_value":      "चाचणी मूल्य",
        "unit":            "एकक",
        "rating":          "दर्जा",
        "normal_level":    "सामान्य पातळी",
        "recommendation":  "कृषी शिफारसी",
        "footer":          "अन्नदाता साथी | IoT सेन्सर डेटा | ICAR/STCR मानक",
        "irrigated":       "सिंचित",
        "rainfed":         "पावसावर अवलंबित",
        "report_id":       "अहवाल ID",
        "params": {
            "ph":    "1.  pH (माती प्रतिक्रिया)",
            "ec":    "2.  EC (विद्युत वाहकता)",
            "n":     "3.  उपलब्ध नत्र (N)",
            "p":     "4.  उपलब्ध स्फुरद (P₂O₅)",
            "k":     "5.  उपलब्ध पालाश (K₂O)",
            "moist": "6.  मातीतील ओलावा",
            "temp":  "7.  मातीचे तापमान",
        },
        "normal": {
            "ph":    "6.5 – 7.5",
            "ec":    "0 – 1 dS/m",
            "n":     "280 – 560 kg/ha",
            "p":     "23 – 57 kg/ha",
            "k":     "145 – 337 kg/ha",
            "moist": "40 – 60 %",
            "temp":  "20 – 30 °C",
        },
    }
}

# ─── Rating Logic (STCR / ICAR) ───────────────────────────────────────────

def rate_ph(val: float, lang: str = "en") -> str:
    table = {
        "en": [(0,4.5,"Strongly Acidic"),(4.5,5.5,"Acidic"),(5.5,6.5,"Moderately Acidic"),
               (6.5,7.5,"Normal"),(7.5,8.5,"Moderately Alkaline"),(8.5,9.5,"Alkaline"),(9.5,14,"Strongly Alkaline")],
        "hi": [(0,4.5,"अत्यधिक अम्लीय"),(4.5,5.5,"अम्लीय"),(5.5,6.5,"मध्यम अम्लीय"),
               (6.5,7.5,"सामान्य"),(7.5,8.5,"मध्यम क्षारीय"),(8.5,9.5,"क्षारीय"),(9.5,14,"अत्यधिक क्षारीय")],
        "mr": [(0,4.5,"अतिशय आम्लीय"),(4.5,5.5,"आम्लीय"),(5.5,6.5,"मध्यम आम्लीय"),
               (6.5,7.5,"सामान्य"),(7.5,8.5,"मध्यम क्षारीय"),(8.5,9.5,"क्षारीय"),(9.5,14,"अतिशय क्षारीय")],
    }
    for lo,hi,label in table.get(lang, table["en"]):
        if lo <= val < hi:
            return label
    return "Normal"

def _rate(val, boundaries, en, hi, mr, lang):
    labels = {"en":en,"hi":hi,"mr":mr}.get(lang,en)
    for i,(lo,h) in enumerate(boundaries):
        if lo <= val < h:
            return labels[i]
    return labels[-1]

def rate_ec(v,lang="en"):
    return _rate(v,[(0,.2),(.2,.6),(.6,1),(1,2),(2,999)],
        ["Very Low","Low","Normal","High","Very High (Saline)"],
        ["अत्यंत कम","कम","सामान्य","अधिक","अत्यधिक (लवणीय)"],
        ["अत्यंत कमी","कमी","सामान्य","जास्त","अत्यधिक (क्षारयुक्त)"],lang)

def rate_n(v,lang="en"):
    return _rate(v,[(0,140),(140,280),(280,420),(420,560),(560,9999)],
        ["Very Low","Low","Medium","Sufficient","High"],
        ["बहुत कम","कम","मध्यम","पर्याप्त","अधिक"],
        ["अत्यंत कमी","कमी","मध्यम","पुरेसे","जास्त"],lang)

def rate_p(v,lang="en"):
    return _rate(v,[(0,11),(11,22),(22,56),(56,112),(112,9999)],
        ["Very Low","Low","Medium","Sufficient","High"],
        ["बहुत कम","कम","मध्यम","पर्याप्त","अधिक"],
        ["अत्यंत कमी","कमी","मध्यम","पुरेसे","जास्त"],lang)

def rate_k(v,lang="en"):
    return _rate(v,[(0,55),(55,110),(110,280),(280,560),(560,9999)],
        ["Very Low","Low","Medium","Sufficient","High"],
        ["बहुत कम","कम","मध्यम","पर्याप्त","अधिक"],
        ["अत्यंत कमी","कमी","मध्यम","पुरेसे","जास्त"],lang)

def rate_moist(v,lang="en"):
    return _rate(v,[(0,15),(15,40),(40,60),(60,85),(85,101)],
        ["Very Dry","Dry","Optimal","Wet","Waterlogged"],
        ["अत्यंत सूखा","सूखा","इष्टतम","नम","जलभराव"],
        ["अत्यंत कोरडे","कोरडे","उत्तम","ओले","पाणी साचलेले"],lang)

def rate_temp(v,lang="en"):
    return _rate(v,[(0,15),(15,20),(20,30),(30,35),(35,100)],
        ["Very Cold","Cold","Optimal","Warm","Hot"],
        ["अत्यंत ठंडा","ठंडा","इष्टतम","गर्म","बहुत गर्म"],
        ["अत्यंत थंड","थंड","उत्तम","उष्ण","खूप उष्ण"],lang)

def rating_colour(r_en: str):
    r = r_en.lower()
    if any(x in r for x in ["very low","strongly acid","waterlog","hot","strongly alk"]): return colors.HexColor("#C62828")
    if any(x in r for x in ["low","dry","acidic","alkaline","saline","warm","high (saline)"]): return colors.HexColor("#E65100")
    if any(x in r for x in ["medium","cold"]): return colors.HexColor("#F9A825")
    if any(x in r for x in ["sufficient","normal","optimal"]): return colors.HexColor("#2E7D32")
    if any(x in r for x in ["high"]): return colors.HexColor("#1565C0")
    return colors.HexColor("#546E7A")

def build_recommendations(sensor, soil_type, lang="en"):
    n  = float(sensor.get("nitrogen",   0))
    p  = float(sensor.get("phosphorus", 0))
    k  = float(sensor.get("potassium",  0))
    ph = float(sensor.get("ph",         7.0))
    ec_raw = float(sensor.get("conductivity", 0.0))
    ec = ec_raw/1000.0 if ec_raw > 5 else ec_raw
    moist = float(sensor.get("soil_moisture", 50))

    en,hi,mr = [],[],[]

    # Soil-type specific opening note
    profile = get_soil_profile(soil_type)
    en.append(f"Soil Profile Note: {profile['notes']}")
    hi.append(f"मिट्टी परिचय: {profile['notes']}")
    mr.append(f"माती परिचय: {profile['notes']}")

    if moist < 15:
        en.append("URGENT: Irrigate immediately — soil is critically dry.")
        hi.append("तत्काल: तुरंत सिंचाई करें — मिट्टी बहुत सूखी है।")
        mr.append("तात्काळ: लगेच सिंचन करा — माती खूप कोरडी आहे.")
    elif moist > 85:
        en.append("Reduce irrigation — waterlogging may cause nutrient leaching.")
        hi.append("सिंचाई कम करें — जलभराव से पोषक तत्व बह सकते हैं।")
        mr.append("सिंचन कमी करा — जास्त पाण्यामुळे पोषके वाहतात.")

    if ph < 6.0:
        en.append(f"pH is {ph:.1f} (Acidic). Apply 2–3 t/ha agricultural lime (CaCO3) to raise to 6.5–7.0.")
        hi.append(f"pH {ph:.1f} (अम्लीय) है। कृषि चूना (CaCO3) 2-3 t/ha डालकर pH 6.5-7.0 करें।")
        mr.append(f"pH {ph:.1f} (आम्लीय) आहे. 2-3 t/ha शेती चुना घालून pH 6.5-7.0 वर आणा.")
    elif ph > 8.0:
        en.append(f"pH is {ph:.1f} (Alkaline). Apply gypsum 2 t/ha or elemental sulphur to reduce pH.")
        hi.append(f"pH {ph:.1f} (क्षारीय) है। जिप्सम 2 t/ha या सल्फर डालें।")
        mr.append(f"pH {ph:.1f} (क्षारीय) आहे. जिप्सम 2 t/ha किंवा गंधक वापरा.")

    if n < 140:
        en.append(f"Nitrogen (N) = {n:.0f} kg/ha [Very Low]. Apply 120–150 kg/ha Urea in 3 split doses.")
        hi.append(f"नाइट्रोजन (N) = {n:.0f} kg/ha [बहुत कम]. 120-150 kg/ha यूरिया 3 बार में डालें।")
        mr.append(f"नत्र (N) = {n:.0f} kg/ha [अत्यंत कमी]. 120-150 kg/ha युरिया 3 विभागांत द्या.")
    elif n < 280:
        en.append(f"Nitrogen (N) = {n:.0f} kg/ha [Low]. Apply 60–80 kg/ha Urea or Ammonium Sulphate.")
        hi.append(f"नाइट्रोजन (N) = {n:.0f} kg/ha [कम]. 60-80 kg/ha यूरिया डालें।")
        mr.append(f"नत्र (N) = {n:.0f} kg/ha [कमी]. 60-80 kg/ha युरिया द्या.")

    if p < 11:
        en.append(f"Phosphorus (P) = {p:.0f} kg/ha [Very Low]. Apply 60–80 kg/ha DAP or SSP basal.")
        hi.append(f"फास्फोरस (P) = {p:.0f} kg/ha [बहुत कम]. 60-80 kg/ha DAP/SSP डालें।")
        mr.append(f"स्फुरद (P) = {p:.0f} kg/ha [अत्यंत कमी]. 60-80 kg/ha DAP/SSP द्या.")
    elif p < 22:
        en.append(f"Phosphorus (P) = {p:.0f} kg/ha [Low]. Apply 30–40 kg/ha SSP or DAP.")
        hi.append(f"फास्फोरस (P) = {p:.0f} kg/ha [कम]. 30-40 kg/ha SSP/DAP डालें।")
        mr.append(f"स्फुरद (P) = {p:.0f} kg/ha [कमी]. 30-40 kg/ha SSP/DAP द्या.")

    if k < 55:
        en.append(f"Potassium (K) = {k:.0f} kg/ha [Very Low]. Apply 80–100 kg/ha MOP (Muriate of Potash).")
        hi.append(f"पोटेशियम (K) = {k:.0f} kg/ha [बहुत कम]. 80-100 kg/ha MOP डालें।")
        mr.append(f"पालाश (K) = {k:.0f} kg/ha [अत्यंत कमी]. 80-100 kg/ha MOP द्या.")
    elif k < 110:
        en.append(f"Potassium (K) = {k:.0f} kg/ha [Low]. Apply 40–60 kg/ha MOP.")
        hi.append(f"पोटेशियम (K) = {k:.0f} kg/ha [कम]. 40-60 kg/ha MOP डालें।")
        mr.append(f"पालाश (K) = {k:.0f} kg/ha [कमी]. 40-60 kg/ha MOP द्या.")

    if ec > 1.0:
        en.append(f"EC = {ec:.2f} dS/m [High]. Saline soil risk — apply leaching irrigation + 2 t/ha gypsum.")
        hi.append(f"EC = {ec:.2f} dS/m [अधिक]. मिट्टी लवणीय — लीचिंग + जिप्सम 2 t/ha लगाएं।")
        mr.append(f"EC = {ec:.2f} dS/m [जास्त]. क्षारयुक्त माती — लीचिंग + जिप्सम 2 t/ha वापरा.")

    if not en or (len(en) == 1):
        en.append("Soil nutrient levels are adequate. Maintain current practices and re-test in 3 months.")
        hi.append("मिट्टी पोषक तत्व उचित हैं। 3 महीने में पुनः परीक्षण करें।")
        mr.append("मातीची पोषकता योग्य आहे. 3 महिन्यांनी पुन्हा तपासा.")

    return {"en":en,"hi":hi,"mr":mr}.get(lang, en)


# ─── PDF Builder ──────────────────────────────────────────────────────────

def generate_soil_report(sensor: dict, farmer: dict, language: str = "en") -> bytes:
    """
    Build and return a PDF soil health card as bytes.
    sensor: {ph, nitrogen, phosphorus, potassium, conductivity, soil_moisture, soil_temperature}
    farmer: {name, farm_size, soil_type, gps, irrigation_status}
    """
    lang = language if language in LABELS else "en"
    L    = LABELS[lang]

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
        topMargin=12*mm, bottomMargin=12*mm,
        leftMargin=14*mm, rightMargin=14*mm)

    styles = getSampleStyleSheet()
    W = A4[0] - 28*mm   # usable width

    # ── Helper: build Paragraph with style ──────────────────
    def p(text, align=TA_LEFT, sz=9, bold=False, color=C_BLACK, italic=False, wrap=True):
        fn = "Helvetica-Bold" if bold else ("Helvetica-Oblique" if italic else "Helvetica")
        return Paragraph(
            f"<b>{text}</b>" if bold else text,
            ParagraphStyle("_p", parent=styles["Normal"],
                fontSize=sz, textColor=color, alignment=align,
                fontName=fn, leading=sz*1.35, wordWrap="CJK" if wrap else None)
        )

    def banner(text, bg, fg=C_WHITE, sz=13, bold=True, pad_t=8, pad_b=8):
        t = Table([[p(text, TA_CENTER, sz, bold, fg)]], colWidths=[W])
        t.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1),bg),
            ("TOPPADDING",(0,0),(-1,-1),pad_t),
            ("BOTTOMPADDING",(0,0),(-1,-1),pad_b),
        ]))
        return t

    def kv_table(rows, cw_left=0.40):
        """2-column key-value table."""
        data = [[p(k,TA_LEFT,9,False,C_BLACK), p(v,TA_LEFT,9,True,C_BLACK)]
                for k,v in rows]
        t = Table(data, colWidths=[W*cw_left, W*(1-cw_left)])
        t.setStyle(TableStyle([
            ("ROWBACKGROUNDS",(0,0),(-1,-1),[C_PALE_GREEN, C_LIGHT_GREEN]),
            ("GRID",(0,0),(-1,-1),0.4,colors.HexColor("#A5D6A7")),
            ("TOPPADDING",(0,0),(-1,-1),4),
            ("BOTTOMPADDING",(0,0),(-1,-1),4),
            ("LEFTPADDING",(0,0),(-1,-1),7),
        ]))
        return t

    story = []

    # ════════════════════════════════════════════════════════
    # SECTION 1 — HEADER BLOCK
    # ════════════════════════════════════════════════════════
    # Top tricolour stripe (saffron-white-green like Indian flag)
    stripe = Table([["","",[p("",TA_CENTER)]]], colWidths=[W/3]*3)
    stripe.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(0,0),colors.HexColor("#FF9933")),   # saffron
        ("BACKGROUND",(1,0),(1,0),C_WHITE),
        ("BACKGROUND",(2,0),(2,0),colors.HexColor("#138808")),   # green
        ("TOPPADDING",(0,0),(-1,-1),3),
        ("BOTTOMPADDING",(0,0),(-1,-1),3),
        ("GRID",(0,0),(-1,-1),0,C_WHITE),
    ]))
    story.append(stripe)

    story.append(banner(L["title"], C_HEADER_BG, C_WHITE, 15, True, 10, 4))
    story.append(banner(L["subtitle"], C_HEADER_BG, C_GOLD, 10, False, 2, 4))
    story.append(banner(L["org"], C_HEADER_BG, colors.HexColor("#A5D6A7"), 8, False, 2, 8))
    story.append(Spacer(1, 5))

    # ════════════════════════════════════════════════════════
    # SECTION 2 — FARM DETAILS
    # ════════════════════════════════════════════════════════
    story.append(banner(L["sample_details"], C_SUBHDR_BG, C_WHITE, 10, True, 5, 5))

    now      = datetime.now().strftime("%d %b %Y   %H:%M")
    irr_txt  = L["irrigated"] if farmer.get("irrigation_status", True) else L["rainfed"]
    soil_t   = farmer.get("soil_type", "Alluvial")
    gps_txt  = farmer.get("gps") or "N/A"
    farm_sz  = str(farmer.get("farm_size","—"))
    if not farm_sz.lower().endswith("acre"):
        farm_sz += " Acres"
    report_id = datetime.now().strftime("AS-%Y%m%d-%H%M")

    detail_rows = [
        (L["report_id"],   report_id),
        (L["date"],        now),
        (L["farmer_name"], farmer.get("name","—")),
        (L["farm_size"],   f"{farm_sz}   |   {irr_txt}"),
        (L["gps"],         gps_txt),
        (L["soil_type"],   soil_t),
    ]
    story.append(kv_table(detail_rows))
    story.append(Spacer(1, 6))

    # ════════════════════════════════════════════════════════
    # SECTION 3 — SOIL TYPE PROFILE (NEW)
    # ════════════════════════════════════════════════════════
    story.append(banner(L["soil_profile"], C_MID_GREEN, C_WHITE, 10, True, 5, 5))

    sp = get_soil_profile(soil_t)
    sp_rows = [
        (L["sp_texture"],  sp["texture"]),
        (L["sp_color"],    sp["color"]),
        (L["sp_ph"],       sp["ph_range"]),
        (L["sp_organic"],  sp["organic"]),
        (L["sp_drainage"], sp["drainage"]),
        (L["sp_crops"],    sp["best_crops"]),
        (L["sp_notes"],    sp["notes"]),
    ]
    # Build profile table with blue stripe
    sp_data = [[p(k,TA_LEFT,9,False,C_DARK_GREEN), p(v,TA_LEFT,9,False,C_BLACK)]
               for k,v in sp_rows]
    sp_tbl = Table(sp_data, colWidths=[W*0.28, W*0.72])
    sp_tbl.setStyle(TableStyle([
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[C_STRIPE_BLU, colors.HexColor("#F0F4C3")]),
        ("GRID",(0,0),(-1,-1),0.4,colors.HexColor("#90CAF9")),
        ("TOPPADDING",(0,0),(-1,-1),4),
        ("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(0,0),(-1,-1),7),
        ("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),
    ]))
    story.append(sp_tbl)
    story.append(Spacer(1, 6))

    # ════════════════════════════════════════════════════════
    # SECTION 4 — SENSOR RESULTS TABLE
    # ════════════════════════════════════════════════════════
    story.append(banner(L["soil_results"], C_SUBHDR_BG, C_WHITE, 10, True, 5, 5))
    story.append(banner(L["macronutrients"], C_LIGHT_GREEN, C_DARK_GREEN, 9, True, 4, 4))

    # Parse sensor values
    ph    = float(sensor.get("ph",               7.0))
    ec_r  = float(sensor.get("conductivity",     350.0))
    ec    = ec_r/1000.0 if ec_r > 5 else ec_r
    n_v   = float(sensor.get("nitrogen",          0))
    p_v   = float(sensor.get("phosphorus",         0))
    k_v   = float(sensor.get("potassium",          0))
    mo    = float(sensor.get("soil_moisture",     40))
    te    = float(sensor.get("soil_temperature",  25))

    def rc(rating_en):
        col = rating_colour(rating_en)
        return Paragraph(
            f"<b>{rating_en}</b>",
            ParagraphStyle("rc",fontSize=8,textColor=C_WHITE,
                alignment=TA_CENTER,backColor=col,fontName="Helvetica-Bold",leading=12))

    # Table header
    hdr = [
        p(L["parameter"],    TA_CENTER, 8, True, C_WHITE),
        p(L["test_value"],   TA_CENTER, 8, True, C_WHITE),
        p(L["unit"],         TA_CENTER, 8, True, C_WHITE),
        p(L["rating"],       TA_CENTER, 8, True, C_WHITE),
        p(L["normal_level"], TA_CENTER, 8, True, C_WHITE),
    ]
    cw = [W*0.31, W*0.13, W*0.10, W*0.22, W*0.24]

    norm = L["normal"]
    Lp   = L["params"]

    rows_raw = [
        (Lp["ph"],    f"{ph:.2f}",    "—",      rate_ph(ph,lang),    rate_ph(ph,"en"),    norm["ph"]),
        (Lp["ec"],    f"{ec:.3f}",    "dS/m",   rate_ec(ec,lang),    rate_ec(ec,"en"),    norm["ec"]),
        (Lp["n"],     f"{n_v:.1f}",   "kg/ha",  rate_n(n_v,lang),    rate_n(n_v,"en"),    norm["n"]),
        (Lp["p"],     f"{p_v:.1f}",   "kg/ha",  rate_p(p_v,lang),    rate_p(p_v,"en"),    norm["p"]),
        (Lp["k"],     f"{k_v:.1f}",   "kg/ha",  rate_k(k_v,lang),    rate_k(k_v,"en"),    norm["k"]),
        (Lp["moist"], f"{mo:.1f}",    "%",      rate_moist(mo,lang), rate_moist(mo,"en"), norm["moist"]),
        (Lp["temp"],  f"{te:.1f}",    "°C",     rate_temp(te,lang),  rate_temp(te,"en"),  norm["temp"]),
    ]

    tbl_data = [hdr]
    row_bgs  = []
    for i,(name,val,unit,rloc,ren,norm_) in enumerate(rows_raw):
        tbl_data.append([
            p(name, TA_LEFT,   8),
            p(val,  TA_CENTER, 8, True),
            p(unit, TA_CENTER, 8),
            rc(rloc),
            p(norm_, TA_CENTER, 8),
        ])
        row_bgs.append(C_PALE_GREEN if i%2==0 else C_ROW_ALT)

    tbl_style = [
        ("BACKGROUND",(0,0),(-1,0), C_MID_GREEN),
        ("GRID",(0,0),(-1,-1),0.5, colors.HexColor("#A5D6A7")),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("TOPPADDING",(0,0),(-1,-1),5),
        ("BOTTOMPADDING",(0,0),(-1,-1),5),
        ("LEFTPADDING",(0,0),(-1,-1),4),
        ("RIGHTPADDING",(0,0),(-1,-1),4),
    ]
    for i,bg in enumerate(row_bgs):
        tbl_style.append(("BACKGROUND",(0,i+1),(-1,i+1),bg))

    nt = Table(tbl_data, colWidths=cw, repeatRows=1)
    nt.setStyle(TableStyle(tbl_style))
    story.append(nt)
    story.append(Spacer(1, 6))

    # ════════════════════════════════════════════════════════
    # SECTION 5 — RECOMMENDATIONS
    # ════════════════════════════════════════════════════════
    story.append(banner(L["recommendation"], C_HEADER_BG, C_WHITE, 10, True, 5, 5))

    recs = build_recommendations(sensor, soil_t, lang)
    rec_data = []
    for i,rec in enumerate(recs):
        bg = C_PALE_GREEN if i%2==0 else C_ROW_ALT
        rec_data.append((rec, bg))

    rt = Table([[p(r, TA_LEFT, 8.5)] for r,_ in rec_data], colWidths=[W])
    rs = [
        ("GRID",(0,0),(-1,-1),0.4,colors.HexColor("#C8E6C9")),
        ("TOPPADDING",(0,0),(-1,-1),5),
        ("BOTTOMPADDING",(0,0),(-1,-1),5),
        ("LEFTPADDING",(0,0),(-1,-1),10),
    ]
    for i,(_,bg) in enumerate(rec_data):
        rs.append(("BACKGROUND",(0,i),(0,i),bg))
    rt.setStyle(TableStyle(rs))
    story.append(rt)
    story.append(Spacer(1, 8))

    # ════════════════════════════════════════════════════════
    # SECTION 6 — COLOUR LEGEND
    # ════════════════════════════════════════════════════════
    story.append(HRFlowable(width=W, thickness=0.75, color=C_MID_GREEN))
    story.append(Spacer(1, 3))

    leg = [
        ("Very Low / Strongly Acidic","#C62828"),
        ("Low / Acidic / Alkaline",   "#E65100"),
        ("Medium",                     "#F9A825"),
        ("Sufficient / Normal",        "#2E7D32"),
        ("High / Excess",              "#1565C0"),
    ]
    lc = []
    for lb,hx in leg:
        lc.append(Paragraph(
            f"<b>{lb}</b>",
            ParagraphStyle("lc",fontSize=6.5,textColor=C_WHITE,
                backColor=colors.HexColor(hx),alignment=TA_CENTER,
                fontName="Helvetica-Bold",leading=10,
                leftPadding=3,rightPadding=3)))
    lt = Table([lc], colWidths=[W/5]*5)
    lt.setStyle(TableStyle([
        ("TOPPADDING",(0,0),(-1,-1),3),
        ("BOTTOMPADDING",(0,0),(-1,-1),3),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ]))
    story.append(lt)
    story.append(Spacer(1, 5))

    # Bottom tricolour stripe
    story.append(stripe)
    story.append(Spacer(1, 3))

    # Footer
    ft = Table([[p(L["footer"],TA_CENTER,7.5,False,colors.HexColor("#757575"),True)]], colWidths=[W])
    ft.setStyle(TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER"),("TOPPADDING",(0,0),(-1,-1),2)]))
    story.append(ft)

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()
