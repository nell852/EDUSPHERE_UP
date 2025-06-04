import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import Colors from '@/constants/Colors';
import FeaturedBooks from '@/components/home/FeaturedBooks';
import PopularClubs from '@/components/home/PopularClubs';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('Utilisateur'); // Par défaut si pas de nom

  useEffect(() => {
    // Récupérer l'utilisateur connecté
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Erreur lors de la récupération de l\'utilisateur:', error.message);
          return;
        }
        if (user) {
          // Priorité : user_metadata.full_name, sinon user.email, sinon fallback
          const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';
          setUserName(name);
        }
      } catch (error) {
        console.error('Erreur inattendue:', error);
      }
    };

    fetchUser();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search books, exams, clubs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.light.darkGray}
        />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Bienvenue : {userName}</Text>
          <Text style={styles.welcomeSubtitle}>Continuez votre parcours d'apprentissage</Text>
        </View>
        
        {/* Featured books carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livres en vedette</Text>
          <FeaturedBooks />
        </View>
        
        {/* Popular clubs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clubs populaires</Text>
          <PopularClubs />
        </View>
        
        {/* Recent exams */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Examens récents</Text>
          <View style={styles.examCard}>
            <View style={styles.examInfo}>
              <Text style={styles.examTitle}>Systèmes de bases de données</Text>
              <Text style={styles.examSchool}>École d'informatique</Text>
              <Text style={styles.examLevel}>B3 • Examen final</Text>
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>Voir</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.examCard}>
            <View style={styles.examInfo}>
              <Text style={styles.examTitle}>Sécurité des réseaux</Text>
              <Text style={styles.examSchool}>École de cybersécurité</Text>
              <Text style={styles.examLevel}>M1 • Examen de mi-parcours</Text>
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>Voir</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Bottom spacing */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Chat bot button */}
      <TouchableOpacity style={styles.chatButton}>
        <MessageCircle color={Colors.light.white} size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.white,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  searchInput: {
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 16,
    marginTop: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.textDark,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.light.textLight,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginBottom: 12,
  },
  examCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  examInfo: {
    flex: 1,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginBottom: 4,
  },
  examSchool: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 2,
  },
  examLevel: {
    fontSize: 14,
    color: Colors.light.gold,
  },
  viewButton: {
    backgroundColor: Colors.light.gold,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewButtonText: {
    color: Colors.light.white,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 80,
  },
  chatButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Colors.light.gold,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});