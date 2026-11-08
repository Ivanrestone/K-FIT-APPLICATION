import serial
import time

SERIAL_PORT = '/dev/ttyUSB0'
BAUD_RATE = 9600

try:
    # Initialize connection to Arduino
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    time.sleep(2)  # Wait for Arduino auto-reset upon connection
    ser.reset_input_buffer()
    print(f"[SYSTEM] Connected to Arduino on {SERIAL_PORT}")

    while True:
        # UNLOCK CYCLE
        ser.write(b'U')
        print("[STATUS] Door UNLOCKED -> Waiting 10 seconds...")
        time.sleep(10)

        # LOCK CYCLE
        ser.write(b'L')
        print("[STATUS] Door LOCKED   -> Waiting 10 seconds...")
        time.sleep(10)

except KeyboardInterrupt:
    print("\n[SYSTEM] Test stopped by user. Restoring locked state...")
    if 'ser' in locals() and ser.is_open:
        ser.write(b'L')  # Ensure door re-locks on exit
        ser.close()
except Exception as e:
    print(f"[ERROR] Connection error: {e}")