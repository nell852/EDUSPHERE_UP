import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';

const FEATURED_BOOKS = [
  {
    id: '1',
    title: 'Machine Learning Basics',
    author: 'John Smith',
    coverUrl: 'https://images.pexels.com/photos/5926396/pexels-photo-5926396.jpeg?auto=compress&cs=tinysrgb&w=600',
    popularity: 92,
  },
  {
    id: '2',
    title: 'Advanced Network Security',
    author: 'Emily Johnson',
    coverUrl: 'https://images.pexels.com/photos/4068366/pexels-photo-4068366.jpeg?auto=compress&cs=tinysrgb&w=600',
    popularity: 88,
  },
  {
    id: '3',
    title: 'Web Development with React',
    author: 'Michael Chen',
    coverUrl: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=600',
    popularity: 95,
  },
  {
    id: '4',
    title: 'Database Design Principles',
    author: 'Sarah Williams',
    coverUrl: 'https://images.pexels.com/photos/4050437/pexels-photo-4050437.jpeg?auto=compress&cs=tinysrgb&w=600',
    popularity: 87,
  },
];

export default function FeaturedBooks() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {FEATURED_BOOKS.map((book) => (
        <TouchableOpacity key={book.id} style={styles.bookCard}>
          <Image source={{ uri: book.coverUrl }} style={styles.bookCover} />
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
            <Text style={styles.bookAuthor}>{book.author}</Text>
            <View style={styles.popularityContainer}>
              <View style={styles.popularityBar}>
                <View 
                  style={[
                    styles.popularityFill, 
                    { width: `${book.popularity}%` }
                  ]} 
                />
              </View>
              <Text style={styles.popularityText}>{book.popularity}%</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingLeft: 8,
    paddingRight: 16,
  },
  bookCard: {
    width: 160,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: Colors.light.white,
    overflow: 'hidden',
    shadowColor: Colors.light.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookCover: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginBottom: 8,
  },
  popularityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularityBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.light.lightGray,
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  popularityFill: {
    height: '100%',
    backgroundColor: Colors.light.gold,
    borderRadius: 2,
  },
  popularityText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.gold,
  },
});