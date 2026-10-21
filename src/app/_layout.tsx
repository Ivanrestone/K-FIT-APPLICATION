import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Text, useColorScheme, View } from "react-native";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
          backgroundColor: "#000000",
          padding: 24,
        }}
      >
        <Text style={{ color: "#FFFFFF", textAlign: "center" }}>
          Unable to load the K-Fit font.
        </Text>
      </View>
    );
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" options={{ animation: "fade" }} />
        <Stack.Screen
          name="index"
          options={{ animation: "fade", statusBarHidden: false }}
        />
        <Stack.Screen name="dashboard" />
      </Stack>
    </ThemeProvider>
  );
}
