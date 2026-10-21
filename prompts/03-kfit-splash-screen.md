# Phase 04: Minimal K-Fit Startup Screen

Status: done

## Objective

Show a brief, text-only K-Fit opening screen before the existing login route.

## Scope

- Add a startup route that replaces itself with the existing login route after a short display.
- Show only centered `K-Fit` text in white on a pure black background.
- Use the Bebas Neue font from a locally bundled font asset.
- Fade the text in, and use the native stack fade when transitioning to login.
- Keep the existing login route, authentication, and other navigation behavior unchanged.
- Configure the native splash background as black and remove its current image so startup does not display a different splash design.
- Use a transparent Android native splash drawable so the launcher icon is not repeated before the in-app K-Fit screen.
- Do not add dependencies or change unrelated routes.

## Design

- Full available screen, centered horizontally and vertically, with a pure `#000000` background.
- One responsive white `K-Fit` text element in Bebas Neue, sized relative to the available width.
- No logo, image, icon, button, or additional text.
- Brief fade in with system reduced-motion behavior respected, followed by a short pause and a native fade transition to login.
- Bundle the Bebas Neue Regular font and its SIL Open Font License text under `assets/fonts/`.

## Verification

- Run `npx expo lint`, `npx tsc --noEmit`, and `git diff --check`.
- Confirm route startup reaches the existing login page without changing its authentication flow.
- Inspect the splash on available small, medium, and large Android configurations in portrait; check landscape only if available.
- Check a release build on Android for native splash behavior, since Expo Go and development builds do not fully reproduce the standalone splash screen.

## Result

Implemented the text only startup route, bundled Bebas Neue and its license, and configured a black native splash background with a transparent Android launch drawable. The splash fades in, respects reduced motion, and replaces itself with the existing login route. Authentication code is unchanged.

Verification:
- `npx tsc --noEmit` passed.
- ESLint passed for `src/app/splash.tsx` and `src/app/_layout.tsx`.
- `npx expo export --platform android` passed and included the Bebas Neue font asset.
- Expo configuration resolves the black Android splash background and the transparent Android drawable used to hide the launcher icon.
- `npx expo lint` still reports five errors in untouched files: apostrophe escaping in `attendance.tsx`, `payments.tsx`, and `trainers.tsx`, plus a synchronous state update in `use-color-scheme.web.ts`.
- LDPlayer is running, but its ADB endpoint is unavailable to this workspace, so device screenshots and size checks remain unverified.
