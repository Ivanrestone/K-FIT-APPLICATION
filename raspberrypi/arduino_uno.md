const int RELAY_PIN = A5;
const int BOARD_LED = 13;

void setup() {
  Serial.begin(9600);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BOARD_LED, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Start LOCKED

  // Reboot indicator: Blink Pin 13 3 times on boot
  for (int i = 0; i < 3; i++) {
    digitalWrite(BOARD_LED, HIGH);
    delay(80);
    digitalWrite(BOARD_LED, LOW);
    delay(80);
  }
}

void loop() {
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd == 'U') {
      digitalWrite(RELAY_PIN, HIGH); // UNLOCK
    } else if (cmd == 'L') {
      digitalWrite(RELAY_PIN, LOW);  // LOCK
    }
  }
}