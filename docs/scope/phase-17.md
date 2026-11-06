# Phase 17: Local TOTP Provisioning & QR Code Rendering Fix

## Overview
The member's QR pass is currently stuck on "Preparing secure pass..." because the app lacks the underlying cryptographic seed (secret) required to generate the time-based token, or the generation function is failing silently. This phase fixes the local TOTP provisioning pipeline using `expo-secure-store` and `expo-crypto` so the QR code renders instantly and rotates every 30 seconds.

## 1. Local Secret Provisioning (SecureStore)
*   **Initialization Check:** When the QR screen mounts, the app must immediately check Expo `SecureStore` for an existing TOTP secret for the logged-in member.
*   **Generate & Save:** If no secret exists in `SecureStore`, the app must securely generate a new cryptographic seed (using `expo-crypto` for randomness), store it locally in `SecureStore`, and optionally sync this seed to the member's profile in Supabase so the admin scanner can verify it later.
*   **Error Handling:** Add a `catch` block to the secret retrieval function. If provisioning fails, replace the infinite "Preparing secure pass..." loading state with a clear error message and a "Retry" button.

## 2. TOTP Generation & Rotation Logic
*   **Time Window Math:** Implement the logic to take the current Unix timestamp, divide it by the 30-second window, and hash it against the member's stored secret using `expo-crypto` (HMAC-SHA1).
*   **Rotation Timer:** Set up a `setInterval` or `useEffect` timer that recalculates the token strictly every 30 seconds and updates the React state to force a re-render.
*   **Progress Bar Sync:** Ensure the visual "Refreshes in" progress bar accurately maps to the remaining seconds of the current 30-second TOTP window.

## 3. Frontend QR Code Rendering
*   **Render the Payload:** Once the TOTP token string is successfully generated in state, pass it directly to the QR code rendering component (e.g., `react-native-qrcode-svg`).
*   **Payload Format:** Format the QR payload cleanly so the backend Edge Function can parse it during a scan. Use a standardized string structure like `KFIT|{member_id}|{totp_token}`.
*   **Clear Loading State:** Ensure the "Preparing secure pass..." text completely unmounts the millisecond the QR code component is ready to render.