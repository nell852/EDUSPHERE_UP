"use client"

import { useState } from "react"
import { Modal, StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from "react-native"
import { X, Save, Plus } from "lucide-react-native"
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
  success: "#34C759",
  warning: "#FF9500",
}

interface AddProjectModalProps {
  visible: boolean
  onClose: () => void
  userId: string
  onProjectAdded: () => void
  project?: any // Pour l'édition
}

export default function AddProjectModal({ visible, onClose, userId, onProjectAdded, project }: AddProjectModalProps) {
  const [nom, setNom] = useState(project?.nom || "")
  const [description, setDescription] = useState(project?.description || "")
  const [langagesUtilises, setLangagesUtilises] = useState<string[]>(project?.langages_utilises || [])
  const [outilsUtilises, setOutilsUtilises] = useState(project?.outils_utilises || "")
  const [interfacePrincipale, setInterfacePrincipale] = useState(project?.interface_principale || "")
  const [codeSource, setCodeSource] = useState(project?.code_source || "")
  const [visibilite, setVisibilite] = useState(project?.visibilite || "prive")
  const [statut, setStatut] = useState(project?.statut || "en_cours")
  const [newLanguage, setNewLanguage] = useState("")
  const [saving, setSaving] = useState(false)

  const isPublic = visibilite === "public"
  const isEditing = !!project

  const addLanguage = () => {
    if (newLanguage.trim() && !langagesUtilises.includes(newLanguage.trim())) {
      setLangagesUtilises([...langagesUtilises, newLanguage.trim()])
      setNewLanguage("")
    }
  }

  const removeLanguage = (language: string) => {
    setLangagesUtilises(langagesUtilises.filter((lang) => lang !== language))
  }

  const handleSave = async () => {
    if (!nom.trim()) {
      Alert.alert("Erreur", "Le nom du projet est requis")
      return
    }

    try {
      setSaving(true)

      // Données de base qui existent toujours
      const baseProjectData = {
        nom: nom.trim(),
        description: description.trim() || null,
        langages_utilises: langagesUtilises,
        visibilite,
        statut,
        updated_at: new Date().toISOString(),
      }

      // Données étendues qui peuvent ne pas exister
      const extendedProjectData = {
        outils_utilises: outilsUtilises.trim() || null,
        interface_principale: interfacePrincipale.trim() || null,
        code_source: codeSource.trim() || null,
      }

      if (isEditing) {
        // Mode édition - essayer d'abord avec toutes les colonnes
        try {
          const { error } = await supabase
            .from("projets")
            .update({
              ...baseProjectData,
              ...extendedProjectData,
            })
            .eq("id", project.id)
            .eq("proprietaire_id", userId)

          if (error) throw error

          console.log("✅ Projet mis à jour avec toutes les colonnes")
        } catch (error: any) {
          console.warn("⚠️ Erreur avec colonnes étendues:", error.message)

          if (
            error.code === "PGRST204" ||
            error.message?.includes("column") ||
            error.message?.includes("does not exist")
          ) {
            console.log("🔄 Tentative avec colonnes de base seulement...")

            const { error: basicError } = await supabase
              .from("projets")
              .update(baseProjectData)
              .eq("id", project.id)
              .eq("proprietaire_id", userId)

            if (basicError) throw basicError
            console.log("✅ Projet mis à jour avec colonnes de base")
          } else {
            throw error
          }
        }
      } else {
        // Mode création - essayer d'abord avec toutes les colonnes
        try {
          const { error } = await supabase.from("projets").insert({
            ...baseProjectData,
            ...extendedProjectData,
            proprietaire_id: userId,
          })

          if (error) throw error
          console.log("✅ Projet créé avec toutes les colonnes")
        } catch (error: any) {
          console.warn("⚠️ Erreur avec colonnes étendues:", error.message)

          if (
            error.code === "PGRST204" ||
            error.message?.includes("column") ||
            error.message?.includes("does not exist")
          ) {
            console.log("🔄 Tentative avec colonnes de base seulement...")

            const { error: basicError } = await supabase.from("projets").insert({
              ...baseProjectData,
              proprietaire_id: userId,
            })

            if (basicError) throw basicError
            console.log("✅ Projet créé avec colonnes de base")
          } else {
            throw error
          }
        }
      }

      // Reset form seulement si ce n'est pas une édition
      if (!isEditing) {
        setNom("")
        setDescription("")
        setLangagesUtilises([])
        setOutilsUtilises("")
        setInterfacePrincipale("")
        setCodeSource("")
        setVisibilite("prive")
        setStatut("en_cours")
      }

      onProjectAdded()
      onClose()
      Alert.alert("Succès", `Projet ${isEditing ? "mis à jour" : "créé"} avec succès !`)
    } catch (error: any) {
      console.error("❌ Erreur finale:", error)
      Alert.alert(
        "Erreur",
        `Impossible de ${isEditing ? "mettre à jour" : "créer"} le projet.\n\nDétails: ${error.message || "Erreur inconnue"}`,
      )
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
          <Text style={styles.headerTitle}>{isEditing ? "Modifier le projet" : "Nouveau projet"}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Save size={24} color={saving ? Colors.gray : Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom du projet *</Text>
            <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Nom de votre projet" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre projet..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Langages utilisés</Text>
            <View style={styles.languageInputContainer}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                value={newLanguage}
                onChangeText={setNewLanguage}
                placeholder="Ajouter un langage"
                onSubmitEditing={addLanguage}
              />
              <TouchableOpacity style={styles.addLanguageButton} onPress={addLanguage}>
                <Plus size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.languagesContainer}>
              {langagesUtilises.map((language, index) => (
                <TouchableOpacity key={index} style={styles.languageChip} onPress={() => removeLanguage(language)}>
                  <Text style={styles.languageText}>{language}</Text>
                  <X size={14} color={Colors.gray} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Outils utilisés</Text>
            <TextInput
              style={styles.input}
              value={outilsUtilises}
              onChangeText={setOutilsUtilises}
              placeholder="Ex: VS Code, Git, Docker..."
            />
            <Text style={styles.helpText}>Cette information sera sauvegardée si la base de données le supporte</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interface principale</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={interfacePrincipale}
              onChangeText={setInterfacePrincipale}
              placeholder="Décrivez l'interface principale..."
              multiline
              numberOfLines={3}
            />
            <Text style={styles.helpText}>Cette information sera sauvegardée si la base de données le supporte</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Code source (URL)</Text>
            <TextInput
              style={styles.input}
              value={codeSource}
              onChangeText={setCodeSource}
              placeholder="https://github.com/..."
              autoCapitalize="none"
            />
            <Text style={styles.helpText}>Cette information sera sauvegardée si la base de données le supporte</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Statut</Text>
            <View style={styles.statusContainer}>
              {["en_cours", "termine", "pause", "abandonne"].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusChip, statut === status && styles.statusChipActive]}
                  onPress={() => setStatut(status)}
                >
                  <Text style={[styles.statusText, statut === status && styles.statusTextActive]}>
                    {status === "en_cours"
                      ? "En cours"
                      : status === "termine"
                        ? "Terminé"
                        : status === "pause"
                          ? "En pause"
                          : "Abandonné"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.visibilityContainer}>
              <Text style={styles.label}>Projet public</Text>
              <Switch
                value={isPublic}
                onValueChange={(value) => setVisibilite(value ? "public" : "prive")}
                trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
            <Text style={styles.visibilityDescription}>
              {isPublic ? "Votre projet sera visible par tous les utilisateurs" : "Seul vous pouvez voir ce projet"}
            </Text>
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
  helpText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: "italic",
  },
  languageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addLanguageButton: {
    width: 40,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  languagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  languageChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  languageText: {
    fontSize: 14,
    color: Colors.textDark,
    marginRight: 4,
  },
  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    marginRight: 8,
    marginBottom: 8,
  },
  statusChipActive: {
    backgroundColor: Colors.primary,
  },
  statusText: {
    fontSize: 14,
    color: Colors.textDark,
  },
  statusTextActive: {
    color: Colors.white,
    fontWeight: "600",
  },
  visibilityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  visibilityDescription: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
})
