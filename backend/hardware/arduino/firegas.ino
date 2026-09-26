#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid        = "One Plus +";
const char* password    = "Megh152006";
const char* backendHost = "172.17.191.229";  // <-- run ipconfig to confirm
const int   backendPort = 8000;

#define MQ2_A0_PIN    35
#define MQ2_D0_PIN    34
#define FLAME1_PIN    26
#define FLAME2_PIN    27
#define SEND_INTERVAL 10000

String serverUrl;

void reconnectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.println(">> WiFi lost. Reconnecting...");
  WiFi.disconnect(true);
  delay(500);
  WiFi.begin(ssid, password);
  for (int i = 0; i < 20 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500); Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("\n>> Reconnected! IP: %s\n", WiFi.localIP().toString().c_str());
  else
    Serial.println("\n>> Reconnect failed.");
}

void setup() {
  Serial.begin(115200);
  pinMode(MQ2_D0_PIN, INPUT);
  pinMode(FLAME1_PIN, INPUT);
  pinMode(FLAME2_PIN, INPUT);

  serverUrl = String("http://") + backendHost + ":" + backendPort + "/api/hardware/fire-gas";

  WiFi.mode(WIFI_STA);
  WiFi.persistent(false);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid, password);

  Serial.printf("\nConnecting to \"%s\"", ssid);
  for (int i = 0; i < 30 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500); Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nConnected! ESP32 IP : %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("Posting to          : %s\n", serverUrl.c_str());
  } else {
    Serial.println("\nWiFi FAILED. Check SSID/password.");
  }
}

void loop() {
  int mq2_analog = analogRead(MQ2_A0_PIN);
  int mq2_d0     = digitalRead(MQ2_D0_PIN);
  int flame1     = digitalRead(FLAME1_PIN);
  int flame2     = digitalRead(FLAME2_PIN);

  String fire_status = (flame1 == LOW || flame2 == LOW) ? "fire" : "safe";

  Serial.printf("\nMQ2: %d | D0: %d | Flame1: %d | Flame2: %d | Status: %s\n",
                mq2_analog, mq2_d0, flame1, flame2, fire_status.c_str());

  reconnectWiFi();

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(8000);

    String payload = "{";
    payload += "\"mq2_value\":"     + String(mq2_analog) + ",";
    payload += "\"mq2_d0\":"        + String(mq2_d0)     + ",";
    payload += "\"flame1\":"        + String(flame1)      + ",";
    payload += "\"flame2\":"        + String(flame2)      + ",";
    payload += "\"fire_status\":\"" + fire_status         + "\"";
    payload += "}";

    int httpCode = http.POST(payload);
    if (httpCode == 200 || httpCode == 201) {
      Serial.printf(">> SUCCESS: HTTP %d\n", httpCode);
    } else if (httpCode > 0) {
      Serial.printf(">> HTTP %d: %s\n", httpCode, http.getString().c_str());
    } else {
      Serial.printf(">> FAIL: %s | URL: %s\n", http.errorToString(httpCode).c_str(), serverUrl.c_str());
    }
    http.end();
  } else {
    Serial.println(">> WiFi disconnected.");
  }

  delay(SEND_INTERVAL);
}
