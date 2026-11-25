import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import { isUuid } from "@/lib/uuid";

const Theme = {
  background: "#080808",
  surface: "#141418",
  surfaceHigh: "#1C1C22",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD600",
  accentText: "#000000",
  border: "#27272F",
};

type MemberProfile = {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};

type ClientRequest = {
  id: string;
  coach_id: string;
  member_id: string;
  status: "pending";
  created_at: string | null;
  member: MemberProfile | null;
};

export default function CoachRequestsScreen() {
  const [coachId, setCoachId] = useState<string | null>(null);
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const loadRequests = async (id: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("coach_clients")
      .select("id, coach_id, member_id, status, created_at")
      .eq("coach_id", id)
      .eq("status", "pending")
      .order("created_at", { ascending: false, nullsFirst: false });

    let requestRows: ClientRequest[];
    if (
      error?.code === "42703" &&
      error.message.includes("coach_clients.created_at")
    ) {
      const fallback = await supabase
        .from("coach_clients")
        .select("id, coach_id, member_id, status")
        .eq("coach_id", id)
        .eq("status", "pending");
      if (fallback.error) throw fallback.error;
      requestRows = (
        (fallback.data || []) as Omit<ClientRequest, "created_at" | "member">[]
      ).map((request) => ({
        ...request,
        created_at: null,
        member: null,
      }));
    } else {
      if (error) throw error;
      requestRows = (data || []) as ClientRequest[];
    }

    const requestsWithMembers = await Promise.all(
      requestRows.map(async (request) => {
        if (!isUuid(request.member_id)) {
          console.warn("Skipping a coaching request with an invalid member ID.");
          return { ...request, member: null } as ClientRequest;
        }
        const { data: member, error: memberError } = await supabase
          .from("users")
          .select("email, first_name, last_name")
          .eq("id", request.member_id)
          .maybeSingle();

        if (memberError) throw memberError;
        return { ...request, member } as ClientRequest;
      }),
    );

    setRequests(requestsWithMembers);
  };

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.replace("/login");
          return;
        }
        if (currentUser.user_metadata?.role !== "coach") {
          router.replace(
            currentUser.user_metadata?.role === "admin"
              ? "/admin/dashboard"
              : "/member/dashboard",
          );
          return;
        }
        if (!active) return;
        setCoachId(currentUser.id);
        await loadRequests(currentUser.id);
      } catch (error) {
        console.error("Error loading coach requests:", error);
        Alert.alert(
          "Unable to load requests",
          error instanceof Error ? error.message : "Please try again.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void initialize();
    return () => {
      active = false;
    };
  }, []);

  const respond = async (
    request: ClientRequest,
    decision: "active" | "rejected",
  ) => {
    if (!coachId) return;
    setProcessingId(request.id);
    setNotice("");

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await (supabase.from("coach_clients") as any)
        .update({ status: decision })
        .eq("id", request.id)
        .eq("coach_id", coachId)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error("This request is no longer pending. Refresh and retry.");
      }

      await loadRequests(coachId);
      setNotice(
        decision === "active"
          ? "Client accepted. You can now schedule sessions and assign plans."
          : "Client request declined.",
      );
    } catch (error) {
      console.error("Error responding to client request:", error);
      Alert.alert(
        "Unable to update request",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>CLIENT MANAGEMENT</Text>
        <Text style={styles.title}>Requests</Text>
        <Text style={styles.subtitle}>
          Review member requests to connect with you as their coach.
        </Text>

        {!!notice && (
          <View style={styles.notice}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={18}
              color={Theme.accent}
            />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        )}

        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-multiple-check-outline"
              size={42}
              color={Theme.textMuted}
            />
            <Text style={styles.emptyTitle}>No pending requests</Text>
            <Text style={styles.emptyText}>
              New member connection requests will appear here.
            </Text>
          </View>
        ) : (
          requests.map((request) => {
            const name = [
              request.member?.first_name,
              request.member?.last_name,
            ]
              .filter(Boolean)
              .join(" ");
            const busy = processingId === request.id;

            return (
              <View key={request.id} style={styles.card}>
                <View style={styles.memberRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(name || request.member?.email || "M")
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {name || "K-FIT member"}
                    </Text>
                    {!!request.member?.email && (
                      <Text style={styles.email}>{request.member.email}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.requestMeta}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={15}
                    color={Theme.textMuted}
                  />
                  <Text style={styles.requestDate}>
                    {request.created_at
                      ? `Requested ${new Date(request.created_at).toLocaleDateString(
                          undefined,
                          { year: "numeric", month: "short", day: "numeric" },
                        )}`
                      : "Request date unavailable"}
                  </Text>
                </View>

                <Text style={styles.explanation}>
                  This is a coaching connection request. No session date,
                  training type, or member notes were provided.
                </Text>

                <View style={styles.actions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.acceptButton, busy && styles.disabled]}
                    onPress={() => void respond(request, "active")}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator color={Theme.accentText} />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="check"
                          size={18}
                          color={Theme.accentText}
                        />
                        <Text style={styles.acceptText}>Accept client</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.declineButton, busy && styles.disabled]}
                    onPress={() => void respond(request, "rejected")}
                    disabled={busy}
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.background,
  },
  content: { padding: 20, paddingTop: 24, paddingBottom: 120 },
  loadingText: { color: Theme.accent, fontSize: 14, marginTop: 12 },
  eyebrow: {
    color: Theme.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: Theme.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  subtitle: {
    color: Theme.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 20,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,214,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,214,0,0.22)",
    marginBottom: 14,
  },
  noticeText: { flex: 1, color: Theme.text, fontSize: 13, lineHeight: 18 },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 52,
    borderRadius: 20,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  emptyTitle: {
    color: Theme.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 14,
  },
  emptyText: {
    color: Theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 12,
  },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.accent,
  },
  avatarText: { color: Theme.accentText, fontSize: 18, fontWeight: "900" },
  memberInfo: { flex: 1 },
  memberName: { color: Theme.text, fontSize: 16, fontWeight: "800" },
  email: { color: Theme.textMuted, fontSize: 12, marginTop: 3 },
  requestMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
  },
  requestDate: { color: Theme.textMuted, fontSize: 12 },
  explanation: {
    color: Theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  acceptButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    borderRadius: 13,
    backgroundColor: Theme.accent,
  },
  acceptText: { color: Theme.accentText, fontWeight: "800", fontSize: 13 },
  declineButton: {
    paddingHorizontal: 20,
    minHeight: 46,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: Theme.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  declineText: { color: Theme.text, fontWeight: "700", fontSize: 13 },
  disabled: { opacity: 0.55 },
});
