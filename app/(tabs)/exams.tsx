import { useState } from 'react';
import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, MoveVertical as MoreVertical } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import SchoolSelector from '@/components/exams/SchoolSelector';
import { StatusBar } from 'expo-status-bar';

const LEVELS = [
  { id: 'b1', name: 'B1' },
  { id: 'b2', name: 'B2' },
  { id: 'b3', name: 'B3' },
  { id: 'm1', name: 'M1' },
  { id: 'm2', name: 'M2' },
];

const EXAMS = [
  {
    id: '1',
    title: 'Database Systems Final',
    subject: 'Database Systems',
    year: '2024',
    level: 'b3',
    school: 'cs',
    isNew: true,
  },
  {
    id: '2',
    title: 'Network Security Midterm',
    subject: 'Network Security',
    year: '2024',
    level: 'm1',
    school: 'cs',
    isNew: true,
  },
  {
    id: '3',
    title: 'Advanced Algorithms',
    subject: 'Algorithms',
    year: '2023',
    level: 'b3',
    school: 'cs',
    isNew: false,
  },
  {
    id: '4',
    title: 'Machine Learning Final',
    subject: 'Machine Learning',
    year: '2023',
    level: 'm1',
    school: 'cs',
    isNew: false,
  },
];

export default function ExamsScreen() {
  const [selectedSchool, setSelectedSchool] = useState('cs');
  const [selectedLevel, setSelectedLevel] = useState('b3');
  
  const filteredExams = EXAMS.filter(
    exam => exam.school === selectedSchool && exam.level === selectedLevel
  );
  
  const renderLevelItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.levelTab,
        selectedLevel === item.id && styles.selectedLevelTab
      ]}
      onPress={() => setSelectedLevel(item.id)}
    >
      <Text
        style={[
          styles.levelText,
          selectedLevel === item.id && styles.selectedLevelText
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
  const renderExamItem = ({ item }) => (
    <TouchableOpacity style={styles.examCard}>
      <View style={styles.examHeader}>
        <Text style={styles.examTitle}>{item.title}</Text>
        <TouchableOpacity>
          <MoreVertical size={20} color={Colors.light.darkGray} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.examDetails}>
        <View style={styles.examDetailItem}>
          <Text style={styles.examDetailLabel}>Subject:</Text>
          <Text style={styles.examDetailValue}>{item.subject}</Text>
        </View>
        <View style={styles.examDetailItem}>
          <Text style={styles.examDetailLabel}>Year:</Text>
          <Text style={styles.examDetailValue}>{item.year}</Text>
        </View>
      </View>
      
      <View style={styles.examActions}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>OPEN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>GET AI HELP</Text>
        </TouchableOpacity>
      </View>
      
      {item.isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      
      {/* School selector */}
      <SchoolSelector
        selectedSchool={selectedSchool}
        onSelectSchool={setSelectedSchool}
      />
      
      {/* Level tabs */}
      <View style={styles.levelTabsContainer}>
        <FlatList
          data={LEVELS}
          renderItem={renderLevelItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelTabs}
        />
      </View>
      
      {/* Search and filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.light.darkGray} />
          <Text style={styles.searchPlaceholder}>Search exams</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={Colors.light.gold} />
        </TouchableOpacity>
      </View>
      
      {/* Exams list */}
      <FlatList
        data={filteredExams}
        renderItem={renderExamItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.examsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No exams found for this selection</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.white,
  },
  levelTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  levelTabs: {
    paddingHorizontal: 16,
  },
  levelTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  selectedLevelTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.gold,
  },
  levelText: {
    fontSize: 16,
    color: Colors.light.textLight,
  },
  selectedLevelText: {
    color: Colors.light.gold,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: Colors.light.darkGray,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.lightGray,
  },
  examsList: {
    padding: 16,
  },
  examCard: {
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textDark,
    flex: 1,
  },
  examDetails: {
    marginBottom: 16,
  },
  examDetailItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  examDetailLabel: {
    fontSize: 14,
    color: Colors.light.textLight,
    width: 70,
  },
  examDetailValue: {
    fontSize: 14,
    color: Colors.light.textDark,
    fontWeight: '500',
  },
  examActions: {
    flexDirection: 'row',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.light.gold,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  primaryButtonText: {
    color: Colors.light.white,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.light.white,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.gold,
  },
  secondaryButtonText: {
    color: Colors.light.gold,
    fontWeight: '600',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 48,
    backgroundColor: Colors.light.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: Colors.light.white,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.textLight,
  },
});