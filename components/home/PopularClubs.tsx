import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Users } from 'lucide-react-native';
import Colors from '@/constants/Colors';

const POPULAR_CLUBS = [
  {
    id: '1',
    name: 'Cybersecurity Club',
    members: 124,
    avatar: 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: '2',
    name: 'AI Researchers',
    members: 98,
    avatar: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: '3',
    name: 'Web Development',
    members: 156,
    avatar: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: '4',
    name: 'Mobile App Developers',
    members: 112,
    avatar: 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

export default function PopularClubs() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {POPULAR_CLUBS.map((club) => (
        <TouchableOpacity key={club.id} style={styles.clubCard}>
          <Image source={{ uri: club.avatar }} style={styles.clubAvatar} />
          <Text style={styles.clubName} numberOfLines={1}>{club.name}</Text>
          <View style={styles.membersContainer}>
            <Users size={12} color={Colors.light.textLight} />
            <Text style={styles.membersCount}>{club.members}</Text>
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
  clubCard: {
    width: 120,
    alignItems: 'center',
    marginLeft: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.white,
    shadowColor: Colors.light.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clubAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  clubName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersCount: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginLeft: 4,
  },
});