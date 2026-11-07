# Phase 20: Attendance API Network & Authentication Stabilization

## Objective
Resolve the critical network failures, authentication drops (401 Unauthorized), and timeout errors (Fetch Canceled / 503 Service Unavailable) occurring in the React Native application's connection to the Supabase Edge Functions, specifically within the `use-attendance.ts` hook.

## Scope
* **Target File:** `src/hooks/use-attendance.ts`
* **Target Actions:** `provision`, `history`, `staff_history`
* **Dependencies:** Clerk Expo Auth, Supabase Edge Functions, React Native `fetch` API.

## 1. Task: Android Emulator Network Routing
**Problem:** The React Native app on the Android emulator is failing to connect to the local Edge Function environment, resulting in aborted requests. Android cannot resolve `localhost` to the host machine.
**Implementation Steps:**
* Introduce a dynamic base URL resolver in `use-attendance.ts` or the API config.
* If `__DEV__` and `Platform.OS === 'android'`, dynamically rewrite `localhost` or `127.0.0.1` to `10.0.2.2`.
* Verify CORS headers on the Edge Function accept requests from the development origin.

## 2. Task: Clerk Authentication Header Sync
**Problem:** The API is returning continuous `401 Unauthorized` errors for the `history` action, indicating missing, malformed, or expired Clerk JWTs.
**Implementation Steps:**
* Inspect the `getToken({ template: 'supabase' })` call preceding the `fetch` request.
* Add a guard clause: If the token returns `null`, wait or explicitly throw an auth error rather than sending a blank request to the Edge Function.
* Ensure the headers strictly follow the `Authorization: Bearer <TOKEN>` format.

## 3. Task: AbortController and Timeout Optimization
**Problem:** TOTP provisioning is throwing `fetch failed: Fetch request has been canceled`, indicating a hard timeout is aborting the request before the Edge Function finishes generating the secret.
**Implementation Steps:**
* Locate the `AbortController` or timeout wrapper in `use-attendance.ts`.
* Extend the timeout threshold for the `provision` action (e.g., from 5000ms to 15000ms) to account for Edge Function cold starts and cryptographic generation time.
* Ensure cleanup functions in `useEffect` are not improperly aborting the controller on standard component re-renders.

## 4. Task: Edge Function Error Handling (503 Mitigations)
**Problem:** Occasional `503 Service Unavailable` logs suggest the Edge Function is either crashing or failing to boot.
**Implementation Steps:**
* Implement a standardized retry logic wrapper for `503` and `fetch failed` errors (max 2 retries with exponential backoff).
* Expand the `[Attendance API Error]` console output to include the stringified raw request URL and headers (excluding the token payload) for easier debugging.

## Expected Outcomes
* The `provision` action successfully executes on Android without network aborts.
* The `history` loop executes smoothly with steady `2xx` HTTP statuses.
* The application gracefully recovers from Edge Function cold starts without immediately throwing a fatal UI error.
## Result

Implemented the four fixes in the attendance path.

* Added `resolveSupabaseUrl` in `src/utils/supabase.ts`: development Android builds rewrite `localhost` and `127.0.0.1` to `10.0.2.2`, release builds and other platforms keep the configured URL unchanged. The member Supabase client now uses it, so Edge Function invocations follow the emulator host loopback.
* `src/hooks/use-attendance.ts` normalizes Clerk tokens (strips a stray `Bearer` prefix), waits briefly for a hydrating session, and throws a clear session error before any request leaves the device when no token is available.
* Provision timeout raised from 9s to 15s for cold starts.
* Added up to two retries with 500ms and 1500ms backoff for `503` responses and transport failures, skipping aborts so an explicit timeout is not multiplied. The `[Attendance API Error]` log now includes the resolved request URL and redacted request headers.
* CORS was verified in `supabase/functions/attendance/index.ts`: `Access-Control-Allow-Origin: *` with `authorization, apikey, content-type, x-client-info`, which accepts the development origin.

Verification: `npx tsc --noEmit` passes; `npx eslint src/hooks/use-attendance.ts src/utils/supabase.ts` passes. Repository-wide `npx expo lint` still reports pre-existing errors in unrelated screens.

### Follow-up: `Session token algorithm is invalid` (401)

The Phase 20 logging exposed a deeper auth bug: the hook sent the Clerk `supabase` JWT template, which is HS256 (legacy Supabase integration), while `attendance` verifies tokens against Clerk's JWKS (asymmetric only). `use-attendance.ts` now sends the default Clerk session token, and the QR screen's pre-sync token gate no longer requests the template. The template stays in use for PostgREST/RLS reads.
