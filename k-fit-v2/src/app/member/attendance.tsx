// app/member/attendance.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Theme = {
  background: "#080808",
  surface: "#121212",
  surfaceHigh: "#1A1A1A",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD700",
  accentText: "#000000",
  success: "#10B981",
  border: "#222222",
};

interface AttendanceRecord {
  id: string;
  check_in: string;
  check_out: string | null;
}

export default function MemberAttendanceScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const stripRef = useRef<any>(null);

  const checkAuth = async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    const role = currentUser?.user_metadata?.role || "member";
    if (role !== "member" && role !== "coach") {
      if (role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/login");
      }
    } else {
      const { getMembershipAccess } = await import("@/lib/membership");
      const access = await getMembershipAccess(currentUser.id);
      if (access === "none") {
        setLoading(false);
        router.replace("/member/membership");
        return;
      }
      await fetchAttendance(currentUser.id);
    }
  };

  const fetchAttendance = async (memberId: string) => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("attendance")
        .select("id, check_in, check_out")
        .eq("member_id", memberId)
        .order("check_in", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching attendance:", error);
      } else {
        setRecords((data || []) as AttendanceRecord[]);
      }
    } catch (error: any) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return null;
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const mins = Math.floor(ms / 60000);
    const hours = Math.floor(mins / 60);
    return hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;
  };

  useEffect(() => {
    const timeout = setTimeout(() => checkAuth(), 0);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading Attendance...</Text>
      </View>
    );
  }

  const dateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const byDate = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const key = dateKey(new Date(r.check_in));
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(r);
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const recentDays = [...byDate.keys()]
    .sort((a, b) => (a < b ? 1 : -1))
    .slice(0, 3);

  const todayKey = dateKey(today);
  const allKeys = [...byDate.keys()].sort();
  const startKey = allKeys.length > 0 ? allKeys[0] : todayKey;
  const dayStrip: {
    key: string;
    day: number;
    weekday: string;
    isToday: boolean;
  }[] = [];
  {
    const [sy, sm, sd] = startKey.split("-").map(Number);
    const cursor = new Date(sy, sm - 1, sd);
    const end = new Date(year, month, today.getDate());
    while (cursor <= end) {
      const key = dateKey(cursor);
      dayStrip.push({
        key,
        day: cursor.getDate(),
        weekday: cursor.toLocaleDateString(undefined, { weekday: "narrow" }),
        isToday: key === todayKey,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={Theme.accent} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Attendance</Text>
        <Text style={styles.subtitle}>Your gym check-in history</Text>
      </View>

      {/* Day Strip */}
      <View style={styles.card}>
        <ScrollView
          ref={stripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripContent}
          onContentSizeChange={() =>
            stripRef.current?.scrollToEnd({ animated: false })
          }
        >
          {dayStrip.map((d) => {
            const dayRecords = byDate.get(d.key) || [];
            return (
              <View
                key={d.key}
                style={[styles.dayCell, d.isToday && styles.dayCellToday]}
              >
                <Text
                  style={[styles.dayWeekday, d.isToday && styles.dayTextToday]}
                >
                  {d.weekday}
                </Text>
                <Text
                  style={[
                    styles.dayNum,
                    d.isToday && styles.dayTextToday,
                    dayRecords.length > 0 && styles.dayNumAttended,
                  ]}
                >
                  {d.day}
                </Text>
                {dayRecords.length === 0 ? (
                  <Text style={styles.dayEmpty}>—</Text>
                ) : (
                  <>
                    {dayRecords.slice(0, 2).map((r, j) => (
                      <Text key={j} style={styles.dayTime} numberOfLines={1}>
                        {fmtTime(r.check_in)}
                      </Text>
                    ))}
                    {dayRecords.length > 2 && (
                      <Text style={styles.dayMore}>
                        +{dayRecords.length - 2}
                      </Text>
                    )}
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.legendRow}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>
            Swipe to see other days. Gold times are your check-ins.
          </Text>
        </View>
      </View>

      {/* Recent Days List */}
      <Text style={styles.sectionTitle}>Recent Days</Text>
      {recentDays.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="calendar-blank-outline"
            size={48}
            color={Theme.border}
          />
          <Text style={styles.emptyText}>No attendance records yet</Text>
        </View>
      ) : (
        recentDays.map((key) => {
          const dayRecords = byDate.get(key)!;
          const label = new Date(dayRecords[0].check_in).toLocaleDateString(
            undefined,
            {
              weekday: "long",
              month: "short",
              day: "numeric",
            },
          );
          return (
            <View key={key} style={styles.card}>
              <Text style={styles.cardTitle}>{label}</Text>
              {dayRecords.map((record) => {
                const duration = formatDuration(
                  record.check_in,
                  record.check_out,
                );
                return (
                  <View key={record.id} style={styles.recordRow}>
                    <View style={styles.recordIcon}>
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={Theme.accent}
                      />
                    </View>
                    <View style={styles.recordTimes}>
                      <Text style={styles.recordTime}>
                        {fmtTime(record.check_in)} →{" "}
                        {record.check_out
                          ? fmtTime(record.check_out)
                          : "In Gym"}
                      </Text>
                      {duration && (
                        <Text style={styles.recordDuration}>{duration}</Text>
                      )}
                    </View>
                    {!record.check_out && (
                      <View style={styles.stillInBadge}>
                        <Text style={styles.stillInText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: {
    fontSize: 14,
    color: Theme.accent,
    fontWeight: "600",
    marginTop: 12,
  },
  scrollContent: { padding: 20, paddingBottom: 100 },

  // Header
  header: { marginBottom: 24 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  backButtonText: { fontSize: 14, fontWeight: "600", color: Theme.accent },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, color: Theme.textMuted, marginTop: 4 },

  // Cards
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 12,
  },

  // Day Strip
  stripContent: { paddingVertical: 4 },
  dayCell: {
    width: 70,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: Theme.background,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  dayCellToday: {
    borderColor: Theme.accent,
    backgroundColor: Theme.surfaceHigh,
  },
  dayWeekday: {
    fontSize: 10,
    color: Theme.textMuted,
    fontWeight: "700",
    marginBottom: 4,
  },
  dayTextToday: { color: Theme.accent },
  dayNum: {
    fontSize: 16,
    color: Theme.textMuted,
    fontWeight: "800",
    marginBottom: 4,
  },
  dayNumAttended: { color: Theme.text },
  dayEmpty: { fontSize: 10, color: Theme.border, marginTop: 4 },
  dayTime: {
    fontSize: 10,
    color: Theme.accent,
    marginTop: 2,
    fontWeight: "600",
  },
  dayMore: { fontSize: 9, color: Theme.textMuted, marginTop: 2 },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.accent,
    marginRight: 8,
  },
  legendText: { fontSize: 11, color: Theme.textMuted, flex: 1, lineHeight: 16 },

  // Recent List
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Theme.text,
    marginTop: 8,
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 12,
  },
  emptyText: { fontSize: 14, color: Theme.textMuted, fontWeight: "500" },

  // Record Rows
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 12,
  },
  recordIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordTimes: { flex: 1 },
  recordTime: { fontSize: 14, color: Theme.text, fontWeight: "700" },
  recordDuration: {
    fontSize: 12,
    color: Theme.accent,
    marginTop: 2,
    fontWeight: "600",
  },
  stillInBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stillInText: { fontSize: 9, color: Theme.success, fontWeight: "900" },
});
