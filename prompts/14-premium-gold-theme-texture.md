# Phase 14: Premium Gold Theme & Texture Integration

Status: done

## Objective

Rebrand the K-Fit Admin application from the neon-green theme to a high-end, luxury Gold theme. Update global color palette tokens in `src/constants/theme.ts` and integrate the custom gold texture asset (`assets/images/gold-texture.jpg`) into key UI components (primary action buttons, active navigation pills, badges, and brand marks) across the Admin interface (including Roster Management / Members and Dashboard).

## Scope

1. **Color Tokens (`src/constants/theme.ts`)**:
   - Update `KFitColors.accent` to `#D4AF37` (Metallic Gold).
   - Add `KFitColors.accentLight` (`#F3E5AB` - Vanilla / Light Gold) for text highlights.
   - Add `KFitColors.accentDark` (`#996515` - Dark Gold) for borders and subtle badge fills.
   - Set `KFitColors.onAccent` to `#121212` for crisp readability on gold surfaces.
   - Maintain deep black (`#0A0A0A` / `#000000`) and dark surface cards (`#202020` / `#121212`) to provide high contrast against the gold.

2. **Primary Action Buttons (`src/app/members.tsx`, `src/components/AppHeader.tsx`, `src/app/dashboard.tsx`)**:
   - Update the large "Add member" button in `src/app/members.tsx` to render with `<ImageBackground>` sourcing `assets/images/gold-texture.jpg`, `resizeMode="cover"`, `borderRadius: 12`, and `overflow: "hidden"`.
   - Ensure the icon (`person-add`) and button text ("Add member") are bold `#121212` for readability.
   - Apply the gold texture to header quick-add buttons (`+`) in `AppHeader.tsx` and `dashboard.tsx`.

3. **Bottom Navigation Active State (`src/components/Sidebar.tsx`)**:
   - Update the floating dock active tab (e.g., "Roster" / `/members`) to use `<ImageBackground>` with `gold-texture.jpg`, `borderRadius: 12`, `overflow: "hidden"`, and dark icon & label (`#121212`).
   - Inactive tabs remain muted dark gray (`#B3B3B3` on transparent/dark background).
   - Update wide/tablet sidebar active nav item (`navItemActive`) with matching gold styling.

4. **Brand Logo Mark ('K')**:
   - Update the top-left 'K' brand icon in `src/components/AppHeader.tsx`, `src/components/Sidebar.tsx`, and `src/app/dashboard.tsx` to use the gold texture via `<ImageBackground>` with bold dark 'K' text (`#121212`).

5. **Badges & Tags ("POS V3.0")**:
   - Update `versionBadge` in `src/components/AppHeader.tsx` and `src/app/dashboard.tsx` to use a dark gold container (`#99651533` fill with `#996515` border) and bright gold text (`#F3E5AB`).

6. **Metric Cards Icons (`src/app/members.tsx`)**:
   - Verify and ensure "Active" (`checkmark-circle`) and "New this month" (`trending-up`) metric card icons render with primary metallic gold (`#D4AF37`).

## Implementation Details

- **Asset Path**: `assets/images/gold-texture.jpg`.
- **ImageBackground Component**:
  ```tsx
  <Pressable style={({ pressed }) => [styles.addButtonWrapper, pressed && styles.pressed]}>
    <ImageBackground
      source={require("../../assets/images/gold-texture.jpg")}
      resizeMode="cover"
      style={styles.addButtonBg}
      imageStyle={styles.addButtonImage}
    >
      <Ionicons name="person-add" size={16} color={KFitColors.onAccent} />
      <Text style={styles.addButtonText}>Add member</Text>
    </ImageBackground>
  </Pressable>
  ```
- **Readability**: Ensure strict dark-on-gold contrast (`#121212` font/icon colors with `fontWeight: "800"` or `"900"`) when overlaying text on the gold texture.

## Verification

1. Run `npx tsc --noEmit` to verify type safety across all modified files.
2. Run `npx expo lint` to ensure code styling compliance.
3. Verify that `gold-texture.jpg` loads without runtime image asset resolution warnings.
4. Verify navigation and interactive states (press feedback on dock and buttons).
5. Verify dark-on-gold contrast and visual hierarchy.

## Result

Successfully rebranded the K-Fit Admin theme to the luxury Gold palette:
- Replaced flat neon green with metallic gold `#D4AF37`, vanilla gold `#F3E5AB`, dark gold `#996515`, and dark contrast text `#121212` in `src/constants/theme.ts`.
- Integrated `gold-texture.jpg` via `<ImageBackground>` into the primary "Add member" button (in both `src/app/members.tsx` and `src/app/memberships.tsx`), the active mobile bottom navigation dock tab (Roster) and tablet sidebar in `src/components/Sidebar.tsx`, and the top-left 'K' brand logo and quick add button in `src/components/AppHeader.tsx` and `src/app/dashboard.tsx`.
- Updated POS V3.0 badge to a luxury dark gold border and translucent fill with vanilla gold text.
- Metric cards' active status and trending highlights render with metallic gold `#D4AF37`.

Verification:
- `npx tsc --noEmit` passed with 0 errors (clean exit code 0).
