import { CoachApplication } from "@/hooks/useAdminCoachApplications";
import { Ionicons } from "@expo/vector-icons";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Theme } from "./theme";

type Props = {
  application: CoachApplication;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
};

export function CoachApplicationDetail({
  application,
  onBack,
  onApprove,
  onReject,
  processing,
}: Props) {
  const name =
    application.user?.first_name || application.user?.last_name
      ? `${application.user?.first_name || ""} ${application.user?.last_name || ""}`.trim()
      : "Unknown Applicant";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={Theme.accent} />
        <Text style={styles.backButtonText}>Back to Applications</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.email}>
          {application.user?.email || "No email"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text
            style={[
              styles.value,
              {
                color:
                  application.status === "approved"
                    ? Theme.success
                    : application.status === "rejected"
                      ? Theme.error
                      : Theme.warning,
              },
            ]}
          >
            {application.status.charAt(0).toUpperCase() +
              application.status.slice(1)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Submitted</Text>
          <Text style={styles.value}>
            {new Date(application.created_at).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Applicant Info</Text>

        <View style={styles.block}>
          <Text style={styles.label}>Experience</Text>
          <Text style={styles.value}>
            {application.experience || "Not provided"}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>Certification</Text>
          <Text style={styles.value}>
            {application.certification || "Not provided"}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>Message</Text>
          <Text style={styles.value}>
            {application.message || "No message included"}
          </Text>
        </View>
      </View>

      {application.status === "pending" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={onReject}
            disabled={processing}
          >
            <Text style={styles.rejectButtonText}>
              {processing ? "..." : "Reject"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={onApprove}
            disabled={processing}
          >
            <Text style={styles.approveButtonText}>
              {processing ? "Processing..." : "Approve"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  content: { padding: 20, paddingBottom: 120 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  backButtonText: { fontSize: 15, color: Theme.accent, fontWeight: "600" },
  header: { alignItems: "center", marginBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  avatarText: { color: Theme.accent, fontSize: 32, fontWeight: "900" },
  title: { fontSize: 22, fontWeight: "800", color: Theme.text },
  email: { fontSize: 14, color: Theme.textMuted, marginTop: 4 },

  section: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Theme.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  label: { fontSize: 13, color: Theme.textMuted, fontWeight: "600" },
  value: {
    fontSize: 13,
    color: Theme.text,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },
  block: { marginBottom: 16 },

  actionButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  rejectButtonText: { color: Theme.error, fontSize: 15, fontWeight: "800" },
  approveButton: { backgroundColor: Theme.accent },
  approveButtonText: {
    color: Theme.accentText,
    fontSize: 15,
    fontWeight: "800",
  },
});
