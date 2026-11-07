import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

type AccessTokenProvider = () => Promise<string | null>;

// Android emulators cannot reach the host machine through localhost. The host
// loopback is exposed as 10.0.2.2, so development builds rewrite the Supabase
// URL while release builds keep using EXPO_PUBLIC_SUPABASE_URL unchanged.
export function resolveSupabaseUrl(url: string): string {
  if (!__DEV__ || Platform.OS !== "android") return url;
  return url.replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/i, "//10.0.2.2");
}

export function createMemberSupabaseClient(getToken: AccessTokenProvider) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase URL and public key are required.");
  }

  const accessToken = async () => await getToken();

  return createClient(resolveSupabaseUrl(url), publishableKey, {
    accessToken,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
