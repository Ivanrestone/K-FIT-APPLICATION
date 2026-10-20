# K-Fit

Expo React Native gym management app. Members pay a 150 PHP digital subscription to generate TOTP Dynamic QR codes for facility entry, book classes, and manage their physical gym memberships, all verified by a dedicated door-mounted scanning kiosk.

This file is the project's memory: it holds every decision that is still true. Plans in `prompts/` are history.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm install: resolves SDK-compatible versions
npx expo start              # dev server (press i for the iOS simulator)
npx expo lint               # lint
npx tsc --noEmit            # type check
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
npx eas-cli@latest <cmd>    # EAS builds, submits, and updates
```

## Expo & Framework

- Expo ships breaking changes every SDK release, so don't trust memory. Before touching an Expo, EAS, or React Native API, check the `expo` major version in `package.json` and read the official docs.
- Routes live in `src/app/`: every file is a screen and `_layout.tsx` files define navigators. Keep components, hooks, and utils outside `src/app/`.
- `ios/` and `android/` are generated. Never create or edit them by hand; configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. For the camera scanner or secure storage modules, use a development build (`npx expo run:android` or `run:ios`).

## Who owns what

Each tool has one job. Ask before moving a responsibility to a different tool.

- **Roles & Auth:** The system strictly enforces three roles: Member (end-user), Coach (staff/classes), and Admin/Gym Owner (kiosk setup, financials). 
- **The Door Kiosk:** A dedicated physical phone/tablet mounted at the door. Logged in as Admin/Coach, it remains permanently on a Camera Scanner screen to read member QRs and log check-ins/check-outs.
- **Subscriptions (Dual-Tier):** The backend separates software access from physical access. The `App Subscription` (150 PHP) owns access to the UI (QR generation, booking). The `Gym Subscription` owns the physical facility rights. Both must be active to check in.
- **Dynamic Access (TOTP):** The Member app generates a Time-Based One-Time Password (TOTP) QR code. It refreshes every 15-30 seconds. The payload includes `member_id`, `timestamp`, and a cryptographic hash.
- **Validation Logic:** The backend owns validation. When the Kiosk scans a QR, the backend validates the token, checks dual-subscription status, marks the token as consumed to prevent replay attacks, and logs the attendance.
- **Bookings:** Capacity-limited slots and waitlists. Only Members with an active 150 PHP App Subscription can reserve slots.

## Rules

- Secret keys never reach the app bundle. Never put them behind `EXPO_PUBLIC_`, which is bundled into the app. Never commit `.env`. Keep variable names, without values, in `.env.example`.
- **QR Security:** The TOTP QR component must unmount, blur, or trigger a screen-capture prevention overlay when the app moves to the background on the Member's phone to prevent screenshot sharing.
- **Memory/Battery Management:** The Door Kiosk camera scanning state must be heavily optimized for long-term battery and memory efficiency, as it runs continuously.
- **Offline States:** The Member app generates TOTP locally (like Google Authenticator) and can do so offline. The Kiosk *must* have an internet connection to validate tokens; implement strict error UI if the Kiosk drops offline.
- **Database Schema:** Let the backend generate document IDs. Decouple `users`, `subscriptions_app`, `subscriptions_gym`, `attendance_logs`, and `bookings` strictly.
- Ask before adding a dependency, changing the database schema once content exists, or deleting data. Prefer Expo modules over third-party libraries.
- Whenever you need input from the user, ask through your tool's built-in question panel so they pick from options instead of typing. 

## How we build features

For a new feature or a change across several files. Small fixes and questions skip this.

1. **Understand.** Read the code involved. Open an earlier plan only if this feature builds directly on it (pick by file name). Read the current docs pages for the APIs you'll use.
2. **Ask.** If a real decision is unclear (scope, visible behavior, data shape), ask in the question panel, batching questions into one round and following up only if the answers raise new ones. Pick defaults for the rest and list them. If a decision in this file looks wrong, raise it instead of changing it.
3. **Plan.** Copy `prompts/TEMPLATE.md` to `prompts/NN-feature-name.md` (next number) and fill it in. The plan must be self-contained, so a fresh session can build it from this file plus the plan alone.
4. **IMPORTANT: stop and wait.** Write no app code until the user approves the plan. Ask for approval in the question panel (approve, or request changes). If they request changes, update the plan and ask again. On approval, set `Status: approved`.
5. **Build** step by step, checking each one. If a step turns out wrong, stop and explain instead of redesigning.
6. **Close out.**
   - Run the plan's Verification and give the report described under Reporting.
   - Add a short `## Result` to the plan and set `Status: done`.
   - Update this file: put each lasting decision in the section it belongs to. Replace or remove rules that are no longer true instead of appending. Keep this file under 150 lines.

## Building from designs

Designs are attached in the chat. Screens must match them exactly: layout, spacing, sizes, colors, type, radii, icons, and copy.

- Map every color, font, spacing value, and radius to a design-system token. List values with no token in the plan as proposed new tokens instead of hardcoding them. 
- UI plans describe the design (elements, states, tokens, assets) well enough to build without the image. If building in a new session, ask for the design to be attached again.
- After building, open the screen in the iOS simulator or Android emulator, take a screenshot, and compare it with the design. List every difference, fix, and repeat. Report which values were estimated from an image.

## Reporting

End every piece of work that changes code (features and fixes, not answers to questions) with this report. Use these headings in this order, and leave out any section that would be empty.

- **Done:** one line on the outcome, then the files changed and what changed in each.
- **Verified:** each check with ✅ or ❌ and its evidence (command output, screenshot). List what wasn't checked as ❌ with the reason. Never mark something ✅ without running it.
- **You need to:** numbered actions only the user can take, such as keys, dashboard settings, database migrations, or assets to provide.
- **Test it yourself:** numbered steps to reproduce the result from a fresh start, ending with `Expected:` and what the user should see.
- **Notes:** defaults picked, trade-offs, and anything left for later.

## Checks

- Lint and type check pass before any task is called done.
- The TOTP interval timers are strictly cleaned up when the QR screen unmounts.
- Screens that load data handle loading, error, and empty states.
- Kiosk scanning flows are tested against valid, expired, and duplicate (consumed) QR codes.