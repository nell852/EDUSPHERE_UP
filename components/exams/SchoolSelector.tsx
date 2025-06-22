import { useState, useEffect } from 'react'; // Ajouté useEffect pour le log (optionnel)
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import Colors from '@/constants/Colors';

type SchoolSelectorProps = {
  selectedSchool: string;
  onSelectSchool: (schoolId: string) => void;
  schools: string[] | undefined; // Permettre undefined comme type
};

export default function SchoolSelector({ selectedSchool, onSelectSchool, schools }: SchoolSelectorProps) {
  useEffect(() => {
    console.log('Schools received in SchoolSelector:', schools); // Log pour débogage
  }, [schools]);

  // Traiter schools comme un tableau vide si undefined
  const safeSchools = schools || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select School</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.schoolsList}
      >
        {safeSchools.length > 0 ? (
          safeSchools.map((schoolId) => {
            // Utiliser des logos par défaut ou une logique pour associer des logos si disponible
            const school = { id: schoolId, name: schoolId, logo: `https://via.placeholder.com/64?text=${schoolId}` };
            return (
              <TouchableOpacity
                key={school.id}
                style={[
                  styles.schoolItem,
                  selectedSchool === school.id && styles.selectedSchoolItem,
                ]}
                onPress={() => onSelectSchool(school.id)}
              >
                <Image source={{ uri: school.logo }} style={styles.schoolLogo} />
                <Text
                  style={[
                    styles.schoolName,
                    selectedSchool === school.id && styles.selectedSchoolName,
                  ]}
                  numberOfLines={2}
                >
                  {school.name}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.noSchoolsText}>No schools available</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
    backgroundColor: Colors.light.white,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginLeft: 16,
    marginBottom: 8,
  },
  schoolsList: {
    paddingHorizontal: 16,
  },
  schoolItem: {
    width: 80,
    alignItems: 'center',
    marginRight: 12,
  },
  selectedSchoolItem: {
    // Highlighted state
  },
  schoolLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSchoolLogo: {
    borderColor: Colors.light.gold,
  },
  schoolName: {
    fontSize: 12,
    color: Colors.light.textLight,
    textAlign: 'center',
  },
  selectedSchoolName: {
    color: Colors.light.gold,
    fontWeight: '600',
  },
  noSchoolsText: {
    fontSize: 14,
    color: Colors.light.textLight,
    padding: 8,
  },
});