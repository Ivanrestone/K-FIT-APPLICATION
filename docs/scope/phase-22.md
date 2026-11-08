# Phase 22: Unencrypted QR Code Scanning & Direct Magnetic Lock Integration

**Branch Name:** `magneticlock`

**File Path:** `docs/scope/phase-22.md`

## 1. Overview & Objectives

The primary goal of Phase 22 is to streamline the attendance and access scanning pipeline by removing QR code encryption/decryption overhead. Every valid scan directly triggers an asynchronous HTTP POST request to the local Raspberry Pi lock controller (`http://192.168.254.109:5000/unlock`). 

To ensure users have sufficient time to physically enter the premises without the door locking prematurely, the system implements a **10 to 20 second entry hold window**. Upon receiving a valid trigger signal, the Raspberry Pi instructs the Arduino Uno over USB serial (`/dev/ttyUSB0`) to cut power to the 12V electromagnetic lock, holding it in an unlocked state for the configured duration (default: 10–20s) before automatically re-engaging the magnetic lock.

## 2. Key Requirements & Architectural Scope

1. **Unencrypted QR Code Format:**
   * Transition from encrypted payload strings (AES/Crypto) to plain text payloads (e.g., `USER_<user_id>` or direct token string).
   * Update the scanner intake routine to validate raw string tokens instantly without running heavy crypto/decryption algorithms.

2. **Configurable Unlocked Entry Timer (10–20 Seconds):**
   * Provide a configurable grace period ($10\text{s}$ to $20\text{s}$) during which the magnetic lock remains completely disengaged, giving users ample time to open the door and walk through.
   * Lock automatically re-engages (`L`) once the hold timer expires.

3. **Hardware Lock Endpoint Trigger:**
   * Wire successful scan events directly to the Raspberry Pi Flask unlock server via an asynchronous, non-blocking request.
   * Maintain thread locking on the Pi server to prevent duplicate overlapping unlock requests while an entry cycle is active.

4. **System Resilience & Fallback:**
   * If the Raspberry Pi lock server is unreachable or offline, log a hardware warning while still allowing the web application to record the scan event in the database.

## 3. Implementation Details

### Step 1: Environment Configuration (`.env.local`)

Add the local IP address of your Raspberry Pi hardware lock server and set the desired unlock hold duration:

```env
NEXT_PUBLIC_PI_LOCK_URL=http://192.168.254.109:5000/unlock
NEXT_PUBLIC_LOCK_HOLD_SECONDS=10
```

### Step 2: Remove Encryption from QR Code Generation

Update your QR generation module to output plain-text user identification tokens:

```typescript
// Example: src/lib/qr/generator.ts

export function generateUserQRCode(userId: string): string {
  // Direct plain-text format without AES/crypto wrapper
  return `USER_${userId}`;
}
```

### Step 3: Remove Decryption from Scanner Verification

Modify your scanner processing function or API handler to validate plain-text QR codes and trigger the hardware controller:

```typescript
// Example: src/lib/qr/scanner.ts or API route handler

export async function processScannedCode(scannedData: string) {
  // 1. Direct string validation (No decryption step required)
  if (!scannedData || !scannedData.startsWith("USER_")) {
    return { success: false, error: "Invalid QR Code format" };
  }

  const userId = scannedData.replace("USER_", "");

  // 2. Dispatch hardware unlock request asynchronously
  triggerHardwareUnlock();

  return { 
    success: true, 
    userId, 
    message: "Access granted. Disengaging magnetic lock." 
  };
}

/**
 * Sends non-blocking POST trigger to Raspberry Pi lock server
 */
function triggerHardwareUnlock() {
  const lockUrl = process.env.NEXT_PUBLIC_PI_LOCK_URL || "http://192.168.254.109:5000/unlock";

  fetch(lockUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  })
  .then((res) => {
    if (!res.ok) console.warn("[HARDWARE WARNING] Lock server responded with status:", res.status);
  })
  .catch((err) => {
    console.error("[HARDWARE ERROR] Unable to connect to Raspberry Pi lock server:", err.message);
  });
}
```

## 4. Hardware System Architecture & Timing Sequence

```text
+------------------------+      Plain Text      +------------------------+
|      QR CODE           | -------------------> |      WEB SCANNER       |
|  (e.g. "USER_12345")   |                      |  (No Decryption Logic) |
+------------------------+                      +------------------------+
                                                            |
                                                 HTTP POST  | /unlock
                                                            v
+------------------------+     USB Serial       +------------------------+
|      ARDUINO UNO       | <=================== |     RASPBERRY PI 4     |
|   (5V Logic Pin A5)    |     "/dev/ttyUSB0"   |   (Flask Server :5000) |
+------------------------+                      +------------------------+
            |                                               |
            | Pin A5 HIGH (5.0V)                            | Holds UNLOCKED
            v                                               v
+------------------------+     Cuts Power       +------------------------+
|    5V RELAY MODULE     | -------------------> |   12V MAGNETIC LOCK    |
|   (NC Terminal Wire)   |     (Loud CLICK!)    | Unlocked for 10s–20s  |
+------------------------+                      +------------------------+
```

## 5. Hardware Reference Files

### 1. Arduino Sketch (`raspberrypi/arduino_uno.ino`)

```cpp
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
```

### 2. Raspberry Pi Lock Server (`raspberrypi/lock_test2.py`)

```python
from flask import Flask, jsonify
import serial
import threading
import time

app = Flask(__name__)

SERIAL_PORT = '/dev/ttyUSB0'
BAUD_RATE = 9600

# Set entry hold time between 10 and 20 seconds
UNLOCK_HOLD_SECONDS = 10  # Change to 15 or 20 if more entry time is required

lock_mutex = threading.Lock()
is_unlocking = False

try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    time.sleep(2)  # Wait for Arduino auto-reset on connection
    ser.reset_input_buffer()
    print(f"[SYSTEM] Connected to Arduino via USB on {SERIAL_PORT}")
except Exception as e:
    print(f"[ERROR] Could not open serial port: {e}")
    ser = None

def execute_unlock_sequence(hold_time):
    global is_unlocking
    with lock_mutex:
        if is_unlocking:
            return
        is_unlocking = True

    try:
        if ser and ser.is_open:
            # 1. Send UNLOCK command
            ser.write(b'U')
            print(f"[HARDWARE] Door UNLOCKED. Entry timer active: holding open for {hold_time} seconds...")
            
            # 2. Hold door open for entry duration
            time.sleep(hold_time)
            
            # 3. Send RE-LOCK command
            ser.write(b'L')
            print("[HARDWARE] Entry window expired. Door RE-LOCKED.")
    finally:
        with lock_mutex:
            is_unlocking = False

@app.route('/unlock', methods=['GET', 'POST'])
def unlock():
    if is_unlocking:
        return jsonify({
            "status": "busy", 
            "message": f"Door is currently unlocked. Entry window active."
        }), 429

    threading.Thread(target=execute_unlock_sequence, args=(UNLOCK_HOLD_SECONDS,)).start()
    return jsonify({
        "status": "success", 
        "message": f"Door unlocked. You have {UNLOCK_HOLD_SECONDS} seconds to enter."
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## 6. Verification Checklist

* [ ] Checkout branch `magneticlock`.
* [ ] Confirm QR code payload generation outputs raw plain text (no AES/crypto wrapper).
* [ ] Verify scanner handler processes plain text directly without decryption functions.
* [ ] Test scanning a QR code and verify the magnetic lock releases with a **CLICK**.
* [ ] Use a stopwatch to confirm the door remains disengaged for the full **10 to 20 seconds** before automatically re-locking.
* [ ] Verify that rapid duplicate scans during the entry window return a `429 busy` status without disrupting the active timer.