// Arduino Pump Control via Serial
#define PUMP_PIN 5

void setup() {
  Serial.begin(9600);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);
  Serial.println("Pump Ready");
  
  // Test on startup
  digitalWrite(PUMP_PIN, HIGH);
  delay(2000);
  digitalWrite(PUMP_PIN, LOW);
  Serial.println("Startup test done");
}

void loop() {
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    
    if (cmd == '1') {
      digitalWrite(PUMP_PIN, HIGH);
      Serial.println("PUMP_ON");
    }
    else if (cmd == '0') {
      digitalWrite(PUMP_PIN, LOW);
      Serial.println("PUMP_OFF");
    }
  }
}
