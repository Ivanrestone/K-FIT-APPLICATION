import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// Close the in-app browser tab on Android so the WebBrowser session resolves
// and control returns to startSSOFlow in index.tsx.
WebBrowser.maybeCompleteAuthSession();

// After the OAuth deep-link lands here, immediately replace this blank screen
// with the index route. This prevents the white screen that shows while
// Clerk is activating the session. The isSignedIn useEffect in index.tsx
// calls provisionAndRoute() once React state has fully settled.
export default function SSOCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
