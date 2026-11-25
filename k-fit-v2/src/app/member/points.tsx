import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Theme } from "@/components/admin/theme";
import { getCurrentUser } from "@/lib/auth";
import {
  getMemberPointsBalance,
  getMemberPointsTransactions,
  PointsTransaction,
} from "@/lib/points";

function transactionLabel(transaction: PointsTransaction) {
  if (transaction.transaction_type === "challenge_reward") {
    return "Challenge reward";
  }
  if (transaction.transaction_type === "deduction") return "Points used";
  if (transaction.transaction_type === "adjustment") return "Admin adjustment";
  return "Points earned";
}

export default function MemberPointsScreen() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      if (currentUser.user_metadata?.role !== "member") {
        router.replace(
          currentUser.user_metadata?.role === "admin"
            ? "/admin/dashboard"
            : "/coach/dashboard",
        );
        return;
      }
      setRefreshing(true);
      setErrorMessage(null);
      const [currentBalance, history] = await Promise.all([
        getMemberPointsBalance(currentUser.id),
        getMemberPointsTransactions(currentUser.id, 100),
      ]);
      setBalance(currentBalance);
      setTransactions(history);
    } catch (error) {
      console.error("Unable to load points history:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load your points.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.muted}>Loading your KP balance...</Text>
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
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.back}
      >
        <Text style={styles.backText}>‹  Challenges</Text>
      </Pressable>
      <Text style={styles.eyebrow}>K-FIT POINTS</Text>
      <Text style={styles.title}>Your balance</Text>
      <View style={styles.balanceCard}>
        <Text style={styles.balance}>{balance.toLocaleString()} KP</Text>
        <Text style={styles.muted}>Available points</Text>
      </View>

      {!!errorMessage && (
        <View style={styles.errorCard}>
          <Text style={styles.error}>{errorMessage}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Transaction history</Text>
      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.muted}>Your points activity will appear here.</Text>
        </View>
      ) : (
        transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transaction}>
            <View style={styles.transactionCopy}>
              <Text style={styles.transactionTitle}>
                {transactionLabel(transaction)}
              </Text>
              <Text style={styles.muted}>{transaction.description}</Text>
              <Text style={styles.date}>
                {new Date(transaction.created_at).toLocaleString()}
              </Text>
            </View>
            <Text
              style={[
                styles.amount,
                transaction.amount < 0 && styles.deduction,
              ]}
            >
              {transaction.amount > 0 ? "+" : ""}
              {transaction.amount.toLocaleString()} KP
            </Text>
          </View>
        ))
      )}
      <Text style={styles.note}>
        Every balance change is recorded in the K-FIT points ledger.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  content: { padding: 18, paddingBottom: 140 },
  center: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  back: { marginBottom: 20 },
  backText: { color: Theme.accent, fontSize: 12, fontWeight: "700" },
  eyebrow: { color: Theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  title: { color: Theme.text, fontSize: 26, fontWeight: "900", marginTop: 4 },
  balanceCard: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.borderAccent,
    padding: 22,
    marginTop: 18,
    marginBottom: 24,
  },
  balance: { color: Theme.accent, fontSize: 30, fontWeight: "900" },
  muted: { color: Theme.textMuted, fontSize: 11, lineHeight: 16 },
  errorCard: {
    backgroundColor: Theme.errorContainer,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  error: { color: Theme.error, fontSize: 11 },
  sectionTitle: { color: Theme.text, fontSize: 15, fontWeight: "800", marginBottom: 10 },
  empty: {
    padding: 18,
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  transaction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  transactionCopy: { flex: 1, gap: 3 },
  transactionTitle: { color: Theme.text, fontSize: 12, fontWeight: "700" },
  date: { color: Theme.textMuted, fontSize: 9, marginTop: 2 },
  amount: { color: Theme.success, fontSize: 13, fontWeight: "900" },
  deduction: { color: Theme.error },
  note: { color: Theme.textMuted, fontSize: 9, marginTop: 12, textAlign: "center" },
});
