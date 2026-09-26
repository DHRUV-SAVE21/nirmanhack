#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

// WiFi Credentials
const char* ssid = "VPPCOE&VA-WIFI";
const char* password = "";

// Pump Control Pin
#define PUMP_PIN 5  // GPIO5 (D1 on NodeMCU)

ESP8266WebServer server(80);
bool pumpStatus = false;

void setup() {
  Serial.begin(115200);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);
  
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
  
  // API Endpoints
  server.on("/pump/on", HTTP_GET, []() {
    digitalWrite(PUMP_PIN, HIGH);
    pumpStatus = true;
    Serial.println("💧 Pump ON");
    server.send(200, "application/json", "{\"status\":\"on\",\"message\":\"Pump started\"}");
  });
  
  server.on("/pump/off", HTTP_GET, []() {
    digitalWrite(PUMP_PIN, LOW);
    pumpStatus = false;
    Serial.println("🛑 Pump OFF");
    server.send(200, "application/json", "{\"status\":\"off\",\"message\":\"Pump stopped\"}");
  });
  
  server.on("/pump/status", HTTP_GET, []() {
    String status = pumpStatus ? "on" : "off";
    server.send(200, "application/json", "{\"status\":\"" + status + "\"}");
  });
  
  server.begin();
  Serial.println("🚀 Server started");
}

void loop() {
  server.handleClient();
}
