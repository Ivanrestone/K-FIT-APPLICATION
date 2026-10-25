import TrainerScreenShell from "@/components/TrainerScreenShell";
import { KFitColors } from "@/constants/theme";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof DAYS)[number];

type Slot = { time: string; client: string; focus: string };

const SCHEDULE: Record<Day, Slot[]> = {
  Mon: [{ time: "09:00 AM", client: "Alex Mercer", focus: "Upper body A" }],
  Tue: [
    {
      time: "11:00 AM",
      client: "Sarah Jenkins",
      focus: "Hypertrophy Legs & Squats",
    },
    {
      time: "02:00 PM",
      client: "Devon Miles",
      focus: "Powerlifting Bench Deadlift",
    },
    { time: "04:30 PM", client: "Alex Mercer", focus: "HIIT & Conditioning" },
  ],
  Wed: [],
  Thu: [{ time: "10:00 AM", client: "Sarah Jenkins", focus: "Upper body B" }],
  Fri: [
    { time: "11:00 AM", client: "Devon Miles", focus: "Lower body B" },
    { time: "03:00 PM", client: "Alex Mercer", focus: "Mobility" },
  ],
  Sat: [],
  Sun: [],
};

// Pick today's weekday as the default selection
const TODAY: Day = DAYS[(new Date().getDay() + 6) % 7];

export default function TrainerScheduleScreen() {
  const [day, setDay] = useState<Day>(TODAY);
  const slots = SCHEDULE[day];

  return (
    <TrainerScreenShell
      eyebrow="THIS WEEK"
      title="Schedule"
      activeRoute="/trainer-schedule"
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.dayRow}>
          {DAYS.map((d) => {
            const selected = d === day;
            return (
              <TouchableOpacity
                key={d}
                onPress={() => setDay(d)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.dayChip, selected && styles.dayChipActive]}
              >
                <Text
                  style={[styles.dayText, selected && styles.dayTextActive]}
                >
                  {d}
                </Text>
                <Text
                  style={[styles.dayCount, selected && styles.dayTextActive]}
                >
                  {SCHEDULE[d].length}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {slots.length === 0 ? (
        <Text style={styles.empty}>No sessions on {day}. Enjoy the rest.</Text>
      ) : (
        slots.map((s) => (
          <View key={s.time + s.client} style={styles.slot}>
            <Text style={styles.time}>{s.time}</Text>
            <View style={styles.divider} />
            <View style={styles.flex}>
              <Text style={styles.client}>{s.client}</Text>
              <Text style={styles.focus}>{s.focus}</Text>
            </View>
          </View>
        ))
      )}
    </TrainerScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dayRow: { flexDirection: "row", gap: 8 },
  dayChip: {
    alignItems: "center",
    minWidth: 52,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  dayChipActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  dayText: { color: KFitColors.mutedText, fontSize: 12, fontWeight: "700" },
  dayTextActive: { color: KFitColors.onAccent },
  dayCount: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },
  empty: {
    color: KFitColors.mutedText,
    textAlign: "center",
    paddingVertical: 28,
    fontSize: 13,
  },
  slot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    padding: 14,
  },
  time: {
    width: 70,
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: KFitColors.border,
  },
  client: { color: KFitColors.text, fontSize: 14, fontWeight: "800" },
  focus: { color: KFitColors.mutedText, fontSize: 12, marginTop: 3 },
});
