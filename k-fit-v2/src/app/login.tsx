import { getCurrentUser, login, loginWithGoogle } from '@/lib/auth';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import { useSoundEffects } from '@/components/shared/SoundEffectsProvider';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const LOGO = require('@/assets/images/logo.jpg');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const playSound = useSoundEffects();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const passwordInputRef = useRef<TextInputInstance>(null);

  const redirectByRole = async () => {
    const { syncOAuthProfile } = await import('@/lib/auth');
    await syncOAuthProfile();
    const user = await getCurrentUser();
    const requestedRole = user?.user_metadata?.role;
    const role =
      requestedRole === 'admin'
        ? 'admin'
        : requestedRole === 'coach'
          ? 'coach'
          : 'member';
    const destination =
      role === 'admin'
        ? '/admin/dashboard'
        : role === 'coach'
          ? '/coach/dashboard'
          : '/member/dashboard';

    router.replace(destination);
  };

  // Pick up an existing session (e.g. returning from Google OAuth redirect)
  useEffect(() => {
    const checkSession = async () => {
      const { getSession } = await import('@/lib/auth');
      const session = await getSession();
      if (session) {
        await redirectByRole();
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setLoginError('Enter your email address.');
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setLoginError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setLoginError('Enter your password.');
      return;
    }

    setLoginError('');
    setLoading(true);
    try {
      const result = await login({ email: normalizedEmail, password });
      if (!result.success) {
        playSound('warning');
        setLoginError(result.error || 'Unable to sign in. Please try again.');
        return;
      }

      playSound('success');
      await redirectByRole();
    } catch (error) {
      console.error('Login failed:', error);
      playSound('warning');
      setLoginError(
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setLoginError('');
    try {
      const result = await loginWithGoogle();
      // On web the browser redirects to Google; native continues here.
      if (result.success) {
        playSound('success');
        await redirectByRole();
      } else {
        playSound('warning');
        setLoginError(result.error || 'Google login failed.');
      }
    } catch (error) {
      console.error('Google login failed:', error);
      playSound('warning');
      setLoginError(
        error instanceof Error ? error.message : 'Google login failed.',
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.shell}>
          <View style={styles.header}>
            <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
            <View>
              <Text style={styles.brandText}>K-FIT</Text>
              <Text style={styles.brandCaption}>SMART GYM</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.eyebrow}>MEMBER PORTAL</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue to your K-FIT account.
            </Text>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email address</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'email' && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#777F8D"
                    accessibilityLabel="Email address"
                    autoComplete="username"
                    textContentType="username"
                    importantForAutofill="yes"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      if (loginError) setLoginError('');
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/forgot-password')}
                    accessibilityRole="button"
                    accessibilityLabel="Forgot password"
                  >
                    <Text style={styles.forgotLink}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'password' && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    ref={passwordInputRef}
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor="#777F8D"
                    accessibilityLabel="Password"
                    autoComplete="current-password"
                    textContentType="password"
                    importantForAutofill="yes"
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!showPassword}
                    returnKeyType="go"
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      if (loginError) setLoginError('');
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onSubmitEditing={() => void handleLogin()}
                  />
                  <TouchableOpacity
                    style={styles.visibilityButton}
                    onPress={() => setShowPassword((visible) => !visible)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    <Text style={styles.visibilityText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {loginError ? (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {loginError}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[styles.signInButton, loading && styles.disabledButton]}
                onPress={() => void handleLogin()}
                disabled={loading || googleLoading}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#101318" />
                ) : (
                  <Text style={styles.signInButtonText}>Sign in</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, googleLoading && styles.disabledButton]}
              onPress={() => void handleGoogleLogin()}
              disabled={loading || googleLoading}
              accessibilityRole="button"
            >
              {googleLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.secondaryText}>New to K-FIT?</Text>
              <TouchableOpacity
                onPress={() => router.push('/signup')}
                accessibilityRole="button"
              >
                <Text style={styles.signupLink}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footerText}>
            © 2025 K-FIT. All rights reserved.
          </Text>
        </View>
      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#0A0D12',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  headerLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    marginRight: 12,
  },
  brandText: {
    color: '#F6F7F9',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  brandCaption: {
    marginTop: 2,
    color: '#9AA6B5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  shell: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  eyebrow: {
    color: '#F0C65A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 10,
  },
  title: {
    color: '#F6F7F9',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#9AA6B5',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 28,
  },
  form: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    color: '#DDE2E8',
    fontSize: 13,
    fontWeight: '700',
  },
  forgotLink: {
    color: '#F0C65A',
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrapperFocused: {
    borderColor: '#F0C65A',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 19,
    marginTop: -4,
    marginBottom: 14,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 24,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#111720',
    borderWidth: 1,
    borderColor: '#293340',
    borderRadius: 22,
    padding: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 8,
    // radial-gradient approximated by the flat dark base color
  },
  inputWrapper: {
    width: '100%',
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#293340',
    borderRadius: 13,
    backgroundColor: '#0C1118',
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 15,
    color: '#F6F7F9',
    fontSize: 15,
  },
  passwordInput: {
    paddingRight: 4,
  },
  visibilityButton: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  visibilityText: {
    color: '#F0C65A',
    fontSize: 12,
    fontWeight: '700',
  },
  signInButton: {
    width: '100%',
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0C65A',
    borderRadius: 13,
    marginTop: 2,
  },
  disabledButton: {
    opacity: 0.65,
  },
  signInButtonText: {
    color: '#17140C',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 23,
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#293340',
  },
  dividerText: {
    color: '#9AA6B5',
    marginHorizontal: 12,
    fontSize: 12,
  },
  googleButton: {
    width: '100%',
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#19212C',
    borderWidth: 1,
    borderColor: '#34404E',
    borderRadius: 13,
  },
  googleButtonText: {
    color: '#F6F7F9',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryText: {
    color: '#9AA6B5',
    fontSize: 13,
  },
  signupLink: {
    color: '#F0C65A',
    fontSize: 13,
    fontWeight: '700',
  },
  footerText: {
    color: '#697586',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 22,
  },
});
