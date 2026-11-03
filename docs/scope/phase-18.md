# Phase 18: Frontend Integration & State Recovery

## Overview
A recent frontend UI update has decoupled the existing backend logic, breaking the Profile, Subscription, and Attendance flows. This phase focuses on re-wiring the Clerk authentication state, Supabase Edge Functions, and local TOTP logic into the new React Native component structures without altering the underlying backend architecture.

## 1. Profile Context & Auth State (Clerk)
*   **Audit New Components:** Inspect the new profile and dashboard screens to ensure Clerk's `useUser()` and `useAuth()` hooks are correctly imported and initialized.
*   **Data Binding:** Map the Clerk user payload (full name, email, profile image) and the custom Supabase member ID to the new UI text and image nodes.
*   **Loading States:** Re-implement `<SignedIn>`, `<SignedOut>`, or `isLoaded` conditional rendering so the new UI does not crash or flash blank data while Clerk initializes.

## 2. Attendance & QR Component Recovery
*   **Re-hook TOTP Provisioning:** Locate the new "Pass" or "QR" screen component. Re-integrate the Phase 17 local TOTP logic (`expo-secure-store` and `expo-crypto`) so it executes immediately on mount.
*   **Restore the Timer:** Re-attach the 30-second `setInterval` rotation and ensure the new UI's progress bar accurately reflects the remaining time window.
*   **Network Error Handling:** Ensure the `use-attendance.ts` hook is connected to the new UI, and that any background Edge Function sync failures (like 401 errors) are caught and displayed elegantly in the new design rather than crashing the component.

## 3. Subscription Status (PayMongo/Supabase)
*   **State Retrieval:** Verify that the hook responsible for fetching the member's active subscription status from Supabase is firing correctly in the new UI lifecycle.
*   **Gating & UI Flags:** Ensure the new design correctly conditionally renders "Active" vs. "Inactive" badges. If the UI includes a paywall or blocks access to the QR pass for unpaid members, re-establish that client-side routing/gating block.