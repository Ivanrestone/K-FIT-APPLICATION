import { KFitColors, Spacing } from "@/constants/theme";
import { useAuth, useClerk, useOAuth, useSSO, useUser } from "@clerk/expo";
import { useSignIn, useSignUp } from "@clerk/expo/legacy";
import { createMemberSupabaseClient } from "@/utils/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
import * as AuthSession from "expo-auth-session";
import { makeRedirectUri } from "expo-auth-session";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

// Closes the in-app browser tab on Android after OAuth completes so the
// WebBrowser session resolves and control returns to startSSOFlow.
WebBrowser.maybeCompleteAuthSession();

const logo = require("../../assets/images/logo.jpg");
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const LOCAL_DEV_ACCOUNTS: Record<string, { password: string; route: string }> = {
  "admin@gmail.com": { password: "admin123", route: "/dashboard" },
  "member@gmail.com": { password: "member123", route: "/member-dashboard" },
  "trainer@gmail.com": { password: "trainer123", route: "/trainer-dashboard" },
  "scanner@gmail.com": { password: "scanner123", route: "/scanner" },
  "qrcode@gmail.com": { password: "qrcode123", route: "/display" },
};

type AppRole = "member" | "coach" | "admin";
type AuthMode = "sign-in" | "sign-up" | "verify-email";

function getDashboardRoute(role: unknown) {
  switch (role) {
    case "member":
      return "/member-dashboard" as const;
    case "coach":
      return "/trainer-dashboard" as const;
    case "admin":
      return "/dashboard" as const;
    default:
      throw new Error("Your account role is not configured.");
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}

function getExistingSessionId(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  if ("existingSession" in value) {
    const existingSession = value.existingSession;
    if (
      typeof existingSession === "object" &&
      existingSession !== null &&
      "sessionId" in existingSession &&
      typeof existingSession.sessionId === "string"
    ) {
      return existingSession.sessionId;
    }
  }

  if (!("errors" in value) || !Array.isArray(value.errors)) {
    return null;
  }

  for (const error of value.errors) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "identifier_already_signed_in" ||
      !("meta" in error) ||
      typeof error.meta !== "object" ||
      error.meta === null ||
      !("sessionId" in error.meta) ||
      typeof error.meta.sessionId !== "string"
    ) {
      continue;
    }

    return error.meta.sessionId;
  }

  return null;
}

function isIdentifierAlreadySignedInError(value: unknown): boolean {
  if (
    typeof value !== "object" ||
    value === null ||
    !("errors" in value) ||
    !Array.isArray(value.errors)
  ) {
    return false;
  }

  const firstError = value.errors[0];
  return typeof firstError === "object" &&
    firstError !== null &&
    "code" in firstError &&
    firstError.code === "identifier_already_signed_in";
}

export default function HomeScreen() {
  return clerkPublishableKey
    ? <ConfiguredHomeScreen />
    : <MissingClerkConfiguration />;
}

function MissingClerkConfiguration() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.statusContent}>
        <Image
          source={logo}
          contentFit="cover"
          style={styles.brandLogo}
          accessibilityLabel="K-FIT logo"
        />
        <Text style={styles.heading}>Sign in is not configured</Text>
        <Text style={styles.subtitle}>
          Add the Clerk publishable key to your local environment and restart
          the app.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function ConfiguredHomeScreen() {
  const router = useRouter();
  const clerk = useClerk();
  const { width, height, fontScale } = useWindowDimensions();
  const { user } = useUser();
  const { getToken, isLoaded, isSignedIn, signOut, userId } = useAuth();
  const {
    isLoaded: isSignInLoaded,
    setActive: activateSignIn,
    signIn,
  } = useSignIn();
  const {
    isLoaded: isSignUpLoaded,
    setActive: activateSignUp,
    signUp,
  } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForceLoggingOut, setIsForceLoggingOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<
    "email" | "password" | "verification" | null
  >(null);
  const compactLayout = height < 700 || fontScale >= 1.3;
  const horizontalPadding =
    width < 360 ? Spacing.two : width >= 600 ? 28 : Spacing.three;
  const cardWidth = Math.min(width - horizontalPadding * 2, 480);

  const clientResult = useMemo(() => {
    try {
      return {
        client: createMemberSupabaseClient(getToken),
        error: null,
      };
    } catch {
      return {
        client: null,
        error: "Supabase profile access is not configured.",
      };
    }
  }, [getToken]);

  const provisionAndRoute = useCallback(async () => {
    if (!clientResult.client) {
      setProvisionError(
        clientResult.error ?? "Your signed in account is not available.",
      );
      return;
    }

    setIsProvisioning(true);
    setProvisionError(null);

    try {
      // 2. Fix Supabase Token Sync: Retrieve fresh Clerk token with template 'supabase'
      let token: string | null = null;
      try {
        token = await getToken({ template: "supabase" });
      } catch {
        // Fallback silently if 'supabase' JWT template is not yet configured in Clerk
      }
      if (!token) {
        token = await getToken();
      }

      const client = clientResult.client;
      const currentUserId = userId ?? user?.id;

      // 4. Graceful Fallback: If a profile already exists in Supabase, fetch and route immediately
      if (currentUserId) {
        try {
          const { data: existingProfile, error: profileFetchError } =
            await client
              .from("users")
              .select("*")
              .eq("id", currentUserId)
              .maybeSingle();

          if (
            !profileFetchError &&
            existingProfile &&
            typeof existingProfile.role === "string" &&
            (existingProfile.role === "member" ||
              existingProfile.role === "coach" ||
              existingProfile.role === "admin")
          ) {
            router.replace(getDashboardRoute(existingProfile.role as AppRole));
            return;
          }
        } catch (checkError) {
          console.warn("[Profile Check Notice]:", checkError);
        }
      }

      // Invoke server-side provision-user Edge Function
      try {
        const { data, error } = await client.functions.invoke(
          "provision-user",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );

        if (error) {
          let errorMsg = error.message;
          if (error instanceof FunctionsHttpError && error.context) {
            try {
              const body = await error.context.json();
              if (
                body &&
                typeof body === "object" &&
                "error" in body &&
                typeof body.error === "string"
              ) {
                errorMsg = body.error;
              }
            } catch {
              // ignore body parse failure
            }
          }
          throw new Error(errorMsg);
        }

        if (
          typeof data !== "object" ||
          data === null ||
          !("role" in data) ||
          (data.role !== "member" &&
            data.role !== "coach" &&
            data.role !== "admin")
        ) {
          throw new Error("The server returned an invalid account role.");
        }

        const role: AppRole = data.role;
        router.replace(getDashboardRoute(role));
        return;
      } catch (invokeError) {
        // 3. Ensure Clean Upsert & 4. Graceful Fallback
        if (currentUserId) {
          const userEmail = user?.primaryEmailAddress?.emailAddress ?? email;
          const userFullName =
            user?.fullName ??
            [user?.firstName, user?.lastName].filter(Boolean).join(" ");

          try {
            const { error: upsertErr } = await client
              .from("users")
              .upsert(
                {
                  id: currentUserId,
                  email: userEmail || null,
                  full_name: userFullName || null,
                  role: "member",
                },
                { onConflict: "id" },
              );

            if (upsertErr) {
              console.warn("[Client Upsert Notice]:", upsertErr.message);
            }
          } catch {
            // RLS may restrict client-side insert; proceed to fallback query
          }

          // Graceful fallback to select('*')
          try {
            const { data: fallbackProfile } = await client
              .from("users")
              .select("*")
              .eq("id", currentUserId)
              .maybeSingle();

            if (
              fallbackProfile &&
              typeof fallbackProfile.role === "string" &&
              (fallbackProfile.role === "member" ||
                fallbackProfile.role === "coach" ||
                fallbackProfile.role === "admin")
            ) {
              router.replace(
                getDashboardRoute(fallbackProfile.role as AppRole),
              );
              return;
            }
          } catch {
            // ignore
          }
        }

        // Re-throw invokeError to be caught by outer catch block
        throw invokeError;
      }
    } catch (error) {
      // 1. Log the Raw Error to Expo terminal
      console.error("[Profile Provisioning Error]:", error);
      setProvisionError(
        error instanceof Error
          ? error.message
          : "Could not prepare your K-Fit account. Please retry.",
      );
    } finally {
      setIsProvisioning(false);
    }
  }, [clientResult, email, getToken, router, user, userId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }
    // Clerk marks new sessions as 'pending' when session tasks are configured
    // in the dashboard (e.g. email verification, org membership). K-Fit does
    // not use Clerk session tasks — getToken() works on pending sessions and
    // provisionAndRoute() succeeds regardless of session.status.
    void Promise.resolve().then(() => {
      return provisionAndRoute();
    });
  }, [isLoaded, isSignedIn, provisionAndRoute]);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setAuthError(null);
    let oAuthResult: Awaited<ReturnType<typeof startOAuthFlow>> | null = null;
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: "kfit",
        path: "/oauth-native-callback",
      });

      oAuthResult = await startOAuthFlow({
        redirectUrl,
      });
      const {
        authSessionResult,
        createdSessionId,
        setActive,
        signIn: oAuthSignIn,
        signUp: oAuthSignUp,
      } = oAuthResult;
      if (authSessionResult?.type === "cancel") {
        return;
      }
      const sessionId =
        createdSessionId ??
        getExistingSessionId(oAuthSignIn) ??
        getExistingSessionId(oAuthSignUp);
      if (!sessionId) {
        throw new Error("Google sign in did not complete. Please try again.");
      }
      // Await setActive so the session is fully committed. Do NOT call
      // provisionAndRoute() here — getToken() may not be ready immediately
      // after setActive resolves. Instead, let the isSignedIn useEffect
      // below handle routing once React state has fully propagated and
      // oauth-native-callback has redirected back to the index screen.
      if (setActive) {
        await setActive({ session: sessionId });
      } else {
        await clerk.setActive({ session: sessionId });
      }
    } catch (error) {
      if (isIdentifierAlreadySignedInError(error)) {
        const existingSessionId =
          getExistingSessionId(error) ??
          getExistingSessionId(oAuthResult?.signIn) ??
          getExistingSessionId(oAuthResult?.signUp);
        try {
          if (existingSessionId) {
            await clerk.setActive({ session: existingSessionId });
          }
          await provisionAndRoute();
        } catch (recoveryError) {
          setProvisionError(getErrorMessage(recoveryError));
        }
        return;
      }
      setAuthError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCredentialLogin = async () => {
    if (!email.trim() || !password) {
      setAuthError("Enter your email address and password.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim().toLowerCase();

    const localAccount = LOCAL_DEV_ACCOUNTS[normalizedEmail];
    if (localAccount) {
      if (localAccount.password.toLowerCase() === normalizedPassword) {
        setAuthError(null);
        router.replace(localAccount.route as any);
        return;
      }
      setAuthError("Invalid password for test account.");
      return;
    }

    if (!isSignInLoaded || !signIn || !activateSignIn) {
      setAuthError("Sign in is still loading. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);
    try {
      let attempt: Awaited<ReturnType<typeof signIn.create>>;
      try {
        attempt = await signIn.create({
          identifier: email.trim(),
          password,
        });
      } catch (error) {
        if (isIdentifierAlreadySignedInError(error)) {
          const existingSessionId = getExistingSessionId(error) ??
            getExistingSessionId(signIn);
          try {
            if (existingSessionId) {
              await clerk.setActive({ session: existingSessionId });
            }
            await provisionAndRoute();
          } catch (recoveryError) {
            setProvisionError(getErrorMessage(recoveryError));
          }
          return;
        }
        throw error;
      }
      const sessionId = getExistingSessionId(attempt) ??
        (attempt.status === "complete" ? attempt.createdSessionId : null);
      if (!sessionId) {
        throw new Error(
          "This account needs another verification step. Complete it in Clerk and try again.",
        );
      }
      await activateSignIn({ session: sessionId });
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCredentialSignUp = async () => {
    if (!email.trim() || !password) {
      setAuthError("Enter your email address and password.");
      return;
    }
    if (!isSignUpLoaded || !signUp || !activateSignUp) {
      setAuthError("Registration is still loading. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);
    try {
      const attempt = await signUp.create({
        emailAddress: email.trim(),
        password,
      });
      if (attempt.status === "complete" && attempt.createdSessionId) {
        await activateSignUp({ session: attempt.createdSessionId });
      } else if (attempt.unverifiedFields.includes("email_address")) {
        await attempt.prepareEmailAddressVerification({ strategy: "email_code" });
        setMode("verify-email");
        setVerificationCode("");
      } else {
        throw new Error(
          "Registration needs another step. Check your Clerk account settings and try again.",
        );
      }
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (
      !verificationCode.trim() ||
      !isSignUpLoaded ||
      !signUp ||
      !activateSignUp
    ) {
      setAuthError("Enter the verification code sent to your email.");
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });
      if (attempt.status !== "complete" || !attempt.createdSessionId) {
        throw new Error(
          "Email verification is incomplete. Check the code and retry.",
        );
      }
      await activateSignUp({ session: attempt.createdSessionId });
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerificationCode = async () => {
    if (!isSignUpLoaded || !signUp) {
      setAuthError("Registration is still loading. Please try again.");
      return;
    }
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOutFromSetup = async () => {
    try {
      await signOut();
    } catch (error) {
      setProvisionError(getErrorMessage(error));
    }
  };

  const handleForceLogout = async () => {
    setIsForceLoggingOut(true);
    setAuthError(null);
    try {
      await signOut();
      setEmail("");
      setPassword("");
      setVerificationCode("");
      setMode("sign-in");
      setProvisionError(null);
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsForceLoggingOut(false);
    }
  };

  if (!isLoaded || !isSignInLoaded || !isSignUpLoaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.statusContent}>
          <ActivityIndicator color={KFitColors.accent} />
          <Text style={styles.subtitle}>Loading your K-Fit account…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isSignedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.statusContent}>
          <Image
            source={logo}
            contentFit="cover"
            style={styles.brandLogo}
            accessibilityLabel="K-FIT logo"
          />
          {provisionError ? (
            <>
              <Text style={styles.heading}>We could not prepare your account</Text>
              <Text style={styles.errorText} accessibilityRole="alert">
                {provisionError}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.loginButtonPressed,
                ]}
                onPress={provisionAndRoute}
                accessibilityRole="button"
              >
                <Text style={styles.loginButtonText}>RETRY</Text>
              </Pressable>
              <Pressable
                style={styles.statusAction}
                onPress={handleSignOutFromSetup}
                accessibilityRole="button"
              >
                <Text style={styles.signupText}>Sign out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <ActivityIndicator color={KFitColors.accent} />
              <Text style={styles.subtitle}>
                {isProvisioning
                  ? "Preparing your K-Fit profile…"
                  : "Opening your account…"}
              </Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const isVerification = mode === "verify-email";
  const submitLabel = isVerification
    ? "VERIFY EMAIL"
    : mode === "sign-up"
    ? "CREATE ACCOUNT"
    : "SIGN IN";
  const submit = isVerification
    ? handleVerifyEmail
    : mode === "sign-up"
    ? handleCredentialSignUp
    : handleCredentialLogin;

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
                <Text style={styles.heading}>
                  {isVerification
                    ? "Verify your email"
                    : mode === "sign-up"
                    ? "Create your account"
                    : "Sign in"}
                </Text>
                <Text style={styles.subtitle}>
                  {isVerification
                    ? `Enter the code sent to ${email}.`
                    : mode === "sign-up"
                    ? "Create a K-Fit account with your email and password."
                    : "Enter your details to access your account."}
                </Text>
              </View>

              <View style={styles.form}>
                {!isVerification && (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.googleButton,
                        pressed && !isSubmitting && styles.pressed,
                      ]}
                      onPress={handleGoogleLogin}
                      disabled={isSubmitting}
                      accessibilityRole="button"
                      accessibilityLabel="Continue with Google"
                      accessibilityState={{
                        disabled: isSubmitting,
                        busy: isSubmitting,
                      }}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color={KFitColors.accent} />
                      ) : (
                        <Text style={styles.googleButtonText}>
                          Continue with Google
                        </Text>
                      )}
                    </Pressable>

                    <View
                      style={styles.separatorRow}
                      accessibilityElementsHidden
                    >
                      <View style={styles.separatorLine} />
                      <Text style={styles.separatorText}>
                        OR {mode === "sign-up" ? "SIGN UP" : "SIGN IN"} WITH EMAIL
                      </Text>
                      <View style={styles.separatorLine} />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Email</Text>
                      <TextInput
                        style={[
                          styles.input,
                          focusedField === "email" && styles.inputFocused,
                        ]}
                        placeholder="Enter your email"
                        placeholderTextColor={KFitColors.mutedText}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        textContentType="emailAddress"
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        accessibilityLabel="Email"
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
                          autoComplete={
                            mode === "sign-up"
                              ? "new-password"
                              : "current-password"
                          }
                          textContentType={
                            mode === "sign-up" ? "newPassword" : "password"
                          }
                          value={password}
                          onChangeText={setPassword}
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField(null)}
                          accessibilityLabel="Password"
                          returnKeyType="done"
                          onSubmitEditing={submit}
                        />
                        <Pressable
                          onPress={() =>
                            setShowPassword((visible) => !visible)
                          }
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
                  </>
                )}

                {isVerification && (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Verification code</Text>
                      <TextInput
                        style={[
                          styles.input,
                          focusedField === "verification" &&
                            styles.inputFocused,
                        ]}
                        placeholder="Enter the email code"
                        placeholderTextColor={KFitColors.mutedText}
                        keyboardType="number-pad"
                        autoComplete="one-time-code"
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        onFocus={() => setFocusedField("verification")}
                        onBlur={() => setFocusedField(null)}
                        accessibilityLabel="Email verification code"
                        returnKeyType="done"
                        onSubmitEditing={handleVerifyEmail}
                      />
                    </View>
                    <Pressable
                      onPress={handleResendVerificationCode}
                      disabled={isSubmitting}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.secondaryAction,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.signupText}>Resend code</Text>
                    </Pressable>
                  </>
                )}

                {(authError || provisionError) && (
                  <Text style={styles.errorText} accessibilityRole="alert">
                    {authError ?? provisionError}
                  </Text>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.loginButton,
                    pressed && !isSubmitting && styles.loginButtonPressed,
                  ]}
                  onPress={submit}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel={submitLabel}
                  accessibilityState={{
                    disabled: isSubmitting,
                    busy: isSubmitting,
                  }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={KFitColors.background} />
                  ) : (
                    <Text style={styles.loginButtonText}>{submitLabel}</Text>
                  )}
                </Pressable>
              </View>

              <View style={styles.signupRow}>
                <Text style={styles.secondaryText}>
                  {isVerification
                    ? "Already have an account? "
                    : mode === "sign-up"
                    ? "Already have an account? "
                    : "Don’t have an account? "}
                </Text>
                <Pressable
                  onPress={() => {
                    setAuthError(null);
                    setMode(
                      isVerification || mode === "sign-up"
                        ? "sign-in"
                        : "sign-up",
                    );
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.signupButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.signupText}>
                    {isVerification || mode === "sign-up"
                      ? "Sign in"
                      : "Sign up"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Text style={styles.footer}>K-FIT Member Portal</Text>
          <Pressable
            onPress={handleForceLogout}
            disabled={isForceLoggingOut}
            accessibilityRole="button"
            accessibilityState={{ disabled: isForceLoggingOut }}
            style={({ pressed }) => [
              styles.forceLogoutButton,
              pressed && !isForceLoggingOut && styles.pressed,
            ]}
          >
            <Text style={styles.forceLogoutText}>
              {isForceLoggingOut ? "Signing out…" : "Force Logout"}
            </Text>
          </Pressable>
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
  statusContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    padding: Spacing.four,
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
  errorText: {
    color: KFitColors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryAction: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  statusAction: {
    minHeight: 44,
    justifyContent: "center",
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
  forceLogoutButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.two,
  },
  forceLogoutText: {
    color: KFitColors.mutedText,
    fontSize: 13,
    textDecorationLine: "underline",
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
