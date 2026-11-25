import { CoachApplicationCard } from "@/components/admin/CoachApplicationCard";
import { CoachApplicationDetail } from "@/components/admin/CoachApplicationDetail";
import { CoachApplicationTabs } from "@/components/admin/CoachApplicationTabs";
import { Theme } from "@/components/admin/theme";
import { ADMIN_NAV_CLEARANCE } from "@/components/navigation/AdminBottomNav";
import {
  CoachApplication,
  useAdminCoachApplications,
} from "@/hooks/useAdminCoachApplications";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function AdminCoachApplicationsScreen() {
  const {
    loading,
    filteredApplications,
    activeTab,
    setActiveTab,
    counts,
    processing,
    processApplication,
  } = useAdminCoachApplications();

  const [selectedApplication, setSelectedApplication] =
    useState<CoachApplication | null>(null);

  const handleApprove = async () => {
    if (!selectedApplication) return;
    const success = await processApplication(selectedApplication, "approved");
    if (success) setSelectedApplication(null);
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    const success = await processApplication(selectedApplication, "rejected");
    if (success) setSelectedApplication(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading Applications...</Text>
      </View>
    );
  }

  // Detail View
  if (selectedApplication) {
    return (
      <CoachApplicationDetail
        application={selectedApplication}
        onBack={() => setSelectedApplication(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        processing={processing === selectedApplication.id}
      />
    );
  }

  // Main View
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>TEAM MANAGEMENT</Text>
            <Text style={styles.title}>Coach Applications</Text>
          </View>
        </View>

        {/* Tabs */}
        <CoachApplicationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={counts}
        />

        {/* List */}
        {filteredApplications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="document-text-outline"
                size={40}
                color={Theme.surfaceHigh}
              />
            </View>
            <Text style={styles.emptyText}>
              No {activeTab} applications found.
            </Text>
          </View>
        ) : (
          filteredApplications.map((app) => (
            <CoachApplicationCard
              key={app.id}
              application={app}
              onPress={() => setSelectedApplication(app)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  center: { justifyContent: "center", alignItems: "center" },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: ADMIN_NAV_CLEARANCE + 20,
  },
  loadingText: { color: Theme.accent, marginTop: 12, fontWeight: "600" },

  header: { marginBottom: 20 },
  headerLeft: { flex: 1 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    color: Theme.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.border,
  },
  emptyText: { fontSize: 14, color: Theme.textMuted, fontWeight: "500" },
});
