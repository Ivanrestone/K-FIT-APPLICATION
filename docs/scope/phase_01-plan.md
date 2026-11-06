# Phase 01: App Initialization and Renaming

## Objective
Fix the app name (currently showing as "MyFirstAppClean") to "K-Fit" and set up the initial routing so the app successfully transitions past the default Expo splash screen to a basic starting page.

## Context
The user is currently seeing the default Expo splash screen with the name "MyFirstAppClean". Based on Expo Router conventions, if the root layout or index file is missing or misconfigured, or if the bundle hasn't finished building the first screen, it can hang here.

## Steps

1. **Update App Configuration:**
   - Open `app.json` (or `app.config.js`).
   - Change the `"name"` field from `"MyFirstAppClean"` (or similar) to `"K-Fit"`.
   - Change the `"slug"` field to `"k-fit"`.
   - Ensure the `"scheme"` is set to `"k-fit"` for deep linking.

2. **Set up the App Directory Structure:**
   - Ensure the `src/app/` directory exists (as per our `claude.md` rules).
   - If not using `src/app/`, verify if the project is using the root `app/` directory and align it with the `tsconfig.json` and `app.json` (`"expo": { "experiments": { "tsconfigPaths": true } }` and main entry point).

3. **Create the Initial Root Layout (`src/app/_layout.tsx`):**
   - Create a basic Stack navigator to wrap the application.
   ```tsx
   import { Stack } from 'expo-router';

   export default function RootLayout() {
     return (
       <Stack screenOptions={{ headerShown: false }}>
         <Stack.Screen name="index" />
       </Stack>
     );
   }
   ```

4. **Create the Landing Page (`src/app/index.tsx`):**
   - Create a simple welcome screen that the app will load into after the splash screen finishes.
   ```tsx
   import { View, Text, StyleSheet } from 'react-native';

   export default function HomeScreen() {
     return (
       <View style={styles.container}>
         <Text style={styles.title}>Welcome to K-Fit</Text>
         <Text>The app is successfully loaded!</Text>
       </View>
     );
   }

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: '#fff',
     },
     title: {
       fontSize: 24,
       fontWeight: 'bold',
       marginBottom: 10,
     },
   });
   ```

## Verification
- Run `npx expo start` and press `a` for Android or `i` for iOS.
- Observe the splash screen; it should now briefly display before transitioning.
- The first screen should display "Welcome to K-Fit".

## Result
Status: done

Implemented the Phase 01 initialization changes:
- Renamed the Expo app to `K-Fit`.
- Set the slug and deep-link scheme to `k-fit`.
- Preserved the existing Expo Router stack and login entry screen.
- Removed the unreleased splash-screen lock so the app can transition to the first route.
- Updated the login footer branding to `K-Fit`.

Verification:
- `npx expo config --json` confirms `name=K-Fit`, `slug=k-fit`, and `scheme=k-fit`.
- `npx tsc --noEmit` passes.
- `npx expo lint` could not complete because Expo's automatic ESLint setup failed to resolve the newly installed lint package; the temporary dependency and generated config were removed.