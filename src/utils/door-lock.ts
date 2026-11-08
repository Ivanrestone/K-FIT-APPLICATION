/**
 * door-lock.ts
 *
 * Fire-and-forget HTTP trigger for the Raspberry Pi Flask LAN server that
 * controls the 12V magnetic door lock.
 *
 * Usage:
 *   Set EXPO_PUBLIC_PI_LOCK_URL in .env.local to the Pi's unlock endpoint,
 *   e.g. http://192.168.254.109:5000/unlock
 *
 * Design decisions:
 *   - The Pi URL defaults to http://192.168.254.109:5000/unlock on local LAN.
 *   - The request is fire-and-forget (void, no await at call site) so the kiosk
 *     UI responds immediately after the backend scan succeeds or USER_ QR code is read.
 *   - Timeout is capped at 3 seconds to avoid blocking the kiosk during a
 *     network hiccup.
 *   - 429 status code indicates the lock is already disengaged (hold timer active);
 *     this is handled gracefully without hardware warning logs.
 */

const DEFAULT_PI_LOCK_URL = "http://192.168.254.109:5000/unlock";

function resolveLockUrl(): string {
  const raw =
    process.env.EXPO_PUBLIC_PI_LOCK_URL ??
    process.env.NEXT_PUBLIC_PI_LOCK_URL ??
    DEFAULT_PI_LOCK_URL;
  if (!raw) return DEFAULT_PI_LOCK_URL;
  // Strip potential markdown link wrappers like [http://...](http://...)
  const match = raw.match(/https?:\/\/[^\s\]\)]+/);
  return match ? match[0] : raw.trim();
}

const PI_LOCK_URL = resolveLockUrl();
const LOCK_TIMEOUT_MS = 3_000;
const HOLD_SECONDS =
  Number(
    process.env.EXPO_PUBLIC_LOCK_HOLD_SECONDS ??
      process.env.NEXT_PUBLIC_LOCK_HOLD_SECONDS ??
      "10",
  ) || 10;

/**
 * Sends a POST request to the configured Pi Flask unlock endpoint.
 * Returns silently on any error or when the URL is not configured.
 */
export async function triggerDoorUnlock(customHoldSeconds?: number): Promise<boolean> {
  const url = resolveLockUrl() || PI_LOCK_URL;
  if (!url) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOCK_TIMEOUT_MS);
  try {
    console.info(`[DoorLock] Dispatching POST unlock request to ${url}...`);
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "unlock",
        hold_seconds: customHoldSeconds ?? HOLD_SECONDS,
      }),
    });

    if (res.status === 429) {
      console.info("[DoorLock] Door is currently unlocked; entry window is active.");
      return true;
    } else if (!res.ok) {
      console.warn("[DoorLock] Lock server responded with status:", res.status);
      return false;
    }
    console.info("[DoorLock] Door unlocked successfully via Pi lock server.");
    return true;
  } catch (error) {
    // Network errors and timeouts are expected when the Pi is offline.
    // Log once so the kiosk operator can diagnose issues without crashing.
    console.warn(
      "[DoorLock] Unlock request failed (non-blocking):",
      error instanceof Error ? error.message : String(error),
    );
    return false;
  } finally {
    clearTimeout(timer);
  }
}
