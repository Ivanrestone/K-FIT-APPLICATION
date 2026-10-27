import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// Complete the auth session in the in-app browser tab on Android
// so control returns to startOAuthFlow in index.tsx.
WebBrowser.maybeCompleteAuthSession();

export default function OAuthNativeCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
