#include <WiFi.h>
#include <HTTPClient.h>

// WiFi Credentials
const char* ssid = "VPPCOE&VA-WIF";
const char* password = "";

// Backend API Endpoint
const char* serverUrl = "https://172.16.28.196:8000/api/hardware/sensor-data";

#define SOIL_PIN 34

int dryValue = 3500;
int wetValue = 1200;

float getConductivity(int raw) {
  return map(raw, dryValue, wetValue, 0, 1000);
}

int estimateNitrogen(float cond) {
  return cond * 0.08;
}

int estimatePhosphorus(float cond) {
  return cond * 0.05;
}

int estimatePotassium(float cond) {
  return cond * 0.07;
}

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  int rawValue = analogRead(SOIL_PIN);
  int moisturePercent = map(rawValue, dryValue, wetValue, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);
  
  float conductivity = getConductivity(rawValue);
  int N = estimateNitrogen(conductivity);
  int P = estimatePhosphorus(conductivity);
  int K = estimatePotassium(conductivity);
  
  // Print to Serial
  Serial.println("\n----------- SOIL REPORT -----------");
  Serial.printf("Moisture: %d%%\n", moisturePercent);
  Serial.printf("N: %d, P: %d, K: %d\n", N, P, K);
  
  // Send to Backend
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient https;
    https.begin(serverUrl);
    https.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    String payload = "{";
    payload += "\"soil_moisture\":" + String(moisturePercent) + ",";
    payload += "\"nitrogen\":" + String(N) + ",";
    payload += "\"phosphorus\":" + String(P) + ",";
    payload += "\"potassium\":" + String(K) + ",";
    payload += "\"conductivity\":" + String(conductivity);
    payload += "}";
    
    int httpCode = https.POST(payload);
    
    if (httpCode > 0) {
      Serial.printf("✅ Data sent! Response: %d\n", httpCode);
      Serial.println(https.getString());
    } else {
      Serial.printf("❌ Send failed: %s\n", https.errorToString(httpCode).c_str());
    }
    
    https.end();
  }
  
  delay(10000); // Send every 10 seconds
}
