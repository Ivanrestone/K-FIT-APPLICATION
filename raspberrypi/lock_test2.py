from flask import Flask, jsonify, request
import serial
import threading
import time
import os

app = Flask(__name__)

SERIAL_PORT = os.environ.get('SERIAL_PORT', '/dev/ttyUSB0')
BAUD_RATE = 9600

# Set entry hold time between 10 and 20 seconds (default: 10s)
DEFAULT_HOLD_SECONDS = 10
try:
    UNLOCK_HOLD_SECONDS = int(os.environ.get('UNLOCK_HOLD_SECONDS', str(DEFAULT_HOLD_SECONDS)))
    if UNLOCK_HOLD_SECONDS < 5 or UNLOCK_HOLD_SECONDS > 60:
        UNLOCK_HOLD_SECONDS = DEFAULT_HOLD_SECONDS
except ValueError:
    UNLOCK_HOLD_SECONDS = DEFAULT_HOLD_SECONDS

lock_mutex = threading.Lock()
is_unlocking = False

try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    time.sleep(2)  # Wait for Arduino auto-reset on connection
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
        else:
            print(f"[SIMULATION] Door UNLOCKED for {hold_time}s (Serial port not connected).")
            time.sleep(hold_time)
            print("[SIMULATION] Door RE-LOCKED.")
    finally:
        with lock_mutex:
            is_unlocking = False

# Add this endpoint inside lock_test3.py
@app.route('/lock', methods=['GET', 'POST'])
def force_lock():
    if ser and ser.is_open:
        ser.write(b'L')
        print("[HARDWARE] Manual force 'L' command sent.")
        return jsonify({"status": "success", "message": "Lock command sent"}), 200
    return jsonify({"status": "error", "message": "Serial port disconnected"}), 500

@app.route('/unlock', methods=['GET', 'POST'])
def unlock():
    global is_unlocking
    if is_unlocking:
        return jsonify({
            "status": "busy", 
            "message": "Door is currently unlocked. Entry window active."
        }), 429

    hold_seconds = UNLOCK_HOLD_SECONDS
    if request.is_json:
        req_data = request.get_json(silent=True) or {}
        custom_hold = req_data.get('hold_seconds')
        if custom_hold and isinstance(custom_hold, (int, float)) and 5 <= custom_hold <= 60:
            hold_seconds = int(custom_hold)

    threading.Thread(target=execute_unlock_sequence, args=(hold_seconds,)).start()
    return jsonify({
        "status": "success", 
        "message": f"Door unlocked. You have {hold_seconds} seconds to enter."
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)