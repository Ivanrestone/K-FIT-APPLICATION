import { Member } from "@/hooks/useAdminMembers";
import { Ionicons } from "@expo/vector-icons";
import { ModalSheet } from "@/components/shared/ModalSheet";
import { Theme } from "./theme";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  member: Member | null;
  onBack: () => void;
  onApprove: (member: Member) => Promise<void>;
  onDelete: (member: Member) => Promise<void>;
  approving: boolean;
  deleting: boolean;
};

export function MemberDetailView({
  member,
  onBack,
  onApprove,
  onDelete,
  approving,
  deleting,
}: Props) {
  if (!member) return null;

  const fullName =
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    "New member";
  const initials = fullName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isPending = member.approved !== true;
  const joined = new Date(member.created_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ModalSheet visible onClose={onBack} scrollable>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>MEMBER PROFILE</Text>
          <Text style={styles.topTitle}>Account details</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onBack}
          accessibilityLabel="Close member details"
        >
          <Ionicons name="close" size={20} color={Theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "M"}</Text>
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{member.email || "Email unavailable"}</Text>
        <View
          style={[
            styles.statusBadge,
            isPending ? styles.pendingBadge : styles.approvedBadge,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isPending ? Theme.warning : Theme.success },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isPending ? Theme.warning : Theme.success },
            ]}
          >
            {isPending ? "Awaiting approval" : "Approved member"}
          </Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>ACCOUNT INFORMATION</Text>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="person-outline" size={16} color={Theme.textMuted} />
          </View>
          <Text style={styles.detailLabel}>Member ID</Text>
          <Text style={styles.detailValue}>{member.id.slice(0, 8).toUpperCase()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Theme.textMuted} />
          </View>
          <Text style={styles.detailLabel}>Account role</Text>
          <Text style={styles.detailValue}>{member.role.toUpperCase()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="calendar-outline" size={16} color={Theme.textMuted} />
          </View>
          <Text style={styles.detailLabel}>Registered</Text>
          <Text style={styles.detailValue}>{joined}</Text>
        </View>
      </View>

      {isPending && (
        <View style={styles.reviewNote}>
          <Ionicons name="information-circle-outline" size={18} color={Theme.warning} />
          <Text style={styles.reviewNoteText}>
            Approving enables this member to access their account.
          </Text>
        </View>
      )}

      {isPending && (
        <TouchableOpacity
          style={[styles.approveButton, approving && styles.disabledButton]}
          onPress={() => onApprove(member)}
          disabled={approving || deleting}
          activeOpacity={0.85}
        >
          {approving ? (
            <ActivityIndicator color={Theme.accentText} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={19} color={Theme.accentText} />
              <Text style={styles.approveButtonText}>Approve member</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.deleteButton, (deleting || approving) && styles.disabledButton]}
        onPress={() => onDelete(member)}
        disabled={approving || deleting}
        activeOpacity={0.85}
      >
        {deleting ? (
          <ActivityIndicator color={Theme.error} size="small" />
        ) : (
          <>
            <Ionicons name="trash-outline" size={17} color={Theme.error} />
            <Text style={styles.deleteButtonText}>Delete member</Text>
          </>
        )}
      </TouchableOpacity>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  eyebrow: {
    color: Theme.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  topTitle: { color: Theme.text, fontSize: 20, fontWeight: "900", marginTop: 4 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 16,
    backgroundColor: "#111214",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 14,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.22)",
    marginBottom: 13,
  },
  avatarText: { color: Theme.accent, fontSize: 26, fontWeight: "900" },
  name: { color: Theme.text, fontSize: 21, fontWeight: "900", textAlign: "center" },
  email: {
    color: Theme.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 13,
  },
  pendingBadge: { backgroundColor: "rgba(245,158,11,0.1)" },
  approvedBadge: { backgroundColor: "rgba(16,185,129,0.1)" },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "800" },
  detailsCard: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 14,
  },
  sectionTitle: {
    color: Theme.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 7,
  },
  detailRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9 },
  detailIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.surfaceHigh,
  },
  detailLabel: { flex: 1, color: Theme.textMuted, fontSize: 12, fontWeight: "600" },
  detailValue: {
    maxWidth: "48%",
    color: Theme.text,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
  },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  reviewNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(245,158,11,0.08)",
    marginBottom: 12,
  },
  reviewNoteText: { flex: 1, color: "#D6B774", fontSize: 11, lineHeight: 16 },
  approveButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Theme.accent,
    borderRadius: 16,
    marginBottom: 10,
  },
  approveButtonText: { color: Theme.accentText, fontSize: 14, fontWeight: "900" },
  deleteButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: 16,
    marginBottom: 5,
  },
  deleteButtonText: { color: Theme.error, fontSize: 13, fontWeight: "800" },
  disabledButton: { opacity: 0.6 },
});
