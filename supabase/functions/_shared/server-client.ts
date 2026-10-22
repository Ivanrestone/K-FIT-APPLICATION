import { createClient } from "npm:@supabase/supabase-js@2";

export function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    getDefaultSecretKey();

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function getDefaultSecretKey(): string | undefined {
  const secretKeysJson = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!secretKeysJson) {
    return undefined;
  }

  let secretKeys: unknown;
  try {
    secretKeys = JSON.parse(secretKeysJson);
  } catch {
    throw new Error("Supabase secret-key configuration is invalid.");
  }

  if (
    typeof secretKeys === "object" &&
    secretKeys !== null &&
    "default" in secretKeys &&
    typeof secretKeys.default === "string"
  ) {
    return secretKeys.default;
  }

  throw new Error("Supabase default secret key is not configured.");
}
