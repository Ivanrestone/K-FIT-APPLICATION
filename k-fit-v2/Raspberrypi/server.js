// K-FIT Attendance Kiosk — Raspberry Pi dashboard
// Serves a live attendance page on http://<pi-ip>:3000
// No external dependencies — runs on any Node.js 18+ install.
// Pushes instant check-in/check-out alerts via Server-Sent Events.

const http = require('http');
const config = require('./config');

const HEADERS = {
  apikey: config.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
};

async function supabaseGet(path) {
  const res = await fetch(`${config.SUPABASE_URL}/rest/v1/${path}`, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// Fetch attendance + member names, merged like the admin app does.
async function fetchAttendance() {
  const rows = await supabaseGet(
    'attendance?select=id,member_id,check_in,check_out&order=check_in.desc&limit=100'
  );

  const memberIds = [...new Set(rows.map((r) => r.member_id).filter(Boolean))];
  let users = [];
  if (memberIds.length) {
    users = await supabaseGet(
      `users?select=id,first_name,last_name,email&id=in.(${memberIds.join(',')})`
    );
  }

  const userMap = new Map(users.map((u) => [u.id, u]));

  return rows.map((r) => {
    const u = userMap.get(r.member_id);
    return {
      id: r.id,
      name: u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Member' : 'Member',
      checkIn: r.check_in,
      checkOut: r.check_out,
    };
  });
}

// Cache attendance so page loads are instant; refresh in background.
let cache = { data: [], fetchedAt: 0 };
let refreshing = false;

async function refreshCache() {
  if (refreshing) return;
  refreshing = true;
  try {
    cache = { data: await fetchAttendance(), fetchedAt: Date.now() };
  } catch (err) {
    console.error('Fetch error:', err.message);
  } finally {
    refreshing = false;
  }
}

// --- Push updates via Server-Sent Events ---
// Poll Supabase every 3s; when attendance changes, notify all connected pages instantly.
const sseClients = new Set();
const knownAttendance = new Map(); // id -> check_out (null while inside)
let attendancePrimed = false;

function broadcast(event) {
  const payload = `data: ${event}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function pollAttendanceChanges() {
  try {
    const rows = await supabaseGet(
      'attendance?select=id,check_in,check_out&order=check_in.desc&limit=50'
    );

    if (!attendancePrimed) {
      rows.forEach((r) => knownAttendance.set(r.id, r.check_out));
      attendancePrimed = true;
      return;
    }

    const events = [];
    for (const r of rows) {
      if (!knownAttendance.has(r.id)) {
        knownAttendance.set(r.id, r.check_out);
        events.push('checkin'); // new check-in (member entered)
      } else if (knownAttendance.get(r.id) === null && r.check_out !== null) {
        knownAttendance.set(r.id, r.check_out);
        events.push('checkout'); // checked out
      }
    }
    // trim map to recent ids only
    if (knownAttendance.size > 200) {
      const keep = new Set(rows.map((r) => r.id));
      for (const id of knownAttendance.keys()) {
        if (!keep.has(id)) knownAttendance.delete(id);
      }
    }

    for (const ev of events) broadcast(ev);
  } catch (err) {
    // silent — next poll retries
  }
}

// SSE heartbeat so connections don't drop
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 25000);

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>K-FIT Attendance</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #131313;
    color: #E5E2E1;
    font-family: 'Segoe UI', system-ui, sans-serif;
    min-height: 100vh;
    padding: 32px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 12px;
  }
  h1 { font-size: 28px; font-weight: 800; letter-spacing: 1px; }
  h1 span { color: #FF6B00; }
  .clock { color: #A98A7D; font-size: 18px; font-variant-numeric: tabular-nums; }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
  .card {
    background: #1C1B1B;
    border: 1px solid #353534;
    border-radius: 16px;
    padding: 20px;
  }
  .card h2 {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #A98A7D;
    margin-bottom: 16px;
  }
  .count {
    display: inline-block;
    background: #FF6B00;
    color: #fff;
    font-weight: 700;
    border-radius: 999px;
    padding: 2px 12px;
    font-size: 13px;
    margin-left: 8px;
    vertical-align: middle;
  }
  .person {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #2A2A2A;
  }
  .person:last-child { border-bottom: none; }
  .pname { font-weight: 600; font-size: 16px; }
  .ptime { color: #A98A7D; font-size: 14px; font-variant-numeric: tabular-nums; }
  .badge {
    font-size: 12px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(52,199,89,.15);
    color: #34C759;
  }
  .empty { color: #A98A7D; padding: 16px 0; font-size: 15px; }
  .feed .person .sub { color: #A98A7D; font-size: 13px; margin-top: 2px; }
  .status { margin-top: 24px; color: #A98A7D; font-size: 13px; text-align: center; }
  .toast {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #FF6B00;
    color: #fff;
    font-weight: 700;
    font-size: 17px;
    padding: 14px 28px;
    border-radius: 999px;
    box-shadow: 0 8px 30px rgba(255,107,0,.45);
    opacity: 0;
    transition: opacity .3s, transform .3s;
    pointer-events: none;
    z-index: 10;
  }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(6px); }
  .newbadge {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    color: #FF6B00;
    border: 1px solid #FF6B00;
    border-radius: 6px;
    padding: 2px 7px;
    margin-left: 8px;
    animation: pulse 1s infinite alternate;
  }
  @keyframes pulse { from { opacity: 1; } to { opacity: .35; } }
  .person.fresh { animation: flash 2s ease-out; }
  @keyframes flash {
    0% { background: rgba(255,107,0,.25); }
    100% { background: transparent; }
  }
</style>
</head>
<body>
<header>
  <h1>K<span>-FIT</span> Attendance</h1>
  <div class="clock" id="clock"></div>
</header>
<div class="grid">
  <div class="card">
    <h2>Currently In <span class="count" id="inCount">0</span></h2>
    <div id="inside"></div>
  </div>
  <div class="card feed">
    <h2>Recent Activity</h2>
    <div id="feed"></div>
  </div>
</div>
<div class="status" id="status">Loading…</div>
<div class="toast" id="toast"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script>
const SUPABASE_URL = '${config.SUPABASE_URL}';
const SUPABASE_ANON_KEY = '${config.SUPABASE_ANON_KEY}';
const REFRESH = ${config.REFRESH_MS};
const seen = new Map(); // id -> checkOut (null while inside)
const freshIds = new Set();
let firstLoad = true;
let audioCtx = null;

function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    o.start();
    o.stop(audioCtx.currentTime + 0.4);
  } catch (e) { /* audio blocked until user interacts — fine */ }
}

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDur(inIso, outIso) {
  const ms = new Date(outIso || Date.now()) - new Date(inIso);
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  return h > 0 ? h + 'h ' + (mins % 60) + 'm' : mins + 'm';
}

async function load() {
  try {
    const res = await fetch('/api/attendance');
    const data = await res.json();

    // Detect new check-ins AND check-outs
    if (!firstLoad) {
      const msgs = [];
      for (const r of data) {
        if (!seen.has(r.id)) {
          seen.set(r.id, r.checkOut);
          freshIds.add(r.id);
          msgs.push(r.checkOut ? r.name + ' checked out' : r.name + ' checked in');
        } else if (seen.get(r.id) === null && r.checkOut !== null) {
          seen.set(r.id, r.checkOut);
          freshIds.add(r.id);
          msgs.push(r.name + ' checked out');
        }
      }
      if (msgs.length) {
        showToast(msgs.join('  •  '));
        beep();
        setTimeout(() => freshIds.forEach(id => freshIds.delete(id)), 30000);
      }
    } else {
      data.forEach(r => seen.set(r.id, r.checkOut));
    }
    firstLoad = false;

    const inside = data.filter(r => !r.checkOut);
    const feed = data.slice(0, 15);

    document.getElementById('inCount').textContent = inside.length;
    document.getElementById('inside').innerHTML = inside.length
      ? inside.map(r =>
          '<div class="person' + (freshIds.has(r.id) ? ' fresh' : '') + '"><div><div class="pname">' + r.name +
          (freshIds.has(r.id) ? '<span class="newbadge">NEW</span>' : '') + '</div>' +
          '<div class="ptime">in at ' + fmtTime(r.checkIn) + ' • ' + fmtDur(r.checkIn, null) + '</div></div>' +
          '<span class="badge">IN</span></div>').join('')
      : '<div class="empty">Nobody checked in right now</div>';

    document.getElementById('feed').innerHTML = feed.length
      ? feed.map(r =>
          '<div class="person' + (freshIds.has(r.id) ? ' fresh' : '') + '"><div><div class="pname">' + r.name +
          (freshIds.has(r.id) ? '<span class="newbadge">NEW</span>' : '') + '</div>' +
          '<div class="sub">' + fmtTime(r.checkIn) + ' → ' + (r.checkOut ? fmtTime(r.checkOut) : 'now') +
          ' • ' + fmtDur(r.checkIn, r.checkOut) + '</div></div>' +
          (r.checkOut ? '' : '<span class="badge">IN</span>') + '</div>').join('')
      : '<div class="empty">No attendance yet today</div>';

    document.getElementById('status').textContent =
      'Updated ' + new Date().toLocaleTimeString() + ' • live updates on';
  } catch (e) {
    document.getElementById('status').textContent = 'Connection error — retrying…';
  }
}

function tickClock() {
  document.getElementById('clock').textContent =
    new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) +
    '  •  ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
tickClock();
setInterval(tickClock, 1000);
load();
setInterval(load, REFRESH);

// Instant updates: Supabase Realtime pushes on every attendance change
try {
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  sb.channel('attendance-kiosk')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'attendance' },
      () => load())
    .subscribe();
} catch (e) { /* realtime unavailable — SSE/polling fallback still works */ }

// Fallback push channel (server-side 3s poller)
try {
  const es = new EventSource('/events');
  es.onmessage = () => load();
} catch (e) { /* fallback: polling still works */ }
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('retry: 2000\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }
  if (req.url === '/api/attendance') {
    // Always fetch fresh — realtime events trigger loads that must see new rows now
    try {
      const data = await fetchAttendance();
      cache = { data, fetchedAt: Date.now() };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cache.data)); // stale fallback
    }
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(PAGE);
});

refreshCache();
setInterval(refreshCache, 15000);
pollAttendanceChanges();
setInterval(pollAttendanceChanges, 3000);

server.listen(config.PORT, () => {
  console.log(`K-FIT Attendance kiosk running at http://localhost:${config.PORT}`);
  console.log(`On the Pi's network, open http://<pi-ip>:${config.PORT} in the browser.`);
});
