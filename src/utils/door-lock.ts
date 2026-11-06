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
 *   - The Pi URL is optional.  If the variable is absent or the request fails,
 *     the check-in is not affected.  The lock trigger is best-effort only.
 *   - The request is fire-and-forget (void, no await at call site) so the kiosk
 *     UI responds immediately after the backend scan succeeds.
 *   - Timeout is capped at 3 seconds to avoid blocking the kiosk during a
 *     network hiccup.
 *   - Only check_in and check_out outcomes unlock the door.
 */

const PI_LOCK_URL = process.env.EXPO_PUBLIC_PI_LOCK_URL ?? "";
const LOCK_TIMEOUT_MS = 3_000;

/**
 * Sends a POST request to the configured Pi Flask unlock endpoint.
 * Returns silently on any error or when the URL is not configured.
 */
export async function triggerDoorUnlock(): Promise<void> {
  if (!PI_LOCK_URL) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOCK_TIMEOUT_MS);
  try {
    await fetch(PI_LOCK_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unlock" }),
    });
  } catch (error) {
    // Network errors and timeouts are expected when the Pi is offline.
    // Log once so the kiosk operator can diagnose issues without crashing.
    console.warn(
      "[DoorLock] Unlock request failed (non-blocking):",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    clearTimeout(timer);
  }
}

