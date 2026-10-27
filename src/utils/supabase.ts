import { createClient } from "@supabase/supabase-js";

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;
type AccessTokenProvider = (() => Promise<string | null>) | GetTokenFn;

export function createMemberSupabaseClient(getToken: AccessTokenProvider) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase URL and public key are required.");
  }

  const accessToken = async () => {
    try {
      const token = await (getToken as GetTokenFn)({ template: "supabase" });
      if (token) return token;
    } catch {
      // Template may not be configured, fallback to default session token
    }
    return await (getToken as () => Promise<string | null>)();
  };

  return createClient(url, publishableKey, {
    accessToken,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
