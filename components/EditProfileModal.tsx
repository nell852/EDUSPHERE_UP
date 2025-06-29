"use client"

import { useState } from "react"
import { Modal, StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native"
import { X, Save } from "lucide-react-native"
import { userService } from "../services/userService"
import { supabase } from "../lib/supabase"

const Colors = {
  primary: "#007AFF",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#8E8E93",
  lightGray: "#F2F2F7",
  textDark: "#000000",
  textLight: "#8E8E93",
}

interface EditProfileModalProps {
  visible: boolean
  onClose: () => void
  profile: any
  onSave: (updatedProfile: any) => void
}

export default function EditProfileModal({ visible, onClose, profile, onSave }: EditProfileModalProps) {
  const [nom, setNom] = useState(profile?.nom || "")
  const [prenom, setPrenom] = useState(profile?.prenom || "")
  const [email, setEmail] = useState(profile?.email || "")
  const [dateNaissance, setDateNaissance] = useState(profile?.date_de_naissance || "")
  const [sexe, setSexe] = useState(profile?.sexe || "")
  const [telephone, setTelephone] = useState(profile?.telephone || "")
  const [adresse, setAdresse] = useState(profile?.adresse || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [saving, setSaving] = useState(false)
  const [matricule, setMatricule] = useState(profile?.matricule || "")

  // Options standardisées pour le sexe
  const sexeOptions = ["Masculin", "Féminin", "Autre"]

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validation des données
      if (!nom.trim() || !prenom.trim()) {
        Alert.alert("Erreur", "Le nom et le prénom sont requis")
        return
      }

      // Validation de la date de naissance
      if (dateNaissance && dateNaissance.trim()) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(dateNaissance.trim())) {
          Alert.alert("Erreur", "Format de date invalide. Utilisez YYYY-MM-DD")
          return
        }

        const date = new Date(dateNaissance.trim())
        const today = new Date()
        const minDate = new Date("1900-01-01")

        if (date > today || date < minDate) {
          Alert.alert("Erreur", "Date de naissance invalide")
          return
        }
      }

      // Validation du sexe
      if (sexe && sexe.trim() && !sexeOptions.includes(sexe.trim())) {
        Alert.alert("Erreur", "Veuillez sélectionner une option valide pour le sexe")
        return
      }

      console.log("🔄 Mise à jour du profil avec les données:", {
        nom: nom.trim(),
        prenom: prenom.trim(),
        matricule: matricule.trim(),
        date_de_naissance: dateNaissance.trim() || null,
        sexe: sexe.trim() || null,
      })

      const updatedProfile = await userService.createOrUpdateProfile({
        nom: nom.trim(),
        prenom: prenom.trim(),
        matricule: matricule.trim(),
        date_de_naissance: dateNaissance.trim() || undefined,
        sexe: sexe.trim() || undefined,
        photo_profil_url: profile?.photo_profil_url,
      })

      // Mettre à jour les champs supplémentaires directement dans la base de données
      try {
        const { error: updateError } = await supabase
          .from("utilisateurs")
          .update({
            telephone: telephone.trim() || null,
            adresse: adresse.trim() || null,
            bio: bio.trim() || null,
          })
          .eq("id", profile?.id)

        if (updateError) {
          console.warn("⚠️ Impossible de mettre à jour les champs supplémentaires:", updateError)
        } else {
          console.log("✅ Champs supplémentaires mis à jour")
        }
      } catch (error) {
        console.warn("⚠️ Erreur lors de la mise à jour des champs supplémentaires:", error)
      }

      // Mettre à jour l'email séparément si nécessaire
      if (email.trim() !== profile?.email) {
        try {
          const { error: emailError } = await supabase.auth.updateUser({
            email: email.trim(),
          })
          if (emailError) {
            console.warn("⚠️ Impossible de mettre à jour l'email:", emailError)
          } else {
            console.log("✅ Email mis à jour")
          }
        } catch (error) {
          console.warn("⚠️ Erreur lors de la mise à jour de l'email:", error)
        }
      }

      onSave(updatedProfile)
      onClose()
      Alert.alert("Succès", "Profil mis à jour avec succès !")
    } catch (error: any) {
      console.error("❌ Erreur lors de la sauvegarde:", error)

      let errorMessage = "Impossible de sauvegarder le profil"

      if (error.code === "23514") {
        errorMessage = "Données invalides. Vérifiez le format de vos informations."
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`
      }

      Alert.alert("Erreur", errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const selectSexe = () => {
    Alert.alert("Sélectionner le sexe", "", [
      ...sexeOptions.map((option) => ({
        text: option,
        onPress: () => setSexe(option),
      })),
      { text: "Annuler", style: "cancel" },
    ])
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier le profil</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Save size={24} color={saving ? Colors.gray : Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} placeholder="Votre prénom" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Votre nom" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="votre.email@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de naissance</Text>
            <TextInput
              style={styles.input}
              value={dateNaissance}
              onChangeText={setDateNaissance}
              placeholder="YYYY-MM-DD (ex: 1995-06-15)"
            />
            <Text style={styles.helpText}>Format: YYYY-MM-DD</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sexe</Text>
            <TouchableOpacity style={styles.selectButton} onPress={selectSexe}>
              <Text style={[styles.selectButtonText, sexe ? styles.selectButtonTextSelected : null]}>
                {sexe || "Sélectionner..."}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={telephone}
              onChangeText={setTelephone}
              placeholder="+33 6 12 34 56 78"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={adresse}
              onChangeText={setAdresse}
              placeholder="Votre adresse"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Parlez-nous de vous..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Matricule</Text>
            <TextInput
              style={styles.input}
              value={matricule}
              onChangeText={setMatricule}
              placeholder="Votre matricule"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.black,
  },
  content: {
    flex: 1,
    padding: 16,
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  selectButton: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  selectButtonText: {
    fontSize: 16,
    color: Colors.gray,
  },
  selectButtonTextSelected: {
    color: Colors.black,
  },
  helpText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: "italic",
  },
})
