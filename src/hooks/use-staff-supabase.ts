import { createMemberSupabaseClient } from "@/utils/supabase";
import { useAuth } from "@clerk/expo";
import { useCallback, useMemo } from "react";

/**
 * Supabase client for coach/admin screens.
 *
 * PostgREST RLS reads `auth.jwt() ->> 'sub'`, which only exists on the Clerk
 * JWT template named `supabase`. The default session token is rejected, so the
 * template token is requested first and the default token kept as a fallback
 * (the dev-only Edge Functions accept it).
 */
export function useStaffSupabase() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  const getSupabaseToken = useCallback(async () => {
    if (!isSignedIn) return null;
    try {
      const templateToken = await getToken({ template: "supabase" });
      if (templateToken) return templateToken;
    } catch (error) {
      console.warn(
        "[Coach Token Notice]:",
        error instanceof Error ? error.message : String(error),
      );
    }
    return getToken();
  }, [getToken, isSignedIn]);

  const configured = Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_KEY,
  );

  const supabase = useMemo(() => {
    if (!configured) return null;
    try {
      return createMemberSupabaseClient(getSupabaseToken);
    } catch {
      return null;
    }
  }, [configured, getSupabaseToken]);

  return {
    supabase,
    userId: userId ?? null,
    isSignedIn,
    isLoaded,
    configured,
  };
}
