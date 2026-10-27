import { KFitColors, Spacing } from "@/constants/theme";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Text, View } from "react-native";

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

void SplashScreen.preventAutoHideAsync();

// One navigation theme for every screen and every role
const KFitNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: KFitColors.accent,
    background: KFitColors.background,
    card: KFitColors.surface,
    text: KFitColors.text,
    border: KFitColors.border,
    notification: KFitColors.accent,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue: require("../../assets/fonts/BebasNeue-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (fontError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: KFitColors.background,
          padding: Spacing.four,
        }}
      >
        <Text style={{ color: KFitColors.text, textAlign: "center" }}>
          Unable to load the K-Fit font.
        </Text>
      </View>
    );
  }

  if (!fontsLoaded) {
    return null;
  }

  const app = (
    <ThemeProvider value={KFitNavTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#0A0A0A",
          },
        }}
      >
        <Stack.Screen name="splash" options={{ animation: "fade" }} />
        <Stack.Screen
          name="index"
          options={{ animation: "fade", statusBarHidden: false }}
        />
        <Stack.Screen name="dashboard" />
        {/* Required so the OAuth redirect target is a known route in the navigator */}
        <Stack.Screen name="sso-callback" options={{ animation: "none" }} />
        <Stack.Screen
          name="oauth-native-callback"
          options={{ animation: "none" }}
        />
      </Stack>
    </ThemeProvider>
  );

  return clerkPublishableKey ? (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      {app}
    </ClerkProvider>
  ) : (
    app
  );
}
