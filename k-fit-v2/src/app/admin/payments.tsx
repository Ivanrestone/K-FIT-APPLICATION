import { Theme } from "@/components/admin/theme";
import { ADMIN_NAV_CLEARANCE } from "@/components/navigation/AdminBottomNav";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Payment {
  id: string;
  member_id: string;
  membership_id: string | null;
  amount: number;
  payment_method: string;
  status: string;
  gateway: string | null;
  gateway_status: string | null;
  paid_at: string | null;
  created_at: string;
  memberName?: string;
  memberEmail?: string;
}

const STATUS_COLORS: Record<string, string> = {
  paid: Theme.success,
  pending: Theme.warning,
  failed: Theme.error,
  expired: Theme.error,
};

export default function AdminPaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    const role = currentUser?.user_metadata?.role || "member";
    if (role !== "admin") {
      if (role === "member") {
        router.replace("/member/dashboard");
      } else if (role === "coach") {
        router.replace("/coach/dashboard");
      } else {
        router.replace("/login");
      }
    } else {
      await fetchPayments();
    }
  };

  const fetchPayments = async () => {
    try {
      const { getServiceRoleClient } = await import("@/lib/supabase");
      const supabase = getServiceRoleClient();

      const { data: paymentData, error } = await supabase
        .from("payments")
        .select(
          "id, member_id, membership_id, amount, payment_method, status, gateway, gateway_status, paid_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching payments:", error);
        return;
      }

      const rows = (paymentData || []) as Payment[];
      const memberIds = [
        ...new Set(rows.map((p) => p.member_id).filter(Boolean)),
      ];

      const { data: userData } = memberIds.length
        ? await supabase
            .from("users")
            .select("id, email, first_name, last_name")
            .in("id", memberIds)
        : { data: [] as any[] };

      const users = (userData || []) as {
        id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
      }[];

      const merged = rows.map((p) => {
        const u = users.find((user) => user.id === p.member_id);
        return {
          ...p,
          memberName: u
            ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
            : undefined,
          memberEmail: u?.email,
        };
      });

      setPayments(merged);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayMethod = (p: Payment) => {
    if (p.gateway === "xendit") return "Xendit";
    return p.payment_method;
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={[styles.loadingText, { marginTop: 12 }]}>
          Loading Payments...
        </Text>
      </View>
    );
  }

  const totalCollected = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingCount = payments.filter((p) => p.status === "pending").length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        <Text style={styles.subtitle}>View all payment transactions</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            ₱{totalCollected.toLocaleString()}
          </Text>
          <Text style={styles.summaryLabel}>Collected</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{payments.length}</Text>
          <Text style={styles.summaryLabel}>Transactions</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: Theme.warning }]}>
            {pendingCount}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <SymbolView
              name={{
                ios: "creditcard",
                android: "credit_card_off",
                web: "credit_card_off",
              }}
              tintColor={Theme.textMuted}
              size={40}
            />
            <Text style={styles.emptyText}>No payments yet</Text>
          </View>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentAmount}>₱{payment.amount}</Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: STATUS_COLORS[payment.status] || "#999",
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {payment.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.memberName}>
                {payment.memberName || "Unknown member"}
              </Text>
              <Text style={styles.memberEmail}>
                {payment.memberEmail || payment.member_id}
              </Text>
              <Text style={styles.paymentMeta}>
                {displayMethod(payment)}
                {payment.gateway_status ? ` • ${payment.gateway_status}` : ""}
                {" • "}
                {payment.paid_at
                  ? `Paid ${new Date(payment.paid_at).toLocaleString()}`
                  : `Created ${new Date(payment.created_at).toLocaleString()}`}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background, // Matches #080808
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Theme.textMuted,
    marginTop: 4,
  },
  loadingText: {
    fontSize: 14,
    color: Theme.accent,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Theme.accent, // Gold
  },
  summaryLabel: {
    fontSize: 11,
    color: Theme.textMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: ADMIN_NAV_CLEARANCE + 20, // Prevents bottom nav from covering content
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Theme.textMuted,
    fontWeight: "500",
  },
  paymentCard: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 16,
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: Theme.accent, // Gold
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  memberName: {
    fontSize: 15,
    fontWeight: "700",
    color: Theme.text,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: Theme.textMuted,
    marginBottom: 8,
  },
  paymentMeta: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
});
