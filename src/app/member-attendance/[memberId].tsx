import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import {
  attendanceDuration,
  formatAttendanceDate,
  formatAttendanceTime,
  useAttendanceHistory,
} from "@/hooks/use-attendance";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MemberAttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ memberId: string; memberName?: string }>();
  const memberId = useMemo(() => {
    const value = Array.isArray(params.memberId) ? params.memberId[0] : params.memberId;
    if (!value) return undefined;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }, [params.memberId]);
  const memberName = Array.isArray(params.memberName) ? params.memberName[0] : params.memberName;
  const { records, isLoading, error, refetch } = useAttendanceHistory(memberId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.layout}>
        <Sidebar activeRoute="/members" />
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
            <Feather name="arrow-left" size={16} color={KFitColors.accent} />
            <Text style={styles.backText}>Members</Text>
          </Pressable>
          <Text style={styles.eyebrow}>MEMBER PROFILE</Text>
          <Text style={styles.title}>{memberName || "Attendance history"}</Text>
          <Text style={styles.subtitle}>Attendance · {memberId || "Member ID unavailable"}</Text>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Visit history</Text>
            {!isLoading && !error && <Text style={styles.count}>{records.length} visits</Text>}
          </View>

          {!memberId ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateText}>A valid member ID is required to view attendance.</Text>
            </View>
          ) : isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={KFitColors.accent} />
              <Text style={styles.stateText}>Loading attendance history…</Text>
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable onPress={() => void refetch()} style={styles.retry} accessibilityRole="button">
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : records.length === 0 ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateText}>No attendance records found for this member.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {records.map((record) => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeading}>
                    <View style={styles.iconBox}>
                      <Feather name="calendar" size={16} color={KFitColors.accent} />
                    </View>
                    <View style={styles.recordDate}>
                      <Text style={styles.date}>{formatAttendanceDate(record.scan_timestamp)}</Text>
                      <Text style={styles.duration}>{attendanceDuration(record.scan_timestamp, record.checkout_timestamp)}</Text>
                    </View>
                  </View>
                  <View style={styles.times}>
                    <View style={styles.timeCell}>
                      <Text style={styles.label}>TIME IN</Text>
                      <Text style={styles.time}>{formatAttendanceTime(record.scan_timestamp)}</Text>
                    </View>
                    <View style={styles.timeCell}>
                      <Text style={styles.label}>TIME OUT</Text>
                      <Text style={styles.time}>{record.checkout_timestamp ? formatAttendanceTime(record.checkout_timestamp) : "In progress"}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.timezone}>Times shown in Asia/Manila</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  layout: { flex: 1, flexDirection: "row" },
  content: { flexGrow: 1, padding: 24, paddingBottom: 64, gap: 8, backgroundColor: KFitColors.background },
  back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 8, marginBottom: 12 },
  backText: { color: KFitColors.accent, fontSize: 14, fontWeight: "700" },
  eyebrow: { color: KFitColors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: KFitColors.text, fontSize: 26, fontWeight: "800" },
  subtitle: { color: KFitColors.mutedText, fontSize: 13 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 4 },
  sectionTitle: { color: KFitColors.text, fontSize: 18, fontWeight: "800" },
  count: { color: KFitColors.mutedText, fontSize: 12 },
  list: { gap: 12 },
  recordCard: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: KFitColors.border, backgroundColor: KFitColors.surface, gap: 16 },
  recordHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: KFitColors.accent + "1F" },
  recordDate: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  date: { color: KFitColors.text, fontSize: 15, fontWeight: "800" },
  duration: { color: KFitColors.mutedText, fontSize: 12 },
  times: { flexDirection: "row", gap: 12, borderTopWidth: 1, borderColor: KFitColors.border, paddingTop: 14 },
  timeCell: { flex: 1, gap: 5 },
  label: { color: KFitColors.mutedText, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  time: { color: KFitColors.text, fontSize: 14, fontWeight: "700" },
  stateCard: { minHeight: 120, alignItems: "center", justifyContent: "center", gap: 12, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: KFitColors.border, backgroundColor: KFitColors.surface },
  stateText: { color: KFitColors.mutedText, fontSize: 14, textAlign: "center" },
  retry: { paddingVertical: 8, paddingHorizontal: 16 },
  retryText: { color: KFitColors.accent, fontWeight: "800" },
  timezone: { color: KFitColors.mutedText, fontSize: 11, textAlign: "right", marginTop: 8 },
});
