# Phase 04: Login and Dashboard Theme

Status: done

## Objective

Apply the requested black and neon green palette to the existing login page and dashboard while preserving their layout and behavior.

## Scope

1. Update `src/constants/theme.ts` with named tokens for the six requested colors.
2. Apply those tokens to the existing login page in `src/app/index.tsx`.
3. Apply the palette to the dashboard background, content, cards, labels, statistics, chart, attention sections, sessions, and quick actions in `src/app/dashboard.tsx`.
4. Add an opt in dashboard theme to `src/components/Sidebar.tsx` and use it only from the dashboard, so other routes that share the sidebar keep their current colors.
5. Preserve login behavior, dashboard content, route navigation, and all data and business logic.

## Design

1. Main background: `#0A0A0A`.
2. Card and panel background: `#202020`.
3. Accent: `#B8F34A`.
4. Primary text: `#FFFFFF`.
5. Secondary text: `#B3B3B3`.
6. Borders and dividers: `#333333`.
7. Keep the login logo, layout, and form behavior unchanged. Use the accent for login focus states, links, and the primary sign in button.
8. Use the accent for dashboard emphasis, active navigation, key statistics, and chart highlights.
9. Retain distinct warning and error colors only where they communicate attention or destructive actions. Keep all other login and dashboard surfaces within the supplied palette.
10. Keep existing navigation and other routes visually unchanged.

## Verification

1. Run `npx tsc --noEmit`.
2. Run `npx expo lint`.
3. Run `git diff --check`.
4. Review the login and dashboard source to confirm the palette is applied to every existing surface and no functionality changed.
5. Verify login, dashboard, and shared sidebar on Android at small and large sizes if an accessible emulator is available. Confirm that routes using the shared sidebar without the dashboard theme retain their current appearance.

## Result

Applied the six requested palette tokens to the login page and dashboard, including the responsive dashboard navigation. Other routes retain the shared sidebar's original appearance.

Verification:
1. `npx tsc --noEmit` passed.
2. ESLint passed for `src/app/index.tsx`, `src/app/dashboard.tsx`, `src/components/Sidebar.tsx`, and `src/constants/theme.ts`.
3. `npx expo lint` reports five errors in unchanged files, in `attendance.tsx`, `payments.tsx`, `trainers.tsx`, and `use-color-scheme.web.ts`.
4. `git diff --check` passed.
5. `npx expo export --platform android` passed and bundled the Android app.
6. Android visual checks were not available because `adb` is not installed in this workspace.
