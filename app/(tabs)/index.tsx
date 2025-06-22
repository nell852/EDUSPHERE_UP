"use client"

import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from 'expo-linear-gradient';

import { MessageCircle, X, Send, Search, BookOpen, BarChart3, History } from "lucide-react-native"
import { useState, useEffect } from "react"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { supabase } from "@/lib/supabase"

const { width, height } = Dimensions.get("window")
const isSmallScreen = width < 375

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [userName, setUserName] = useState("Utilisateur")
  const [chatVisible, setChatVisible] = useState(false)
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([])
  const [inputText, setInputText] = useState("")
  const [books, setBooks] = useState<any[]>([])
  const [filteredBooks, setFilteredBooks] = useState<any[]>([])
  const [readingHistory, setReadingHistory] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        if (error) {
          console.error("Erreur lors de la récupération de l'utilisateur:", error.message)
          return
        }
        if (user) {
          const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur"
          setUserName(name)
        }
      } catch (error) {
        console.error("Erreur inattendue:", error)
      }
    }

    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase.from("livres").select("*").order("created_at", { ascending: false })
        if (error) {
          console.error("Erreur récupération livres:", error.message)
          return
        }
        setBooks(data || [])
        setFilteredBooks(data || [])
      } catch (error) {
        console.error("Erreur inattendue:", error)
      }
    }

    // Mock reading history - remplacez par de vraies données depuis Supabase
    const mockHistory = [
      {
        id: "1",
        titre: "Introduction à React",
        auteur: "John Doe",
        couverture_url: "/placeholder.svg?height=60&width=40",
        opened_at: "2024-01-15T10:30:00Z",
        domaine: "programmation",
      },
      {
        id: "2",
        titre: "Machine Learning Basics",
        auteur: "Alice Johnson",
        couverture_url: "/placeholder.svg?height=60&width=40",
        opened_at: "2024-01-14T15:20:00Z",
        domaine: "ia",
      },
      {
        id: "3",
        titre: "Design Patterns",
        auteur: "Jane Smith",
        couverture_url: "/placeholder.svg?height=60&width=40",
        opened_at: "2024-01-13T09:15:00Z",
        domaine: "informatique",
      },
    ]
    setReadingHistory(mockHistory)

    fetchUser()
    fetchBooks()
  }, [])

  // Filtrer les livres selon la recherche
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBooks(books)
    } else {
      const filtered = books.filter(
        (book) =>
          book.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.auteur?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.domaine?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredBooks(filtered)
    }
  }, [searchQuery, books])

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const userMessage = { text: inputText, isUser: true }
    setMessages((prev) => [...prev, userMessage])

    let botResponse = "Désolé, je ne comprends pas votre demande. Essayez 'résumé de [titre]' ou 'infos sur [titre]'."
    const queryLower = inputText.toLowerCase()

    const book = books.find((b) => queryLower.includes(b.titre.toLowerCase()))
    if (book) {
      if (queryLower.includes("résumé") || queryLower.includes("summary")) {
        botResponse = `Résumé de "${book.titre}": Ce livre traite de ${book.domaine}. Il est écrit par ${book.auteur} et est populaire avec ${book.popularite} vues.`
      } else if (queryLower.includes("infos") || queryLower.includes("information")) {
        botResponse = `Infos sur "${book.titre}": Auteur: ${book.auteur}, Domaine: ${book.domaine}, Popularité: ${book.popularite}.`
      }
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, { text: botResponse, isUser: false }])
    }, 500)

    setInputText("")
  }

  // Créer des catégories avec le premier livre de chaque domaine pour la couverture
  const getCategoriesWithCovers = () => {
    const categoryMap = new Map()
    books.forEach((book) => {
      if (book.domaine && !categoryMap.has(book.domaine)) {
        categoryMap.set(book.domaine, book)
      }
    })
    return Array.from(categoryMap.values())
  }

  // Calculer les statistiques dynamiques
  const getBookStats = () => {
    const totalBooks = books.length
    const categoryStats = books.reduce(
      (acc, book) => {
        if (book.domaine) {
          acc[book.domaine] = (acc[book.domaine] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    return { totalBooks, categoryStats }
  }

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.categoryItem} activeOpacity={0.8} onPress={() => router.push("/library")}>
      <LinearGradient colors={["#FFD700", "#FFA500", "#FF8C00"]} style={styles.categoryGradient}>
        <View style={styles.categoryImageContainer}>
          <Image
            source={{ uri: item.couverture_url || "https://via.placeholder.com/60x60" }}
            style={styles.categoryImage}
          />
        </View>
      </LinearGradient>
      <Text style={styles.categoryText} numberOfLines={1}>
        {item.domaine || "Général"}
      </Text>
    </TouchableOpacity>
  )

  const renderRecentBook = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.recentBookCard} activeOpacity={0.8} onPress={() => router.push("/library")}>
      <Image
        source={{ uri: item.couverture_url || "https://via.placeholder.com/60x80" }}
        style={styles.recentBookImage}
      />
      <View style={styles.recentBookInfo}>
        <Text style={styles.recentBookTitle} numberOfLines={2}>
          {item.titre || "Sans titre"}
        </Text>
        <Text style={styles.recentBookAuthor} numberOfLines={1}>
          {item.auteur || "Auteur inconnu"}
        </Text>
        <Text style={styles.recentBookCategory}>{item.domaine || "Non spécifié"}</Text>
      </View>
      <View style={styles.recentBookBadge}>
        <Text style={styles.recentBookBadgeText}>NOUVEAU</Text>
      </View>
    </TouchableOpacity>
  )

  const renderHistoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.historyCard} activeOpacity={0.8} onPress={() => router.push("/library")}>
      <Image
        source={{ uri: item.couverture_url || "https://via.placeholder.com/50x70" }}
        style={styles.historyBookImage}
      />
      <View style={styles.historyBookInfo}>
        <Text style={styles.historyBookTitle} numberOfLines={2}>
          {item.titre || "Sans titre"}
        </Text>
        <Text style={styles.historyBookAuthor} numberOfLines={1}>
          {item.auteur || "Auteur inconnu"}
        </Text>
        <Text style={styles.historyBookTime}>Ouvert le {new Date(item.opened_at).toLocaleDateString("fr-FR")}</Text>
      </View>
      <View style={styles.historyIcon}>
        <History size={16} color="#FFD700" />
      </View>
    </TouchableOpacity>
  )

  const categoriesWithCovers = getCategoriesWithCovers()
  const { totalBooks, categoryStats } = getBookStats()
  const recentBooks = books.slice(0, 3) // 3 derniers livres ajoutés

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {/* LIGNE À MODIFIER POUR VOTRE LOGO : Remplacez le source par votre logo */}
          <Image
            source={require('../../assets/images/edusphere-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setChatVisible(true)}>
            <MessageCircle size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={16} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des livres..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome */}
        <LinearGradient colors={["#FFF8DC", "#FFFACD", "#FFFFFF"]} style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Salut {userName} ! 👋</Text>
          <Text style={styles.welcomeSubtitle}>Prêt à explorer de nouveaux horizons ?</Text>
        </LinearGradient>

        {/* Categories (avec couvertures de livres) */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Explorez par domaine</Text>
          <FlatList
            data={categoriesWithCovers.slice(0, 8)}
            renderItem={renderCategoryItem}
            keyExtractor={(item, index) => String(index)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Stats Section (dynamiques) */}
        <View style={styles.statsSection}>
          <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statColumn}>
                <BookOpen size={24} color="#FFF" />
                <Text style={styles.statNumber}>{totalBooks}</Text>
                <Text style={styles.statLabel}>Livres</Text>
              </View>
              <View style={styles.statColumn}>
                <BarChart3 size={24} color="#FFF" />
                <Text style={styles.statNumber}>{Object.keys(categoryStats).length}</Text>
                <Text style={styles.statLabel}>Catégories</Text>
              </View>
            </View>
            {/* Détail des catégories */}
            <View style={styles.categoryStatsContainer}>
              <Text style={styles.categoryStatsTitle}>Répartition par domaine :</Text>
              <View style={styles.categoryStatsList}>
                {Object.entries(categoryStats)
                  .slice(0, 4)
                  .map(([category, count]) => (
                    <Text key={category} style={styles.categoryStatItem}>
                      {String(category)}: {String(count)}
                    </Text>
                  ))}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Recent Books (3 seulement) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🆕 Nouveautés</Text>
            <TouchableOpacity onPress={() => router.push("/library")}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {recentBooks.map((book, index) => (
            <View key={String(index)}>{renderRecentBook({ item: book })}</View>
          ))}
        </View>

        {/* Reading History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 Historique de lecture</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {readingHistory.slice(0, 3).map((item, index) => (
            <View key={String(index)}>{renderHistoryItem({ item })}</View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Recommandé pour vous</Text>
          <View style={styles.recommendationCard}>
            <LinearGradient colors={["#FFF8DC", "#FFFACD"]} style={styles.recommendationGradient}>
              <Text style={styles.recommendationTitle}>Continuez votre apprentissage</Text>
              <Text style={styles.recommendationText}>
                Basé sur vos lectures récentes, nous vous recommandons d'explorer les domaines de programmation et
                d'intelligence artificielle.
              </Text>
              <TouchableOpacity style={styles.recommendationButton} onPress={() => router.push("/library")}>
                <Text style={styles.recommendationButtonText}>Explorer maintenant</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* Search Results (si recherche active) */}
        {searchQuery.trim() !== "" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 Résultats de recherche ({filteredBooks.length})</Text>
            {filteredBooks.slice(0, 5).map((book, index) => (
              <TouchableOpacity
                key={String(index)}
                style={styles.searchResultCard}
                activeOpacity={0.8}
                onPress={() => router.push("/library")}
              >
                <Image
                  source={{ uri: book.couverture_url || "https://via.placeholder.com/50x70" }}
                  style={styles.searchResultImage}
                />
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultTitle} numberOfLines={2}>
                    {book.titre || "Sans titre"}
                  </Text>
                  <Text style={styles.searchResultAuthor} numberOfLines={1}>
                    {book.auteur || "Auteur inconnu"}
                  </Text>
                  <Text style={styles.searchResultCategory}>{book.domaine || "Non spécifié"}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Chat Modal */}
      {chatVisible && (
        <View style={styles.chatModal}>
          <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.chatHeaderGradient}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Assistant Edusphere</Text>
              <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.closeButton}>
                <X color="#FFF" size={24} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
            {messages.length === 0 && (
              <View style={styles.chatWelcome}>
                <Text style={styles.chatWelcomeText}>
                  👋 Salut ! Je suis votre assistant Edusphere. Demandez-moi des infos sur vos livres préférés !
                </Text>
              </View>
            )}
            {messages.map((msg, index) => (
              <View
                key={String(index)}
                style={[styles.messageBubble, msg.isUser ? styles.userBubble : styles.botBubble]}
              >
                <Text style={[styles.messageText, msg.isUser ? styles.userMessageText : styles.botMessageText]}>
                  {msg.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Tapez votre message..."
              placeholderTextColor="#999"
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <LinearGradient
                colors={inputText.trim() ? ["#FFD700", "#FFA500"] : ["#DDD", "#CCC"]}
                style={styles.sendButtonGradient}
              >
                <Send color="#FFF" size={16} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    height: 80,
    width: 120,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  categoriesSection: {
    paddingVertical: 20,
    backgroundColor: "#FFF",
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 16,
    width: 70,
  },
  categoryGradient: {
    padding: 3,
    borderRadius: 35,
    marginBottom: 8,
  },
  categoryImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF",
    padding: 2,
    overflow: "hidden",
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F5F5F5",
  },
  categoryText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statColumn: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#FFF",
    opacity: 0.9,
    marginTop: 4,
  },
  categoryStatsContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
    paddingTop: 16,
  },
  categoryStatsTitle: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
    marginBottom: 8,
  },
  categoryStatsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryStatItem: {
    fontSize: 12,
    color: "#FFF",
    opacity: 0.9,
    marginRight: 16,
    marginBottom: 4,
  },
  section: {
    paddingVertical: 16,
    backgroundColor: "#FFF",
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: "#FFD700",
    fontWeight: "500",
  },
  recentBookCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentBookImage: {
    width: 50,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginRight: 16,
  },
  recentBookInfo: {
    flex: 1,
  },
  recentBookTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    lineHeight: 20,
  },
  recentBookAuthor: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  recentBookCategory: {
    fontSize: 13,
    color: "#FFD700",
    fontWeight: "500",
  },
  recentBookBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentBookBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#FFD700",
  },
  historyBookImage: {
    width: 45,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
    marginRight: 16,
  },
  historyBookInfo: {
    flex: 1,
  },
  historyBookTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    lineHeight: 18,
  },
  historyBookAuthor: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  historyBookTime: {
    fontSize: 12,
    color: "#999",
  },
  historyIcon: {
    padding: 8,
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  searchResultImage: {
    width: 45,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
    marginRight: 16,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    lineHeight: 18,
  },
  searchResultAuthor: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 12,
    color: "#FFD700",
    fontWeight: "500",
  },
  recommendationCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recommendationGradient: {
    padding: 20,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  recommendationButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: "flex-start",
  },
  recommendationButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  bottomPadding: {
    height: 20,
  },
  chatModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: height * 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  chatHeaderGradient: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
  },
  closeButton: {
    padding: 4,
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  chatWelcome: {
    backgroundColor: "#FFF8DC",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  chatWelcomeText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    lineHeight: 20,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginVertical: 4,
    maxWidth: "80%",
  },
  userBubble: {
    backgroundColor: "#FFD700",
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  botBubble: {
    backgroundColor: "#F5F5F5",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  userMessageText: {
    color: "#FFF",
  },
  botMessageText: {
    color: "#333",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 80,
    color: "#333",
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  sendButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})
