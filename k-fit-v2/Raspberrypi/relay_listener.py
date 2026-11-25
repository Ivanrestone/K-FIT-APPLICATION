#!/usr/bin/env python3
"""
K-FIT Relay Listener — Raspberry Pi
Listens to the kiosk server's event stream and pulses the relay
on GPIO 17 whenever a member checks in.

Wire the relay:
  - VCC  -> 3.3V or 5V (match relay module)
  - GND  -> GND
  - IN   -> GPIO 17

Run alongside the kiosk server:
  node server.js            # terminal 1
  python3 relay_listener.py # terminal 2
"""

import time
import sys
import requests
from gpiozero import OutputDevice

# --- Config ---
KIOSK_URL = "http://localhost:3000/events"
RELAY_PIN = 17
RELAY_ON_SECONDS = 2.0    # how long relay stays ON
RELAY_OFF_SECONDS = 2.0   # pause before it can fire again
RECONNECT_DELAY = 5       # seconds before retrying if stream drops
# ----------------

relay = OutputDevice(RELAY_PIN, active_high=False)


def pulse_relay():
    """Turn relay ON for RELAY_ON_SECONDS, then OFF."""
    print(">>> RELAY ON (member checked in)", flush=True)
    relay.on()
    time.sleep(RELAY_ON_SECONDS)
    relay.off()
    print(">>> RELAY OFF", flush=True)


def listen():
    print(f"Listening for check-ins on {KIOSK_URL} ...", flush=True)
    print("Press Ctrl+C to stop.\n", flush=True)

    while True:
        try:
            with requests.get(KIOSK_URL, stream=True, timeout=30) as resp:
                resp.raise_for_status()
                for line in resp.iter_lines(decode_unicode=True):
                    if not line or not line.startswith("data:"):
                        continue  # skip heartbeats/comments
                    event = line[5:].strip()
                    if event == "checkin":
                        pulse_relay()
                    # 'checkout' events are ignored — relay only fires on entry
        except KeyboardInterrupt:
            raise
        except Exception as e:
            print(f"Connection lost ({e}) — retrying in {RECONNECT_DELAY}s", flush=True)
            time.sleep(RECONNECT_DELAY)


if __name__ == "__main__":
    try:
        listen()
    except KeyboardInterrupt:
        relay.off()
        relay.close()
        print("\nRelay listener stopped.")
        sys.exit(0)
