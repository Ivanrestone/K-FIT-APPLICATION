import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useSoundEffects } from '@/components/shared/SoundEffectsProvider';
import { signup } from '@/lib/auth';
import type { TextInputInstance } from 'react-native';
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
const MIN_PASSWORD_LENGTH = 8;

type SignupField = 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword';
type Feedback = { type: 'error' | 'success'; message: string };
type PasswordStrength = { score: number; label: string; color: string };

function getPasswordStrength(password: string): PasswordStrength {
  const checks = [
    password.length >= MIN_PASSWORD_LENGTH,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const levels = [
    { label: 'Add a password', color: '#697586' },
    { label: 'Weak', color: '#F87171' },
    { label: 'Fair', color: '#F0C65A' },
    { label: 'Good', color: '#A3C76D' },
    { label: 'Strong', color: '#4ADE80' },
  ];

  if (!password) return { score: 0, ...levels[0] };
  if (score <= 2) return { score, ...levels[1] };
  return { score, ...levels[score - 1] };
}

export default function SignupScreen() {
  const playSound = useSoundEffects();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<SignupField | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<SignupField, string>>>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const firstNameRef = useRef<TextInputInstance>(null);
  const lastNameRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmPasswordRef = useRef<TextInputInstance>(null);
  const passwordStrength = getPasswordStrength(password);
  const registrationComplete = feedback?.type === 'success';

  const handleFieldChange = (field: SignupField, value: string) => {
    if (field === 'firstName') setFirstName(value);
    if (field === 'lastName') setLastName(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);

    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (field === 'password') delete next.confirmPassword;
      return next;
    });
    setFeedback(null);
  };

  const handleSignup = async () => {
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const nextErrors: Partial<Record<SignupField, string>> = {};

    if (!normalizedFirstName) nextErrors.firstName = 'First name is required.';
    if (!normalizedLastName) nextErrors.lastName = 'Last name is required.';
    if (!normalizedEmail) {
      nextErrors.email = 'Email address is required.';
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFeedback({ type: 'error', message: 'Please review the highlighted fields.' });
      playSound('warning');
      if (nextErrors.firstName) firstNameRef.current?.focus();
      else if (nextErrors.lastName) lastNameRef.current?.focus();
      else if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.password) passwordRef.current?.focus();
      else confirmPasswordRef.current?.focus();
      return;
    }

    setErrors({});
    setFeedback(null);
    setLoading(true);
    try {
      const result = await signup({
        email: normalizedEmail,
        password,
        data: {
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
        },
      });

      if (!result.success) {
        setFeedback({
          type: 'error',
          message: result.error || 'Unable to create your account. Please try again.',
        });
        playSound('warning');
        return;
      }

      playSound('success');
      setFeedback({
        type: 'success',
        message: result.data?.session
          ? 'Your account is ready. Continue to sign in to access K-FIT.'
          : 'Account created. Check your email for a confirmation link before signing in.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to create your account. Please try again.',
      });
      playSound('warning');
    } finally {
      setLoading(false);
    }
  };

  const inputWrapperStyle = (field: SignupField) => [
    styles.inputWrapper,
    focusedInput === field && styles.inputWrapperFocused,
    errors[field] && styles.inputWrapperError,
  ];

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
            <View style={styles.brand}>
              <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
              <View>
                <Text style={styles.brandText}>K-FIT</Text>
                <Text style={styles.brandCaption}>SMART GYM</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/login')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
            >
              <Ionicons name="arrow-back" size={16} color="#F0C65A" />
              <Text style={styles.backButtonText}>Sign in</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.eyebrow}>JOIN K-FIT</Text>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Set up your profile to start your fitness journey.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>First name</Text>
              <View style={inputWrapperStyle('firstName')}>
                <Ionicons name="person-outline" size={18} color="#8793A2" />
                <TextInput
                  ref={firstNameRef}
                  style={styles.input}
                  placeholder="Your first name"
                  placeholderTextColor="#777F8D"
                  accessibilityLabel="First name"
                  autoComplete="given-name"
                  textContentType="givenName"
                  importantForAutofill="yes"
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={firstName}
                  editable={!loading && !registrationComplete}
                  onChangeText={(value) => handleFieldChange('firstName', value)}
                  onFocus={() => setFocusedInput('firstName')}
                  onBlur={() => setFocusedInput(null)}
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                />
              </View>
              {errors.firstName ? (
                <Text style={styles.fieldError} accessibilityRole="alert">
                  {errors.firstName}
                </Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Last name</Text>
              <View style={inputWrapperStyle('lastName')}>
                <Ionicons name="person-outline" size={18} color="#8793A2" />
                <TextInput
                  ref={lastNameRef}
                  style={styles.input}
                  placeholder="Your last name"
                  placeholderTextColor="#777F8D"
                  accessibilityLabel="Last name"
                  autoComplete="family-name"
                  textContentType="familyName"
                  importantForAutofill="yes"
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={lastName}
                  editable={!loading && !registrationComplete}
                  onChangeText={(value) => handleFieldChange('lastName', value)}
                  onFocus={() => setFocusedInput('lastName')}
                  onBlur={() => setFocusedInput(null)}
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>
              {errors.lastName ? (
                <Text style={styles.fieldError} accessibilityRole="alert">
                  {errors.lastName}
                </Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={inputWrapperStyle('email')}>
                <Ionicons name="mail-outline" size={18} color="#8793A2" />
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#777F8D"
                  accessibilityLabel="Email address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  importantForAutofill="yes"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  value={email}
                  editable={!loading && !registrationComplete}
                  onChangeText={(value) => handleFieldChange('email', value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              {errors.email ? (
                <Text style={styles.fieldError} accessibilityRole="alert">
                  {errors.email}
                </Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={inputWrapperStyle('password')}>
                <Ionicons name="lock-closed-outline" size={18} color="#8793A2" />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#777F8D"
                  accessibilityLabel="Password"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  importantForAutofill="yes"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  value={password}
                  editable={!loading && !registrationComplete}
                  onChangeText={(value) => handleFieldChange('password', value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />
                <TouchableOpacity
                  style={styles.visibilityButton}
                  onPress={() => setShowPassword((visible) => !visible)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  accessibilityState={{ expanded: showPassword }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.visibilityText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.fieldError} accessibilityRole="alert">
                  {errors.password}
                </Text>
              ) : null}
              <View
                style={styles.strengthContainer}
                accessibilityRole="progressbar"
                accessibilityLabel={`Password strength: ${passwordStrength.label}`}
                accessibilityValue={{ min: 0, max: 5, now: passwordStrength.score }}
              >
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        level <= passwordStrength.score && {
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
              <Text style={styles.helperText}>
                Use at least 8 characters. Mix letters, numbers, and symbols for a stronger password.
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirm password</Text>
              <View style={inputWrapperStyle('confirmPassword')}>
                <Ionicons name="lock-closed-outline" size={18} color="#8793A2" />
                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#777F8D"
                  accessibilityLabel="Confirm password"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  importantForAutofill="yes"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  value={confirmPassword}
                  editable={!loading && !registrationComplete}
                  onChangeText={(value) =>
                    handleFieldChange('confirmPassword', value)
                  }
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput(null)}
                  onSubmitEditing={() => void handleSignup()}
                />
                <TouchableOpacity
                  style={styles.visibilityButton}
                  onPress={() => setShowConfirmPassword((visible) => !visible)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirmPassword
                      ? 'Hide confirmation password'
                      : 'Show confirmation password'
                  }
                  accessibilityState={{ expanded: showConfirmPassword }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.visibilityText}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.fieldError} accessibilityRole="alert">
                  {errors.confirmPassword}
                </Text>
              ) : null}
            </View>

            {feedback ? (
              <View
                style={[
                  styles.feedbackBox,
                  feedback.type === 'success'
                    ? styles.successFeedback
                    : styles.errorFeedback,
                ]}
                accessibilityLiveRegion={
                  feedback.type === 'error' ? 'assertive' : 'polite'
                }
              >
                <Ionicons
                  name={
                    feedback.type === 'success'
                      ? 'checkmark-circle-outline'
                      : 'alert-circle-outline'
                  }
                  size={18}
                  color={feedback.type === 'success' ? '#86EFAC' : '#FCA5A5'}
                />
                <Text
                  style={[
                    styles.feedbackText,
                    feedback.type === 'success'
                      ? styles.successFeedbackText
                      : styles.errorFeedbackText,
                  ]}
                  accessibilityRole={feedback.type === 'error' ? 'alert' : undefined}
                >
                  {feedback.message}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading || registrationComplete) && styles.disabledButton,
              ]}
              onPress={() => void handleSignup()}
              disabled={loading || registrationComplete}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading || registrationComplete }}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#101318" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {registrationComplete ? 'Account created' : 'Create account'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.secondaryText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => router.replace('/login')}
                accessibilityRole="link"
                activeOpacity={0.7}
              >
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footerText}>© 2025 K-FIT. All rights reserved.</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  shell: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
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
  backButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#293340',
    backgroundColor: '#111720',
  },
  backButtonText: {
    color: '#F0C65A',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    width: '100%',
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
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: '#9AA6B5',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 26,
  },
  fieldGroup: {
    marginBottom: 17,
  },
  fieldLabel: {
    color: '#DDE2E8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
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
    paddingLeft: 14,
  },
  inputWrapperFocused: {
    borderColor: '#F0C65A',
  },
  inputWrapperError: {
    borderColor: '#F87171',
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 11,
    color: '#F6F7F9',
    fontSize: 14,
  },
  visibilityButton: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  visibilityText: {
    color: '#F0C65A',
    fontSize: 12,
    fontWeight: '700',
  },
  fieldError: {
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 11,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    marginRight: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#293340',
  },
  strengthLabel: {
    minWidth: 90,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
  },
  helperText: {
    color: '#8793A2',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 2,
    marginBottom: 14,
  },
  successFeedback: {
    borderColor: '#285B3B',
    backgroundColor: '#10251A',
  },
  errorFeedback: {
    borderColor: '#673A40',
    backgroundColor: '#28171B',
  },
  feedbackText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  successFeedbackText: {
    color: '#BBF7D0',
  },
  errorFeedbackText: {
    color: '#FECACA',
  },
  submitButton: {
    width: '100%',
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0C65A',
    borderRadius: 13,
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: '#17140C',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 23,
  },
  secondaryText: {
    color: '#9AA6B5',
    fontSize: 13,
  },
  loginLink: {
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
