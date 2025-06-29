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

  const handleSave = async () => {
    try {
      setSaving(true)
      const updatedProfile = await userService.createOrUpdateProfile({
        nom: nom.trim(),
        prenom: prenom.trim(),
        matricule: matricule.trim(),
        date_de_naissance: dateNaissance || undefined,
        sexe: sexe || undefined,
        photo_profil_url: profile?.photo_profil_url,
      })

      // Mettre à jour les champs supplémentaires directement dans la base de données
      const { error: updateError } = await supabase
        .from("utilisateurs")
        .update({
          telephone: telephone.trim() || null,
          adresse: adresse.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("id", profile?.id)

      if (updateError) {
        console.warn("Impossible de mettre à jour les champs supplémentaires:", updateError)
      }

      // Mettre à jour l'email séparément si nécessaire
      if (email.trim() !== profile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email.trim(),
        })
        if (emailError) {
          console.warn("Impossible de mettre à jour l'email:", emailError)
        }
      }

      onSave(updatedProfile)
      onClose()
      Alert.alert("Succès", "Profil mis à jour avec succès !")
    } catch (error) {
      console.error("Erreur:", error)
      Alert.alert("Erreur", "Impossible de sauvegarder le profil")
    } finally {
      setSaving(false)
    }
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
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sexe</Text>
            <TextInput style={styles.input} value={sexe} onChangeText={setSexe} placeholder="Masculin/Féminin/Autre" />
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
})
