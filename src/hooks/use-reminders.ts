import { useStaffSupabase } from "@/hooks/use-staff-supabase";
import { readFunctionErrorMessage } from "@/utils/supabase";
import { useCallback, useEffect, useState } from "react";

export type ReminderKind = "membership_expiry" | "session";

export type ReminderResult = {
  emailSent: boolean;
  notificationSent: boolean;
};

/**
 * Sends a reminder through the `send-reminder` Edge Function. The function
 * writes the in-app notification and, when RESEND_API_KEY is configured,
 * delivers the email through Resend.
 */
export function useReminderSender() {
  const { supabase } = useStaffSupabase();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendReminder = useCallback(
    async (input: {
      memberId: string;
      kind: ReminderKind;
      message?: string;
      sessionId?: string;
    }): Promise<ReminderResult> => {
      if (!supabase) throw new Error("Supabase is not configured.");
      setIsSending(true);
      setError(null);
      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          "send-reminder",
          { body: input },
        );
        if (invokeError) {
          throw new Error(
            await readFunctionErrorMessage(
              invokeError,
              "Could not send the reminder.",
            ),
          );
        }
        const record = (data ?? {}) as {
          emailSent?: boolean;
          notificationSent?: boolean;
        };
        return {
          emailSent: Boolean(record.emailSent),
          notificationSent: record.notificationSent !== false,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not send the reminder.";
        setError(message);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [supabase],
  );

  return { sendReminder, isSending, error };
}

/* ───────────────────────── Notification center ───────────────────────── */

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  kind: string;
  readAt: string | null;
  createdAt: string;
};

type RawNotification = {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  read_at: string | null;
  created_at: string;
};

export function useCoachNotifications(enabled = true) {
  const { supabase, userId, isSignedIn, isLoaded } = useStaffSupabase();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setIsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, body, kind, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40);

    if (!error) {
      setNotifications(
        ((data ?? []) as RawNotification[]).map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body ?? "",
          kind: row.kind,
          readAt: row.read_at,
          createdAt: row.created_at,
        })),
      );
    }
    setIsLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    if (!isLoaded || !enabled) return;
    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (!cancelled) {
        await load();
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, isLoaded, load]);

  const markRead = useCallback(
    async (id: string) => {
      if (!supabase) return;
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
      );
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .is("read_at", null);
    },
    [supabase],
  );

  const markAllRead = useCallback(async () => {
    if (!supabase || !userId) return;
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((item) => (item.readAt ? item : { ...item, readAt: now })),
    );
    await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", userId)
      .is("read_at", null);
  }, [supabase, userId]);

  const unread = notifications.filter((item) => !item.readAt).length;

  return {
    notifications,
    unread,
    isLoading: !isLoaded || (isSignedIn && isLoading),
    refresh: load,
    markRead,
    markAllRead,
  };
}
