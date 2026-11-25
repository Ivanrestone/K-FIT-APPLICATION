#!/usr/bin/env python3
"""
K-FIT All-in-One Relay Test — Raspberry Pi
Single file: polls Supabase attendance and pulses the relay on GPIO 17
whenever a member checks in. No Node server needed.

Wiring: relay IN -> GPIO 17, VCC -> 3.3V/5V, GND -> GND

Run:  python3 kiosk_relay.py
Stop: Ctrl+C
"""

import time
import requests
from gpiozero import OutputDevice

# --- Config ---
SUPABASE_URL = "https://ahicsoctvqxcutjbvnfl.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoaWNzb2N0dnF4Y3V0amJ2bmZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjc2MjM1MCwiZXhwIjoyMTA4MzM4MzUwfQ.L2c0D6McmaJ2uuToppfA5PUwVljq8q5cJPTO86azQ5Y"

RELAY_PIN = 17
RELAY_ON_SECONDS = 2.0     # relay stays ON this long
POLL_SECONDS = 3           # how often to check Supabase
# ----------------

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
}
ATTENDANCE_URL = (
    f"{SUPABASE_URL}/rest/v1/attendance"
    "?select=id,member_id,check_in,check_out&order=check_in.desc&limit=50"
)
USERS_URL = f"{SUPABASE_URL}/rest/v1/users?select=id,first_name,last_name&id=in."

relay = OutputDevice(RELAY_PIN, active_high=False)
known = {}  # id -> check_out (None while inside)
primed = False


def pulse_relay(name):
    print(f">>> CHECK-IN: {name} — RELAY ON", flush=True)
    relay.on()
    time.sleep(RELAY_ON_SECONDS)
    relay.off()
    print(">>> RELAY OFF", flush=True)


def member_names(ids):
    """Look up first+last names for a list of member ids."""
    if not ids:
        return {}
    try:
        res = requests.get(
            USERS_URL + "(" + ",".join(ids) + ")",
            headers=HEADERS,
            timeout=10,
        )
        res.raise_for_status()
        return {
            u["id"]: f"{u.get('first_name') or ''} {u.get('last_name') or ''}".strip() or "Member"
            for u in res.json()
        }
    except Exception:
        return {}


def poll():
    global primed
    res = requests.get(ATTENDANCE_URL, headers=HEADERS, timeout=10)
    res.raise_for_status()
    rows = res.json()

    if not primed:
        for r in rows:
            known[r["id"]] = r["check_out"]
        primed = True
        inside = sum(1 for r in rows if r["check_out"] is None)
        print(f"Baseline loaded — {inside} currently inside. Waiting for check-ins...\n", flush=True)
        return

    # find brand-new attendance rows
    new_rows = [r for r in rows if r["id"] not in known]
    for r in rows:
        known[r["id"]] = r["check_out"]

    if not new_rows:
        return

    names = member_names([r["member_id"] for r in new_rows if r.get("member_id")])
    for r in new_rows:
        name = names.get(r.get("member_id"), "Member")
        pulse_relay(name)


def main():
    print("K-FIT relay listener starting...", flush=True)
    print(f"Polling Supabase every {POLL_SECONDS}s — relay on GPIO {RELAY_PIN}\n", flush=True)
    try:
        while True:
            try:
                poll()
            except Exception as e:
                print(f"Poll error: {e} — retrying", flush=True)
            time.sleep(POLL_SECONDS)
    except KeyboardInterrupt:
        relay.off()
        relay.close()
        print("\nStopped.")


if __name__ == "__main__":
    main()
