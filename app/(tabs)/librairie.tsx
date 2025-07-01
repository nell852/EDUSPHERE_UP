"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Share as RNShare,
  Modal,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { BookOpen, Search, Filter, Star, Share2, MessageSquare, Eye, Moon, Sun } from "lucide-react-native"
import { StatusBar } from "expo-status-bar"
import { supabase } from "@/lib/supabase"
import { useNavigation } from "expo-router"

// Types pour la navigation
type RootStackParamList = {
  "(tabs)/library": undefined
  PDFViewerScreen: { pdfUrl: string; title: string }
}

type NavigationProp = {
  navigate: <RouteName extends keyof RootStackParamList>(
    ...args: RouteName extends keyof RootStackParamList ? [RouteName, RootStackParamList[RouteName]] : [RouteName, any]
  ) => void
}

// Interface pour les catégories
interface Category {
  id: string
  name: string
}

// Interface pour les livres
interface Book {
  id: string
  title: string
  author: string
  coverUrl: string
  category: string
  isNew: boolean
  popularity: number
  documentUrl: string
  averageRating?: number
}

// Options de tri
type SortField = "popularity" | "date" | "rating"
type SortOrder = "ascending" | "descending"

interface SortOption {
  field: SortField
  order: SortOrder
}

const { width, height } = Dimensions.get("window")
const isSmallScreen = width < 375
const isMediumScreen = width >= 375 && width < 414

export default function LibraryScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([{ id: "all", name: "Tous les domaines" }])
  const [modalVisible, setModalVisible] = useState(false)
  const [currentBook, setCurrentBook] = useState<Book | null>(null)
  const [reviewText, setReviewText] = useState("")
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>({ field: "date", order: "descending" })
  const [minRating, setMinRating] = useState<number | null>(null)
  const [nightMode, setNightMode] = useState(false)

  const navigation = useNavigation<NavigationProp>()

  useEffect(() => {
    async function fetchBooks() {
      try {
        let query = supabase
          .from("livres")
          .select("id, titre, domaine, couverture_url, document_url, popularite, created_at, auteur")

        // Modifier la partie de tri pour éviter l'erreur avec average_rating
        query = query.order(
          sortOption.field === "popularity"
            ? "popularite"
            : sortOption.field === "rating"
              ? "created_at" // Utiliser created_at au lieu de average_rating si la table ratings n'existe pas
              : "created_at",
          { ascending: sortOption.order === "ascending" },
        )

        const { data, error } = await query

        if (error) {
          console.error("Erreur récupération livres:", error.message)
          return
        }

        console.log("Données brutes depuis Supabase:", data)

        // Tentative de récupération des ratings (optionnel si la table n'existe pas)
        let ratingsData: any[] = []
        try {
          const { data: ratingsResult, error: ratingsError } = await supabase
            .from("ratings")
            .select("book_id, rating")
            .in(
              "book_id",
              data.map((book) => book.id),
            )

          if (ratingsError) {
            // Si la table n'existe pas, on continue sans les ratings
            if (ratingsError.code === "42P01" || ratingsError.message.includes("does not exist")) {
              console.log("ℹ️ Table 'ratings' non trouvée - continuons sans les notes")
              ratingsData = []
            } else {
              console.error("Erreur récupération notes:", ratingsError.message)
              ratingsData = []
            }
          } else {
            ratingsData = ratingsResult || []
          }
        } catch (error) {
          console.log("ℹ️ Impossible de récupérer les ratings - continuons sans les notes")
          ratingsData = []
        }

        const ratingsMap = new Map<string, number[]>()
        ratingsData.forEach(({ book_id, rating }) => {
          if (!ratingsMap.has(book_id)) ratingsMap.set(book_id, [])
          ratingsMap.get(book_id)!.push(rating)
        })

        const booksWithRatings = data.map((book: any) => {
          const ratings = ratingsMap.get(book.id) || []
          const averageRating =
            ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : undefined

          // Normaliser la catégorie pour éviter les doublons
          const category = book.domaine ? book.domaine.toLowerCase().trim() : "all"

          return {
            id: book.id,
            title: book.titre || "Sans titre",
            author: book.auteur || "Auteur inconnu",
            coverUrl: book.couverture_url || "",
            category,
            isNew: new Date().getTime() - new Date(book.created_at).getTime() < 7 * 24 * 60 * 60 * 1000,
            popularity: book.popularite || 0,
            documentUrl: book.document_url || "",
            averageRating,
          }
        })

        // Créer une liste de catégories uniques
        const uniqueCategories = Array.from(new Set(booksWithRatings.map((book) => book.category)))
          .filter((category) => category !== "all")
          .map((category) => ({
            id: category,
            name: category.charAt(0).toUpperCase() + category.slice(1), // Capitalisation pour l'affichage
          }))

        console.log("Catégories générées:", uniqueCategories)

        setCategories([{ id: "all", name: "Tous les domaines" }, ...uniqueCategories])

        const filteredBooks = minRating
          ? booksWithRatings.filter((book) => book.averageRating && book.averageRating >= minRating)
          : booksWithRatings

        setBooks(filteredBooks)
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Erreur inattendue:", error.message)
        }
      }
    }

    fetchBooks()
  }, [sortOption, minRating])

  const filteredBooks = books.filter(
    (book) =>
      (selectedCategory === "all" || book.category.toLowerCase() === selectedCategory.toLowerCase()) &&
      (book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  console.log("Livres filtrés:", filteredBooks)

  const popularBooks = books.filter((book) => book.popularity > 1000).slice(0, 3)

  const openReviewModal = (book: Book) => {
    setCurrentBook(book)
    setReviewText("")
    setModalVisible(true)
  }

  const submitReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert("Validation", "Veuillez entrer un commentaire.")
      return
    }

    setModalVisible(false)
    try {
      const { error } = await supabase.from("reviews").insert([
        {
          book_id: currentBook?.id,
          book_title: currentBook?.title,
          review: reviewText.trim(),
          created_at: new Date().toISOString(),
        },
      ])

      if (error) {
        Alert.alert("Erreur", "Une erreur s'est produite lors de l'envoi de votre commentaire.")
      } else {
        Alert.alert("Merci !", "Votre commentaire a été soumis.")
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        Alert.alert("Erreur", "Erreur inattendue : " + err.message)
      }
    }
  }

  const handleShare = async (book: Book) => {
    try {
      const result = await RNShare.share({
        message: `Découvrez ce livre : "${book.title}" par ${book.author} !`,
      })

      if (result.action === RNShare.sharedAction) {
        const { error } = await supabase
          .from("shares")
          .insert([{ book_id: book.id, book_title: book.title, shared_at: new Date().toISOString() }])

        if (error) {
          console.log("Erreur enregistrement partage:", error.message)
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert("Erreur", "Une erreur s'est produite lors du partage.")
      }
    }
  }

  const openPDF = async (book: Book) => {
    let pdfUrl = book.documentUrl

    if (!pdfUrl) {
      Alert.alert("Erreur", "Aucun document disponible pour ce livre.")
      return
    }

    try {
      const response = await fetch(pdfUrl)
      if (!response.ok) {
        const fileName = pdfUrl.split("/").pop()
        if (!fileName) {
          throw new Error("Nom de fichier invalide")
        }

        const { data, error } = await supabase.storage
          .from("bookFilterModalVisible-documents")
          .createSignedUrl(fileName, 31536000)

        if (error) throw error

        pdfUrl = data.signedUrl
      }

      navigation.navigate("PDFViewerScreen", { pdfUrl, title: book.title })
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert("Erreur", `Impossible de charger le PDF: ${error.message}`)
      }
    }
  }

  const handleAIHelp = async (book: Book) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBOx6RTLImCCg4lGTVu0xF0oCqu-K-CJ0M"
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`

      console.log("Appel API à:", url)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Fournissez une aide contextuelle pour le livre "${book.title}" par ${book.author}. Proposez un résumé ou des questions pertinentes basées sur le titre et l'auteur.`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.7,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur API: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Aucune réponse disponible."

      Alert.alert("AI Help", aiResponse)
    } catch (error) {
      console.error("Erreur AI Help:", error)
      Alert.alert(
        "Erreur",
        "Impossible de contacter l'IA. Vérifiez la clé API ou la connexion. Détails : " +
          (error instanceof Error ? error.message : String(error)),
      )
    }
  }

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.selectedCategoryChip,
        nightMode && styles.categoryChipNight,
      ]}
      onPress={() => setSelectedCategory(item.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          selectedCategory === item.id
            ? ["#3B82F6", "#60A5FA"]
            : nightMode
              ? ["#2a2a2a", "#404040"]
              : ["#f8f9fa", "#ffffff"]
        }
        style={styles.categoryGradient}
      >
        <Text
          style={[
            styles.categoryText,
            selectedCategory === item.id && styles.selectedCategoryText,
            nightMode && styles.categoryTextNight,
          ]}
        >
          {item.name}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  )

  const renderPopularBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity style={[styles.popularBookCard, nightMode && styles.popularBookCardNight]} activeOpacity={0.8}>
      <LinearGradient colors={["#3B82F6", "#60A5FA", "#93C5FD"]} style={styles.popularBookCover}>
        <BookOpen size={16} color="#FFFFFF" />
      </LinearGradient>
      <Text style={[styles.popularBookTitle, nightMode && styles.popularBookTitleNight]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.popularBookViews, nightMode && styles.popularBookViewsNight]}>{item.popularity} vues</Text>
    </TouchableOpacity>
  )

  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity style={[styles.bookCard, nightMode && styles.bookCardNight]} activeOpacity={0.8}>
      <LinearGradient
        colors={nightMode ? ["#1e1e1e", "#2a2a2a"] : ["#ffffff", "#f8f9fa"]}
        style={styles.bookCardGradient}
      >
        <View style={styles.bookCoverContainer}>
          <Image source={{ uri: item.coverUrl }} style={styles.bookCover} />
          {item.isNew && (
            <LinearGradient colors={["#10B981", "#34D399"]} style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </LinearGradient>
          )}
        </View>

        <View style={styles.bookInfo}>
          <View style={styles.bookHeader}>
            <View style={styles.bookTitleContainer}>
              <Text style={[styles.bookTitle, nightMode && styles.bookTitleNight]} numberOfLines={2}>
                {item.title}
              </Text>
              {item.popularity > 1000 && (
                <LinearGradient colors={["#F59E0B", "#FBBF24"]} style={styles.popularBadge}>
                  <Text style={styles.badgeText}>HOT</Text>
                </LinearGradient>
              )}
            </View>

            <Text style={[styles.bookAuthor, nightMode && styles.bookAuthorNight]} numberOfLines={1}>
              {item.author}
            </Text>
            <Text style={[styles.bookCategory, nightMode && styles.bookCategoryNight]}>{item.category}</Text>

            <View style={styles.bookStats}>
              {item.averageRating && (
                <>
                  <Star size={10} color="#FFD700" fill="#FFD700" />
                  <Text style={[styles.bookStatText, nightMode && styles.bookStatTextNight]}>
                    {item.averageRating.toFixed(1)}
                  </Text>
                </>
              )}
              <Eye size={10} color={nightMode ? "#aaa" : "#999"} style={styles.statIcon} />
              <Text style={[styles.bookStatText, nightMode && styles.bookStatTextNight]}>{item.popularity}</Text>
            </View>
          </View>

          <View style={styles.bookActions}>
            <TouchableOpacity onPress={() => openPDF(item)} activeOpacity={0.8}>
              <LinearGradient colors={["#3B82F6", "#60A5FA"]} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>OUVRIR</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={[styles.iconButton, nightMode && styles.iconButtonNight]}
                onPress={() => openReviewModal(item)}
                activeOpacity={0.8}
              >
                <MessageSquare size={12} color={nightMode ? "#FFD700" : "#3B82F6"} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconButton, nightMode && styles.iconButtonNight]}
                onPress={() => handleShare(item)}
                activeOpacity={0.8}
              >
                <Share2 size={12} color={nightMode ? "#FFD700" : "#3B82F6"} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleAIHelp(item)} activeOpacity={0.8}>
                <LinearGradient colors={["#8B5CF6", "#A78BFA"]} style={styles.aiButton}>
                  <Text style={styles.aiButtonText}>AI</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.container, nightMode && styles.containerNight]} edges={["top"]}>
      <StatusBar style={nightMode ? "light" : "auto"} />

      {/* Header */}
      <LinearGradient colors={nightMode ? ["#1e1e1e", "#2a2a2a"] : ["#ffffff", "#f8f9fa"]} style={styles.header}>
        <Text style={[styles.headerTitle, nightMode && styles.headerTitleNight]}>📚 Bibliothèque</Text>
        <TouchableOpacity onPress={() => setNightMode(!nightMode)} style={styles.nightModeButton} activeOpacity={0.8}>
          <LinearGradient
            colors={nightMode ? ["#FFD700", "#FFA500"] : ["#1e1e1e", "#2a2a2a"]}
            style={styles.nightModeGradient}
          >
            {nightMode ? <Sun size={18} color="#121212" /> : <Moon size={18} color="#FFFFFF" />}
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Search Header */}
      <View style={[styles.searchHeader, nightMode && styles.searchHeaderNight]}>
        <LinearGradient
          colors={nightMode ? ["#2a2a2a", "#404040"] : ["#f8f9fa", "#ffffff"]}
          style={styles.searchContainer}
        >
          <Search size={16} color={nightMode ? "#aaa" : "#666"} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, nightMode && styles.searchInputNight]}
            placeholder="Rechercher un livre..."
            placeholderTextColor={nightMode ? "#aaa" : "#666"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </LinearGradient>

        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)} activeOpacity={0.8}>
          <LinearGradient colors={["#3B82F6", "#60A5FA"]} style={styles.filterGradient}>
            <Filter size={16} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Popular Section */}
      <LinearGradient
        colors={nightMode ? ["#1e1e1e", "#2a2a2a"] : ["#EBF4FF", "#DBEAFE"]}
        style={styles.popularSection}
      >
        <View style={styles.sectionHeader}>
          <Star size={16} color="#FFD700" fill="#FFD700" />
          <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>🔥 Populaires</Text>
        </View>
        <FlatList
          data={popularBooks}
          renderItem={renderPopularBookItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.popularBooksList}
        />
      </LinearGradient>

      {/* Books List */}
      <FlatList
        data={filteredBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
        ListEmptyComponent={
          <Text style={[styles.noBooksText, nightMode && styles.noBooksTextNight]}>Aucun livre trouvé</Text>
        }
      />

      {/* Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, nightMode && styles.modalOverlayNight]}>
          <LinearGradient colors={nightMode ? ["#1e1e1e", "#2a2a2a"] : ["#ffffff", "#f8f9fa"]} style={styles.modalView}>
            <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
              💬 Commenter "{currentBook?.title || ""}"
            </Text>
            <TextInput
              style={[styles.modalInput, nightMode && styles.modalInputNight]}
              multiline
              placeholder="Écrivez votre commentaire ici..."
              placeholderTextColor={nightMode ? "#aaa" : "#666"}
              value={reviewText}
              onChangeText={setReviewText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.8}>
                <LinearGradient colors={["#6B7280", "#9CA3AF"]} style={styles.cancelButton}>
                  <Text style={styles.modalButtonText}>Annuler</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitReview} activeOpacity={0.8}>
                <LinearGradient colors={["#10B981", "#34D399"]} style={styles.submitButton}>
                  <Text style={styles.modalButtonText}>Envoyer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={[styles.modalOverlay, nightMode && styles.modalOverlayNight]}>
          <LinearGradient colors={nightMode ? ["#1e1e1e", "#2a2a2a"] : ["#ffffff", "#f8f9fa"]} style={styles.modalView}>
            <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>⚙️ Filtres</Text>

            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, nightMode && styles.filterSectionTitleNight]}>Trier par</Text>
              {["popularity", "date", "rating"].map((field) => (
                <TouchableOpacity
                  key={field}
                  style={[
                    styles.filterOption,
                    sortOption.field === field && styles.selectedFilterOption,
                    nightMode && styles.filterOptionNight,
                  ]}
                  onPress={() => setSortOption({ ...sortOption, field: field as SortField })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterOptionText, nightMode && styles.filterOptionTextNight]}>
                    {field === "popularity" ? "📈 Popularité" : field === "date" ? "📅 Date" : "⭐ Note"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, nightMode && styles.filterSectionTitleNight]}>Ordre</Text>
              {["descending", "ascending"].map((order) => (
                <TouchableOpacity
                  key={order}
                  style={[
                    styles.filterOption,
                    sortOption.order === order && styles.selectedFilterOption,
                    nightMode && styles.filterOptionNight,
                  ]}
                  onPress={() => setSortOption({ ...sortOption, order: order as SortOrder })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterOptionText, nightMode && styles.filterOptionTextNight]}>
                    {order === "descending" ? "⬇️ Décroissant" : "⬆️ Croissant"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => setFilterModalVisible(false)} activeOpacity={0.8}>
              <LinearGradient colors={["#3B82F6", "#60A5FA"]} style={styles.applyButton}>
                <Text style={styles.modalButtonText}>Appliquer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  containerNight: {
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  headerTitleNight: {
    color: "#FFFFFF",
  },
  nightModeButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  nightModeGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchHeaderNight: {
    backgroundColor: "#1e1e1e",
    borderBottomColor: "#333",
  },
  searchContainer: {
    flex: 1,
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
    color: "#1F2937",
    fontSize: 14,
  },
  searchInputNight: {
    color: "#FFFFFF",
  },
  searchIcon: {
    opacity: 0.6,
  },
  filterButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  filterGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesContainer: {
    paddingVertical: 12,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    marginRight: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  categoryChipNight: {},
  selectedCategoryChip: {},
  categoryGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  categoryText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
  },
  categoryTextNight: {
    color: "#FFFFFF",
  },
  selectedCategoryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  popularSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 12,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 6,
  },
  sectionTitleNight: {
    color: "#FFFFFF",
  },
  popularBooksList: {
    paddingVertical: 2,
  },
  popularBookCard: {
    width: width * 0.24,
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  popularBookCardNight: {
    backgroundColor: "#2a2a2a",
  },
  popularBookCover: {
    width: width * 0.16,
    height: width * 0.22,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  popularBookTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 14,
  },
  popularBookTitleNight: {
    color: "#FFFFFF",
  },
  popularBookViews: {
    fontSize: 9,
    color: "#6B7280",
    marginTop: 2,
  },
  popularBookViewsNight: {
    color: "#9CA3AF",
  },
  booksList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bookCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  bookCardNight: {},
  bookCardGradient: {
    flexDirection: "row",
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 16,
  },
  bookCoverContainer: {
    width: width * 0.18,
    height: width * 0.25,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#F8F9FA",
  },
  bookCover: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  newBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },
  bookInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  bookHeader: {
    flex: 1,
  },
  bookTitleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    lineHeight: 18,
  },
  bookTitleNight: {
    color: "#FFFFFF",
  },
  popularBadge: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginLeft: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },
  bookAuthor: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 3,
  },
  bookAuthorNight: {
    color: "#9CA3AF",
  },
  bookCategory: {
    fontSize: 10,
    color: "#3B82F6",
    fontWeight: "500",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  bookCategoryNight: {
    color: "#60A5FA",
  },
  bookStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bookStatText: {
    fontSize: 10,
    color: "#6B7280",
    marginLeft: 3,
  },
  bookStatTextNight: {
    color: "#9CA3AF",
  },
  statIcon: {
    marginLeft: 8,
  },
  bookActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flex: 1,
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 11,
    textAlign: "center",
  },
  secondaryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    borderWidth: 1,
    borderColor: "#3B82F6",
    borderRadius: 6,
    padding: 4,
  },
  iconButtonNight: {
    borderColor: "#FFD700",
  },
  aiButton: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  aiButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalOverlayNight: {
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalView: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1F2937",
    textAlign: "center",
  },
  modalTitleNight: {
    color: "#FFFFFF",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 12,
    minHeight: 80,
    padding: 12,
    textAlignVertical: "top",
    marginBottom: 16,
    fontSize: 14,
    color: "#1F2937",
    backgroundColor: "#F8F9FA",
  },
  modalInputNight: {
    borderColor: "#404040",
    color: "#FFFFFF",
    backgroundColor: "#2a2a2a",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  filterSectionTitleNight: {
    color: "#FFFFFF",
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  filterOptionNight: {
    backgroundColor: "#2a2a2a",
    borderColor: "#404040",
  },
  selectedFilterOption: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterOptionText: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "500",
  },
  filterOptionTextNight: {
    color: "#FFFFFF",
  },
  noBooksText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 32,
    fontStyle: "italic",
  },
  noBooksTextNight: {
    color: "#9CA3AF",
  },
})
