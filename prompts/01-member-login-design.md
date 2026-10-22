# Phase 02: Member Login Design

Status: done

## Objective

Restyle the mobile login route to match the supplied K-FIT member-portal design while preserving the existing prototype authentication and navigation behavior.

## Scope

- Update `src/app/index.tsx`.
- Reuse the existing `assets/images/logo.jpg` asset.
- Keep the current admin and member demo credentials and route destinations.
- Keep forgot-password and sign-up actions as prototype alerts.
- Do not add dependencies or change backend/auth data behavior.

## Design

- Use a charcoal full-screen background sampled from the supplied reference (`#242424`).
- Add a compact top header with the K-FIT logo/brand and `MEMBER PORTAL` label.
- Center a dark login panel with the K-FIT logo, `MEMBER PORTAL` label, uppercase `USERNAME` and `PASSWORD` fields, `SHOW/HIDE` password control, gold `SIGN IN` button, and the supplied forgot-password/sign-up copy.
- Add the copyright footer at the bottom.
- Use `expo-image` for the logo, safe-area handling, keyboard-aware scrolling, accessible labels, and pressed states.
- Add design tokens for the supplied charcoal, gold, muted text, spacing, and radius values in the existing theme rather than scattering repeated literals.
- Preserve keyboard access and allow the form to scroll on small devices.

## Verification

- Run `npx tsc --noEmit`.
- Run the configured Expo lint command if available.
- Launch the app and verify the login screen visually against the supplied reference.
- Verify empty credentials, admin demo login, member demo login, password visibility, forgot-password, and sign-up interactions.

## Result

Implemented the K-FIT member-portal login design in `src/app/index.tsx`, including the supplied logo, charcoal/gold palette, branded header, member portal card, uppercase form controls, password visibility action, sign-in button, links, and footer. Added the related visual tokens to `src/constants/theme.ts`.

Verification completed:
- `npx tsc --noEmit` passed.
- `npx expo export --platform web` passed and generated all static routes.
- Interactive device testing and screenshot comparison were not available in this environment.
