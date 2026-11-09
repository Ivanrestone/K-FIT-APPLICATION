# Phase 23: Auto-Rotation (Landscape Support), Dependency Resolution & Standalone APK Build Setup

**Branch Name:** `magneticlock` (or feature branch)  
**File Path:** `docs/scope/phase-23.md`  

---

## 1. Executive Summary

Phase 23 prepares the K-FIT mobile application for physical device deployment by enabling full device orientation flexibility (auto-rotating between portrait and landscape modes upon device tilt), resolving pre-build dependency mismatches surfaced by `expo doctor`, and configuring `eas.json` for standalone Android APK generation.

---

## 2. Dynamic Orientation Configuration (`app.json`)

To allow the application to automatically rotate into landscape mode when the phone is tilted:

1. Open `app.json` in the project root.
2. Update the top-level `"orientation"` key from `"portrait"` to `"default"`:

```json
{
  "expo": {
    "name": "K-FIT",
    "slug": "k-fit-application",
    "version": "1.0.0",
    "orientation": "default",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark"
  }
}
```

*Note: In Expo, setting `"orientation": "default"` unlocks full sensor-based auto-rotation (both portrait and landscape directions).*

---

## 3. Resolving `expo doctor` Errors

### Error 1: Missing Peer Dependency (`expo-asset`)
`expo-audio` requires `expo-asset` as a direct peer dependency outside Expo Go.

**Fix Command:**
```bash
npx expo install expo-asset
```

### Error 2: Duplicate Native Module (`react-native-screens`)
`react-native-screens` has mismatched versions (`4.26.2` vs `4.30.0`) inside nested `node_modules`.

**Fix Sequence:**
1. Align Expo SDK compatible package versions:
   ```bash
   npx expo install --fix
   ```
2. Deduplicate npm dependency trees:
   ```bash
   npm dedupe
   ```
3. Verify project health:
   ```bash
   npx expo-doctor
   ```

---

## 4. Standalone APK Configuration (`eas.json`)

To build an installable Android `.apk` file (without requiring Google Play Store submission), verify or update your `eas.json` in the root folder to include an `android.buildType: "apk"` configuration under the `preview` profile:

```json
{
  "cli": {
    "version": ">= 14.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

---

## 5. Execution Steps to Build the APK

After resolving dependencies and updating `app.json`:

```bash
# 1. Install missing peer dependency
npx expo install expo-asset

# 2. Fix and deduplicate dependencies
npx expo install --fix
npm dedupe

# 3. Verify project health (Must pass all checks)
npx expo-doctor

# 4. Trigger cloud APK build
eas build -p android --profile preview
```

---

## 6. Verification Checklist

- [x] `app.json` has `"orientation": "default"`.
- [x] `npx expo-doctor` passes all 21 checks without errors.
- [x] `eas.json` contains `preview.android.buildType = "apk"`.
- [x] Release build allows the LAN unlock POST (`expo-build-properties` sets `android.usesCleartextTraffic: true`; prebuild manifest verified).
- [ ] Mobile device auto-rotates into landscape mode on tilt (needs a device; prebuild emits `screenOrientation="unspecified"`).
- [ ] App correctly sends HTTP POST requests to `http://192.168.254.109:5000/unlock` when connected to local Wi-Fi (`192.168.254.x`) (needs a device on the gym LAN).

## 7. Result

Built. `orientation` was already `default`, `expo-asset` was installed, `react-native-screens` was already deduped to a single `4.26.2`, and `eas.json` already had the `preview` APK profile, so the only open item was the LAN unlock POST: the generated release manifest had no `usesCleartextTraffic`, which Android 9+ blocks. Added `expo-build-properties` (`~57.0.23`) with `android.usesCleartextTraffic: true` in `app.json`. `npx expo-doctor` 21/21 and `npx tsc --noEmit` pass; a fresh prebuild emits `android:usesCleartextTraffic="true"` and `android:screenOrientation="unspecified"`. The cloud APK build was intentionally not triggered.