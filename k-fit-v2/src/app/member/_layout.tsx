// app/member/_layout.tsx
import { MemberHeader } from "@/components/headers/MemberHeader";
import PendingVerification from "@/components/member/PendingVerification";
import { MemberBottomNav } from "@/components/navigation/MemberBottomNav";
import { getApprovalStatus } from "@/lib/verification";
import { Stack, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Theme = {
  background: "#080808",
};

export default function MemberLayout() {
  const [approval, setApproval] = useState<
    "loading" | "approved" | "pending" | "error"
  >("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    "We couldn't verify your account status.",
  );

  const checkApproval = useCallback(async () => {
    setRefreshing(true);
    try {
      const { getCurrentUser } = await import("@/lib/auth");
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      const status = await getApprovalStatus(currentUser);
      setApproval(status);
    } catch (error) {
      console.error("Member approval check failed:", error);
      setErrorMessage("We couldn't verify your account status. Please retry.");
      setApproval("error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void checkApproval();
    }, 0);
    return () => clearTimeout(timeout);
  }, [checkApproval]);

  if (approval === "loading" && !refreshing) {
    return (
      <View style={styles.gateContainer}>
        <ActivityIndicator color="#FFD700" size="large" />
        <Text style={styles.loadingText}>Checking account status...</Text>
      </View>
    );
  }

  if (approval === "pending") {
    return (
      <PendingVerification onRefresh={checkApproval} refreshing={refreshing} />
    );
  }

  if (approval === "error") {
    return (
      <View style={styles.gateContainer}>
        <Text style={styles.loadingText}>{errorMessage}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => void checkApproval()}
          disabled={refreshing}
        >
          <Text style={styles.retryButtonText}>
            {refreshing ? "Checking..." : "Try again"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MemberHeader
        onSearchPress={() => router.push("/member/search")}
        onNotificationsPress={() => router.push("/member/notifications")}
      />
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Theme.background },
          }}
        />
      </View>
      <MemberBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  content: { flex: 1 },
  gateContainer: {
    flex: 1,
    backgroundColor: Theme.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#9CA3AF", fontSize: 14 },
  retryButton: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "#FFD700",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: "#080808",
    fontSize: 14,
    fontWeight: "700",
  },
});
