import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ADMIN PANEL</Text>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back, Admin!</Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Hello, Administrator!</Text>
          <Text style={styles.welcomeText}>
            You have successfully logged in to your application.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statNumber}>120</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>admin@gmail.com</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>Administrator</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.status}>Active</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            alert('User Management feature coming soon!')
          }
        >
          <Text style={styles.actionIcon}>👤</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Users</Text>
            <Text style={styles.actionSubtitle}>
              View and manage application users
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            alert('Settings feature coming soon!')
          }
        >
          <Text style={styles.actionIcon}>⚙️</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Settings</Text>
            <Text style={styles.actionSubtitle}>
              Configure your application
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>MyFirstApp · Admin Dashboard</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  eyebrow: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  welcomeCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    padding: 22,
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  welcomeText: {
    color: '#E0E7FF',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIcon: {
    fontSize: 25,
    marginBottom: 12,
  },
  statNumber: {
    color: '#4F46E5',
    fontSize: 27,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 28,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  status: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 23,
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 5,
  },
  arrow: {
    color: '#9CA3AF',
    fontSize: 27,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 26,
  },
});