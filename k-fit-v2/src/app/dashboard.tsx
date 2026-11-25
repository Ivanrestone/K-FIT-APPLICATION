// app/dashboard.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const checkAuth = useCallback(async () => {
    try {
      const { getCurrentUser } = await import("@/lib/auth");
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
    } catch (error) {
      console.error("Authentication check error:", error);
      Alert.alert(
        "Authentication Error",
        "Unable to verify your account. Please log in again.",
      );
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      const { logout } = await import("@/lib/auth");
      const result = await logout();

      if (result.success) {
        router.replace("/login");
      } else {
        Alert.alert("Error", result.error || "Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Something went wrong while logging out.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f0d995" />
      </View>
    );
  }

  const userRole = user?.user_metadata?.role || "member";

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="person" size={32} color="#f0d995" />
        </View>

        <Text style={styles.greeting}>Welcome Back</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{userRole.toUpperCase()}</Text>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#1d1f1f",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#3b3d3b",
    padding: 32,
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(240, 217, 149, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(240, 217, 149, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    color: "#e1c991",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  email: {
    color: "#8a8a8f",
    fontSize: 14,
    marginBottom: 16,
  },
  roleBadge: {
    backgroundColor: "rgba(240, 217, 149, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  roleText: {
    color: "#f0d995",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(216, 192, 139, 0.15)",
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.3)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 15,
    fontWeight: "700",
  },
});
