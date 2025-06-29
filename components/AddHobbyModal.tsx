"use client"

import { useState } from "react"
import { Modal, StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native"
import { X, Save } from "lucide-react-native"
import { supabase } from "../lib/supabase"

const Colors = {
  primary: "#007AFF",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#8E8E93",
  lightGray: "#F2F2F7",
  gold: "#FFD700",
  textDark: "#000000",
  textLight: "#8E8E93",
}

interface AddHobbyModalProps {
  visible: boolean
  onClose: () => void
  userId: string
  onHobbyAdded: () => void
  hobby?: any
}

export default function AddHobbyModal({ visible, onClose, userId, onHobbyAdded, hobby }: AddHobbyModalProps) {
  const [nom, setNom] = useState(hobby?.nom || "")
  const [description, setDescription] = useState(hobby?.description || "")
  const [niveau, setNiveau] = useState(hobby?.niveau || "intermediaire")
  const [saving, setSaving] = useState(false)

  const niveaux = ["debutant", "intermediaire", "avance", "expert"]
  const isEditing = !!hobby

  const handleSave = async () => {
    if (!nom.trim()) {
      Alert.alert("Erreur", "Le nom du loisir est requis")
      return
    }

    try {
      setSaving(true)

      const hobbyData = {
        nom: nom.trim(),
        description: description.trim() || null,
        niveau,
      }

      if (isEditing) {
        const { error } = await supabase
          .from("loisirs")
          .update(hobbyData)
          .eq("id", hobby.id)
          .eq("utilisateur_id", userId)

        if (error) throw error
      } else {
        const { error } = await supabase.from("loisirs").insert({
          ...hobbyData,
          utilisateur_id: userId,
        })

        if (error) throw error
      }

      setNom("")
      setDescription("")
      setNiveau("intermediaire")

      onHobbyAdded()
      onClose()
      Alert.alert("Succès", `Loisir ${isEditing ? "mis à jour" : "ajouté"} avec succès !`)
    } catch (error) {
      console.error("Erreur:", error)
      Alert.alert("Erreur", `Impossible ${isEditing ? "de mettre à jour" : "d'ajouter"} le loisir`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? "Modifier le loisir" : "Ajouter un loisir"}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Save size={24} color={saving ? Colors.gray : Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom du loisir *</Text>
            <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Ex: Football, Lecture..." />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre loisir..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Niveau</Text>
            <View style={styles.niveauxContainer}>
              {niveaux.map((niv) => (
                <TouchableOpacity
                  key={niv}
                  style={[styles.niveauChip, niveau === niv && styles.niveauChipActive]}
                  onPress={() => setNiveau(niv)}
                >
                  <Text style={[styles.niveauText, niveau === niv && styles.niveauTextActive]}>
                    {niv.charAt(0).toUpperCase() + niv.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
  niveauxContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  niveauChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    marginRight: 8,
    marginBottom: 8,
  },
  niveauChipActive: {
    backgroundColor: Colors.gold,
  },
  niveauText: {
    fontSize: 14,
    color: Colors.textDark,
  },
  niveauTextActive: {
    color: Colors.white,
    fontWeight: "600",
  },
})
