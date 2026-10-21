# Phase-02: Kiosk QR Scanner (Door Device) Integration

## Context
The core app structure (Login, Admin, and Member pages) is already built. This phase integrates a dedicated "Scanner Kiosk" mode into the existing architecture. A physical device at the gym door will use a specific account (`scanner@gmail.com`) to bypass standard member/admin routing and lock the device into a full-screen, continuous QR scanner for checking in members and coaches.

## Scope
- Integrate a role check into the existing login flow specifically for `scanner@gmail.com`.
- Create a new, isolated route group (`(kiosk)`) with navigation headers and tabs disabled.
- Implement `expo-camera` to read the dynamic TOTP QR codes.
- Build the continuous scanning logic (debouncing and handling scan events) without requiring the user to tap the screen between scans.

## Steps

1. **Install Camera Dependency:**
   - Run `npx expo install expo-camera`.
   - Update `app.json` to include the camera permission plugin: 
     `"plugins": [["expo-camera", {"cameraPermission": "Allow K-Fit to use the camera for QR check-ins."}]]`

2. **Update Existing Login Logic:**
   - Modify the current login handler in your authentication flow.
   - Add a conditional check: If the authenticated email is `scanner@gmail.com` (password: `scanner123`), assign the `scanner` role and route them explicitly to `/scanner` instead of the Member or Admin dashboards.

3. **Build the Kiosk Route & Screen:**
   - Create a new directory `src/app/(kiosk)` and add a `_layout.tsx` that hides all headers (`headerShown: false`) to prevent the scanner from navigating away.
   - Create `src/app/(kiosk)/scanner.tsx`.
   - Request camera permissions on mount using `useCameraPermissions()`.
   - Render the `<CameraView>` from `expo-camera` taking up the full screen flex space.

4. **Implement Continuous Scan Logic:**
   - Add an `onBarcodeScanned` handler to the `CameraView`.
   - Implement a debounce state (`isScanning` boolean): When a QR is scanned, set `isScanning` to true, process the mock check-in (e.g., show an on-screen toast "Check-in logged"), wait 3 seconds using `setTimeout`, and then set `isScanning` to false to accept the next member's QR.

## Verification

- [ ] `npx expo-doctor` passes with the new `expo-camera` dependency installed.
- [ ] Logging in with `scanner@gmail.com` correctly intercepts the existing auth flow and routes strictly to the kiosk screen.
- [ ] The kiosk screen has no back buttons, tab bars, or headers (fully locked down).
- [ ] Pointing the camera at a QR code triggers the scan event exactly once, pauses for 3 seconds, and then resets automatically for the next scan.

## You need to:
1. Approve this updated plan.
2. Provide the exact file path to your existing Login screen if you need me to write the specific integration code for it.

## Test it yourself:
1. Start the app with `npx expo start` and scan the QR with a physical testing device.
2. Log in using `scanner@gmail.com` / `scanner123`.
3. Verify the UI is just a full-screen camera.
4. Scan a random QR code and verify the UI pauses briefly (simulating backend validation) before becoming ready again.

## Result
Status: Done

Implemented the scanner kiosk integration.

- Added `expo-camera` and its camera permission configuration.
- Added the `scanner@gmail.com` and `scanner123` login path to `/scanner`.
- Added the isolated `(kiosk)` route group with headers, gestures, and transitions disabled.
- Added the full screen QR scanner with camera permission handling.
- Added a three second scan cooldown with cleanup on unmount and an on screen check in status.