#define SOIL_PIN 34

int dryValue = 3500;   // dry air
int wetValue = 1200;   // water

float getConductivity(int raw) {
  float cond = (float)(dryValue - raw) * 1000.0 / (dryValue - wetValue);
  cond = constrain(cond, 0, 1000);
  return cond;
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


String fertilizerAdvice(int N, int P, int K) {
  if (N < 40) return "Add Urea (Nitrogen)";
  if (P < 30) return "Add DAP (Phosphorus)";
  if (K < 35) return "Add MOP (Potassium)";
  return "Soil nutrients are sufficient";
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n🌱 Smart Soil Analyzer (Estimated NPK Model) 🌱");
}

void loop() {
  int rawValue = analogRead(SOIL_PIN);

  int moisturePercent = map(rawValue, dryValue, wetValue, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  float conductivity = getConductivity(rawValue);

  int N = estimateNitrogen(conductivity);
  int P = estimatePhosphorus(conductivity);
  int K = estimatePotassium(conductivity);

  Serial.println("\n----------- SOIL REPORT -----------");
  Serial.print("Raw Value: "); Serial.println(rawValue);

  Serial.print("Moisture: ");
  Serial.print(moisturePercent);
  Serial.println("%");

  Serial.print("Conductivity (uS/cm): ");
  Serial.println(conductivity);

  Serial.print("Nitrogen (mg/kg): ");
  Serial.println(N);

  Serial.print("Phosphorus (mg/kg): ");
  Serial.println(P);

  Serial.print("Potassium (mg/kg): ");
  Serial.println(K);

  Serial.print("Advice: ");
  Serial.println(fertilizerAdvice(N, P, K));
  Serial.println("-----------------------------------");

  delay(500);
}
