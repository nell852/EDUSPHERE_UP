import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import Colors from '@/constants/Colors';

const SCHOOLS = [
  {
    id: 'cs',
    name: 'Computer Science',
    logo: 'https://images.pexels.com/photos/2448232/pexels-photo-2448232.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 'business',
    name: 'Business',
    logo: 'https://images.pexels.com/photos/936137/pexels-photo-936137.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 'engineering',
    name: 'Engineering',
    logo: 'https://images.pexels.com/photos/3862632/pexels-photo-3862632.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 'arts',
    name: 'Arts & Design',
    logo: 'https://images.pexels.com/photos/20967/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 'medicine',
    name: 'Medicine',
    logo: 'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 'law',
    name: 'Law',
    logo: 'https://images.pexels.com/photos/5668859/pexels-photo-5668859.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 'science',
    name: 'Science',
    logo: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

type SchoolSelectorProps = {
  selectedSchool: string;
  onSelectSchool: (schoolId: string) => void;
};

export default function SchoolSelector({ selectedSchool, onSelectSchool }: SchoolSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select School</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.schoolsList}
      >
        {SCHOOLS.map((school) => (
          <TouchableOpacity
            key={school.id}
            style={[
              styles.schoolItem,
              selectedSchool === school.id && styles.selectedSchoolItem
            ]}
            onPress={() => onSelectSchool(school.id)}
          >
            <Image source={{ uri: school.logo }} style={styles.schoolLogo} />
            <Text 
              style={[
                styles.schoolName,
                selectedSchool === school.id && styles.selectedSchoolName
              ]}
              numberOfLines={2}
            >
              {school.name}
            </Text>
          </TouchableOpacity>
        ))}
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
});