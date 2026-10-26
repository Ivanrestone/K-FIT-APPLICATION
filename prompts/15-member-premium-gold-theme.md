# Phase 15: Member App Premium Gold Theme Implementation

Status: done

## Objective

Apply the luxury gold textured theme established in Phase 14 to all member-facing screens and components, ensuring a cohesive, high-end visual identity across the entire K-Fit ecosystem. 

**Strict Design-Only Constraint:** Only styling (CSS, ImageBackgrounds, colors, typography contrast) is updated. No routing, database queries, state management, hooks, or business logic (including checkout sessions and profile updates) will be altered.

## Scope

1. **Member Bottom Navigation (`src/components/MemberBottomNav.tsx`)**:
   - Modernize the container to a dark premium dock (`backgroundColor: 'rgba(20, 20, 20, 0.95)'`, `borderTopColor: '#333333'`).
   - For active tabs: render a gold textured pill (`assets/images/gold-texture.jpg`) behind the icon with 14px border radius and gold glow.
   - Set active tab label color to bright gold (`#F3E5AB` / `#D4AF37`) at `fontWeight: "800"` for high contrast and readability.
   - Inactive tabs use muted gray (`#B3B3B3` / `#9CA3AF`).

2. **Subscription Paywall & Checkout Buttons (`src/components/SubscriptionPaywall.tsx`)**:
   - Refactor primary action buttons ("Subscribe for PHP ..." / "Renew for PHP ...") from standard filled buttons to luxury gold textured buttons using `<ImageBackground>` with `gold-texture.jpg`, `borderRadius: 12`, `overflow: "hidden"`, and bold dark text (`#121212`, `fontWeight: "800"`).
   - Update plan prices, active status badges, and highlights to use metallic gold (`#D4AF37`) and light gold (`#F3E5AB`).
   - Preserve all existing checkout handlers, loading states, and disabled logic.

3. **Member Profile (`src/app/member-profile.tsx`)**:
   - Primary action buttons:
     - "Save Profile" / "Save Changes" (`saveButton`): wrap in `<ImageBackground>` with `gold-texture.jpg`, `borderRadius: 12`, and dark text (`#121212`, `fontWeight: "800"`).
     - "Request to become a Coach" (`requestButton`): wrap in `<ImageBackground>` with `gold-texture.jpg`, `borderRadius: 12`, and dark text (`#121212`, `fontWeight: "800"`).
   - Avatar circle: enhance with gold border and dark/gold accent styling.
   - Edit buttons & secondary action highlights: metallic gold accent (`#D4AF37`).

4. **Member Dashboard & Progress (`src/app/member-dashboard.tsx`)**:
   - Primary action button "+ Log measurements" (`logButton`): wrap in `<ImageBackground>` with `gold-texture.jpg`, `borderRadius: 12`, and dark text (`#121212`, `fontWeight: "800"`).
   - Charts & Progress indicators: replace old indigo/green fills (`#4F46E5`) with metallic gold (`#D4AF37`) for bar chart fills (`barFill`), weight point dots (`weightDot`), and goal progress fills (`goalFill`).

5. **Member Workouts (`src/app/member-workout.tsx`)**:
   - Primary action button "▷ Start workout" (`startButton`): wrap in `<ImageBackground>` with `gold-texture.jpg`, `borderRadius: 12`, and dark text (`#121212`, `fontWeight: "800"`).
   - Secondary button "View full program" (`viewProgramButton`): style with gold accent border and gold text (`#D4AF37`).
   - Workout badges & overview numbers: style with metallic gold accents.

6. **Member Check-in & Passes (`src/app/member-checkin.tsx` & `src/app/member-qr.tsx`)**:
   - Replace neon green status badge (`#10B981`) with metallic gold badge (`#D4AF37` / gold texture badge) with `#121212` text.
   - TOTP countdown timer and pass status badges: metallic gold styling.

## Implementation Details

- **Asset Path**: `assets/images/gold-texture.jpg`.
- **Primary Button Pattern**:
  ```tsx
  <TouchableOpacity
    style={[styles.primaryButtonWrapper, disabled && styles.disabledButton]}
    onPress={onPressHandler}
    disabled={disabled}
    activeOpacity={0.8}
  >
    <ImageBackground
      source={require("../../assets/images/gold-texture.jpg")}
      resizeMode="cover"
      style={styles.primaryButtonBg}
      imageStyle={styles.primaryButtonImage}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </ImageBackground>
  </TouchableOpacity>
  ```
- **Text & Contrast Rules**:
  - Elements sitting on `gold-texture.jpg`: strictly `#121212` with `fontWeight: "800"` or `"900"`.
  - Elements sitting on dark backgrounds: `#D4AF37` (metallic gold) or `#F3E5AB` (light gold).

## Verification

1. Run `npx tsc --noEmit` to verify type safety across all modified files.
2. Run `npx expo lint` / ESLint on all touched files to ensure styling and syntax compliance.
3. Verify that `gold-texture.jpg` renders properly on all buttons and active tabs without layout shifts or text clipping.
4. Verify that all original `onPress` actions, navigation routes, and checkout session triggers remain completely unchanged.

## Result

- Applied the premium gold theme and `gold-texture.jpg` across all member app surfaces.
- Updated `MemberBottomNav.tsx` to a dark luxury dock with gold textured active icon pills and vanilla gold active labels.
- Converted primary checkout / renewal action buttons in `SubscriptionPaywall.tsx` to gold textured buttons with bold dark contrast text (`#121212`).
- Updated `member-profile.tsx` avatar, profile save buttons, and coach request buttons to the gold theme.
- Updated `member-dashboard.tsx` log button and progress chart fills to gold.
- Updated `member-workout.tsx` start workout button and program highlights to gold.
- Replaced green accent badges in `member-checkin.tsx` and `member-qr.tsx` with metallic gold `#D4AF37` and high-contrast dark text `#121212`.
- Maintained strict UI-only boundary: zero functional logic, routing, or state changes.
- Verification: `npx tsc --noEmit` passed with 0 errors.
