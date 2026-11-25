import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";

export default function HomeScreen() {
  const [introProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.timing(introProgress, {
      toValue: 1,
      duration: 950,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();

    const timeout = setTimeout(() => {
      router.replace("/login");
    }, 2500);

    return () => {
      animation.stop();
      clearTimeout(timeout);
    };
  }, [introProgress]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: introProgress,
          transform: [
            {
              scale: introProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.94, 1],
              }),
            },
            {
              translateY: introProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text accessibilityRole="header" style={styles.brand}>
        K-FIT
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080909",
    justifyContent: "center",
    alignItems: "center",
  },
  brand: {
    color: "#E9D7A7",
    fontFamily: "Bebas Neue",
    fontSize: 92,
    letterSpacing: 3,
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: "rgba(233, 215, 167, 0.18)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
});
