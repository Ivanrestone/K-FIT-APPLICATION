# Phase-05: Clerk Authentication & Google Login Integration

## Context
To streamline member onboarding, we are integrating Clerk to enable single-tap Google Login. However, it is critical that we retain the standard email/password login flow to support our dedicated hardware accounts and testing roles. The app must seamlessly support both OAuth (Google) and local credential authentication.

## Scope
- Install and configure `@clerk/clerk-expo`.
- Update the Login screen UI to feature a "Continue with Google" button alongside the existing Email/Password input fields.
- Ensure the hardcoded role accounts (Admin, Member, Trainer, Scanner, Qrcode) remain fully functional.
- Implement role fallback logic: Google OAuth logins default to the `member` role, while specific emails retain their elevated or specialized roles.

## Steps

1. **Install Clerk Dependencies:**
   - Run `npx expo install @clerk/clerk-expo`.
   - Set up your Clerk API keys in a `.env` file (e.g., `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`). Remember not to commit this file.

2. **Configure Clerk Provider:**
   - Wrap your root `_layout.tsx` (or main App component) with `<ClerkProvider>`.
   - Implement the token cache logic as recommended by Clerk's Expo documentation to persist sessions securely on the device.

3. **Update the Login UI:**
   - Modify the existing login screen (`src/app/login.tsx`).
   - Add a "Continue with Google" button using Clerk's `useOAuth` hook.
   - Retain the existing email and password text inputs and the submit button.

4. **Implement Unified Routing & Role Logic:**
   - Upon successful Clerk authentication (either via Google or email/password), check the user's email address.
   - Assign roles based on the email string:
     - `Admin@gmail.com` -> routes to Admin Dashboard
     - `Member@gmail.com` -> routes to Member Dashboard
     - `Trainer@gmail.com` -> routes to Trainer Dashboard
     - `Scanner@gmail.com` -> routes to Kiosk Scanner
     - `Qrcode@gmail.com` -> routes to QR Generator (if kept for fallback testing)
   - If the email does not match the hardcoded list (e.g., a new user signing in via Google), assign them the default `member` role and route them to the Member Dashboard.

## Verification

- [ ] `npx expo-doctor` passes with the new Clerk dependencies.
- [ ] Tapping "Continue with Google" opens the OAuth browser flow and logs the user in as a standard member.
- [ ] Entering `Scanner@gmail.com` / `Scanner123` via the standard input fields successfully bypasses the member route and locks into the Kiosk Scanner.
- [ ] The app successfully remembers the session across app restarts (token caching works).

## You need to:
1. Create a project in the [Clerk Dashboard](https://dashboard.clerk.com).
2. Enable "Email/Password" and "Google" in the Clerk authentication providers settings.
3. Add the `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to your local `.env` file.
4. Manually create the test accounts (Admin, Member, Trainer, Scanner, Qrcode) inside your Clerk Dashboard users list with their respective passwords so they authenticate against Clerk's backend, or configure the code to intercept those specific emails before calling Clerk.

## Test it yourself:
1. Run `npx expo start`.
2. Tap "Continue with Google" and complete the flow. Verify you land on the Member screen.
3. Log out.
4. Type `Admin@gmail.com` and `Admin123` into the manual fields and submit.
5. **Expected:** You are routed strictly to the Admin dashboard.

## Result
Status: Pending Approval