"use client"

import { Tabs } from "expo-router"
import { Chrome as Home, Book, FileText, Users, User } from "lucide-react-native"
import { useColorScheme } from "react-native"

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3B82F6", // Bleu principal
        tabBarInactiveTintColor: "#9CA3AF", // Gris clair
        tabBarStyle: {
          backgroundColor: "#FFFFFF", // Blanc
          borderTopColor: "#E5E7EB", // Bordure gris clair
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
          shadowColor: "#000000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        headerStyle: {
          backgroundColor: "#FFFFFF", // Blanc
          shadowColor: "#000000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
        headerTitleStyle: {
          color: "#1F2937", // Gris foncé
          fontWeight: "700",
          fontSize: 18,
        },
        headerShadowVisible: true,
        headerTintColor: "#3B82F6", // Bleu pour les boutons de navigation
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size, focused }) => (
            <Home
              color={focused ? "#3B82F6" : "#9CA3AF"}
              size={focused ? size + 2 : size}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="librairie"
        options={{
          title: "Librairie",
          tabBarIcon: ({ color, size, focused }) => (
            <Book
              color={focused ? "#3B82F6" : "#9CA3AF"}
              size={focused ? size + 2 : size}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="examens"
        options={{
          title: "Examens",
          tabBarIcon: ({ color, size, focused }) => (
            <FileText
              color={focused ? "#3B82F6" : "#9CA3AF"}
              size={focused ? size + 2 : size}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="communauté"
        options={{
          title: "Communauté",
          tabBarIcon: ({ color, size, focused }) => (
            <Users
              color={focused ? "#3B82F6" : "#9CA3AF"}
              size={focused ? size + 2 : size}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size, focused }) => (
            <User
              color={focused ? "#3B82F6" : "#9CA3AF"}
              size={focused ? size + 2 : size}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="PDFViewerScreen"
        options={{
          title: "Visionneuse PDF",
          href: null, // Masque l'onglet dans la barre de navigation
        }}
      />
    </Tabs>
  )
}
