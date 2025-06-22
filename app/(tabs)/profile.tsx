"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import { Camera, Save, User as UserIcon } from "lucide-react-native"
import { userService } from "../../services/userService"
import { supabase } from "../../lib/supabase"
import * as ImagePicker from "expo-image-picker"

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
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  // États pour l'édition
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [matricule, setMatricule] = useState("")
  const [dateNaissance, setDateNaissance] = useState("")
  const [sexe, setSexe] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      // S'assurer que le profil existe
      const userProfile = await userService.ensureProfileExists()
      setProfile(userProfile)
      
      // Remplir les champs d'édition
      setNom(userProfile.nom || "")
      setPrenom(userProfile.prenom || "")
      setMatricule(userProfile.matricule || "")
      setDateNaissance(userProfile.date_de_naissance || "")
      setSexe(userProfile.sexe || "")
      setPhotoUrl(userProfile.photo_profil_url || "")
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error)
      Alert.alert("Erreur", "Impossible de charger le profil")
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      
      const updatedProfile = await userService.createOrUpdateProfile({
        nom: nom.trim(),
        prenom: prenom.trim(),
        matricule: matricule.trim(),
        date_de_naissance: dateNaissance || undefined,
        sexe: sexe || undefined,
        photo_profil_url: photoUrl || undefined,
      })

      setProfile(updatedProfile)
      setEditing(false)
      Alert.alert("Succès", "Profil mis à jour avec succès !")
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      Alert.alert("Erreur", "Impossible de sauvegarder le profil")
    } finally {
      setSaving(false)
    }
  }

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert("Erreur", "Permission d'accès à la galerie refusée")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Ici vous pourriez uploader l'image vers Supabase Storage
      setPhotoUrl(result.assets[0].uri)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      Alert.alert("Déconnexion", "Vous avez été déconnecté avec succès")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      Alert.alert("Erreur", "Impossible de se déconnecter")
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(!editing)}
          >
            <Text style={styles.editButtonText}>
              {editing ? "Annuler" : "Modifier"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Photo de profil */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.placeholderPhoto}>
                <UserIcon size={40} color={Colors.gray} />
              </View>
            )}
            {editing && (
              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <Camera size={20} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.userName}>
            {profile?.prenom} {profile?.nom}
          </Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
        </View>

        {/* Informations */}
        <View style={styles.infoSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={prenom}
              onChangeText={setPrenom}
              editable={editing}
              placeholder="Votre prénom"
              placeholderTextColor={Colors.gray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={nom}
              onChangeText={setNom}
              editable={editing}
              placeholder="Votre nom"
              placeholderTextColor={Colors.gray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Matricule</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={matricule}
              onChangeText={setMatricule}
              editable={editing}
              placeholder="Votre matricule"
              placeholderTextColor={Colors.gray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de naissance</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={dateNaissance}
              onChangeText={setDateNaissance}
              editable={editing}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.gray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sexe</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={sexe}
              onChangeText={setSexe}
              editable={editing}
              placeholder="M/F"
              placeholderTextColor={Colors.gray}
            />
          </View>
        </View>

        {/* Boutons d'action */}
        {editing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Save size={20} color={Colors.white} />
                  <Text style={styles.saveButtonText}>Sauvegarder</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.gray,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.black,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  editButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  photoSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: Colors.white,
    marginBottom: 20,
  },
  photoContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.black,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.gray,
  },
  infoSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  inputDisabled: {
    backgroundColor: Colors.background,
    color: Colors.darkGray,
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  signOutButton: {
    backgroundColor: Colors.danger,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  signOutButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
})
