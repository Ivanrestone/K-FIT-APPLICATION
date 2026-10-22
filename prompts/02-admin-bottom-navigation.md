# Phase 03: Admin Bottom Navigation

Status: done

## Objective

Replace the admin mobile sidebar with a fixed bottom navigation bar inspired by the supplied reference image, while keeping the existing sidebar layout for wider screens.

## Scope

- Update `src/components/Sidebar.tsx` to render responsively:
  - Compact bottom bar on phone-sized screens.
  - Existing collapsible sidebar on wider screens.
- Keep all current admin routes and logout behavior.
- Keep the active-route highlight and labels visible in the bottom bar.
- Use the existing route icons for now; no dependency additions.
- Update affected admin screen containers only if required so content is not hidden behind the bottom bar.
- Do not alter member navigation or dashboard business logic.

## Design

- Bottom bar spans the safe-area width at the bottom.
- Use a white surface with a subtle top border.
- Show five primary destinations in the bar: Dashboard, Members, Attendance, Trainers, and Payments.
- Use the active state with the existing K-FIT accent color and muted inactive labels/icons.
- Put secondary destinations (Memberships, Memo) and logout behind the existing admin sidebar on larger screens; on phones, expose them through a compact overflow action if needed.
- Respect bottom safe-area insets and keep the bar fixed while each screen scrolls.

## Verification

- Run `npx tsc --noEmit`.
- Run `npx expo export --platform web`.
- Verify each bottom-bar destination navigates to the correct route.
- Verify the active item updates across admin screens.
- Verify the dashboard content remains reachable above the bar.
- Verify the wider-screen sidebar remains available.

## Result

Implemented responsive admin navigation:
- Phone-sized screens now use a fixed bottom bar with Dashboard, Members, Attendance, Trainers, Payments, and More.
- The More sheet exposes Memberships, Memo, and Logout.
- Wider screens retain the existing collapsible sidebar.
- Admin screen scroll containers include bottom space so the fixed navigation does not cover the last content.

Verification completed:
- `npx tsc --noEmit` passed.
- `npx expo export --platform web` passed.
- `git diff --check` passed for the navigation changes.
- Native device interaction and screenshot comparison were not available in this environment.
