import type { AccountRole, AccountHeaderStat } from "@/components/account/types";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import { useEffect, useState } from "react";

type HeaderAccount = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

const ROLE_NAMES: Record<AccountRole, string> = {
  admin: "Admin",
  coach: "Coach",
  member: "Member",
};

export function useHeaderAccount(role: AccountRole) {
  const [account, setAccount] = useState<HeaderAccount>({
    name: ROLE_NAMES[role],
    email: "",
    avatarUrl: null,
  });
  const [stats, setStats] = useState<AccountHeaderStat[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const user = await getCurrentUser();
        if (!active || !user) return;

        const metadata = (user.user_metadata || {}) as Record<string, unknown>;
        const name =
          [metadata.first_name, metadata.last_name]
            .filter(
              (part): part is string =>
                typeof part === "string" && part.trim().length > 0,
            )
            .join(" ") ||
          user.email?.split("@")[0] ||
          ROLE_NAMES[role];
        const avatarUrl =
          typeof metadata.avatar_url === "string"
            ? metadata.avatar_url
            : typeof metadata.picture === "string"
              ? metadata.picture
              : null;

        setAccount({
          name,
          email: user.email || "",
          avatarUrl,
        });

        const supabase = getSupabaseClient();
        if (role === "admin") {
          const [occupancy, applications] = await Promise.all([
            supabase
              .from("attendance")
              .select("id", { count: "exact", head: true })
              .is("check_out", null),
            supabase
              .from("coach_applications")
              .select("id", { count: "exact", head: true })
              .eq("status", "pending"),
          ]);

          if (!active) return;
          if (occupancy.error) {
            console.warn("Could not load current gym occupancy:", occupancy.error);
          }
          if (applications.error) {
            console.warn(
              "Could not load pending coach applications:",
              applications.error,
            );
          }
          setStats([
            {
              label: "Open check-ins",
              value: occupancy.error
                ? "N/A"
                : String(occupancy.count || 0),
            },
            {
              label: "Applications",
              value: applications.error
                ? "N/A"
                : String(applications.count || 0),
            },
          ]);
        } else if (role === "coach") {
          const sessions = await supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("coach_id", user.id)
            .eq("status", "completed");

          if (!active) return;
          if (sessions.error) {
            console.warn("Could not load completed coach sessions:", sessions.error);
          }
          setStats([
            {
              label: "Completed sessions",
              value: sessions.error ? "N/A" : String(sessions.count || 0),
            },
          ]);
        }
      } catch (error) {
        console.error("Could not load account menu data:", error);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [role]);

  return { account, stats };
}
