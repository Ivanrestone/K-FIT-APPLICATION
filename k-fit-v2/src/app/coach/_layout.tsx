// app/coach/_layout.tsx
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CoachHeader } from "../../components/headers/CoachHeader";
import { CoachBottomNav } from "../../components/navigation/CoachBottomNav";

const Theme = {
  background: "#080808",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  content: { flex: 1 },
});

export default function CoachLayout() {
  return (
    <View style={styles.container}>
      {/* Top Header (Contains the K-FIT logo, search, and profile) */}
      <CoachHeader />

      {/* Main App Content (Clients, Requests, Dashboard, etc.) */}
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Theme.background },
            animation: "fade", // Smooth transition between tabs
          }}
        />
      </View>

      {/* Floating Bottom Navigation */}
      <CoachBottomNav />
    </View>
  );
}
