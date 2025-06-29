"use client"

import { useState } from "react"
import { Modal, StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native"
import { X, Plus } from "lucide-react-native"
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

interface AddSkillModalProps {
  visible: boolean
  onClose: () => void
  userId: string
  onSkillAdded: () => void
  skill?: any // Ajouter cette ligne
}

export default function AddSkillModal({ visible, onClose, userId, onSkillAdded, skill }: AddSkillModalProps) {
  const [nom, setNom] = useState(skill?.nom || "")
  const [description, setDescription] = useState(skill?.description || "")
  const [niveau, setNiveau] = useState(skill?.niveau || "intermediaire")
  const [experience, setExperience] = useState(skill?.experience || "")
  const [certifications, setCertifications] = useState(skill?.certifications || "")
  const [typeCompetence, setTypeCompetence] = useState(skill?.type || "competence_professionnelle")
  const [saving, setSaving] = useState(false)

  const isEditing = !!skill

  const niveaux = ["debutant", "intermediaire", "avance", "expert"]
  const typesCompetences = [
    { value: "competence_professionnelle", label: "Compétence Professionnelle" },
    { value: "competence_technique", label: "Compétence Technique" },
    { value: "competence_transversale", label: "Compétence Transversale" },
    { value: "certification", label: "Certification" },
    { value: "formation", label: "Formation" },
  ]

  const handleSave = async () => {
    if (!nom.trim()) {
      Alert.alert("Erreur", "Le nom de la compétence est requis")
      return
    }

    try {
      setSaving(true)

      const baseData = {
        nom: nom.trim(),
        niveau,
        type: typeCompetence,
      }

      if (isEditing) {
        // Mode édition
        try {
          const { error } = await supabase
            .from("competences")
            .update({
              ...baseData,
              description: description.trim() || null,
              experience: experience.trim() || null,
              certifications: certifications.trim() || null,
            })
            .eq("id", skill.id)
            .eq("utilisateur_id", userId)

          if (error) throw error
        } catch (error: any) {
          if (error.code === "PGRST204" || error.message?.includes("column")) {
            console.warn("Colonnes étendues non disponibles, mise à jour des données de base seulement")
            const { error: basicError } = await supabase
              .from("competences")
              .update(baseData)
              .eq("id", skill.id)
              .eq("utilisateur_id", userId)
            if (basicError) throw basicError
          } else {
            throw error
          }
        }
      } else {
        // Mode création (code existant)
        try {
          const { error } = await supabase.from("competences").insert({
            ...baseData,
            utilisateur_id: userId,
            description: description.trim() || null,
            experience: experience.trim() || null,
            certifications: certifications.trim() || null,
          })

          if (error) throw error
        } catch (error: any) {
          if (error.code === "PGRST204" || error.message?.includes("column")) {
            console.warn("Colonnes étendues non disponibles, insertion des données de base seulement")
            const { error: basicError } = await supabase
              .from("competences")
              .insert({ ...baseData, utilisateur_id: userId })
            if (basicError) throw basicError
          } else {
            throw error
          }
        }
      }

      // Reset form seulement si ce n'est pas une édition
      if (!isEditing) {
        setNom("")
        setDescription("")
        setNiveau("intermediaire")
        setExperience("")
        setCertifications("")
        setTypeCompetence("competence_professionnelle")
      }

      onSkillAdded()
      onClose()
      Alert.alert("Succès", `Compétence ${isEditing ? "mise à jour" : "ajoutée"} avec succès !`)
    } catch (error) {
      console.error("Erreur:", error)
      Alert.alert("Erreur", `Impossible ${isEditing ? "de mettre à jour" : "d'ajouter"} la compétence`)
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
          <Text style={styles.headerTitle}>{isEditing ? "Modifier la compétence" : "Ajouter une compétence"}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Plus size={24} color={saving ? Colors.gray : Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom de la compétence *</Text>
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={setNom}
              placeholder="Ex: Développement Web, Design UX/UI..."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type de compétence</Text>
            <View style={styles.typesContainer}>
              {typesCompetences.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.typeChip, typeCompetence === type.value && styles.typeChipActive]}
                  onPress={() => setTypeCompetence(type.value)}
                >
                  <Text style={[styles.typeText, typeCompetence === type.value && styles.typeTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre compétence en détail..."
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expérience</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={experience}
              onChangeText={setExperience}
              placeholder="Décrivez votre expérience avec cette compétence..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Certifications</Text>
            <TextInput
              style={styles.input}
              value={certifications}
              onChangeText={setCertifications}
              placeholder="Certifications obtenues (optionnel)"
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
  typesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    marginRight: 8,
    marginBottom: 8,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
  },
  typeText: {
    fontSize: 12,
    color: Colors.textDark,
  },
  typeTextActive: {
    color: Colors.white,
    fontWeight: "600",
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
