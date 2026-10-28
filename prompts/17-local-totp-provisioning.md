# Phase 17: Local TOTP Provisioning & QR Code Rendering Fix

Status: done

## Objective

Make the member QR pass reliably provision a device-local TOTP secret, display a scannable rotating pass, and recover from SecureStore, server provisioning, and token-generation failures without an indefinite loading state. Keep the pass compatible with the trusted attendance verifier introduced in Phase 16.

## Decisions and constraints

- Follow the existing Phase 16 trust boundary: generate and retain the 160-bit TOTP secret in `expo-secure-store`, then provision it through the authenticated `attendance` Edge Function. Do not write the secret directly into the public `users` profile or expose a Supabase service-role credential. The backend stores its copy encrypted in `member_totp_secrets`.
- Keep the existing `KFIT1|{encoded member ID}|{time-step}|{six-digit code}` payload because the current Edge Function parser verifies that exact versioned format and the time-step is required for expiry/replay prevention. Do not replace it with `KFIT|{member_id}|{totp_token}`.
- Reuse installed `expo-crypto`, `expo-secure-store`, `react-native-qrcode-svg`, and the existing RFC 6238 implementation; do not add dependencies or change the database schema.
- Preserve the current QR design, foreground concealment, signed-in member identity, screen structure, and 30-second TOTP period.
- Fail closed for local secret-storage and TOTP-generation failures, with a clear error and retry action. Once a local secret is available, render the local QR before starting authenticated server provisioning; backend synchronization is best-effort and must not gate or invalidate the local pass. Bound the UI-facing sync wait to 10 seconds, log sync failures with `[TOTP Provisioning Error]`, and retain the local secret so retry or a later mount can retry provisioning. The backend continues to fail closed when validating scans.
- Ensure 30-second token updates and countdown/progress derive from the same absolute time-step boundary. Clean up intervals and ignore stale async work when the screen unmounts or the signed-in member changes.

## Scope

1. Inspect and repair the member QR initialization path so SecureStore lookup, secret generation/persistence, authenticated backend provisioning, and first token generation have explicit loading, success, and failure behavior.
2. Add an accessible retry action for local SecureStore or TOTP-generation failures; do not leave a permanent spinner. A locally generated QR remains visible if offline/server provisioning fails.
3. Keep the QR payload compatible with `parseAttendanceQr` and ensure the rendered QR appears only after a valid token exists. Keep current conceal-on-background behavior.
4. Keep token rotation and the progress bar synchronized to actual 30-second TOTP boundaries, handling delayed intervals/app foregrounding without showing stale tokens as current.
5. Validate the existing TOTP and QR contract with focused tests or repository-supported checks; do not add a testing dependency just for this work.

## Implementation steps

1. Confirm current screen, attendance hook, TOTP helper, Phase 16 Edge Function parser and SDK 57 APIs. Use the existing local-secret / authenticated-encrypted-server-secret design and retain `KFIT1` payload compatibility.
2. Repair provisioning state handling in the QR screen: securely load or generate and persist the member secret, generate and display its first token immediately, then start best-effort background provisioning; prevent stale operations from updating another member's screen state.
3. Implement an explicit retryable failure state and ensure token, countdown, and status UI cannot imply a pass is ready after an error.
4. Align token generation and countdown/progress refresh with the same TOTP counter boundary, preserve foreground concealment, and clean up timers/subscriptions on unmount.
5. Run focused TOTP / attendance tests available in the repository, then app lint and TypeScript checks. Exercise provisioning success, retry after SecureStore or network/provisioning failure, boundary rotation, and background concealment where the available local test environment permits. Do not deploy functions or apply remote database changes.

## Verification

- Existing QR payload parses through the backend contract as `KFIT1`, carrying the member ID, current counter, and six-digit SHA-1 TOTP; incompatible payload variants remain rejected.
- Once the local secret is present/persisted and TOTP generation succeeds, the QR is displayed without waiting for server provisioning.
- SecureStore or TOTP-generation failures show a clear error and retry affordance; a server provisioning/network failure is logged but leaves the locally generated QR available.
- Countdown and progress correspond to the remaining time in the active 30-second counter; the pass updates after a boundary, and stale asynchronous generation cannot overwrite a newer member's pass.
- Backgrounding continues to conceal the QR; timers/listeners are cleaned up on unmount.
- `npx expo lint` and `npx tsc --noEmit` pass; report any focused integration check that cannot run and why. No remote migration or deployment is performed.

## Rollout / user configuration

No schema migration, new secret, dependency, or external deployment is expected. The existing Phase 16 attendance Edge Function and `TOTP_ENCRYPTION_KEY` configuration must already be deployed/configured for server provisioning; the app must be tested in a development build for SecureStore native behavior.

## Result

Updated the member QR screen to persist a newly generated secret locally, display its `KFIT1` pass immediately, then provision it with a non-blocking background request bounded to 10 seconds and logged with `[TOTP Provisioning Error]` on failure. Local storage and token-generation failures remain retryable and fail closed; sync failures leave the QR visible, and async work is guarded against member changes/unmounts. The screen passes focused ESLint and repository TypeScript checks. Full `npx expo lint` remains blocked by existing unrelated lint errors across other app files, and the focused Deno TOTP test could not run because Deno is unavailable in this environment.
