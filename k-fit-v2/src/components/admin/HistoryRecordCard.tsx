import { AttendanceRecord } from "@/hooks/useAdminAttendance";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "./theme";

type Props = {
  record: AttendanceRecord;
  formatTime: (t: string) => string;
};

export function HistoryRecordCard({ record, formatTime }: Props) {
  const initial = (record.memberName || "?").charAt(0).toUpperCase();
  const isOut = !!record.check_out;
  const dateLabel = new Date(record.check_in).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial || "M"}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {record.memberName || "Unknown member"}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {record.memberEmail || (isOut ? "Visit completed" : "Active visit")}
          </Text>
          <View style={styles.times}>
            <Ionicons
              name={isOut ? "exit-outline" : "enter-outline"}
              size={11}
              color={isOut ? Theme.textMuted : Theme.success}
            />
            <Text style={[styles.timeText, !isOut && styles.activeTime]}>
              {isOut && record.check_out
                ? `${dateLabel} | Out ${formatTime(record.check_out)} | In ${formatTime(record.check_in)}`
                : `${dateLabel} | In ${formatTime(record.check_in)}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.statusBadge, isOut ? styles.outBadge : styles.inBadge]}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isOut ? Theme.textMuted : Theme.success },
          ]}
        />
        <Text style={[styles.statusText, { color: isOut ? Theme.textMuted : Theme.success }]}>
          {isOut ? "OUT" : "INSIDE"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111214",
    borderRadius: 18,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  leftSection: { flexDirection: "row", alignItems: "center", gap: 11, flex: 1, marginRight: 8 },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "rgba(255,215,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Theme.accent, fontSize: 14, fontWeight: "900" },
  memberInfo: { flex: 1 },
  name: { fontSize: 13, fontWeight: "900", color: Theme.text, marginBottom: 2 },
  subtitle: { fontSize: 10, color: Theme.textMuted, fontWeight: "500" },
  times: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  timeText: { fontSize: 9, color: Theme.textMuted, fontWeight: "700" },
  activeTime: { color: Theme.success },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },
  outBadge: { backgroundColor: "#202226" },
  inBadge: { backgroundColor: "rgba(16,185,129,0.1)" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
});
