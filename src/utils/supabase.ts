import { createClient } from "@supabase/supabase-js";

type AccessTokenProvider = () => Promise<string | null>;

export function createMemberSupabaseClient(getToken: AccessTokenProvider) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase URL and public key are required.");
  }

  const accessToken = async () => await getToken();

  return createClient(url, publishableKey, {
    accessToken,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
