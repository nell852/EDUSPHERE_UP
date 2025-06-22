import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Share2, HelpCircle, FileText } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import SchoolSelector from '@/components/exams/SchoolSelector';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { useNavigation } from 'expo-router';
import * as Sharing from 'expo-sharing';

interface Exam {
  id: string;
  ecole: string;
  niveau: string;
  matiere: string;
  title: string;
  annee: string;
  difficulte: string;
  contenu_url: string;
  created_at: string;
}

interface Level {
  id: string;
  name: string;
}

const ALL_LEVELS: Level[] = [
  { id: 'b1', name: 'B1' },
  { id: 'b2', name: 'B2' },
  { id: 'b3', name: 'B3' },
  { id: 'm1', name: 'M1' },
  { id: 'm2', name: 'M2' },
];

export default function ExamsScreen() {
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation();

  useEffect(() => {
    async function fetchExamsAndSchools() {
      setLoading(true);
      try {
        const { data: examsData, error: examsError } = await supabase
          .from('examens')
          .select('*')
          .order('created_at', { ascending: false });

        if (examsError) throw examsError;
        setExams(examsData || []);

        const { data: schoolsData, error: schoolsError } = await supabase
          .from('examens')
          .select('ecole');
        
        if (schoolsError) throw schoolsError;
        const uniqueSchools = Array.from(new Set(schoolsData?.map(item => item.ecole) || []));
        setSchools(uniqueSchools);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchExamsAndSchools();
  }, []);

  useEffect(() => {
    setSelectedLevel('');
  }, [selectedSchool]);

  const getAvailableLevels = (): Level[] => {
    if (!selectedSchool) return ALL_LEVELS;
    
    const normalizeLevel = (level: string) => level.trim().toLowerCase();
    
    const levelsInSchool = exams
      .filter(exam => exam.ecole === selectedSchool)
      .map(exam => normalizeLevel(exam.niveau))
      .filter((value, index, self) => self.indexOf(value) === index);

    return ALL_LEVELS.filter(level => 
      levelsInSchool.includes(normalizeLevel(level.id)) ||
      levelsInSchool.includes(normalizeLevel(level.name))
    );
  };

  const handleOpenExam = (exam: Exam) => {
    navigation.navigate({
      name: 'ExamViewerScreen',
      params: { pdfUrl: exam.contenu_url, title: exam.matiere },
    } as never);
  };

  const handleShareExam = async (exam: Exam) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exam.contenu_url, {
          dialogTitle: `Share ${exam.matiere} - ${exam.ecole}`,
        });
      } else {
        alert('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing exam:', error);
      alert('Failed to share exam');
    }
  };

  const handleAIHelp = (exam: Exam) => {
    // Placeholder for AI help functionality
    // This would need to integrate with an external AI service
    alert('AI Help feature coming soon!');
    // TODO: Implement API call to external AI service with exam.contenu_url
  };

  const filteredExams = exams.filter(
    exam =>
      (selectedSchool === '' || exam.ecole === selectedSchool) &&
      (selectedLevel === '' || exam.niveau.toLowerCase() === selectedLevel.toLowerCase()) &&
      (exam.matiere.toLowerCase().includes(searchQuery.toLowerCase()) ||
       exam.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderLevelItem = ({ item }: { item: Level }) => (
    <TouchableOpacity
      style={[
        styles.levelTab,
        selectedLevel === item.id && styles.selectedLevelTab,
      ]}
      onPress={() => setSelectedLevel(item.id)}
    >
      <Text
        style={[
          styles.levelText,
          selectedLevel === item.id && styles.selectedLevelText,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderExamItem = ({ item }: { item: Exam }) => (
    <View style={styles.examCard}>
      <TouchableOpacity 
        style={styles.examContent}
        onPress={() => handleOpenExam(item)}
      >
        <View style={styles.examHeader}>
          <Text style={styles.examTitle}>{item.matiere}</Text>
          <Text style={styles.examSchool}>{item.ecole} - {item.niveau}</Text>
        </View>
        <View style={styles.examDetails}>
          <View style={styles.examDetailItem}>
            <Text style={styles.examDetailLabel}>Year:</Text>
            <Text style={styles.examDetailValue}>{item.annee}</Text>
          </View>
          <View style={styles.examDetailItem}>
            <Text style={styles.examDetailLabel}>Difficulty:</Text>
            <Text style={styles.examDetailValue}>{item.difficulte}</Text>
          </View>
        </View>
        {item.created_at && new Date(item.created_at).getTime() > (Date.now() - 7 * 24 * 60 * 60 * 1000) && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleOpenExam(item)}
        >
          <FileText size={20} color={Colors.light.tint} />
          <Text style={styles.actionButtonText}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleShareExam(item)}
        >
          <Share2 size={20} color={Colors.light.tint} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleAIHelp(item)}
        >
          <HelpCircle size={20} color={Colors.light.tint} />
          <Text style={styles.actionButtonText}>AI Help</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exams</Text>
        <TouchableOpacity onPress={() => navigation.navigate({ name: 'upload-exam' } as never)}>
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>
      
      <SchoolSelector 
        selectedSchool={selectedSchool} 
        onSelectSchool={setSelectedSchool} 
        schools={schools} 
      />
      
      <View style={styles.levelTabsContainer}>
        <FlatList
          data={getAvailableLevels()}
          renderItem={renderLevelItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelTabs}
        />
        {selectedSchool && getAvailableLevels().length === 0 && (
          <Text style={styles.noLevelsText}>Loading levels...</Text>
        )}
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.light.darkGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exams..."
            placeholderTextColor={Colors.light.darkGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading exams...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExams}
          renderItem={renderExamItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.examsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No exams found</Text>
              <Text style={styles.emptyStateSubText}>Try changing your filters</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.textDark,
  },
  uploadButtonText: {
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: '500',
  },
  levelTabsContainer: {
    backgroundColor: Colors.light.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  levelTabs: {
    paddingHorizontal: 16,
  },
  levelTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: Colors.light.lightGray,
  },
  selectedLevelTab: {
    backgroundColor: Colors.light.tint,
  },
  levelText: {
    fontSize: 14,
    color: Colors.light.textDark,
  },
  selectedLevelText: {
    color: Colors.light.white,
    fontWeight: '600',
  },
  noLevelsText: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: Colors.light.textLight,
    fontStyle: 'italic',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.light.white,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.textDark,
  },
  examsList: {
    padding: 16,
  },
  examCard: {
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.light.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  examContent: {
    padding: 16,
  },
  examHeader: {
    marginBottom: 12,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textDark,
  },
  examSchool: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginTop: 4,
  },
  examDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  examDetailItem: {
    flexDirection: 'row',
    marginRight: 16,
    marginBottom: 8,
  },
  examDetailLabel: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginRight: 4,
  },
  examDetailValue: {
    fontSize: 14,
    color: Colors.light.textDark,
    fontWeight: '500',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: Colors.light.white,
    fontSize: 10,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.light.lightGray,
    padding: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.textDark,
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textLight,
  },
});