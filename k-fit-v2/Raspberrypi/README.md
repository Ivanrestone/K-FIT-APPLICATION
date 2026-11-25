# K-FIT Attendance Kiosk (Raspberry Pi)

A standalone dashboard that shows live gym attendance — who's currently checked in and recent activity. No dependencies, plain Node.js.

## What's inside

- `server.js` — web server + Supabase fetcher + dashboard page
- `config.js` — Supabase credentials and port (already filled in)
- `package.json` — no npm install needed

## Run on the Raspberry Pi

1. Copy this whole `Raspberrypi` folder to the Pi (USB, `scp`, or git).
2. Make sure Node.js 18+ is installed:

   ```bash
   node -v
   # if missing:
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. Start it:

   ```bash
   cd Raspberrypi
   node server.js
   ```

4. On the Pi (or any device on the same network), open:

   ```
   http://<pi-ip>:3000
   ```

   Find the Pi's IP with `hostname -I`.

## Auto-start on boot (optional)

```bash
sudo nano /etc/systemd/system/kfit-kiosk.service
```

Paste:

```ini
[Unit]
Description=K-FIT Attendance Kiosk
After=network.target

[Service]
ExecStart=/usr/bin/node /home/pi/Raspberrypi/server.js
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl enable --now kfit-kiosk
```

## Kiosk mode (fullscreen, no browser chrome)

```bash
chromium-browser --kiosk http://localhost:3000
```

Add that to the Pi's autostart (`~/.config/lxsession/LXDE-pi/autostart`) for a dedicated display.

## Relay (door strike / light / buzzer)

`relay_listener.py` pulses a relay on **GPIO 17** every time a member checks in.

### Wiring

| Relay module | Pi |
|---|---|
| VCC | 3.3V or 5V (match module) |
| GND | GND |
| IN | GPIO 17 |

### Run

```bash
# terminal 1 — kiosk server
node server.js

# terminal 2 — relay listener
python3 relay_listener.py
```

Requires `gpiozero` (preinstalled on Raspberry Pi OS) and `requests`.
If missing: `sudo apt install python3-gpiozero python3-requests`

### Adjust behavior

Edit the top of `relay_listener.py`:

- `RELAY_ON_SECONDS` — how long the relay stays on (default 2s)
- `RELAY_OFF_SECONDS` — cooldown between triggers (default 2s)
- `RELAY_PIN` — change if you wire a different GPIO

Checkout events are ignored — the relay only fires on member **entry**.

## Notes

- Data refreshes from Supabase every 15s; the page polls every 10s.
- Uses the service role key — keep `config.js` private, don't commit it publicly.
- To change the port, edit `PORT` in `config.js`.
