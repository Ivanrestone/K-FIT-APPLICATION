import { router } from "expo-router"; // ✅ Added this

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  data?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  try {
    const { getSupabaseClient } = await import("./supabase");
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Login failed" };
  }
}

export async function signup(
  credentials: SignupCredentials,
): Promise<AuthResponse> {
  try {
    const { getSupabaseClient } = await import("./supabase");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
      options: {
        data: credentials.data,
      },
    });

    if (error) {
      if (error.message.includes("User already registered")) {
        return {
          success: false,
          error: "This email is already registered. Please login.",
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Account creation failed. No user was returned.",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Signup failed",
    };
  }
}

export async function loginWithGoogle(): Promise<AuthResponse> {
  try {
    const { getSupabaseClient } = await import("./supabase");
    const supabase = getSupabaseClient();

    if (typeof window !== "undefined" && window.location) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const Linking = await import("expo-linking");
    const redirectUrl = Linking.createURL("/login");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) return { success: false, error: error.message };
    if (!data?.url)
      return { success: false, error: "Could not start Google sign-in" };

    const { openAuthSessionAsync } = await import("expo-web-browser");
    const result = await openAuthSessionAsync(data.url, redirectUrl);
    if (result.type !== "success" || !result.url) {
      return { success: false, error: "Google sign-in was cancelled" };
    }

    const fragment = result.url.split("#")[1] || "";
    const params: Record<string, string> = {};
    fragment.split("&").forEach((pair) => {
      const [k, v] = pair.split("=");
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });

    if (params.access_token && params.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (sessionError) return { success: false, error: sessionError.message };
      return { success: true };
    }

    return { success: false, error: "Google sign-in did not return a session" };
  } catch (error: any) {
    return { success: false, error: error.message || "Google login failed" };
  }
}

export async function syncOAuthProfile(): Promise<void> {
  try {
    const { getSupabaseClient, getServiceRoleClient } =
      await import("./supabase");
    const supabase = getSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const meta = user.user_metadata || {};
    let first = meta.given_name || "";
    let last = meta.family_name || "";

    if (!first && !last) {
      const full = meta.full_name || meta.name || "";
      const parts = full.trim().split(/\s+/).filter(Boolean);
      first = parts[0] || "";
      last = parts.slice(1).join(" ");
    }

    const admin = getServiceRoleClient();

    const { data: row } = (await admin
      .from("users")
      .select("id, role, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle()) as {
      data: {
        id: string;
        role: string | null;
        first_name: string | null;
        last_name: string | null;
      } | null;
    };

    if (!row) {
      const { error: insertError } = await admin.from("users").insert({
        id: user.id,
        email: user.email,
        role: "member",
        first_name: first || null,
        last_name: last || null,
      } as any);
      if (insertError) {
        console.error(
          "syncOAuthProfile: failed to create users row:",
          insertError,
        );
        return;
      }
    } else {
      const updates: { first_name?: string; last_name?: string } = {};
      if (!row.first_name && first) updates.first_name = first;
      if (!row.last_name && last) updates.last_name = last;
      if (Object.keys(updates).length > 0) {
        await (admin.from("users") as any).update(updates).eq("id", user.id);
      }
    }

    const role = row?.role || "member";
    if (role !== "admin") {
      const { data: memberRow } = await admin
        .from("members")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!memberRow) {
        const { error: memberError } = await admin
          .from("members")
          .insert({ id: user.id } as any);
        if (memberError) {
          console.error(
            "syncOAuthProfile: failed to create members row:",
            memberError,
          );
        }
      }

      await (admin.from("users") as any)
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", user.id);
    }
  } catch (error) {
    console.error("syncOAuthProfile failed:", error);
  }
}

export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const { getSupabaseClient } = await import("./supabase");
    const { data, error } =
      await getSupabaseClient().auth.resetPasswordForEmail(email);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Reset password failed" };
  }
}

export async function logout(): Promise<AuthResponse> {
  try {
    const { getSupabaseClient } = await import("./supabase");
    const { error } = await getSupabaseClient().auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Logout failed" };
  }
}

export async function getCurrentUser() {
  const { getSupabaseClient } = await import("./supabase");
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = (await supabase
    .from("users")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single()) as {
    data: { role?: string; first_name?: string; last_name?: string } | null;
  };

  return {
    ...user,
    user_metadata: {
      ...user.user_metadata,
      role: userData?.role || user.user_metadata?.role || "member",
      first_name: userData?.first_name || user.user_metadata?.first_name,
      last_name: userData?.last_name || user.user_metadata?.last_name,
    },
  };
}

export async function getSession() {
  const { getSupabaseClient } = await import("./supabase");
  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession();
  return session;
}

// ✅ THIS IS THE NEW FUNCTION THAT FIXES THE ERROR
export async function requireRole(
  expected: "admin" | "coach" | "member",
): Promise<any | null> {
  const user = await getCurrentUser();

  if (!user) {
    router.replace("/login");
    return null;
  }

  const role = user.user_metadata?.role || "member";

  if (role !== expected) {
    if (role === "admin") router.replace("/admin/dashboard");
    else if (role === "coach") router.replace("/coach/dashboard");
    else if (role === "member") router.replace("/member/dashboard");
    else router.replace("/login");

    return null;
  }

  return user;
}
