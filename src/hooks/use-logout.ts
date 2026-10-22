import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";

export function useLogout() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signOutInFlight = useRef(false);

  const logout = useCallback(async () => {
    if (signOutInFlight.current) {
      return;
    }

    signOutInFlight.current = true;
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Could not sign out",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      signOutInFlight.current = false;
      setIsSigningOut(false);
    }
  }, [router, signOut]);

  return { isSigningOut, logout };
}
