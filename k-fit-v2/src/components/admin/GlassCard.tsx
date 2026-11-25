import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

export function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#121212", // cardBg
    borderRadius: 24, // rounded-3xl
    borderWidth: 1,
    borderColor: "#222222", // cardBorder
    padding: 20,
  },
});
