import { AttendanceRecord } from "@/hooks/useAdminAttendance";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "./theme";

type Props = {
  record: AttendanceRecord;
  formatTime: (t: string) => string;
  onCheckOut: (r: AttendanceRecord) => void;
};

export function ActiveMemberCard({ record, formatTime, onCheckOut }: Props) {
  const initials = (record.memberName || "M")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {record.memberName || "Unknown member"}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {record.memberEmail || `Checked in at ${formatTime(record.check_in)}`}
          </Text>
          {record.memberEmail && (
            <View style={styles.checkInTime}>
              <Ionicons name="time-outline" size={11} color={Theme.success} />
              <Text style={styles.checkInTimeText}>
                In at {formatTime(record.check_in)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.checkOutBtn}
        onPress={() => onCheckOut(record)}
        activeOpacity={0.75}
        accessibilityLabel={`Check out ${record.memberName || "member"}`}
      >
        <Ionicons name="exit-outline" size={15} color={Theme.error} />
        <Text style={styles.checkOutText}>Check Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#101512",
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.18)",
    marginBottom: 9,
  },
  leftSection: { flex: 1, flexDirection: "row", alignItems: "center", gap: 11, marginRight: 8 },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "rgba(16,185,129,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Theme.success, fontSize: 13, fontWeight: "900" },
  memberInfo: { flex: 1 },
  name: { fontSize: 13, fontWeight: "900", color: Theme.text, marginBottom: 3 },
  subtitle: { fontSize: 10, color: Theme.textMuted, fontWeight: "500" },
  checkInTime: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  checkInTimeText: { color: Theme.success, fontSize: 10, fontWeight: "700" },
  checkOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
  },
  checkOutText: { color: Theme.error, fontSize: 10, fontWeight: "900" },
});
