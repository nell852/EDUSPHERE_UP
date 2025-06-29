"use client"
import { useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Alert, Switch } from "react-native"
import { ArrowLeft, Globe, Moon, Sun, LogOut, User, Lock, Bell, Shield } from "lucide-react-native"
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
  const [language, setLanguage] = useState("Français")
  const [darkMode, setDarkMode] = useState(false)
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
            router.replace("/auth/login")
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
        onPress: () => {
          setLanguage(lang)
          Alert.alert("Langue changée", `Langue définie sur ${lang}`)
        },
      })),
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
      "secure-text",
    )
  }

  const openEditProfile = () => {
    router.back()
    Alert.alert("Info", "Retour au profil pour éditer")
  }

  const openPrivacySettings = () => {
    Alert.alert("Paramètres de confidentialité", "Choisissez vos préférences de confidentialité :", [
      {
        text: "Profil public",
        onPress: () => Alert.alert("Succès", "Profil défini comme public"),
      },
      {
        text: "Profil privé",
        onPress: () => Alert.alert("Succès", "Profil défini comme privé"),
      },
      {
        text: "Visible aux collègues uniquement",
        onPress: () => Alert.alert("Succès", "Profil visible aux collègues uniquement"),
      },
      { text: "Annuler", style: "cancel" },
    ])
  }

  const currentColors = darkMode
    ? {
        ...Colors,
        white: Colors.black,
        black: Colors.white,
        background: Colors.darkGray,
        lightGray: Colors.gray,
        textDark: Colors.white,
        textLight: Colors.lightGray,
      }
    : Colors

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: currentColors.white, borderBottomColor: currentColors.lightGray }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={currentColors.textDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentColors.textDark }]}>Paramètres</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Settings Options */}
      <View style={styles.content}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentColors.textDark }]}>Compte</Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: currentColors.white }]}
            onPress={openEditProfile}
          >
            <User size={20} color={Colors.primary} />
            <Text style={[styles.settingText, { color: currentColors.textDark }]}>Modifier le profil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: currentColors.white }]}
            onPress={changePassword}
          >
            <Lock size={20} color={Colors.primary} />
            <Text style={[styles.settingText, { color: currentColors.textDark }]}>Changer le mot de passe</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentColors.textDark }]}>Préférences</Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: currentColors.white }]}
            onPress={selectLanguage}
          >
            <Globe size={20} color={Colors.primary} />
            <Text style={[styles.settingText, { color: currentColors.textDark }]}>Langue</Text>
            <Text style={[styles.settingValue, { color: currentColors.textLight }]}>{language}</Text>
          </TouchableOpacity>

          <View style={[styles.settingItem, { backgroundColor: currentColors.white }]}>
            {darkMode ? <Moon size={20} color={Colors.primary} /> : <Sun size={20} color={Colors.primary} />}
            <Text style={[styles.settingText, { color: currentColors.textDark }]}>Mode sombre</Text>
            <Switch
              value={darkMode}
              onValueChange={(value) => {
                setDarkMode(value)
                Alert.alert("Mode sombre", value ? "Mode sombre activé" : "Mode clair activé")
              }}
              trackColor={{ false: Colors.lightGray, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: currentColors.white }]}>
            <Bell size={20} color={Colors.primary} />
            <Text style={[styles.settingText, { color: currentColors.textDark }]}>Notifications</Text>
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
          <Text style={[styles.sectionTitle, { color: currentColors.textDark }]}>Sécurité</Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: currentColors.white }]}
            onPress={openPrivacySettings}
          >
            <Shield size={20} color={Colors.primary} />
            <Text style={[styles.settingText, { color: currentColors.textDark }]}>Confidentialité</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: currentColors.white, borderColor: Colors.danger }]}
          onPress={signOut}
        >
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
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
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.danger,
    marginLeft: 12,
    fontWeight: "600",
  },
})
