const int RELAY_PIN = A5;
const int BOARD_LED = 13;

void setup() {
  Serial.begin(9600);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BOARD_LED, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Default: LOCKED (12V active on NC terminal)

  // Reboot indicator: Blink Pin 13 LED 3 times on startup
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
      digitalWrite(RELAY_PIN, HIGH); // Output HIGH -> Cut 12V -> UNLOCK
    } else if (cmd == 'L') {
      digitalWrite(RELAY_PIN, LOW);  // Output LOW  -> Restore 12V -> LOCK
    }
  }
}

