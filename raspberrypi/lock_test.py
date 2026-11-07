import RPi.GPIO as GPIO
import time

# Use BCM GPIO numbering
RELAY_PIN = 24  # Connects to physical Pin 18

def setup():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(RELAY_PIN, GPIO.OUT)
    
    # Default State: LOW keeps NC contact closed (Door LOCKED at rest)
    GPIO.output(RELAY_PIN, GPIO.LOW)
    print("[SYSTEM] Standby: 12V active across NC -> Door LOCKED")

def main():
    setup()
    try:
        while True:
            # --- UNLOCK PHASE (5 SECONDS) ---
            # HIGH energizes coil -> Opens NC contact -> Cuts 12V -> UNLOCKED
            GPIO.output(RELAY_PIN, GPIO.HIGH)
            print("[STATUS] Door: UNLOCKED | Relay LED: ON  | Duration: 5s")
            time.sleep(5)

            # --- LOCK PHASE (10 SECONDS) ---
            # LOW drops coil -> Closes NC contact -> Restores 12V -> LOCKED
            GPIO.output(RELAY_PIN, GPIO.LOW)
            print("[STATUS] Door: LOCKED   | Relay LED: OFF | Duration: 10s")
            time.sleep(10)

    except KeyboardInterrupt:
        print("\n[SYSTEM] Stopping hardware loop...")
    finally:
        GPIO.output(RELAY_PIN, GPIO.LOW) # Ensure lock re-engages on exit
        GPIO.cleanup()

if __name__ == "__main__":
    main()