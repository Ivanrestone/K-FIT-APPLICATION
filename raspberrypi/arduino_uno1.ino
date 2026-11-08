const int RELAY_PIN = A5;
const int BOARD_LED = 13;

// Set to 'false' for standard Active-HIGH relay modules (Relay turns ON when pin is HIGH)
// Set to 'true' if your relay module is Active-LOW (Relay turns ON when pin is LOW)
const bool INVERT_RELAY_LOGIC = false; 

void setRelayState(bool energize) {
  if (INVERT_RELAY_LOGIC) {
    digitalWrite(RELAY_PIN, energize ? LOW : HIGH);
  } else {
    digitalWrite(RELAY_PIN, energize ? HIGH : LOW);
  }
}

void setup() {
  Serial.begin(9600);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BOARD_LED, OUTPUT);

  // At rest: Relay De-energized -> 12V flows through Normally Closed (NC) -> Door LOCKED
  setRelayState(false); 

  // Reboot indicator: Blink Pin 13 LED 3 times on power up
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
      // Energize relay -> Break 12V NC circuit -> Door UNLOCKED
      setRelayState(true);
    } else if (cmd == 'L') {
      // De-energize relay -> Restore 12V NC circuit -> Door LOCKED
      setRelayState(false);
    }
  }
}