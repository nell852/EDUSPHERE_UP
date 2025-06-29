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

interface AddLanguageModalProps {
  visible: boolean
  onClose: () => void
  userId: string
  onLanguageAdded: () => void
  language?: any
}

export default function AddLanguageModal({
  visible,
  onClose,
  userId,
  onLanguageAdded,
  language,
}: AddLanguageModalProps) {
  const [langue, setLangue] = useState(language?.langue || "")
  const [niveau, setNiveau] = useState(language?.niveau || "intermediaire")
  const [certification, setCertification] = useState(language?.certification || "")
  const [saving, setSaving] = useState(false)

  const niveaux = ["debutant", "intermediaire", "avance", "natif"]
  const isEditing = !!language

  const handleSave = async () => {
    if (!langue.trim()) {
      Alert.alert("Erreur", "Le nom de la langue est requis")
      return
    }

    try {
      setSaving(true)

      const languageData = {
        langue: langue.trim(),
        niveau,
        certification: certification.trim() || null,
      }

      if (isEditing) {
        const { error } = await supabase
          .from("langues_parlees")
          .update(languageData)
          .eq("id", language.id)
          .eq("utilisateur_id", userId)

        if (error) throw error
      } else {
        const { error } = await supabase.from("langues_parlees").insert({
          ...languageData,
          utilisateur_id: userId,
        })

        if (error) throw error
      }

      setLangue("")
      setNiveau("intermediaire")
      setCertification("")

      onLanguageAdded()
      onClose()
      Alert.alert("Succès", `Langue ${isEditing ? "mise à jour" : "ajoutée"} avec succès !`)
    } catch (error) {
      console.error("Erreur:", error)
      Alert.alert("Erreur", `Impossible ${isEditing ? "de mettre à jour" : "d'ajouter"} la langue`)
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
          <Text style={styles.headerTitle}>{isEditing ? "Modifier la langue" : "Ajouter une langue"}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Save size={24} color={saving ? Colors.gray : Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Langue *</Text>
            <TextInput
              style={styles.input}
              value={langue}
              onChangeText={setLangue}
              placeholder="Ex: Anglais, Espagnol..."
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Certification</Text>
            <TextInput
              style={styles.input}
              value={certification}
              onChangeText={setCertification}
              placeholder="Ex: TOEFL, DELE, DELF..."
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
