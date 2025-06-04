import { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Users, MessageCircle, Calendar, Award } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';

const CLUBS = [
  {
    id: '1',
    name: 'Cybersecurity Club',
    domain: 'cybersecurity',
    members: 124,
    avatar: 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'A community dedicated to cybersecurity practices, ethical hacking, and network protection.',
  },
  {
    id: '2',
    name: 'AI Researchers',
    domain: 'artificial-intelligence',
    members: 98,
    avatar: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'Exploring the frontiers of artificial intelligence, machine learning, and neural networks.',
  },
  {
    id: '3',
    name: 'Web Development',
    domain: 'web-development',
    members: 156,
    avatar: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'Frontend and backend web development, modern frameworks, and best practices.',
  },
  {
    id: '4',
    name: 'Mobile App Developers',
    domain: 'mobile-development',
    members: 112,
    avatar: 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'Creating innovative mobile applications for iOS and Android platforms.',
  },
];

const FEED_ITEMS = [
  {
    id: '1',
    type: 'event',
    title: 'Hackathon: Build a Secure App',
    club: 'Cybersecurity Club',
    date: 'May 15, 2025',
    participants: 32,
  },
  {
    id: '2',
    type: 'challenge',
    title: 'Weekly Coding Challenge',
    club: 'Web Development',
    date: 'Ends in 3 days',
    participants: 48,
  },
  {
    id: '3',
    type: 'discussion',
    title: 'AI Ethics in Modern Applications',
    club: 'AI Researchers',
    date: 'Active discussion',
    participants: 24,
  },
];

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('feed');
  
  const renderClubItem = ({ item }) => (
    <TouchableOpacity style={styles.clubCard}>
      <Image source={{ uri: item.avatar }} style={styles.clubAvatar} />
      <View style={styles.clubInfo}>
        <Text style={styles.clubName}>{item.name}</Text>
        <Text style={styles.clubDomain}>{item.domain}</Text>
        <View style={styles.clubMembersContainer}>
          <Users size={14} color={Colors.light.textLight} />
          <Text style={styles.clubMembers}>{item.members} members</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>Join</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  const renderFeedItem = ({ item }) => {
    let icon;
    let backgroundColor;
    
    switch (item.type) {
      case 'event':
        icon = <Calendar size={20} color={Colors.light.white} />;
        backgroundColor = Colors.light.gold;
        break;
      case 'challenge':
        icon = <Award size={20} color={Colors.light.white} />;
        backgroundColor = '#4CAF50'; // Green
        break;
      case 'discussion':
        icon = <MessageCircle size={20} color={Colors.light.white} />;
        backgroundColor = '#2196F3'; // Blue
        break;
      default:
        icon = null;
        backgroundColor = Colors.light.gold;
    }
    
    return (
      <TouchableOpacity style={styles.feedItem}>
        <View style={[styles.feedItemIcon, { backgroundColor }]}>
          {icon}
        </View>
        <View style={styles.feedItemContent}>
          <Text style={styles.feedItemTitle}>{item.title}</Text>
          <Text style={styles.feedItemClub}>{item.club}</Text>
          <View style={styles.feedItemDetails}>
            <Text style={styles.feedItemDate}>{item.date}</Text>
            <View style={styles.feedItemParticipants}>
              <Users size={12} color={Colors.light.textLight} />
              <Text style={styles.feedItemParticipantsText}>{item.participants}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      
      {/* Header with search and create button */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.light.darkGray} />
          <Text style={styles.searchPlaceholder}>Search clubs, discussions...</Text>
        </View>
        <TouchableOpacity style={styles.createButton}>
          <Plus size={20} color={Colors.light.white} />
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]} 
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'clubs' && styles.activeTab]} 
          onPress={() => setActiveTab('clubs')}
        >
          <Text style={[styles.tabText, activeTab === 'clubs' && styles.activeTabText]}>Clubs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'my-clubs' && styles.activeTab]} 
          onPress={() => setActiveTab('my-clubs')}
        >
          <Text style={[styles.tabText, activeTab === 'my-clubs' && styles.activeTabText]}>My Clubs</Text>
        </TouchableOpacity>
      </View>
      
      {/* Content based on active tab */}
      {activeTab === 'feed' && (
        <FlatList
          data={FEED_ITEMS}
          renderItem={renderFeedItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feedList}
        />
      )}
      
      {activeTab === 'clubs' && (
        <FlatList
          data={CLUBS}
          renderItem={renderClubItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.clubsList}
        />
      )}
      
      {activeTab === 'my-clubs' && (
        <View style={styles.emptyState}>
          <Users size={48} color={Colors.light.lightGray} />
          <Text style={styles.emptyStateTitle}>No clubs joined yet</Text>
          <Text style={styles.emptyStateSubtitle}>Join clubs to collaborate with other students</Text>
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={() => setActiveTab('clubs')}
          >
            <Text style={styles.emptyStateButtonText}>Browse Clubs</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: Colors.light.darkGray,
    fontSize: 16,
  },
  createButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.gold,
    borderRadius: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.gold,
  },
  tabText: {
    fontSize: 16,
    color: Colors.light.textLight,
  },
  activeTabText: {
    color: Colors.light.gold,
    fontWeight: '600',
  },
  clubsList: {
    padding: 16,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clubAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginBottom: 2,
  },
  clubDomain: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  clubMembersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubMembers: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: Colors.light.gold,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  joinButtonText: {
    color: Colors.light.white,
    fontWeight: '600',
  },
  feedList: {
    padding: 16,
  },
  feedItem: {
    flexDirection: 'row',
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedItemContent: {
    flex: 1,
  },
  feedItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginBottom: 2,
  },
  feedItemClub: {
    fontSize: 14,
    color: Colors.light.gold,
    marginBottom: 4,
  },
  feedItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedItemDate: {
    fontSize: 12,
    color: Colors.light.textLight,
  },
  feedItemParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedItemParticipantsText: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: Colors.light.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: Colors.light.white,
    fontWeight: '600',
  },
});