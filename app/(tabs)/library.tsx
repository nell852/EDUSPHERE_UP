import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity,
  Image, Alert, Share as RNShare, Modal, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Filter, Search } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { useNavigation } from 'expo-router';

// Définir les types pour la navigation
type RootStackParamList = {
  '(tabs)/library': undefined;
  PDFViewerScreen: { pdfUrl: string; title: string };
};

// Typé useNavigation
type NavigationProp = {
  navigate: <RouteName extends keyof RootStackParamList>(
    ...args: RouteName extends keyof RootStackParamList
      ? [RouteName, RootStackParamList[RouteName]]
      : [RouteName, any]
  ) => void;
};

// Interface pour les catégories
interface Category {
  id: string;
  name: string;
}

// Interface pour les livres
interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  category: string;
  isNew: boolean;
  popularity: number;
  documentUrl: string;
  averageRating?: number;
}

// Options de tri
type SortField = 'popularity' | 'date' | 'rating';
type SortOrder = 'ascending' | 'descending';
interface SortOption {
  field: SortField;
  order: SortOrder;
}

const CATEGORIES: Category[] = [
  { id: 'all', name: 'Tous' },
  { id: 'computer-science', name: 'Informatique' },
  { id: 'cybersecurity', name: 'Cybersécurité' },
  { id: 'networks', name: 'Réseaux' },
  { id: 'artificial-intelligence', name: 'IA & ML' },
  { id: 'software-engineering', name: 'Génie Logiciel' },
];

export default function LibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>({ field: 'date', order: 'descending' });
  const [minRating, setMinRating] = useState<number | null>(null);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    async function fetchBooks() {
      try {
        let query = supabase
          .from('livres')
          .select('id, titre, domaine, couverture_url, document_url, popularite, created_at, auteur');

        query = query.order(
          sortOption.field === 'popularity' ? 'popularite' :
          sortOption.field === 'rating' ? 'average_rating' : 'created_at',
          { ascending: sortOption.order === 'ascending' }
        );

        const { data, error } = await query;

        if (error) {
          console.error('Erreur récupération livres:', error.message);
          return;
        }

        const { data: ratingsData, error: ratingsError } = await supabase
          .from('ratings')
          .select('book_id, rating')
          .in('book_id', data.map(book => book.id));

        if (ratingsError) {
          console.error('Erreur récupération notes:', ratingsError.message);
        }

        const ratingsMap = new Map<string, number[]>();
        ratingsData?.forEach(({ book_id, rating }) => {
          if (!ratingsMap.has(book_id)) ratingsMap.set(book_id, []);
          ratingsMap.get(book_id)!.push(rating);
        });

        const booksWithRatings = data.map((book: any) => {
          const ratings = ratingsMap.get(book.id) || [];
          const averageRating = ratings.length > 0 ?
            ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : undefined;
          return {
            id: book.id,
            title: book.titre || 'Sans titre',
            author: book.auteur || 'Auteur inconnu',
            coverUrl: book.couverture_url || '',
            category: book.domaine || 'all',
            isNew: new Date().getTime() - new Date(book.created_at).getTime() < 7 * 24 * 60 * 60 * 1000,
            popularity: book.popularite || 0,
            documentUrl: book.document_url || '',
            averageRating,
          };
        });

        const filteredBooks = minRating
          ? booksWithRatings.filter(book => book.averageRating && book.averageRating >= minRating)
          : booksWithRatings;

        setBooks(filteredBooks);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Erreur inattendue:', error.message);
        }
      }
    }
    fetchBooks();
  }, [sortOption, minRating]);

  const filteredBooks = books.filter(book =>
    (selectedCategory === 'all' || book.category === selectedCategory) &&
    (book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     book.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openReviewModal = (book: Book) => {
    setCurrentBook(book);
    setReviewText('');
    setModalVisible(true);
  };

  const submitReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Validation', 'Veuillez entrer un commentaire.');
      return;
    }
    setModalVisible(false);
    try {
      const { error } = await supabase.from('reviews').insert([
        {
          book_id: currentBook?.id,
          book_title: currentBook?.title,
          review: reviewText.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) {
        Alert.alert('Erreur', 'Une erreur s\'est produite lors de l\'envoi de votre commentaire.');
      } else {
        Alert.alert('Merci !', 'Votre commentaire a été soumis.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        Alert.alert('Erreur', 'Erreur inattendue : ' + err.message);
      }
    }
  };

  const handleShare = async (book: Book) => {
    try {
      const result = await RNShare.share({
        message: `Découvrez ce livre : "${book.title}" par ${book.author} !`,
      });
      if (result.action === RNShare.sharedAction) {
        const { error } = await supabase.from('shares').insert([
          { book_id: book.id, book_title: book.title, shared_at: new Date().toISOString() },
        ]);
        if (error) {
          console.log('Erreur enregistrement partage:', error.message);
        } else {
          console.log('Partage enregistré dans la base de données.');
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert('Erreur', 'Une erreur s\'est produite lors du partage.');
      }
    }
  };

  const openPDF = async (book: Book) => {
    let pdfUrl = book.documentUrl;
    if (!pdfUrl) {
      Alert.alert('Erreur', 'Aucun document disponible pour ce livre.');
      return;
    }
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        const fileName = pdfUrl.split('/').pop();
        if (!fileName) {
          throw new Error('Nom de fichier invalide');
        }
        const { data, error } = await supabase.storage
          .from('book-documents')
          .createSignedUrl(fileName, 31536000);
        if (error) throw error;
        pdfUrl = data.signedUrl;
      }
      navigation.navigate('PDFViewerScreen', { pdfUrl, title: book.title });
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert('Erreur', `Impossible de charger le PDF: ${error.message}`);
      }
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.selectedCategoryChip,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity style={styles.bookCard} activeOpacity={0.8}>
      <Image source={{ uri: item.coverUrl || 'https://via.placeholder.com/180' }} style={styles.bookCover} />
      {item.isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NOUVEAU</Text>
        </View>
      )}
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        {item.averageRating && (
          <Text style={styles.bookRating}>
            Note: {item.averageRating.toFixed(1)}/5
          </Text>
        )}
        <View style={styles.bookActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => openPDF(item)}>
            <Text style={styles.primaryButtonText}>OUVRIR</Text>
          </TouchableOpacity>
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleShare(item)}
            >
              <Text style={styles.iconButtonText}>PARTAGER</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => openReviewModal(item)}
            >
              <Text style={styles.iconButtonText}>COMMENTER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.light.darkGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par titre ou auteur"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.darkGray}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={20} color={Colors.light.gold} />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <FlatList
        data={filteredBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
      />

      {/* Modale pour les commentaires */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              Commenter "{currentBook ? currentBook.title : ''}"
            </Text>
            <TextInput
              style={styles.modalInput}
              multiline
              placeholder="Écrivez votre commentaire ici..."
              value={reviewText}
              onChangeText={setReviewText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitReview}
              >
                <Text style={styles.modalButtonText}>Envoyer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modale pour le filtre */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Trier par</Text>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Champ</Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  sortOption.field === 'popularity' && styles.selectedFilterOption,
                ]}
                onPress={() => setSortOption({ ...sortOption, field: 'popularity' })}
              >
                <Text style={styles.filterOptionText}>Popularité</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  sortOption.field === 'date' && styles.selectedFilterOption,
                ]}
                onPress={() => setSortOption({ ...sortOption, field: 'date' })}
              >
                <Text style={styles.filterOptionText}>Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  sortOption.field === 'rating' && styles.selectedFilterOption,
                ]}
                onPress={() => setSortOption({ ...sortOption, field: 'rating' })}
              >
                <Text style={styles.filterOptionText}>Note</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Ordre</Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  sortOption.order === 'descending' && styles.selectedFilterOption,
                ]}
                onPress={() => setSortOption({ ...sortOption, order: 'descending' })}
              >
                <Text style={styles.filterOptionText}>Décroissant</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  sortOption.order === 'ascending' && styles.selectedFilterOption,
                ]}
                onPress={() => setSortOption({ ...sortOption, order: 'ascending' })}
              >
                <Text style={styles.filterOptionText}>Croissant</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Note minimale</Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  minRating === null && styles.selectedFilterOption,
                ]}
                onPress={() => setMinRating(null)}
              >
                <Text style={styles.filterOptionText}>Aucune</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  minRating === 3 && styles.selectedFilterOption,
                ]}
                onPress={() => setMinRating(3)}
              >
                <Text style={styles.filterOptionText}>3+ étoiles</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  minRating === 4 && styles.selectedFilterOption,
                ]}
                onPress={() => setMinRating(4)}
              >
                <Text style={styles.filterOptionText}>4+ étoiles</Text>
              </TouchableOpacity>
            </View>
            <Pressable
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Appliquer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, marginLeft: 8, color: '#333', maxHeight: 40 },
  searchIcon: { marginRight: 8 },
  filterButton: { marginLeft: 12, backgroundColor: '#f2f2f2', borderRadius: 8, padding: 8 },
  categoriesContainer: { marginTop: 12 },
  categoriesList: { paddingHorizontal: 16 },
  categoryChip: {
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  selectedCategoryChip: { backgroundColor: Colors.light.gold },
  categoryText: { color: '#333' },
  selectedCategoryText: { color: '#fff' },
  booksList: { padding: 16 },
  bookCard: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookCover: { width: '100%', height: 180 },
  newBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.light.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  newBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  bookInfo: { padding: 12 },
  bookTitle: { fontWeight: 'bold', fontSize: 16, color: '#111', marginBottom: 4 },
  bookAuthor: { fontSize: 14, color: '#666', marginBottom: 4 },
  bookRating: { fontSize: 12, color: '#666', marginBottom: 8 },
  bookActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButton: {
    backgroundColor: Colors.light.gold,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  primaryButtonText: { color: '#fff', fontWeight: 'bold' },
  secondaryActions: { flexDirection: 'row' },
  iconButton: {
    marginLeft: 12,
    borderWidth: 1,
    borderColor: Colors.light.gold,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  iconButtonText: { color: Colors.light.gold, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 100,
    padding: 12,
    textAlignVertical: 'top',
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    alignSelf: 'center',
    width: '100%',
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: Colors.light.gold,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginBottom: 8,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f2f2f2',
  },
  selectedFilterOption: {
    backgroundColor: Colors.light.gold,
  },
  filterOptionText: {
    fontSize: 16,
    color: Colors.light.textDark,
  },
});
