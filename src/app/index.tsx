import { KFitColors, Spacing } from "@/constants/theme";
import { useSSO } from "@clerk/expo";
import { useSignIn } from "@clerk/expo/legacy";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const logo = require("../../assets/images/logo.jpg");
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function navigateForEmail(router: ReturnType<typeof useRouter>, email: string) {
  switch (email.trim().toLowerCase()) {
    case "admin@gmail.com":
      router.replace("/dashboard");
      break;
    case "scanner@gmail.com":
      router.replace("/scanner");
      break;
    case "qrcode@gmail.com":
      router.replace("/display");
      break;
    case "trainer@gmail.com":
      router.replace("/trainer-dashboard" as any);
      break;
    case "member@gmail.com":
    default:
      router.replace("/member-dashboard" as any);
      break;
  }
}

function GoogleLoginButton({
  onAuthenticated,
}: {
  onAuthenticated: (email: string) => void;
}) {
  const { startSSOFlow } = useSSO();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { authSessionResult, createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({ strategy: "oauth_google" });

      if (authSessionResult?.type === "cancel") {
        return;
      }

      if (!createdSessionId || !setActive) {
        throw new Error("Google sign in did not complete. Please try again.");
      }

      await setActive({ session: createdSessionId });
      onAuthenticated(signIn?.identifier ?? signUp?.emailAddress ?? "");
    } catch (error) {
      Alert.alert(
        "Google sign in failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.googleButton,
        pressed && !isLoading && styles.pressed,
      ]}
      onPress={handleGoogleLogin}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator color={KFitColors.accent} />
      ) : (
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      )}
    </Pressable>
  );
}

function ClerkCredentialLoginButton({
  email,
  password,
  onAuthenticated,
}: {
  email: string;
  password: string;
  onAuthenticated: (email: string) => void;
}) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter your username and password.",
      );
      return;
    }

    if (!isLoaded) {
      return;
    }

    setIsLoading(true);
    try {
      const attempt = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (attempt.status !== "complete" || !attempt.createdSessionId) {
        Alert.alert(
          "Sign in needs more steps",
          "This account requires additional verification. Please contact your gym administrator.",
        );
        return;
      }

      await setActive({ session: attempt.createdSessionId });
      onAuthenticated(attempt.identifier ?? email);
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.loginButton,
        pressed && !isLoading && styles.loginButtonPressed,
      ]}
      onPress={handleLogin}
      disabled={isLoading || !isLoaded}
      accessibilityRole="button"
      accessibilityLabel="Sign in"
      accessibilityHint="Signs in to your K-FIT account"
      accessibilityState={{ disabled: isLoading || !isLoaded, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator color={KFitColors.background} />
      ) : (
        <Text style={styles.loginButtonText}>SIGN IN</Text>
      )}
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { width, height, fontScale } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(
    null,
  );
  const compactLayout = height < 700 || fontScale >= 1.3;
  const horizontalPadding =
    width < 360 ? Spacing.two : width >= 600 ? 28 : Spacing.three;
  const cardWidth = Math.min(width - horizontalPadding * 2, 480);

  const handleLogin = () => {
    if (!__DEV__) {
      Alert.alert(
        "Authentication unavailable",
        "Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to enable sign in.",
      );
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter your username and password.",
      );
      return;
    }

    if (
      email.trim().toLowerCase() === "admin@gmail.com" &&
      password === "admin123"
    ) {
      navigateForEmail(router, email);
    } else if (
      email.trim().toLowerCase() === "scanner@gmail.com" &&
      password === "scanner123"
    ) {
      navigateForEmail(router, email);
    } else if (
      email.trim().toLowerCase() === "qrcode@gmail.com" &&
      password === "qrcode123"
    ) {
      navigateForEmail(router, email);
    } else if (
      email.trim().toLowerCase() === "member@gmail.com" &&
      password === "member123"
    ) {
      navigateForEmail(router, email);
    } else if (
      email.trim().toLowerCase() === "trainer@gmail.com" &&
      password === "trainer123"
    ) {
      navigateForEmail(router, email);
    } else {
      Alert.alert(
        "Login Failed",
        "Invalid username or password. Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              gap: compactLayout ? Spacing.two : Spacing.three,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.mainContent}>
            <View
              style={[
                styles.loginCard,
                {
                  width: cardWidth,
                  paddingVertical: compactLayout ? Spacing.four : Spacing.five,
                },
              ]}
            >
              <View style={styles.brand}>
                <Image
                  source={logo}
                  contentFit="cover"
                  style={styles.brandLogo}
                  accessibilityLabel="K-FIT logo"
                />
              </View>

              <View style={styles.intro}>
                <Text style={styles.portalLabel}>MEMBER PORTAL</Text>
                <Text style={styles.heading}>Sign in</Text>
                <Text style={styles.subtitle}>
                  Enter your details to access your account.
                </Text>
              </View>

              <View style={styles.form}>
                {clerkPublishableKey ? (
                  <GoogleLoginButton
                    onAuthenticated={(authenticatedEmail) =>
                      navigateForEmail(router, authenticatedEmail)
                    }
                  />
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.googleButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      Alert.alert(
                        "Google sign in is not configured",
                        "Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your local environment, then restart Expo.",
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Continue with Google"
                  >
                    <Text style={styles.googleButtonText}>
                      Continue with Google
                    </Text>
                  </Pressable>
                )}

                <View style={styles.separatorRow} accessibilityElementsHidden>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>OR SIGN IN WITH EMAIL</Text>
                  <View style={styles.separatorLine} />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Username or email</Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "email" && styles.inputFocused,
                    ]}
                    placeholder="Enter your username or email"
                    placeholderTextColor={KFitColors.mutedText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    textContentType="username"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    accessibilityLabel="Username or email"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View
                    style={[
                      styles.passwordContainer,
                      focusedField === "password" &&
                        styles.passwordContainerFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter your password"
                      placeholderTextColor={KFitColors.mutedText}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="current-password"
                      textContentType="password"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      accessibilityLabel="Password"
                      returnKeyType="done"
                      onSubmitEditing={
                        __DEV__ ? handleLogin : undefined
                      }
                    />
                    <Pressable
                      onPress={() => setShowPassword((visible) => !visible)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? "Hide password" : "Show password"
                      }
                      accessibilityState={{ expanded: showPassword }}
                      style={({ pressed }) => [
                        styles.visibilityButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.visibilityText}>
                        {showPassword ? "HIDE" : "SHOW"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={() =>
                    Alert.alert(
                      "Forgot Password",
                      "Password recovery is coming soon.",
                    )
                  }
                  accessibilityRole="link"
                  style={({ pressed }) => [
                    styles.forgotButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>

                {__DEV__ ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.loginButton,
                      pressed && styles.loginButtonPressed,
                    ]}
                    onPress={handleLogin}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in"
                    accessibilityHint="Signs in to your K-FIT account"
                  >
                    <Text style={styles.loginButtonText}>SIGN IN</Text>
                  </Pressable>
                ) : clerkPublishableKey ? (
                  <ClerkCredentialLoginButton
                    email={email}
                    password={password}
                    onAuthenticated={(authenticatedEmail) =>
                      navigateForEmail(router, authenticatedEmail)
                    }
                  />
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.loginButton,
                      pressed && styles.loginButtonPressed,
                    ]}
                    onPress={handleLogin}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in"
                    accessibilityHint="Signs in to your K-FIT account"
                  >
                    <Text style={styles.loginButtonText}>SIGN IN</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.signupRow}>
                <Text style={styles.secondaryText}>
                  Don&apos;t have an account?{" "}
                </Text>
                <Pressable
                  onPress={() =>
                    Alert.alert("Sign Up", "Registration is coming soon.")
                  }
                  accessibilityRole="link"
                  style={({ pressed }) => [
                    styles.signupButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.signupText}>Sign Up.</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Text style={styles.footer}>© 2025 K-FIT. All rights reserved.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: KFitColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  mainContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.three,
  },
  brand: {
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  brandLogo: {
    width: 96,
    height: 96,
    borderRadius: 10,
    borderCurve: "continuous",
  },
  loginCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 20,
    borderCurve: "continuous",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    borderWidth: 1,
    borderColor: KFitColors.border,
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.24)",
  },
  intro: {
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  portalLabel: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  heading: {
    color: KFitColors.text,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 32,
    flexShrink: 1,
  },
  subtitle: {
    color: KFitColors.mutedText,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    flexShrink: 1,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  fieldLabel: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  form: {
    width: "100%",
    gap: Spacing.three,
  },
  googleButton: {
    minHeight: 58,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
  },
  googleButtonText: {
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: KFitColors.border,
  },
  separatorText: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  input: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    borderCurve: "continuous",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: KFitColors.surface,
    color: KFitColors.text,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: KFitColors.accent,
  },
  passwordContainer: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    borderCurve: "continuous",
    paddingLeft: Spacing.three,
    backgroundColor: KFitColors.surface,
  },
  passwordContainerFocused: {
    borderColor: KFitColors.accent,
  },
  passwordInput: {
    flex: 1,
    minHeight: 56,
    paddingVertical: Spacing.two,
    textAlignVertical: "center",
    color: KFitColors.text,
    fontSize: 16,
  },
  visibilityButton: {
    minWidth: 64,
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.two,
  },
  visibilityText: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  forgotButton: {
    alignSelf: "flex-end",
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: Spacing.one,
    marginTop: -Spacing.two,
  },
  forgotText: {
    color: KFitColors.mutedText,
    fontSize: 13,
    fontWeight: "600",
  },
  loginButton: {
    minHeight: 58,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  loginButtonPressed: {
    opacity: 0.86,
  },
  loginButtonText: {
    color: KFitColors.background,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  signupRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.three,
  },
  secondaryText: {
    color: KFitColors.mutedText,
    fontSize: 13,
  },
  signupText: {
    color: KFitColors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  signupButton: {
    minHeight: 44,
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  footer: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: "center",
  },
});
