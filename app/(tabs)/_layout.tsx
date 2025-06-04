import { Tabs } from 'expo-router';
import { Chrome as Home, Book, FileText, Users, User } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].gold,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].darkGray,
        tabBarStyle: { 
          backgroundColor: Colors[colorScheme ?? 'light'].white,
          borderTopColor: Colors[colorScheme ?? 'light'].lightGray,
        },
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].white,
        },
        headerTitleStyle: {
          color: Colors[colorScheme ?? 'light'].textDark,
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => <Book color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: 'Exams',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="PDFViewerScreen"
        options={{
          title: 'Visionneuse PDF',
          href: null, // Masque l'onglet dans la barre de navigation
        }}
      />
    </Tabs>
  );
}