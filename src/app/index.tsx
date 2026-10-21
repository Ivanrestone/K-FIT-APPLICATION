import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KFitColors, Spacing } from '@/constants/theme';

const logo = require('../../assets/images/logo.jpg');

export default function HomeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing Information',
        'Please enter your username and password.'
      );
      return;
    }

    if (
      email.trim().toLowerCase() === 'admin@gmail.com' &&
      password === 'admin123'
    ) {
      router.replace('/dashboard');
    } else if (
      email.trim().toLowerCase() === 'member@gmail.com' &&
      password === 'member123'
    ) {
      router.replace('/member-dashboard' as any);
    } else {
      Alert.alert(
        'Login Failed',
        'Invalid username or password. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.header}>
            <View style={styles.headerBrand}>
              <Image
                source={logo}
                contentFit="cover"
                style={styles.headerLogo}
                accessibilityLabel="K-FIT logo"
              />
              <Text style={styles.headerBrandText}>K-FIT</Text>
            </View>
            <Text style={styles.headerLabel}>MEMBER PORTAL</Text>
          </View>

          <View style={styles.loginCard}>
            <Image
              source={logo}
              contentFit="cover"
              style={styles.logo}
              accessibilityLabel="K-FIT logo"
            />
            <Text style={styles.portalLabel}>MEMBER PORTAL</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="USERNAME"
                placeholderTextColor={KFitColors.mutedText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                value={email}
                onChangeText={setEmail}
                accessibilityLabel="Username"
                returnKeyType="next"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="PASSWORD"
                  placeholderTextColor={KFitColors.mutedText}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  value={password}
                  onChangeText={setPassword}
                  accessibilityLabel="Password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  onPress={() => setShowPassword((visible) => !visible)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  style={({ pressed }) => [
                    styles.visibilityButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.visibilityText}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() =>
                  Alert.alert(
                    'Forgot Password',
                    'Password recovery is coming soon.'
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

              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.loginButtonPressed,
                ]}
                onPress={handleLogin}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
              >
                <Text style={styles.loginButtonText}>SIGN IN</Text>
              </Pressable>
            </View>

            <View style={styles.signupRow}>
              <Text style={styles.secondaryText}>Don&apos;t have an account? </Text>
              <Pressable
                onPress={() =>
                  Alert.alert('Sign Up', 'Registration is coming soon.')
                }
                accessibilityRole="link"
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.signupText}>Sign Up.</Text>
              </Pressable>
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
    backgroundColor: KFitColors.charcoal,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  headerBrandText: {
    color: KFitColors.goldBright,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  headerLabel: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  loginCard: {
    width: '100%',
    backgroundColor: KFitColors.charcoalRaised,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 156,
    height: 156,
    borderRadius: 12,
    marginBottom: Spacing.one,
  },
  portalLabel: {
    color: KFitColors.goldBright,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: Spacing.two,
  },
  form: {
    width: '100%',
    gap: Spacing.two,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: KFitColors.inputBorder,
    borderRadius: 8,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    color: KFitColors.text,
    fontSize: 14,
    letterSpacing: 1.2,
  },
  passwordContainer: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: KFitColors.inputBorder,
    borderRadius: 8,
    borderCurve: 'continuous',
    paddingLeft: Spacing.three,
  },
  passwordInput: {
    flex: 1,
    minHeight: 50,
    color: KFitColors.text,
    fontSize: 14,
    letterSpacing: 1.2,
  },
  visibilityButton: {
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  visibilityText: {
    color: KFitColors.goldBright,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  forgotText: {
    color: KFitColors.mutedText,
    fontSize: 12,
  },
  loginButton: {
    minHeight: 52,
    borderRadius: 8,
    borderCurve: 'continuous',
    backgroundColor: KFitColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  loginButtonPressed: {
    backgroundColor: KFitColors.goldBright,
  },
  loginButtonText: {
    color: KFitColors.charcoal,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  signupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  secondaryText: {
    color: KFitColors.mutedText,
    fontSize: 13,
  },
  signupText: {
    color: KFitColors.goldBright,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  footer: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 'auto',
  },
});
