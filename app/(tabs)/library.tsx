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
  Pressable,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BookOpen, Search, Filter, Star, Share2, MessageSquare, Eye, Moon, Sun } from "lucide-react-native"
import Colors from "@/constants/Colors"
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

        query = query.order(
          sortOption.field === "popularity"
            ? "popularite"
            : sortOption.field === "rating"
              ? "average_rating"
              : "created_at",
          { ascending: sortOption.order === "ascending" },
        )

        const { data, error } = await query
        if (error) {
          console.error("Erreur récupération livres:", error.message)
          return
        }

        console.log("Données brutes depuis Supabase:", data)

        const { data: ratingsData, error: ratingsError } = await supabase
          .from("ratings")
          .select("book_id, rating")
          .in(
            "book_id",
            data.map((book) => book.id),
          )

        if (ratingsError) {
          console.error("Erreur récupération notes:", ratingsError.message)
        }

        const ratingsMap = new Map<string, number[]>()
        ratingsData?.forEach(({ book_id, rating }) => {
          if (!ratingsMap.has(book_id)) ratingsMap.set(book_id, [])
          ratingsMap.get(book_id)!.push(rating)
        })

        const booksWithRatings = data.map((book: any) => {
          const ratings = ratingsMap.get(book.id) || []
          const averageRating =
            ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : undefined
          const category = book.domaine?.toLowerCase() || "all"
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

        const uniqueCategories = Array.from(new Set(booksWithRatings.map((book) => book.category)))
          .filter((category) => category !== "all")
          .map((category) => ({
            id: category,
            name: category.charAt(0).toUpperCase() + category.slice(1),
          }))

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
        const { data, error } = await supabase.storage.from("book-documents").createSignedUrl(fileName, 31536000)
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
      const apiKey = process.env.GEMINI_API_KEY || "VOTRE_CLE_API_GEMINI"
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
    </TouchableOpacity>
  )

  const renderPopularBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity style={[styles.popularBookCard, nightMode && styles.popularBookCardNight]} activeOpacity={0.8}>
      <View style={[styles.popularBookCover, nightMode && styles.popularBookCoverNight]}>
        <BookOpen size={isSmallScreen ? 20 : 24} color={nightMode ? "#121212" : "#fff"} />
      </View>
      <Text style={[styles.popularBookTitle, nightMode && styles.popularBookTitleNight]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.popularBookViews, nightMode && styles.popularBookViewsNight]}>{item.popularity} vues</Text>
    </TouchableOpacity>
  )

  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity style={[styles.bookCard, nightMode && styles.bookCardNight]} activeOpacity={0.8}>
      <View style={styles.bookCoverContainer}>
        <Image source={{ uri: item.coverUrl }} style={styles.bookCover} />
        {item.isNew && (
          <View style={[styles.newBadge, nightMode && styles.newBadgeNight]}>
            <Text style={styles.newBadgeText}>NOUVEAU</Text>
          </View>
        )}
      </View>
      <View style={styles.bookInfo}>
        <View style={styles.bookHeader}>
          <View style={styles.bookTitleContainer}>
            <Text style={[styles.bookTitle, nightMode && styles.bookTitleNight]} numberOfLines={2}>
              {item.title}
            </Text>
            {item.popularity > 1000 && (
              <View style={[styles.badge, styles.popularBadge, nightMode && styles.popularBadgeNight]}>
                <Text style={styles.badgeText}>POPULAIRE</Text>
              </View>
            )}
          </View>
          <Text style={[styles.bookAuthor, nightMode && styles.bookAuthorNight]} numberOfLines={1}>
            {item.author}
          </Text>
          <Text style={[styles.bookCategory, nightMode && styles.bookCategoryNight]}>{item.category}</Text>
          <View style={styles.bookStats}>
            {item.averageRating && (
              <>
                <Star
                  size={12}
                  color={nightMode ? "#FFD700" : Colors.light.gold}
                  fill={nightMode ? "#FFD700" : Colors.light.gold}
                />
                <Text style={[styles.bookStatText, nightMode && styles.bookStatTextNight]}>
                  {item.averageRating.toFixed(1)}
                </Text>
              </>
            )}
            <Eye size={12} color={nightMode ? "#aaa" : "#999"} style={styles.statIcon} />
            <Text style={[styles.bookStatText, nightMode && styles.bookStatTextNight]}>{item.popularity}</Text>
          </View>
        </View>
        <View style={styles.bookActions}>
          <TouchableOpacity
            style={[styles.primaryButton, nightMode && styles.primaryButtonNight]}
            onPress={() => openPDF(item)}
          >
            <Text style={[styles.primaryButtonText, nightMode && styles.primaryButtonTextNight]}>OUVRIR</Text>
          </TouchableOpacity>
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={[styles.iconButton, nightMode && styles.iconButtonNight]}
              onPress={() => openReviewModal(item)}
            >
              <MessageSquare size={16} color={nightMode ? "#FFD700" : Colors.light.gold} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, nightMode && styles.iconButtonNight]}
              onPress={() => handleShare(item)}
            >
              <Share2 size={16} color={nightMode ? "#FFD700" : Colors.light.gold} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.aiButton, nightMode && styles.aiButtonNight]}
              onPress={() => handleAIHelp(item)}
            >
              <Text style={[styles.aiButtonText, nightMode && styles.aiButtonTextNight]}>AI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.container, nightMode && styles.containerNight]} edges={["top"]}>
      <StatusBar style={nightMode ? "light" : "auto"} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, nightMode && styles.headerTitleNight]}>Bibliothèque</Text>
        <TouchableOpacity onPress={() => setNightMode(!nightMode)} style={styles.nightModeButton}>
          {nightMode ? <Sun size={24} color="#FFD700" /> : <Moon size={24} color="#000" />}
        </TouchableOpacity>
      </View>

      {/* Search Header */}
      <View style={[styles.searchHeader, nightMode && styles.searchHeaderNight]}>
        <View style={[styles.searchContainer, nightMode && styles.searchContainerNight]}>
          <Search size={20} color={nightMode ? "#aaa" : Colors.light.darkGray} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, nightMode && styles.searchInputNight]}
            placeholder="Rechercher un livre..."
            placeholderTextColor={nightMode ? "#aaa" : Colors.light.darkGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, nightMode && styles.filterButtonNight]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={20} color={nightMode ? "#FFD700" : Colors.light.gold} />
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
      <View style={[styles.popularSection, nightMode && styles.popularSectionNight]}>
        <View style={styles.sectionHeader}>
          <Star size={20} color={nightMode ? "#FFD700" : Colors.light.gold} />
          <Text style={[styles.sectionTitle, nightMode && styles.sectionTitleNight]}>Les plus populaires</Text>
        </View>
        <FlatList
          data={popularBooks}
          renderItem={renderPopularBookItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.popularBooksList}
        />
      </View>

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
          <View style={[styles.modalView, nightMode && styles.modalViewNight]}>
            <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
              Commenter "{currentBook?.title || ""}"
            </Text>
            <TextInput
              style={[styles.modalInput, nightMode && styles.modalInputNight]}
              multiline
              placeholder="Écrivez votre commentaire ici..."
              placeholderTextColor={nightMode ? "#aaa" : "#333"}
              value={reviewText}
              onChangeText={setReviewText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, nightMode && styles.cancelButtonNight]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, nightMode && styles.modalButtonTextNight]}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.submitButton, nightMode && styles.submitButtonNight]}
                onPress={submitReview}
              >
                <Text style={[styles.modalButtonText, nightMode && styles.modalButtonTextNight]}>Envoyer</Text>
              </Pressable>
            </View>
          </View>
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
          <View style={[styles.modalView, nightMode && styles.modalViewNight]}>
            <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>Trier par</Text>
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, nightMode && styles.filterSectionTitleNight]}>Champ</Text>
              {["popularity", "date", "rating"].map((field) => (
                <TouchableOpacity
                  key={field}
                  style={[
                    styles.filterOption,
                    sortOption.field === field && styles.selectedFilterOption,
                    nightMode && styles.filterOptionNight,
                  ]}
                  onPress={() => setSortOption({ ...sortOption, field: field as SortField })}
                >
                  <Text style={[styles.filterOptionText, nightMode && styles.filterOptionTextNight]}>
                    {field === "popularity" ? "Popularité" : field === "date" ? "Date" : "Note"}
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
                >
                  <Text style={[styles.filterOptionText, nightMode && styles.filterOptionTextNight]}>
                    {order === "descending" ? "Décroissant" : "Croissant"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, nightMode && styles.filterSectionTitleNight]}>
                Note minimale
              </Text>
              {[null, 3, 4].map((rating) => (
                <TouchableOpacity
                  key={rating?.toString() || "none"}
                  style={[
                    styles.filterOption,
                    minRating === rating && styles.selectedFilterOption,
                    nightMode && styles.filterOptionNight,
                  ]}
                  onPress={() => setMinRating(rating)}
                >
                  <Text style={[styles.filterOptionText, nightMode && styles.filterOptionTextNight]}>
                    {rating === null ? "Aucune" : `${rating}+ étoiles`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Pressable
              style={[styles.modalButton, styles.cancelButton, nightMode && styles.cancelButtonNight]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, nightMode && styles.modalButtonTextNight]}>Appliquer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerNight: {
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: "bold",
    color: "#000",
  },
  headerTitleNight: {
    color: "#fff",
  },
  nightModeButton: {
    padding: 8,
    borderRadius: 20,
  },
  searchHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchHeaderNight: {
    backgroundColor: "#1e1e1e",
    borderBottomColor: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  searchContainerNight: {
    backgroundColor: "#2a2a2a",
    borderColor: "#404040",
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: "#333",
    fontSize: 16,
  },
  searchInputNight: {
    color: "#fff",
  },
  searchIcon: {
    opacity: 0.6,
  },
  filterButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.light.gold,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "rgba(255, 193, 7, 0.1)",
  },
  filterButtonNight: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  categoriesContainer: {
    paddingVertical: 16,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  categoryChipNight: {
    backgroundColor: "#2a2a2a",
    borderColor: "#404040",
  },
  selectedCategoryChip: {
    backgroundColor: Colors.light.gold,
    borderColor: Colors.light.gold,
  },
  categoryText: {
    color: "#495057",
    fontSize: 14,
    fontWeight: "500",
  },
  categoryTextNight: {
    color: "#fff",
  },
  selectedCategoryText: {
    color: "#fff",
    fontWeight: "600",
  },
  popularSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fef3c7",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fffbeb",
  },
  popularSectionNight: {
    backgroundColor: "#1e1e1e",
    borderColor: "#333",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginLeft: 8,
  },
  sectionTitleNight: {
    color: "#fff",
  },
  popularBooksList: {
    paddingVertical: 4,
  },
  popularBookCard: {
    width: width * 0.28,
    alignItems: "center",
    marginRight: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularBookCardNight: {
    backgroundColor: "#2a2a2a",
  },
  popularBookCover: {
    width: width * 0.2,
    height: width * 0.28,
    backgroundColor: Colors.light.gold,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  popularBookCoverNight: {
    backgroundColor: "#FFD700",
  },
  popularBookTitle: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
    lineHeight: 18,
  },
  popularBookTitleNight: {
    color: "#fff",
  },
  popularBookViews: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  popularBookViewsNight: {
    color: "#aaa",
  },
  booksList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bookCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  bookCardNight: {
    backgroundColor: "#1e1e1e",
    borderColor: "#333",
  },
  bookCoverContainer: {
    width: width * 0.22,
    height: width * 0.3,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 16,
    backgroundColor: "#f8f9fa",
  },
  bookCover: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  newBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#22c55e",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeNight: {
    backgroundColor: "#4CAF50",
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 9,
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
    marginBottom: 6,
  },
  bookTitle: {
    fontSize: isSmallScreen ? 15 : 17,
    fontWeight: "600",
    color: "#111",
    flex: 1,
    lineHeight: 22,
  },
  bookTitleNight: {
    color: "#fff",
  },
  badge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  popularBadge: {
    backgroundColor: Colors.light.gold,
  },
  popularBadgeNight: {
    backgroundColor: "#FFD700",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
  bookAuthor: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  bookAuthorNight: {
    color: "#aaa",
  },
  bookCategory: {
    fontSize: 13,
    color: Colors.light.gold,
    fontWeight: "500",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  bookCategoryNight: {
    color: "#FFD700",
  },
  bookStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bookStatText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  bookStatTextNight: {
    color: "#aaa",
  },
  statIcon: {
    marginLeft: 12,
  },
  bookActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryButton: {
    backgroundColor: Colors.light.gold,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 12,
  },
  primaryButtonNight: {
    backgroundColor: "#FFD700",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  primaryButtonTextNight: {
    color: "#121212",
  },
  secondaryActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    borderWidth: 1,
    borderColor: Colors.light.gold,
    borderRadius: 8,
    padding: 8,
    marginLeft: 6,
  },
  iconButtonNight: {
    borderColor: "#FFD700",
  },
  aiButton: {
    backgroundColor: Colors.light.gold,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 6,
  },
  aiButtonNight: {
    backgroundColor: "#FFD700",
  },
  aiButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  aiButtonTextNight: {
    color: "#121212",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalOverlayNight: {
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalView: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: height * 0.8,
  },
  modalViewNight: {
    backgroundColor: "#1e1e1e",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#111",
    textAlign: "center",
  },
  modalTitleNight: {
    color: "#fff",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    minHeight: 120,
    padding: 16,
    textAlignVertical: "top",
    marginBottom: 20,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f8f9fa",
  },
  modalInputNight: {
    borderColor: "#404040",
    color: "#fff",
    backgroundColor: "#2a2a2a",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  cancelButtonNight: {
    backgroundColor: "#495057",
  },
  submitButton: {
    backgroundColor: Colors.light.gold,
  },
  submitButtonNight: {
    backgroundColor: "#FFD700",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalButtonTextNight: {
    color: "#121212",
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 12,
  },
  filterSectionTitleNight: {
    color: "#fff",
  },
  filterOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  filterOptionNight: {
    backgroundColor: "#2a2a2a",
    borderColor: "#404040",
  },
  selectedFilterOption: {
    backgroundColor: Colors.light.gold,
    borderColor: Colors.light.gold,
  },
  filterOptionText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  filterOptionTextNight: {
    color: "#fff",
  },
  noBooksText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingVertical: 40,
    fontStyle: "italic",
  },
  noBooksTextNight: {
    color: "#aaa",
  },
})
