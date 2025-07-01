"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Search, Share2, HelpCircle, FileText, Upload, BookOpen } from "lucide-react-native"
import SchoolSelector from "@/components/exams/SchoolSelector"
import { StatusBar } from "expo-status-bar"
import { supabase } from "@/lib/supabase"
import { useNavigation } from "expo-router"
import * as Sharing from "expo-sharing"

interface Exam {
  id: string
  ecole: string
  niveau: string
  matiere: string
  title: string
  annee: string
  difficulte: string
  contenu_url: string
  created_at: string
}

interface Level {
  id: string
  name: string
}

const ALL_LEVELS: Level[] = [
  { id: "b1", name: "B1" },
  { id: "b2", name: "B2" },
  { id: "b3", name: "B3" },
  { id: "m1", name: "M1" },
  { id: "m2", name: "M2" },
]

export default function ExamsScreen() {
  const [selectedSchool, setSelectedSchool] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [exams, setExams] = useState<Exam[]>([])
  const [schools, setSchools] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)

  const navigation = useNavigation()

  useEffect(() => {
    async function fetchExamsAndSchools() {
      setLoading(true)
      try {
        const { data: examsData, error: examsError } = await supabase
          .from("examens")
          .select("*")
          .order("created_at", { ascending: false })

        if (examsError) throw examsError

        setExams(examsData || [])

        const { data: schoolsData, error: schoolsError } = await supabase.from("examens").select("ecole")

        if (schoolsError) throw schoolsError

        const uniqueSchools = Array.from(new Set(schoolsData?.map((item) => item.ecole) || []))
        setSchools(uniqueSchools)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExamsAndSchools()
  }, [])

  useEffect(() => {
    setSelectedLevel("")
  }, [selectedSchool])

  const getAvailableLevels = (): Level[] => {
    if (!selectedSchool) return ALL_LEVELS

    const normalizeLevel = (level: string) => level.trim().toLowerCase()

    const levelsInSchool = exams
      .filter((exam) => exam.ecole === selectedSchool)
      .map((exam) => normalizeLevel(exam.niveau))
      .filter((value, index, self) => self.indexOf(value) === index)

    return ALL_LEVELS.filter(
      (level) =>
        levelsInSchool.includes(normalizeLevel(level.id)) || levelsInSchool.includes(normalizeLevel(level.name)),
    )
  }

  const handleOpenExam = (exam: Exam) => {
    navigation.navigate({
      name: "ExamViewerScreen",
      params: { pdfUrl: exam.contenu_url, title: exam.matiere },
    } as never)
  }

  const handleShareExam = async (exam: Exam) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exam.contenu_url, {
          dialogTitle: `Share ${exam.matiere} - ${exam.ecole}`,
        })
      } else {
        alert("Sharing is not available on this device")
      }
    } catch (error) {
      console.error("Error sharing exam:", error)
      alert("Failed to share exam")
    }
  }

  const handleAIHelp = (exam: Exam) => {
    // Placeholder for AI help functionality
    // This would need to integrate with an external AI service
    alert("AI Help feature coming soon!")
    // TODO: Implement API call to external AI service with exam.contenu_url
  }

  const filteredExams = exams.filter(
    (exam) =>
      (selectedSchool === "" || exam.ecole === selectedSchool) &&
      (selectedLevel === "" || exam.niveau.toLowerCase() === selectedLevel.toLowerCase()) &&
      (exam.matiere.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.title.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const renderLevelItem = ({ item }: { item: Level }) => (
    <TouchableOpacity style={styles.levelTab} onPress={() => setSelectedLevel(item.id)} activeOpacity={0.8}>
      <LinearGradient
        colors={selectedLevel === item.id ? ["#3B82F6", "#60A5FA"] : ["#F8F9FA", "#FFFFFF"]}
        style={styles.levelTabGradient}
      >
        <Text style={[styles.levelText, selectedLevel === item.id && styles.selectedLevelText]}>{item.name}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )

  const renderExamItem = ({ item }: { item: Exam }) => (
    <TouchableOpacity style={styles.examCard} activeOpacity={0.8} onPress={() => handleOpenExam(item)}>
      <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.examCardGradient}>
        <View style={styles.examContent}>
          <View style={styles.examHeader}>
            <View style={styles.examTitleContainer}>
              <BookOpen size={16} color="#3B82F6" />
              <Text style={styles.examTitle}>{item.matiere}</Text>
            </View>
            <Text style={styles.examSchool}>
              {item.ecole} - {item.niveau}
            </Text>
          </View>

          <View style={styles.examDetails}>
            <View style={styles.examDetailItem}>
              <Text style={styles.examDetailLabel}>📅 Année:</Text>
              <Text style={styles.examDetailValue}>{item.annee}</Text>
            </View>
            <View style={styles.examDetailItem}>
              <Text style={styles.examDetailLabel}> Difficulté:</Text>
              <Text style={styles.examDetailValue}>{item.difficulte}</Text>
            </View>
          </View>

          {item.created_at && new Date(item.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
            <LinearGradient colors={["#10B981", "#34D399"]} style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </LinearGradient>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenExam(item)} activeOpacity={0.8}>
            <LinearGradient colors={["#3B82F6", "#60A5FA"]} style={styles.actionButtonGradient}>
              <FileText size={14} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Ouvrir</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconActionButton} onPress={() => handleShareExam(item)} activeOpacity={0.8}>
            <Share2 size={14} color="#3B82F6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconActionButton} onPress={() => handleAIHelp(item)} activeOpacity={0.8}>
            <LinearGradient colors={["#8B5CF6", "#A78BFA"]} style={styles.aiButtonGradient}>
              <HelpCircle size={14} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="auto" />

      {/* Header */}
      <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.header}>
        <Text style={styles.headerTitle}>Examens</Text>
       
      </LinearGradient>

      <SchoolSelector selectedSchool={selectedSchool} onSelectSchool={setSelectedSchool} schools={schools} />

      {/* Level Tabs */}
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
          <Text style={styles.noLevelsText}>Chargement des niveaux...</Text>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <LinearGradient colors={["#F8F9FA", "#FFFFFF"]} style={styles.searchInputContainer}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des examens..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </LinearGradient>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.loadingCard}>
            <BookOpen size={24} color="#3B82F6" />
            <Text style={styles.loadingText}>Chargement des examens...</Text>
          </LinearGradient>
        </View>
      ) : (
        <FlatList
          data={filteredExams}
          renderItem={renderExamItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.examsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <LinearGradient colors={["#FEF3C7", "#FDE68A"]} style={styles.emptyStateCard}>
                <Text style={styles.emptyStateText}>Aucun examen trouvé</Text>
                <Text style={styles.emptyStateSubText}>Essayez de modifier vos filtres</Text>
              </LinearGradient>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  levelTabsContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  levelTabs: {
    paddingHorizontal: 16,
  },
  levelTab: {
    marginRight: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  levelTabGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  levelText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  selectedLevelText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  noLevelsText: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: "#9CA3AF",
    fontStyle: "italic",
    fontSize: 12,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1F2937",
  },
  examsList: {
    padding: 16,
  },
  examCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  examCardGradient: {
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 16,
  },
  examContent: {
    padding: 12,
  },
  examHeader: {
    marginBottom: 8,
  },
  examTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  examTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  examSchool: {
    fontSize: 11,
    color: "#6B7280",
  },
  examDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  examDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  examDetailLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  examDetailValue: {
    fontSize: 11,
    color: "#1F2937",
    fontWeight: "500",
  },
  newBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "700",
  },
  actionButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    padding: 8,
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  iconActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  aiButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyStateCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 4,
    fontWeight: "600",
  },
  emptyStateSubText: {
    fontSize: 12,
    color: "#6B7280",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
})
