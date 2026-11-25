import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";
import { SoundEffectsProvider } from "@/components/shared/SoundEffectsProvider";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
    "Bebas Neue": require("../assets/fonts/BebasNeue-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SoundEffectsProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Top-level screens */}
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="help-center" />
          <Stack.Screen name="about" />

          {/* Folder groups — handled by their own _layout.tsx files */}
          <Stack.Screen name="admin" />
          <Stack.Screen name="member" />
          <Stack.Screen name="coach" />
        </Stack>
      </ThemeProvider>
    </SoundEffectsProvider>
  );
}
