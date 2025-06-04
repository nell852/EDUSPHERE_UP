import { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Users, MessageCircle, Code, FileText, Clock, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';

const PROGRAMMING_LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++'];

const PROJECTS = [
  {
    id: '1',
    name: 'E-commerce Platform',
    description: 'A full-stack e-commerce application with React and Node.js',
    languages: ['JavaScript', 'React', 'Node.js'],
    collaborators: 3,
    lastUpdated: '2 days ago',
  },
  {
    id: '2',
    name: 'Machine Learning Model',
    description: 'Predictive model for financial forecasting',
    languages: ['Python', 'TensorFlow'],
    collaborators: 2,
    lastUpdated: '1 week ago',
  },
];

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('journey');
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600' }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Alex Johnson</Text>
            <Text style={styles.profileMatricule}>Matricule: STD24785</Text>
            <Text style={styles.profileSchool}>School of Computer Science</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color={Colors.light.darkGray} />
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'journey' && styles.activeTab]} 
          onPress={() => setActiveTab('journey')}
        >
          <Text style={[styles.tabText, activeTab === 'journey' && styles.activeTabText]}>My Journey</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'colleagues' && styles.activeTab]} 
          onPress={() => setActiveTab('colleagues')}
        >
          <Text style={[styles.tabText, activeTab === 'colleagues' && styles.activeTabText]}>Colleagues</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]} 
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Chat</Text>
        </TouchableOpacity>
      </View>
      
      {/* Content based on active tab */}
      <ScrollView style={styles.content}>
        {activeTab === 'journey' && (
          <View>
            {/* Programming Languages */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Programming Languages</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.languagesContainer}>
                {PROGRAMMING_LANGUAGES.map((language, index) => (
                  <View key={index} style={styles.languageChip}>
                    <Text style={styles.languageText}>{language}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            {/* Projects */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Projects</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              
              {PROJECTS.map((project) => (
                <TouchableOpacity key={project.id} style={styles.projectCard}>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <ChevronRight size={16} color={Colors.light.darkGray} />
                  </View>
                  <Text style={styles.projectDescription}>{project.description}</Text>
                  
                  <View style={styles.projectLanguages}>
                    {project.languages.map((language, index) => (
                      <View key={index} style={styles.projectLanguageChip}>
                        <Text style={styles.projectLanguageText}>{language}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.projectFooter}>
                    <View style={styles.projectCollaborators}>
                      <Users size={14} color={Colors.light.textLight} />
                      <Text style={styles.projectFooterText}>{project.collaborators} collaborators</Text>
                    </View>
                    <View style={styles.projectLastUpdated}>
                      <Clock size={14} color={Colors.light.textLight} />
                      <Text style={styles.projectFooterText}>{project.lastUpdated}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Tools */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tools</Text>
              
              <TouchableOpacity style={styles.toolCard}>
                <View style={styles.toolIcon}>
                  <FileText size={24} color={Colors.light.white} />
                </View>
                <View style={styles.toolInfo}>
                  <Text style={styles.toolName}>Generate CV</Text>
                  <Text style={styles.toolDescription}>Create a professional CV based on your profile data</Text>
                </View>
                <ChevronRight size={16} color={Colors.light.darkGray} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.toolCard}>
                <View style={[styles.toolIcon, { backgroundColor: '#4CAF50' }]}>
                  <Code size={24} color={Colors.light.white} />
                </View>
                <View style={styles.toolInfo}>
                  <Text style={styles.toolName}>Development Environments</Text>
                  <Text style={styles.toolDescription}>Access specialized coding environments</Text>
                </View>
                <ChevronRight size={16} color={Colors.light.darkGray} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {activeTab === 'colleagues' && (
          <View style={styles.emptyState}>
            <Users size={48} color={Colors.light.lightGray} />
            <Text style={styles.emptyStateTitle}>No colleagues yet</Text>
            <Text style={styles.emptyStateSubtitle}>Connect with other students to collaborate on projects</Text>
          </View>
        )}
        
        {activeTab === 'chat' && (
          <View style={styles.emptyState}>
            <MessageCircle size={48} color={Colors.light.lightGray} />
            <Text style={styles.emptyStateTitle}>No conversations yet</Text>
            <Text style={styles.emptyStateSubtitle}>Start chatting with colleagues and clubs</Text>
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginBottom: 2,
  },
  profileMatricule: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 2,
  },
  profileSchool: {
    fontSize: 14,
    color: Colors.light.gold,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.light.background,
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textDark,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.gold,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    color: Colors.light.white,
    fontWeight: '600',
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageChip: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  languageText: {
    fontSize: 14,
    color: Colors.light.textDark,
  },
  projectCard: {
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textDark,
  },
  projectDescription: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 8,
  },
  projectLanguages: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  projectLanguageChip: {
    backgroundColor: Colors.light.gold + '20', // 20% opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
  },
  projectLanguageText: {
    fontSize: 12,
    color: Colors.light.gold,
    fontWeight: '500',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectCollaborators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectLastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectFooterText: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginLeft: 4,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: Colors.light.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 300,
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
    textAlign: 'center',
  },
});