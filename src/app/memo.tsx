import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface Memo {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  author: string;
}

const mockMemos: Memo[] = [
  {
    id: '1',
    title: 'Gym Closure - Maintenance Day',
    content: 'The gym will be closed on October 25, 2026 for scheduled maintenance. We apologize for any inconvenience and will resume normal operations on October 26.',
    date: 'Oct 20, 2026',
    priority: 'High',
    author: 'Admin',
  },
  {
    id: '2',
    title: 'New Class Schedule',
    content: 'Starting next week, we are adding new yoga classes on Monday and Wednesday evenings at 6 PM. Sign up through the member app.',
    date: 'Oct 18, 2026',
    priority: 'Medium',
    author: 'Admin',
  },
  {
    id: '3',
    title: 'Holiday Hours Notice',
    content: 'Please note our modified hours during the upcoming holiday season. We will be open from 8 AM to 6 PM on Thanksgiving Day.',
    date: 'Oct 15, 2026',
    priority: 'Medium',
    author: 'Admin',
  },
  {
    id: '4',
    title: 'Equipment Update',
    content: 'New cardio equipment has been installed in the main floor. Please ask staff for a quick tutorial if needed.',
    date: 'Oct 10, 2026',
    priority: 'Low',
    author: 'Admin',
  },
  {
    id: '5',
    title: 'Personal Training Promotion',
    content: 'Special offer: 20% off personal training packages for the month of October. Contact front desk for details.',
    date: 'Oct 05, 2026',
    priority: 'Low',
    author: 'Admin',
  },
];

export default function MemoScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All priorities');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#EF4444';
      case 'Medium':
        return '#F59E0B';
      case 'Low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#EF444420';
      case 'Medium':
        return '#F59E0B20';
      case 'Low':
        return '#10B98120';
      default:
        return '#6B728020';
    }
  };

  const handleCreateMemo = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Missing Information', 'Please enter both title and content.');
      return;
    }

    Alert.alert(
      'Memo Created',
      'Your memo has been created and will be visible to all members.'
    );

    setCreateModalVisible(false);
    setNewTitle('');
    setNewContent('');
    setNewPriority('Medium');
  };

  const handleViewMemo = (memo: Memo) => {
    setSelectedMemo(memo);
    setViewModalVisible(true);
  };

  const handleDeleteMemo = () => {
    Alert.alert(
      'Memo Deleted',
      'The memo has been deleted successfully.'
    );
    setViewModalVisible(false);
    setSelectedMemo(null);
  };

  const filteredMemos = mockMemos.filter((memo) => {
    const matchesSearch =
      memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = selectedPriority === 'All priorities' || memo.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.gymName}>FORM/Brooklyn</Text>
            <Text style={styles.gymSubtitle}>Performance club</Text>
          </View>

          <View style={styles.sidebarDate}>
            <Text style={styles.dateText}>Tuesday, October 20, 2026</Text>
            <Text style={styles.timeText}>AM</Text>
          </View>

          <View style={styles.sidebarNav}>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/dashboard')}>
              <Text style={styles.navItemText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/members')}>
              <Text style={styles.navItemText}>Members</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/attendance')}>
              <Text style={styles.navItemText}>Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/trainers')}>
              <Text style={styles.navItemText}>Trainers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/memberships')}>
              <Text style={styles.navItemText}>Memberships</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/payments')}>
              <Text style={styles.navItemText}>Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
              <Text style={[styles.navItemText, styles.navItemTextActive]}>
                Memo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Gym Memos</Text>
              <Text style={styles.headerSubtitle}>
                Important announcements and notifications for members
              </Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <Text style={styles.createButtonText}>+ Create Memo</Text>
            </TouchableOpacity>
          </View>

          {/* Search and Filters */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search memos by title or content"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContainer}
            >
              <TouchableOpacity
                style={[styles.filterTab, selectedPriority === 'All priorities' && styles.filterTabActive]}
                onPress={() => setSelectedPriority('All priorities')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedPriority === 'All priorities' && styles.filterTabTextActive,
                  ]}
                >
                  All priorities
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedPriority === 'High' && styles.filterTabActive]}
                onPress={() => setSelectedPriority('High')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedPriority === 'High' && styles.filterTabTextActive,
                  ]}
                >
                  High
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedPriority === 'Medium' && styles.filterTabActive]}
                onPress={() => setSelectedPriority('Medium')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedPriority === 'Medium' && styles.filterTabTextActive,
                  ]}
                >
                  Medium
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedPriority === 'Low' && styles.filterTabActive]}
                onPress={() => setSelectedPriority('Low')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedPriority === 'Low' && styles.filterTabTextActive,
                  ]}
                >
                  Low
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Memo List */}
          <View style={styles.memoList}>
            {filteredMemos.map((memo) => (
              <TouchableOpacity
                key={memo.id}
                style={styles.memoCard}
                onPress={() => handleViewMemo(memo)}
              >
                <View style={styles.memoHeader}>
                  <View style={styles.memoTitleContainer}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityColor(memo.priority) },
                      ]}
                    />
                    <Text style={styles.memoTitle}>{memo.title}</Text>
                  </View>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityBgColor(memo.priority) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: getPriorityColor(memo.priority) },
                      ]}
                    >
                      {memo.priority}
                    </Text>
                  </View>
                </View>
                <Text style={styles.memoContent} numberOfLines={2}>
                  {memo.content}
                </Text>
                <View style={styles.memoFooter}>
                  <Text style={styles.memoDate}>{memo.date}</Text>
                  <Text style={styles.memoAuthor}>By {memo.author}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.footerText}>
            Showing {filteredMemos.length} of {mockMemos.length} memos
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>FORM ATHLETICS/ADMINISTRATOR WORKSPACE</Text>
            <Text style={styles.footerPhone}>123</Text>
          </View>
        </ScrollView>
      </View>

      {/* Create Memo Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Memo</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Enter memo title"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Content</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={newContent}
                onChangeText={setNewContent}
                placeholder="Enter memo content"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityOptions}>
                <TouchableOpacity
                  style={[
                    styles.priorityOption,
                    newPriority === 'High' && styles.priorityOptionSelected,
                    { borderColor: newPriority === 'High' ? '#EF4444' : '#E5E7EB' },
                  ]}
                  onPress={() => setNewPriority('High')}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      newPriority === 'High' && { color: '#EF4444' },
                    ]}
                  >
                    High
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.priorityOption,
                    newPriority === 'Medium' && styles.priorityOptionSelected,
                    { borderColor: newPriority === 'Medium' ? '#F59E0B' : '#E5E7EB' },
                  ]}
                  onPress={() => setNewPriority('Medium')}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      newPriority === 'Medium' && { color: '#F59E0B' },
                    ]}
                  >
                    Medium
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.priorityOption,
                    newPriority === 'Low' && styles.priorityOptionSelected,
                    { borderColor: newPriority === 'Low' ? '#10B981' : '#E5E7EB' },
                  ]}
                  onPress={() => setNewPriority('Low')}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      newPriority === 'Low' && { color: '#10B981' },
                    ]}
                  >
                    Low
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleCreateMemo}
              >
                <Text style={styles.modalSaveButtonText}>Create Memo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Memo Modal */}
      <Modal
        visible={viewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMemo && (
              <>
                <View style={styles.viewMemoHeader}>
                  <View style={styles.viewMemoTitleContainer}>
                    <View
                      style={[
                        styles.priorityDotLarge,
                        { backgroundColor: getPriorityColor(selectedMemo.priority) },
                      ]}
                    />
                    <Text style={styles.viewMemoTitle}>{selectedMemo.title}</Text>
                  </View>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityBgColor(selectedMemo.priority) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: getPriorityColor(selectedMemo.priority) },
                      ]}
                    >
                      {selectedMemo.priority}
                    </Text>
                  </View>
                </View>

                <Text style={styles.viewMemoContent}>{selectedMemo.content}</Text>

                <View style={styles.viewMemoFooter}>
                  <Text style={styles.viewMemoDate}>{selectedMemo.date}</Text>
                  <Text style={styles.viewMemoAuthor}>By {selectedMemo.author}</Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalDeleteButton}
                    onPress={handleDeleteMemo}
                  >
                    <Text style={styles.modalDeleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setViewModalVisible(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: width > 768 ? 250 : 80,
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sidebarHeader: {
    marginBottom: 20,
  },
  gymName: {
    fontSize: width > 768 ? 16 : 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  gymSubtitle: {
    fontSize: width > 768 ? 12 : 10,
    color: '#6B7280',
    marginTop: 2,
  },
  sidebarDate: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateText: {
    fontSize: width > 768 ? 11 : 10,
    color: '#6B7280',
  },
  timeText: {
    fontSize: width > 768 ? 10 : 9,
    color: '#9CA3AF',
    marginTop: 2,
  },
  sidebarNav: {
    gap: 8,
  },
  navItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#E5E7EB',
  },
  navItemText: {
    fontSize: width > 768 ? 14 : 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  navItemTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  createButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#111827',
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterContainer: {
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterTabActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterTabText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  memoList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  memoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  memoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  memoContent: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  memoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memoDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  memoAuthor: {
    fontSize: 11,
    color: '#6B7280',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerBrand: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerPhone: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: width > 600 ? 500 : '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalInput: {
    height: 44,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  priorityOptionSelected: {
    borderWidth: 2,
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDeleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewMemoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewMemoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  viewMemoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  viewMemoContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 20,
  },
  viewMemoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewMemoDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  viewMemoAuthor: {
    fontSize: 12,
    color: '#6B7280',
  },
});
