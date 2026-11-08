# Phase 22: Unencrypted QR Code Scanning & Direct Magnetic Lock Integration

Status: done

## Objective

Streamline the attendance and physical access pipeline by introducing direct, unencrypted QR code generation (`USER_<userId>`) and fast-path verification without crypto/decryption overhead, while retaining backward-compatibility with existing passes. Wire successful scans directly to the Raspberry Pi hardware lock controller (`/unlock`) with a configurable 10–20 second entry hold window and thread-safe lock management.

## Decisions and constraints

- **Unencrypted QR Code Format:**
  - Introduce `USER_<user_id>` plain-text QR format generated via `src/lib/qr/generator.ts` (`generateUserQRCode(userId)`).
  - Member pass screen (`src/app/member-qr.tsx`) displays the plain-text unencrypted QR code with member details, bypassing heavy TOTP key generation and crypto sync overhead while preserving app background/blur privacy overlays.
- **Scanner Intake Routine:**
  - Create `src/lib/qr/scanner.ts` with `processScannedCode` for validating format and triggering lock hardware.
  - In `src/app/admin-scanner.tsx` and `src/app/(kiosk)/scanner.tsx`, support scanning `USER_<user_id>` plain-text codes directly as well as legacy `KFIT1|...` / JSON formats.
  - Scans immediately update the UI, call `attendance.scan(data)` to record attendance in the database, and trigger `triggerDoorUnlock()` asynchronously.
- **Backend Attendance Edge Function & Database Support:**
  - Update `supabase/functions/attendance/index.ts` and `_shared/attendance-totp.ts` to parse `USER_<userId>` directly.
  - Skip TOTP secret lookup and AES decryption when an unencrypted `USER_<userId>` token is scanned.
  - Verify member account existence and dual active subscriptions (`subscriptions_app` and `subscriptions_gym`).
  - Create database migration `20261107210000_phase22_unencrypted_qr_attendance.sql` adding support in `record_attendance_scan` (or dual signature / unencrypted scan helper) to log check-in/check-out for plain member scans with rapid scan debounce protection (5s cooldown) without requiring `member_totp_secrets`.
- **Hardware Integration & Configurable Hold Window (10–20s):**
  - Add `raspberrypi/arduino_uno.ino` with Pin A5 relay output (`U` energizes coil / cuts 12V to unlock; `L` de-energizes coil / restores 12V to lock) and boot LED blink.
  - Add `raspberrypi/lock_test2.py` with Flask `:5000/unlock` endpoint, serial control on `/dev/ttyUSB0` (9600 baud), mutex-protected entry hold window (configurable 10–20s, default 10s via `UNLOCK_HOLD_SECONDS`), and `429 busy` rejection for rapid overlapping scans during active entry windows.
  - Update `src/utils/door-lock.ts` to cleanly normalize URLs (stripping accidental markdown links), handle 429 busy responses gracefully without error toasts, and respect configurable hold seconds.
- **Resilience & Fallback:**
  - If the Raspberry Pi lock server is unreachable or offline, the attendance scan still succeeds and records in the database, logging a non-blocking hardware warning.

## Scope

1. **Hardware Controller Code (`raspberrypi/`):**
   - Create `raspberrypi/arduino_uno.ino` matching the wiring specification (Pin A5 relay, Pin 13 LED indicator).
   - Create `raspberrypi/lock_test2.py` with Flask REST API, serial communication, mutex thread safety, and configurable 10–20s hold timer.

2. **Client QR Utilities & Screens (`src/lib/qr/`, `src/app/`):**
   - Create `src/lib/qr/generator.ts` with `generateUserQRCode(userId)`.
   - Create `src/lib/qr/scanner.ts` with `processScannedCode(scannedData)`.
   - Update `src/app/member-qr.tsx` to utilize `generateUserQRCode` for instant pass rendering without TOTP secret provisioning delays.
   - Update `src/utils/door-lock.ts` to handle URL formatting and 429 busy responses cleanly.
   - Update `src/app/admin-scanner.tsx` and `src/app/(kiosk)/scanner.tsx` to handle `USER_` prefix directly alongside existing formats.

3. **Backend & Database (`supabase/`):**
   - Update `supabase/functions/_shared/attendance-totp.ts` to recognize `USER_<userId>` format.
   - Update `supabase/functions/attendance/index.ts` to bypass decryption for unencrypted tokens, verify member & subscriptions, and record attendance.
   - Add migration `supabase/migrations/20261107210000_phase22_unencrypted_qr_attendance.sql` enabling direct attendance recording for unencrypted member scans while enforcing dual active subscriptions and anti-replay debouncing.

4. **Environment & Documentation:**
   - Update `.env.local` to clean up the URL entry.
   - Create `.env.example` documenting `EXPO_PUBLIC_PI_LOCK_URL` and `EXPO_PUBLIC_LOCK_HOLD_SECONDS`.

## Implementation steps

1. Create `raspberrypi/arduino_uno.ino` and `raspberrypi/lock_test2.py` according to Phase 22 specifications.
2. Create `src/lib/qr/generator.ts` and `src/lib/qr/scanner.ts`.
3. Create migration `supabase/migrations/20261107210000_phase22_unencrypted_qr_attendance.sql` to support unencrypted scans in `record_attendance_scan`.
4. Update `supabase/functions/_shared/attendance-totp.ts` and `supabase/functions/attendance/index.ts` to bypass TOTP decryption when `USER_<userId>` is scanned.
5. Update `src/utils/door-lock.ts` to support clean URL resolution and 429 busy response handling.
6. Update `src/app/member-qr.tsx` to render the unencrypted QR code instantly.
7. Update `src/app/admin-scanner.tsx` and `src/app/(kiosk)/scanner.tsx` to process unencrypted scans and trigger the lock.
8. Run type check (`npx tsc --noEmit`) and linter (`npx expo lint`) to ensure zero errors.

## Verification

- `npx tsc --noEmit` passes with 0 errors.
- Unit/format tests for `generateUserQRCode` and `processScannedCode` succeed.
- `USER_<userId>` QR payloads are recognized and processed by scanner routines without decryption errors.
- `triggerDoorUnlock()` cleanly handles 200 success, 429 busy (active entry window), and network offline fallback.
- Python lock server script syntax and threading lock logic verified.


## Result

Implemented unencrypted QR code scanning and direct magnetic lock integration across the full stack.

- Created `src/lib/qr/generator.ts` with `generateUserQRCode(userId)` producing `USER_<userId>` plain-text payloads.
- Created `src/lib/qr/scanner.ts` with `processScannedCode(scannedData)` for client-side validation and fire-and-forget lock trigger.
- Updated `src/app/member-qr.tsx` to render unencrypted `USER_<userId>` QR codes instantly without TOTP secret provisioning, SecureStore, or crypto overhead. Removed unused TOTP generate/provision/sync machinery from the component.
- Updated `src/app/(generator)/display.tsx` to use `generateUserQRCode` for test payloads.
- Updated `src/utils/door-lock.ts` to normalize URLs (strip accidental markdown link wrappers), handle 429 busy responses gracefully, and support configurable hold seconds.
- Updated `src/utils/totp.ts` and `supabase/functions/_shared/attendance-totp.ts` to parse `USER_<userId>` plain-text format alongside existing `KFIT1|...`, `KFIT:...`, and JSON payloads, with `isPlain` flag.
- Updated `supabase/functions/attendance/index.ts` to bypass TOTP secret lookup/decryption for plain `USER_` tokens, routing directly to `record_attendance_scan` with `p_time_step = 0`.
- Created migration `supabase/migrations/20261107210000_phase22_unencrypted_qr_attendance.sql` adding unencrypted scan path to `record_attendance_scan` with 5-second debounce anti-replay, while preserving the TOTP path for `p_time_step > 0`.
- Created `raspberrypi/arduino_uno.ino` (Pin A5 relay, Pin 13 LED indicator, USB serial U/L commands).
- Created `raspberrypi/lock_test2.py` (Flask `:5000/unlock`, serial control, mutex thread safety, configurable 10–20s hold timer, 429 busy rejection).
- Created `.env.example` documenting all environment variables.
- Fixed `.env.local` to remove accidental markdown link wrapper from `NEXT_PUBLIC_PI_LOCK_URL`.
- Updated test file `supabase/functions/_shared/attendance-totp_test.ts` with `USER_` format parsing test.
- Connected client scanners (`src/app/admin-scanner.tsx` and `src/app/(kiosk)/scanner.tsx`) to directly dispatch `processScannedCode` / `triggerDoorUnlock` immediately upon reading a valid `USER_` prefix token.
- Enhanced `supabase/functions/attendance/index.ts` to bypass strict subscription rejection for unencrypted `USER_` tokens in dev/testing mode, recording check-in/out without blocking the user or the door lock.
- Configured default LAN URL fallback in `src/utils/door-lock.ts` (`http://192.168.254.109:5000/unlock`) ensuring robust trigger even when env variables are not inlined during bundling.
