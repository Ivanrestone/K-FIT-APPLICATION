import TrainerBottomNav from "@/components/TrainerBottomNav";
import TrainerHeader from "@/components/TrainerHeader";
import { KFitColors } from "@/constants/theme";
import { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  eyebrow: string;
  title: string;
  activeRoute: string;
  /** Optional element shown on the right of the page title. */
  headerRight?: ReactNode;
  children: ReactNode;
};

export default function TrainerScreenShell({
  eyebrow,
  title,
  activeRoute,
  headerRight,
  children,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <TrainerHeader />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderText}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          {headerRight}
        </View>
        {children}
      </ScrollView>
      <TrainerBottomNav activeRoute={activeRoute} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1, backgroundColor: KFitColors.background },
  container: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 14,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 10,
  },
  pageHeaderText: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  title: {
    color: KFitColors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
});
