"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
} from "react-native"
import {
  ArrowLeft,
  Globe,
  Moon,
  Sun,
  LogOut,
  User,
  Lock,
  Bell,
  Shield,
} from "lucide-react-native"
import { supabase } from "../lib/supabase"
import { router } from "expo-router"

const Colors = {
  primary: "#007AFF",
  secondary: "#5856D6",
  success: "#34C759",
  warning: "#FF9500",
  danger: "#FF3B30",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#8E8E93",
  lightGray: "#F2F2F7",
  darkGray: "#48484A",
  background: "#F2F2F7",
  gold: "#FFD700",
  textDark: "#000000",
  textLight: "#8E8E93",
}

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState("Français")
  const [notifications, setNotifications] = useState(true)

  const languages = ["Français", "English", "Español", "العربية"]

  const signOut = async () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.auth.signOut()
            router.replace("/login")
          } catch (error) {
            console.error("Erreur lors de la déconnexion:", error)
            Alert.alert("Erreur", "Impossible de se déconnecter")
          }
        },
      },
    ])
  }

  const selectLanguage = () => {
    Alert.alert(
      "Sélectionner la langue",
      "",
      languages.map((lang) => ({
        text: lang,
        onPress: () => setLanguage(lang),
      }))
    )
  }

  const changePassword = () => {
    Alert.prompt(
      "Changer le mot de passe",
      "Entrez votre nouveau mot de passe",
      async (newPassword) => {
        if (newPassword && newPassword.length >= 6) {
          try {
            const { error } = await supabase.auth.updateUser({
              password: newPassword,
            })
            if (error) throw error
            Alert.alert("Succès", "Mot de passe mis à jour avec succès !")
          } catch (error) {
            console.error("Erreur:", error)
            Alert.alert("Erreur", "Impossible de changer le mot de passe")
          }
        } else {
          Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères")
        }
      },
      "secure-text"
    )
  }

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, darkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={darkMode ? Colors.white : Colors.black} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode && styles.darkText]}>Paramètres</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Settings Options */}
      <View style={styles.content}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>Compte</Text>
          
          <TouchableOpacity style={[styles.settingItem, darkMode && styles.darkSettingItem]}>
            <User size={20} color={Colors.primary} />
            <Text style={[styles.settingText, darkMode && styles.darkText]}>Modifier le profil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, darkMode && styles.darkSettingItem]} onPress={changePassword}>
            <Lock size={20} color={Colors.primary} />
            <Text style={[styles.settingText, darkMode && styles.darkText]}>Changer le mot de passe</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>Préférences</Text>
          
          <TouchableOpacity style={[styles.settingItem, darkMode && styles.darkSettingItem]} onPress={selectLanguage}>
            <Globe size={20} color={Colors.primary} />
            <Text style={[styles.settingText, darkMode && styles.darkText]}>Langue</Text>
            <Text style={[styles.settingValue, darkMode && styles.darkTextLight]}>{language}</Text>
          </TouchableOpacity>

          <View style={[styles.settingItem, darkMode && styles.darkSettingItem]}>
            {darkMode ? <Moon size={20} color={Colors.primary} /> : <Sun size={20} color={Colors.primary} />}
            <Text style={[styles.settingText, darkMode && styles.darkText]}>Mode sombre</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: Colors.lightGray, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={[styles.settingItem, darkMode && styles.darkSettingItem]}>
            <Bell size={20} color={Colors.primary} />
            <Text style={[styles.settingText, darkMode && styles.darkText]}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: Colors.lightGray, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>Sécurité</Text>
          
          <TouchableOpacity style={[styles.settingItem, darkMode && styles.darkSettingItem]}>
            <Shield size={20} color={Colors.primary} />
            <Text style={[styles.settingText, darkMode && styles.darkText]}>Confidentialité</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutButton, darkMode && styles.darkLogoutButton]} onPress={signOut}>
          <LogOut size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  darkContainer: {
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  darkHeader: {
    backgroundColor: Colors.darkGray,
    borderBottomColor: Colors.gray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.black,
  },
  darkText: {
    color: Colors.white,
  },
  darkTextLight: {
    color: Colors.gray,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textDark,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  darkSettingItem: {
    backgroundColor: Colors.darkGray,
  },
  settingText: {
    fontSize: 16,
    color: Colors.textDark,
    marginLeft: 12,
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.textLight,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  darkLogoutButton: {
    backgroundColor: Colors.darkGray,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.danger,
    marginLeft: 12,
    fontWeight: "600",
  },
})
