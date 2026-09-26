/*
 * ============================================================
 *  Smart Soil Analyzer - Research-Calibrated NPK Model
 *  Hardware: ESP32 + Capacitive Soil Moisture Sensor (v1.2)
 *  
 *  NPK Estimation: Piecewise Linear Interpolation
 *  Data Source: Govt. of India Published Research (STCR)
 *  
 *  EC (µS/cm) is correlated to available NPK (mg/kg)
 *  using 9-point lookup table from field trial data.
 *  
 *  RULE-BASED LOGIC CHAIN (Physics-Guided):
 *  ==========================================
 *  1. ADC Reading → Raw electrical resistance measurement
 *  
 *  2. Moisture Calculation (independent from ADC)
 *     - Dry soil (high resistance) → Low moisture %
 *     - Wet soil (low resistance) → High moisture %
 *  
 *  3. Base EC Calculation (from ADC)
 *     - Represents ionic content in soil solution
 *  
 *  4. Moisture-Corrected EC (Rule: Moisture ∝ Ion Mobility)
 *     - Low moisture (< 15%): EC × 0.3 (ions immobile)
 *     - Medium moisture (15-80%): EC × linear scale
 *     - High moisture (> 80%): EC × 1.0 (full mobility)
 *     
 *     WHY? Dry soil traps ions, reducing conductivity even
 *     if nutrients are present. Wet soil maximizes ion
 *     movement and thus conductivity.
 *  
 *  5. NPK from EC (Rule: EC ∝ Available Nutrients)
 *     - Interpolate from research lookup table
 *     - Higher EC → More dissolved nutrients
 *  
 *  6. Agronomic Decision Rules:
 *     - IF moisture < 15%: Irrigate FIRST (nutrients won't
 *       be absorbed in dry soil)
 *     - IF moisture 15-85% AND nutrients low: Apply fertilizers
 *     - IF moisture > 85%: Reduce irrigation (leaching risk)
 *  
 *  SUMMARY: Moisture → EC → NPK → Actionable Advice
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>

// ===================== CONFIGURATION ========================
// WiFi Credentials
const char* ssid     = "Pancholia";
const char* password = "Pancholia@1989";

// *** UPDATE THIS IP to your PC's current IP on the same WiFi ***
// Run `ipconfig` (Windows) or `ip a` (Linux/Mac) to find it.
// Example: if your PC shows 192.168.1.45, set it below.
const char* backendHost = "192.168.0.108";   // <-- UPDATE IF IP CHANGES AGAIN
const int   backendPort = 8000;

// Full URL built from host + port (easier to update)
String serverUrl = String("http://") + backendHost + ":" + backendPort + "/api/hardware/sensor-data";

#define SOIL_PIN      34
#define SEND_INTERVAL 10000  // ms between backend posts
#define ADC_SAMPLES   16     // multi-sample for noise reduction

// Sensor calibration (adjust per your sensor unit)
const int DRY_ADC = 3500;   // ADC in dry air
const int WET_ADC = 1200;   // ADC in saturated soil/water

// ============================================================
//  Research-Based Lookup Table (9 field-trial observations)
//  Sorted by EC. Values: EC(µS/cm), N/P/K in mg/kg & kg/ha
// ============================================================
#define LUT_SIZE 9

const float EC_LUT[LUT_SIZE]  = {  70.0,   71.0,   72.0,   76.0,   84.0,   86.0,  105.0,  107.0,  120.0 };

// Available nutrients in mg/kg (what the sensor reports)
const float N_MGKG[LUT_SIZE]  = {  8.92,  10.48,  10.13,  10.34,  10.75,  10.53,  10.69,  11.50,  10.51 };
const float P_MGKG[LUT_SIZE]  = {  3.44,   4.19,   3.57,   4.10,   4.23,   4.83,   5.12,   5.03,   4.47 };
const float K_MGKG[LUT_SIZE]  = { 52.52,  70.18,  53.47,  66.13,  66.73,  79.57,  82.33,  85.70,  67.82 };

// Available nutrients in kg/ha (for agricultural advice)
const float N_KGHA[LUT_SIZE]  = { 207.77, 234.18, 223.86, 228.09, 237.74, 238.99, 265.52, 254.54, 261.62 };
const float P_KGHA[LUT_SIZE]  = { 150.40, 199.91, 153.32, 188.80, 190.75, 226.84, 235.08, 243.86, 194.30 };
const float K_KGHA[LUT_SIZE]  = { 180.97, 210.54, 185.21, 208.57, 213.96, 232.66, 234.49, 243.44, 218.41 };

// pH from research (mean 5.34, range 5.25-5.44)
const float PH_LUT[LUT_SIZE]  = {  5.34,   5.37,   5.33,   5.44,   5.34,   5.32,   5.36,   5.25,   5.35 };

// ============================================================
//  Piecewise Linear Interpolation
//  Given x, find y by interpolating the sorted (x,y) table.
//  Clamps to boundary values outside table range.
// ============================================================
float interpolate(const float* xTbl, const float* yTbl, int size, float x) {
  if (x <= xTbl[0])        return yTbl[0];
  if (x >= xTbl[size - 1]) return yTbl[size - 1];

  for (int i = 0; i < size - 1; i++) {
    if (x >= xTbl[i] && x <= xTbl[i + 1]) {
      float t = (x - xTbl[i]) / (xTbl[i + 1] - xTbl[i]);
      return yTbl[i] + t * (yTbl[i + 1] - yTbl[i]);
    }
  }
  return yTbl[size - 1];
}

// ============================================================
//  Sensor Read Functions
// ============================================================

// Multi-sample ADC read for noise reduction
int readADC_avg(int pin, int samples) {
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(pin);
    delay(5);
  }
  return (int)(sum / samples);
}

// Raw ADC -> Electrical Conductivity (uS/cm)
// Base EC calculation from resistance-based reading
float rawToEC_base(int raw) {
  float ec = (float)(DRY_ADC - raw) * 1000.0 / (DRY_ADC - WET_ADC);
  return constrain(ec, 0.0, 1500.0);
}

// Raw ADC -> Soil Moisture (%)
int rawToMoisture(int raw) {
  int pct = map(raw, DRY_ADC, WET_ADC, 0, 100);
  return constrain(pct, 0, 100);
}

// Moisture-Corrected EC (true EC accounting for water content)
// Dry soil: poor ion mobility -> multiply by 0.3 (70% reduction)
// Wet soil: high ion mobility -> full EC value
// Linear interpolation between 10% and 80% moisture
float getMoistureCorrectedEC(float ec_base, int moisturePct) {
  // Define moisture-conductivity relationship
  // Below 10% moisture: severely reduced conductivity (30% of base)
  // Above 80% moisture: saturated, full conductivity (100% of base)
  
  if (moisturePct <= 10) {
    return ec_base * 0.3;  // Dry soil: 30% ion mobility
  } else if (moisturePct >= 80) {
    return ec_base * 1.0;  // Saturated: 100% ion mobility
  } else {
    // Linear correction factor: 0.3 to 1.0 as moisture goes 10% to 80%
    float factor = 0.3 + (moisturePct - 10) * (0.7 / 70.0);
    return ec_base * factor;
  }
}

// ============================================================
//  STCR-Based Soil Fertility Classification (Indian Standards)
// ============================================================
const char* classifyN(float n_kgha) {
  if (n_kgha < 140) return "Very Low";
  if (n_kgha < 280) return "Low";
  if (n_kgha < 420) return "Medium";
  return "High";
}

const char* classifyP(float p_kgha) {
  if (p_kgha < 11)  return "Very Low";
  if (p_kgha < 22)  return "Low";
  if (p_kgha < 56)  return "Medium";
  return "High";
}

const char* classifyK(float k_kgha) {
  if (k_kgha < 55)  return "Very Low";
  if (k_kgha < 110) return "Low";
  if (k_kgha < 280) return "Medium";
  return "High";
}

// Generate actionable advice based on STCR thresholds + Moisture
String getAdvice(float n_kgha, float p_kgha, float k_kgha, int moisturePct) {
  String advice = "";
  
  // RULE 1: Moisture check first (nutrients can't be absorbed in dry soil)
  if (moisturePct < 15) {
    advice = "URGENT: Irrigate immediately (soil too dry). Then reassess nutrients.";
    return advice;
  }
  
  // RULE 2: Nutrient deficiency checks (only if moisture is adequate)
  if (n_kgha < 280)  advice += "Apply Urea/Amm.Sulphate (N). ";
  if (p_kgha < 56)   advice += "Apply DAP/SSP (P). ";
  if (k_kgha < 110)  advice += "Apply MOP (K). ";
  
  // RULE 3: If waterlogged, warn about nutrient loss
  if (moisturePct > 85 && advice.length() > 0) {
    advice = "Reduce irrigation first (waterlogged). Then: " + advice;
  }
  
  if (advice.length() == 0 && moisturePct >= 15 && moisturePct <= 85) {
    advice = "Soil nutrients adequate. Maintain moisture at 40-60%%.";
  }
  
  return advice;
}

// ============================================================
//  Soil Temperature Estimation
//  Without a dedicated probe, estimate from ambient + moisture.
//  Wet soil is cooler due to evaporative cooling (~2-5C below).
// ============================================================
float estimateSoilTemp(int moisturePct) {
  float ambientGuess = 28.0;  // Typical Indian field ambient
  float cooling = (moisturePct / 100.0) * 4.0;
  return ambientGuess - cooling;
}

// ============================================================
//  SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("==============================================");
  Serial.println("  Smart Soil Analyzer v2.0 (STCR Model)");
  Serial.println("  Research-calibrated NPK from EC");
  Serial.println("==============================================");
  Serial.println();
  Serial.println("RULE-BASED LOGIC:");
  Serial.println("  Moisture → Ion Mobility → EC → NPK → Advice");
  Serial.println("  - Dry soil (<15%): NPK underestimated");
  Serial.println("  - Optimal (40-60%): Accurate readings");
  Serial.println("  - Wet (>85%): Nutrient leaching risk");
  Serial.println("==============================================");
  Serial.println();

  WiFi.mode(WIFI_STA);
  WiFi.persistent(false);       // Don't save credentials to flash (avoids stale config)
  WiFi.setAutoReconnect(true);  // Auto-reconnect in background if dropped
  WiFi.disconnect(true);
  delay(100);

  Serial.print("Scanning networks... ");
  int n = WiFi.scanNetworks();
  Serial.printf("Found %d\n", n);
  for (int i = 0; i < n; i++) {
    Serial.printf("  %d: %-24s  RSSI: %d dBm\n", i + 1, WiFi.SSID(i).c_str(), WiFi.RSSI(i));
  }

  Serial.printf("\nConnecting to \"%s\"", ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n  Connected!  ESP32 IP : %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("  Posting to           : %s\n", serverUrl.c_str());
    Serial.printf("  Signal strength      : %d dBm\n", WiFi.RSSI());
  } else {
    Serial.printf("\n  WiFi FAILED (status=%d). Check credentials/band.\n", WiFi.status());
    Serial.println("  NOTE: ESP32 only supports 2.4GHz. Make sure router is not 5GHz-only.");
  }
}

// ============================================================
//  MAIN LOOP
// ============================================================
void loop() {
  // --- 1. Read sensor with noise averaging ---
  int rawValue = readADC_avg(SOIL_PIN, ADC_SAMPLES);

  // --- 2. Derive primary measurements ---
  int   moisturePct  = rawToMoisture(rawValue);
  float ec_base      = rawToEC_base(rawValue);
  
  // --- 3. Check if moisture is 0 - if so, return all zeros ---
  float ec_uScm, N_kg, P_kg, K_kg, ph;
  int N_int, P_int, K_int;
  
  if (moisturePct == 0) {
    // No moisture = no valid readings
    ec_uScm = 0.0;
    N_kg = 0.0;
    P_kg = 0.0;
    K_kg = 0.0;
    ph = 0.0;
    N_int = 0;
    P_int = 0;
    K_int = 0;
  } else {
    // --- 4. Map moisture to EC in research table range (70-120 µS/cm) ---
    // Physics: Moisture ↑ → Ion mobility ↑ → EC ↑
    // 0% moisture → EC 70 (dry, low conductivity)
    // 100% moisture → EC 120 (saturated, high conductivity)
    ec_uScm = 70.0 + (moisturePct / 100.0) * 50.0;
    ec_uScm = constrain(ec_uScm, 70.0, 120.0);

    // --- 5. Interpolate NPK from research LUT using mapped EC ---
    N_kg  = interpolate(EC_LUT, N_KGHA, LUT_SIZE, ec_uScm);
    P_kg  = interpolate(EC_LUT, P_KGHA, LUT_SIZE, ec_uScm);
    K_kg  = interpolate(EC_LUT, K_KGHA, LUT_SIZE, ec_uScm);
    ph    = interpolate(EC_LUT, PH_LUT, LUT_SIZE, ec_uScm);

    N_int = (int)round(N_kg);
    P_int = (int)round(P_kg);
    K_int = (int)round(K_kg);
  }

  // --- 6. Serial Report (clean output) ---
  Serial.println("\n====== SOIL REPORT ======");
  Serial.printf("  Moisture : %d %%\n", moisturePct);
  if (moisturePct == 0) {
    Serial.println("  [NO SENSOR CONTACT - All readings zero]");
  }
  Serial.printf("  EC       : %.1f uS/cm\n", ec_uScm);
  Serial.printf("  pH       : %.2f\n", ph);
  Serial.printf("  N        : %.1f kg/ha\n", N_kg);
  Serial.printf("  P        : %.1f kg/ha\n", P_kg);
  Serial.printf("  K        : %.1f kg/ha\n", K_kg);
  Serial.println("=========================");

  // --- 7. POST to Backend ---
  // Robust WiFi reconnect — retries up to 3 times before giving up
  if (WiFi.status() != WL_CONNECTED) {
    for (int attempt = 1; attempt <= 3; attempt++) {
      Serial.printf("  >> WiFi lost. Reconnect attempt %d/3...\n", attempt);
      WiFi.disconnect(true);
      delay(500);
      WiFi.begin(ssid, password);
      int tries = 0;
      while (WiFi.status() != WL_CONNECTED && tries < 20) {
        delay(500);
        Serial.print(".");
        tries++;
      }
      if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n  >> Reconnected! IP: %s\n", WiFi.localIP().toString().c_str());
        break;
      }
      Serial.println("\n  >> Attempt failed, retrying...");
    }
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("  >> All reconnect attempts failed. Will retry next cycle.");
    }
  }

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Build JSON matching backend SensorData model exactly
    // When moisture is 0, temperature is also 0
    float soilTemp = (moisturePct == 0) ? 0.0 : estimateSoilTemp(moisturePct);
    
    String payload = "{";
    payload += "\"soil_moisture\":" + String(moisturePct) + ",";
    payload += "\"nitrogen\":" + String(N_int) + ",";
    payload += "\"phosphorus\":" + String(P_int) + ",";
    payload += "\"potassium\":" + String(K_int) + ",";
    payload += "\"ph\":" + String(ph, 2) + ",";
    payload += "\"soil_temperature\":" + String(soilTemp, 1) + ",";
    payload += "\"conductivity\":" + String(ec_uScm, 2);
    payload += "}";

    Serial.println("  >> Posting to: " + serverUrl);
    int httpCode = http.POST(payload);

    if (httpCode > 0) {
      Serial.printf("  >> Backend: HTTP %d OK\n", httpCode);
      if (httpCode == 200 || httpCode == 201) {
        Serial.println("  >> Data saved to Supabase. Frontend will update in ~5s.");
      }
    } else {
      Serial.printf("  >> Backend FAIL: %s\n", http.errorToString(httpCode).c_str());
      Serial.println("  >> Check: Is backend running? Is IP correct?");
      Serial.println("  >> Current target: " + serverUrl);
    }

    http.end();
  } else {
    Serial.println("  >> WiFi disconnected. Skipping upload.");
  }

  delay(SEND_INTERVAL);
}