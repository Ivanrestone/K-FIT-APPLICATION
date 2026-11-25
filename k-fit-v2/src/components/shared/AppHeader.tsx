import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Theme = {
  surface: "#1C1B1B",
  text: "#E5E2E1",
  border: "#353534",
};

type AppHeaderProps = {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
};

export function AppHeader({ title, showBack = false, right }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {showBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <SymbolView
              name={{
                ios: "chevron.left",
                android: "arrow_back",
                web: "arrow_back",
              }}
              tintColor={Theme.text}
              size={22}
            />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: Theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  side: { width: 48, alignItems: "flex-start", justifyContent: "center" },
  sideRight: { alignItems: "flex-end" },
  backButton: { padding: 8 },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: Theme.text,
    textAlign: "center",
  },
});
