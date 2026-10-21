import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, {
  FadeIn,
  ReduceMotion,
  useReducedMotion,
} from "react-native-reanimated";

const SPLASH_DURATION_MS = 850;
const SPLASH_FADE_IN = FadeIn.duration(240).reduceMotion(ReduceMotion.System);

export default function SplashRoute() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/");
    }, reducedMotion ? 500 : SPLASH_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [reducedMotion, router]);

  return (
    <>
      <Stack.Screen
        options={{
          animation: reducedMotion ? "none" : "fade",
          statusBarHidden: true,
        }}
      />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          paddingHorizontal: 24,
        }}
      >
        <Animated.Text
          accessibilityLabel="K-Fit"
          accessibilityRole="header"
          adjustsFontSizeToFit
          entering={SPLASH_FADE_IN}
          numberOfLines={1}
          style={{
            width: "100%",
            color: "#FFFFFF",
            fontFamily: "BebasNeue",
            fontSize: Math.min(width * 0.28, 128),
            includeFontPadding: false,
            textAlign: "center",
          }}
        >
          K-Fit
        </Animated.Text>
      </View>
    </>
  );
}
