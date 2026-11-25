import { getCurrentUser } from "@/lib/auth";
import { adminAdjustMemberPoints } from "@/lib/points";
import { getSupabaseClient } from "@/lib/supabase";
import { Theme } from "@/components/admin/theme";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type MemberBalance = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  balance: number;
};

type AdminTransaction = {
  id: string;
  member_id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
};

export default function AdminPointsScreen() {
  const [members, setMembers] = useState<MemberBalance[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      if (currentUser.user_metadata?.role !== "admin") {
        router.replace(
          currentUser.user_metadata?.role === "coach"
            ? "/coach/dashboard"
            : "/member/dashboard",
        );
        return;
      }
      setRefreshing(true);
      setErrorMessage(null);
      const supabase = getSupabaseClient() as any;
      const [{ data: memberRows, error: memberError }, { data: pointRows, error: pointsError }] =
        await Promise.all([
          supabase
            .from("users")
            .select("id, first_name, last_name, email")
            .eq("role", "member")
            .order("first_name", { ascending: true })
            .limit(500),
          supabase.from("member_points").select("member_id, balance"),
        ]);
      if (memberError) throw memberError;
      if (pointsError) throw pointsError;

      const balances = new Map<string, number>(
        ((pointRows ?? []) as { member_id: string; balance: number }[]).map(
          (row) => [row.member_id, Number(row.balance)],
        ),
      );
      const rows = ((memberRows ?? []) as Omit<MemberBalance, "balance">[]).map(
        (member) => ({
          ...member,
          balance: balances.get(member.id) ?? 0,
        }),
      );
      setMembers(rows);
      if (selectedMemberId) {
        const { data: history, error: historyError } = await supabase
          .from("points_transactions")
          .select("id, member_id, amount, transaction_type, description, created_at")
          .eq("member_id", selectedMemberId)
          .order("created_at", { ascending: false })
          .limit(20);
        if (historyError) throw historyError;
        setTransactions((history ?? []) as AdminTransaction[]);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Unable to load points administration:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load points data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMemberId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) =>
      `${member.first_name ?? ""} ${member.last_name ?? ""} ${member.email}`
        .toLowerCase()
        .includes(query),
    );
  }, [members, search]);

  const selectedMember = members.find((member) => member.id === selectedMemberId);

  const applyAdjustment = async () => {
    const numericAmount = Number(amount);
    if (!selectedMemberId || !Number.isInteger(numericAmount) || numericAmount === 0) {
      setErrorMessage("Choose a member and enter a non-zero whole number of KP.");
      return;
    }
    if (reason.trim().length < 3) {
      setErrorMessage("Enter a clear reason for the adjustment.");
      return;
    }

    Alert.alert(
      "Confirm points adjustment",
      `${numericAmount > 0 ? "Add" : "Deduct"} ${Math.abs(numericAmount)} KP ${
        numericAmount > 0 ? "to" : "from"
      } ${selectedMember?.first_name ?? "this member"}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => void saveAdjustment(numericAmount) },
      ],
    );
  };

  const saveAdjustment = async (numericAmount: number) => {
    setSaving(true);
    setErrorMessage(null);
    try {
      const key =
        idempotencyKey ||
        `manual-adjustment:${selectedMemberId}:${Date.now()}:${Math.random()
          .toString(36)
          .slice(2)}`;
      setIdempotencyKey(key);
      await adminAdjustMemberPoints({
        memberId: selectedMemberId,
        amount: numericAmount,
        reason: reason.trim(),
        idempotencyKey: key,
      });
      setAmount("");
      setReason("");
      setIdempotencyKey("");
      await load();
      Alert.alert("Points updated", "The adjustment was added to the KP ledger.");
    } catch (error) {
      console.error("Unable to adjust member points:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to apply adjustment.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.muted}>Loading member points...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void load()}
          tintColor={Theme.accent}
          colors={[Theme.accent]}
        />
      }
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>K-FIT POINTS</Text>
      <Text style={styles.title}>Points management</Text>
      <Text style={styles.subtitle}>
        Review member balances and record auditable manual adjustments.
      </Text>

      {!!errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search members"
        placeholderTextColor={Theme.textMuted}
        style={styles.input}
        autoCapitalize="none"
      />

      <View style={styles.memberList}>
        {filteredMembers.map((member) => {
          const name =
            [member.first_name, member.last_name].filter(Boolean).join(" ") ||
            member.email;
          return (
            <Pressable
              key={member.id}
              accessibilityRole="button"
              onPress={() => {
                setSelectedMemberId(member.id);
                setIdempotencyKey("");
              }}
              style={[
                styles.memberRow,
                selectedMemberId === member.id && styles.selectedMember,
              ]}
            >
              <View style={styles.memberCopy}>
                <Text style={styles.memberName}>{name}</Text>
                <Text style={styles.muted}>{member.email}</Text>
              </View>
              <Text style={styles.balance}>{member.balance.toLocaleString()} KP</Text>
            </Pressable>
          );
        })}
        {filteredMembers.length === 0 && (
          <Text style={styles.muted}>No members match that search.</Text>
        )}
      </View>

      {selectedMember && (
        <>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Adjust {selectedMember.first_name ?? "member"}</Text>
            <Text style={styles.muted}>
              Positive values add KP. Negative values deduct KP. Balances cannot go below zero.
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="Amount, e.g. 50 or -20"
              placeholderTextColor={Theme.textMuted}
              keyboardType="numbers-and-punctuation"
              style={styles.input}
            />
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Reason (required)"
              placeholderTextColor={Theme.textMuted}
              style={[styles.input, styles.reasonInput]}
              multiline
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => void applyAdjustment()}
              disabled={saving}
              style={[styles.submitButton, saving && styles.disabled]}
            >
              {saving ? (
                <ActivityIndicator color={Theme.accentText} />
              ) : (
                <Text style={styles.submitText}>Record adjustment</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Recent member transactions</Text>
          {transactions.length === 0 ? (
            <Text style={styles.muted}>No transactions recorded yet.</Text>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transaction}>
                <View style={styles.memberCopy}>
                  <Text style={styles.memberName}>{transaction.description}</Text>
                  <Text style={styles.muted}>
                    {transaction.transaction_type.replace(/_/g, " ")} ·{" "}
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.balance,
                    transaction.amount < 0 && styles.negative,
                  ]}
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount} KP
                </Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  content: { padding: 16, paddingBottom: 145 },
  center: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  eyebrow: { color: Theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  title: { color: Theme.text, fontSize: 24, fontWeight: "900", marginTop: 4 },
  subtitle: { color: Theme.textMuted, fontSize: 11, marginTop: 4, marginBottom: 14 },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    color: Theme.text,
    paddingHorizontal: 12,
    fontSize: 12,
    marginBottom: 9,
  },
  reasonInput: { minHeight: 72, paddingTop: 12, textAlignVertical: "top" },
  memberList: {
    borderRadius: 14,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  memberRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderColor: Theme.border,
  },
  selectedMember: { backgroundColor: "rgba(255,215,0,0.06)" },
  memberCopy: { flex: 1, gap: 3 },
  memberName: { color: Theme.text, fontSize: 11, fontWeight: "700" },
  balance: { color: Theme.accent, fontSize: 12, fontWeight: "900" },
  negative: { color: Theme.error },
  muted: { color: Theme.textMuted, fontSize: 10, lineHeight: 15 },
  formCard: {
    padding: 14,
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 16,
  },
  sectionTitle: { color: Theme.text, fontSize: 14, fontWeight: "800", marginBottom: 9 },
  submitButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: Theme.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
  disabled: { opacity: 0.6 },
  submitText: { color: Theme.accentText, fontSize: 12, fontWeight: "900" },
  errorBanner: {
    padding: 11,
    borderRadius: 12,
    backgroundColor: Theme.errorContainer,
    marginBottom: 12,
  },
  errorText: { color: Theme.error, fontSize: 10 },
  transaction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderColor: Theme.border,
  },
});
