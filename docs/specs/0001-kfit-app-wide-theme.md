# 0001. Standardize the K Fit App Theme

**Date**: 2026-10-21
**Status**: Accepted

## Summary

This decision sets one black and neon green theme for every existing K Fit screen and shared component. The theme stays dark on every supported platform, even when the device uses light appearance. The splash screen stays black and white, and the QR code keeps its high contrast scan pattern.

## Context

K Fit is an Expo React Native app targeting Android, iOS, and web. The login and admin dashboard now use shared K Fit color tokens, while member screens, payments, attendance, trainers, the QR generator, kiosk overlays, starter screens, and some shared navigation still define their own colors.

The theme file also exposes a separate light and dark palette that follows the device setting. That behavior conflicts with the requested fixed dark appearance. Without one enforceable source for colors, screens can continue to look unrelated and new UI can reintroduce the earlier light surfaces.

The requested theme is a visual change only. Existing layouts, screen content, authentication, navigation, data, and business behavior must remain in place. The current project has no Reports or Settings route, so this decision does not add those modules.

## Requirements

**User stories**:
- As a K Fit member, coach, or admin, I want the existing app screens to share one dark fitness theme so that the product feels consistent wherever I go.

**Acceptance criteria**:
- **AC-1**: Every existing screen and shared UI component uses the approved theme across Android, iOS, and web.
- **AC-2**: The app keeps the black and neon green theme regardless of the device appearance setting.
- **AC-3**: Main backgrounds use `#0A0A0A`, content surfaces use `#202020`, the primary accent uses `#B8F34A`, primary text uses `#FFFFFF`, secondary text uses `#B3B3B3`, and borders use `#333333`.
- **AC-4**: Existing active, success, warning, error, disabled, and selected states remain distinguishable. Success and active states use the accent; warning and error states keep clear semantic colors and are not represented by color alone.
- **AC-5**: Existing forms, tables, cards, navigation, dialogs, charts, loading states, and permission states use themed surfaces and text without changing their behavior.
- **AC-6**: The K Fit splash remains text only, centered, white on pure black, with its existing animation.
- **AC-7**: The generator QR remains black on white for scanning contrast. Its surrounding screen and progress display use the app theme. The live kiosk camera preview remains unchanged, while its controls and status overlays use the theme.
- **AC-8**: Existing layouts, logo and brand assets, routes, authentication, APIs, data, and business rules remain unchanged. No new modules or dependencies are added.
- **AC-9**: Existing responsive behavior and readable text are preserved across supported screen sizes.
- **AC-10**: Linting rejects direct color literals in app screens and shared components, so new colors must come from the shared theme.

## Options considered

### Option 1: One app wide migration with a lint guard

Apply the theme to all existing screens and shared components in one coordinated change. Use the existing ESLint setup to prevent future direct color values outside the theme.

**Pros**:
- Meets the request for a consistent appearance across all existing routes.
- Keeps current color values in one source and catches new drift without another dependency.

**Cons**:
- Touches more screens at once, so careful visual checks are needed.
- Existing special cases such as status colors, the splash, and QR contrast must be represented deliberately.

### Option 2: One app wide migration with review only

Apply the theme to all current screens, but rely on code review to keep later changes consistent.

**Pros**:
- Meets the immediate visual request with less lint configuration.
- Keeps implementation focused on the existing screens.

**Cons**:
- A later screen can reintroduce hardcoded colors without a failing check.
- Reviewers must remember the rule on every UI change.

### Option 3: Theme new screens only

Use the new palette for future UI and leave existing screens to be updated over time.

**Pros**:
- Smaller initial change with less immediate review effort.

**Cons**:
- Existing screens remain inconsistent, which does not meet the requested outcome.
- Users continue to see mixed visual styles across routes.

## Decision

**Chosen option**: Option 1: One app wide migration with a lint guard.

Use one shared color source for every existing K Fit screen and shared component. Apply the palette on Android, iOS, and web regardless of device appearance. Preserve the monochrome splash, QR scanning contrast, and meaningful status colors as explicit exceptions.

**Implementation skills**: `expo-design-system` (`Ivanrestone/K-FIT-APPLICATION`, `.agents/skills/expo-design-system/`) · `expo-native-ui` (`Ivanrestone/K-FIT-APPLICATION`, `.agents/skills/expo-native-ui/`)

## Rationale

The project already has a theme module and a working Expo setup, so adding another styling system or package would create more places to maintain. The login and dashboard show that shared K Fit tokens fit the current code. Extending that source and making the root theme fixed dark is simpler than keeping screen specific palettes and device dependent variants.

One coordinated migration is the only option that meets the request to theme every current module. A lint guard uses the existing ESLint installation to reduce future drift. The approved exceptions protect established product behavior: QR readability, the text only splash design, and clear status meaning.

## Standard definition

**Canonical pattern**:
```tsx
import { KFitColors } from '@/constants/theme';

const styles = StyleSheet.create({
  screen: { backgroundColor: KFitColors.background },
  panel: {
    backgroundColor: KFitColors.surface,
    borderColor: KFitColors.border,
  },
  title: { color: KFitColors.text },
  description: { color: KFitColors.mutedText },
  primaryAction: { backgroundColor: KFitColors.accent },
  primaryActionText: { color: KFitColors.background },
});
```

`KFitColors` is the only source for visual colors. It contains the six core palette values, named semantic status colors, and named splash and QR contrast values. The existing `Colors` light and dark interfaces must derive from the same tokens, not repeat palette values. The root navigation theme and `useTheme` must render the dark palette in every device appearance. Use the accent for active or successful states, retain distinct warning and error colors, and use labels or icons as well as color to explain status.

The same tokens apply to route screens, shared navigation, forms, tables, modals, platform tab bars, and permission or loading states. A screen must not introduce a separate page palette or a route specific theme flag.

**Replaces**:
- Independent light color values in individual screens and shared controls.
- Screen specific copies of the K Fit palette.
- Device appearance based theme switching for K Fit app surfaces.
- Route specific theme flags for shared navigation.

**Enforcement**:
Use ESLint `no-restricted-syntax` in `eslint.config.js` to reject literal values in color style properties and JSX color props under `src/app/` and `src/components/`. Keep color literals in `src/constants/theme.ts`; all app surfaces, including approved exceptions, reference named tokens from there. This uses the existing linter and adds no package.

**Rollout**:
Single migration of every existing UI route and shared component, followed by lint and type checks and visual review on the supported platforms.

**Exceptions**:
- The K Fit splash remains pure black and white, as already specified.
- The QR graphic remains black on white for reliable scanning. The QR surface around it follows the app theme.
- The live camera image remains device content. The kiosk controls, status, and surrounding interface use the app theme.
- Warning and error states may retain distinct semantic colors. Each state must also have a readable text or icon cue.
- Existing static brand assets remain unchanged.

## Consequences

**Positive**:
- Existing app routes share the same dark visual identity.
- New UI is less likely to reintroduce unthemed colors.
- No new dependency, backend change, or data migration is required.

**Negative / tradeoffs**:
- Users cannot switch the app to a light appearance through their device setting.
- The migration touches many route and shared component files, increasing the need for cross platform review.
- QR, splash, and status colors mean that not every rendered pixel uses only the six core palette values.

**Neutral**:
- Existing reports and settings are not created because there are no such routes in the current app.
- Authentication, data, APIs, and route behavior remain outside the theme change.

## Follow-up

- [ ] The `expo-design-system` conventions are not yet listed in root `AGENTS.md`. Consider recording the shared token rule there during a later project memory sync.
- [ ] Root `AGENTS.md` currently limits the theme to login and dashboard. Reconcile that line with this app wide decision after it is accepted.
