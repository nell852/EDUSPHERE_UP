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
  Linking,
} from "react-native"
import {
  Camera,
  User as UserIcon,
  Settings,
  Users,
  Code,
  FileText,
  Clock,
  ChevronRight,
  Edit3,
  X,
} from "lucide-react-native"
import { userService } from "../../services/userService"
import { supabase } from "../../lib/supabase"
import * as ImagePicker from "expo-image-picker"
import { StatusBar } from "expo-status-bar"
import EditProfileModal from "../../components/EditProfileModal"
import AddSkillModal from "../../components/AddSkillModal"
import { router } from "expo-router"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"
import AddProjectModal from "../../components/AddProjectModal"
import AddLanguageModal from "../../components/AddLanguageModal"
import AddHobbyModal from "../../components/AddHobbyModal"

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

// Types pour une meilleure gestion TypeScript
interface UserProfile {
  id: string
  nom: string
  prenom: string
  matricule: string
  email: string
  date_de_naissance?: string
  sexe?: string
  photo_profil_url?: string
}

interface Project {
  id: string
  name: string
  description: string
  languages: string[]
  collaborators: number
  lastUpdated: string
  status: string
  visibility: string
  outils_utilises?: string
  interface_principale?: string
  code_source?: string
}

interface Colleague {
  id: string
  name: string
  photo?: string
  commonClubs: number
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  // États pour l'édition (existants)
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [matricule, setMatricule] = useState("")
  const [dateNaissance, setDateNaissance] = useState("")
  const [sexe, setSexe] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")

  // Nouveaux états pour le design dynamique
  const [activeTab, setActiveTab] = useState("journey")
  const [programmingLanguages, setProgrammingLanguages] = useState<string[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [colleagues, setColleagues] = useState<Colleague[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [showSkillModal, setShowSkillModal] = useState(false)
  const [skills, setSkills] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])

  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [showHobbyModal, setShowHobbyModal] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [editingSkill, setEditingSkill] = useState<any>(null)
  const [editingLanguage, setEditingLanguage] = useState<any>(null)
  const [editingHobby, setEditingHobby] = useState<any>(null)
  const [spokenLanguages, setSpokenLanguages] = useState<any[]>([])
  const [hobbies, setHobbies] = useState<any[]>([])

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile?.id) {
      loadUserData()

      // Délai pour éviter les souscriptions multiples rapides
      const timer = setTimeout(() => {
        const cleanup = setupRealtimeSubscriptions()
        return cleanup
      }, 1000)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [profile?.id])

  const loadProfile = async () => {
    try {
      setLoading(true)

      // S'assurer que le profil existe
      const userProfile = await userService.ensureProfileExists()
      setProfile({
        id: userProfile.id,
        nom: userProfile.nom ?? "",
        prenom: userProfile.prenom ?? "",
        matricule: userProfile.matricule ?? "",
        email: userProfile.email ?? "",
        date_de_naissance: userProfile.date_de_naissance ?? undefined,
        sexe: userProfile.sexe ?? undefined,
        photo_profil_url: userProfile.photo_profil_url ?? undefined,
      })

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

  const loadUserData = async () => {
    try {
      setLoadingData(true)
      const userId = profile?.id

      if (!userId) return

      // 1. Charger les compétences/langages depuis la table competences
      try {
        const { data: competencesData, error: competencesError } = await supabase
          .from("competences")
          .select("nom")
          .eq("utilisateur_id", userId)
          .eq("type", "langage_programmation")

        if (competencesError && competencesError.code !== "PGRST116") {
          console.error("Erreur compétences:", competencesError)
        } else {
          const languages = competencesData?.map((comp) => comp.nom) || []
          setProgrammingLanguages(languages)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des compétences:", error)
        setProgrammingLanguages([])
      }

      // 2. Charger les projets depuis la table projets - VERSION ROBUSTE
      try {
        const { data: userProjects, error: userProjectsError } = await supabase
          .from("projets")
          .select("*")
          .eq("proprietaire_id", userId)
          .order("updated_at", { ascending: false })

        if (userProjectsError) {
          console.error("Erreur projets:", userProjectsError)
          setProjects([])
        } else {
          const formattedProjects: Project[] = []

          for (const project of userProjects || []) {
            const { count: collaboratorsCount } = await supabase
              .from("projet_collaborateurs")
              .select("*", { count: "exact", head: true })
              .eq("projet_id", project.id)

            formattedProjects.push({
              id: project.id,
              name: project.nom,
              description: project.description || "Aucune description",
              languages: project.langages_utilises || [],
              collaborators: collaboratorsCount || 0,
              lastUpdated: formatTimeAgo(project.updated_at),
              status: project.statut || "en_cours",
              visibility: project.visibilite || "prive",
              // Ajouter les nouveaux champs avec des valeurs par défaut
              outils_utilises: project.outils_utilises || "",
              interface_principale: project.interface_principale || "",
              code_source: project.code_source || "",
            })
          }

          setProjects(formattedProjects)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des projets:", error)
        setProjects([])
      }

      // 3. Charger les compétences professionnelles
      try {
        const { data: skillsData, error: skillsError } = await supabase
          .from("competences")
          .select("*")
          .eq("utilisateur_id", userId)
          .in("type", [
            "competence_professionnelle",
            "competence_technique",
            "competence_transversale",
            "certification",
            "formation",
          ])
          .order("created_at", { ascending: false })

        if (!skillsError) {
          setSkills(skillsData || [])
        }
      } catch (error) {
        console.error("Erreur lors du chargement des compétences:", error)
        setSkills([])
      }

      // 4. Charger les langues parlées
      try {
        const { data: languagesData, error: languagesError } = await supabase
          .from("langues_parlees")
          .select("*")
          .eq("utilisateur_id", userId)
          .order("created_at", { ascending: false })

        if (!languagesError) {
          setSpokenLanguages(languagesData || [])
        }
      } catch (error) {
        console.error("Erreur lors du chargement des langues:", error)
        setSpokenLanguages([])
      }

      // 5. Charger les loisirs
      try {
        const { data: hobbiesData, error: hobbiesError } = await supabase
          .from("loisirs")
          .select("*")
          .eq("utilisateur_id", userId)
          .order("created_at", { ascending: false })

        if (!hobbiesError) {
          setHobbies(hobbiesData || [])
        }
      } catch (error) {
        console.error("Erreur lors du chargement des loisirs:", error)
        setHobbies([])
      }

      // 6. Charger les réalisations/badges
      const achievementsData = [
        {
          id: 1,
          name: "Premier pas",
          description: "Profil complété",
          earned: !!(profile?.nom && profile?.prenom && profile?.email),
          icon: "👤",
          progress: profile?.nom && profile?.prenom && profile?.email ? 100 : 0,
        },
        {
          id: 2,
          name: "Développeur",
          description: "Premier langage ajouté",
          earned: programmingLanguages.length > 0,
          icon: "💻",
          progress: Math.min((programmingLanguages.length / 1) * 100, 100),
        },
        {
          id: 3,
          name: "Polyglotte Tech",
          description: "Maîtrise 3+ langages",
          earned: programmingLanguages.length >= 3,
          icon: "🌟",
          progress: Math.min((programmingLanguages.length / 3) * 100, 100),
        },
        {
          id: 4,
          name: "Chef de projet",
          description: "Premier projet créé",
          earned: projects.length > 0,
          icon: "🚀",
          progress: Math.min((projects.length / 1) * 100, 100),
        },
        {
          id: 5,
          name: "Collaborateur",
          description: "Travaillé avec d'autres",
          earned: colleagues.length > 0,
          icon: "🤝",
          progress: Math.min((colleagues.length / 1) * 100, 100),
        },
        {
          id: 6,
          name: "Expert",
          description: "5+ compétences ajoutées",
          earned: skills.length >= 5,
          icon: "🏆",
          progress: Math.min((skills.length / 5) * 100, 100),
        },
        {
          id: 7,
          name: "Polyglotte",
          description: "Parle 2+ langues",
          earned: spokenLanguages.length >= 2,
          icon: "🌍",
          progress: Math.min((spokenLanguages.length / 2) * 100, 100),
        },
        {
          id: 8,
          name: "Équilibré",
          description: "3+ loisirs ajoutés",
          earned: hobbies.length >= 3,
          icon: "⚖️",
          progress: Math.min((hobbies.length / 3) * 100, 100),
        },
      ]
      setAchievements(achievementsData)

      // 7. Charger les collègues depuis les clubs
      try {
        const { data: userClubs, error: userClubsError } = await supabase
          .from("club_membres")
          .select("club_id")
          .eq("membre_id", userId)

        if (!userClubsError && userClubs && userClubs.length > 0) {
          const clubIds = userClubs.map((club) => club.club_id)

          const { data: clubMembers, error: clubMembersError } = await supabase
            .from("club_membres")
            .select(`
              membre_id,
              club_id,
              utilisateurs!inner(
                id,
                nom,
                prenom,
                photo_profil_url
              )
            `)
            .in("club_id", clubIds)
            .neq("membre_id", userId)

          if (!clubMembersError && clubMembers) {
            const uniqueColleagues = new Map<string, Colleague>()

            clubMembers.forEach((member: any) => {
              const colleague = member.utilisateurs

              if (colleague && typeof colleague === "object" && colleague.id) {
                const colleagueId = colleague.id

                if (!uniqueColleagues.has(colleagueId)) {
                  uniqueColleagues.set(colleagueId, {
                    id: colleagueId,
                    name: `${colleague.prenom || ""} ${colleague.nom || ""}`.trim(),
                    photo: colleague.photo_profil_url,
                    commonClubs: 1,
                  })
                } else {
                  const existing = uniqueColleagues.get(colleagueId)
                  if (existing) {
                    existing.commonClubs += 1
                  }
                }
              }
            })

            setColleagues(Array.from(uniqueColleagues.values()))
          } else {
            setColleagues([])
          }
        } else {
          setColleagues([])
        }
      } catch (error) {
        console.error("Erreur lors du chargement des collègues:", error)
        setColleagues([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const setupRealtimeSubscriptions = () => {
    if (!profile?.id) return () => {}

    // Créer un canal unique avec un nom spécifique
    const channelName = `projects_changes_${profile.id}_${Date.now()}`

    const projectsSubscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projets", filter: `proprietaire_id=eq.${profile.id}` },
        (payload) => {
          console.log("🔄 Changement détecté dans les projets:", payload)
          loadUserData()
        },
      )
      .subscribe((status) => {
        console.log("📡 Statut de souscription:", status)
      })

    return () => {
      console.log("🧹 Nettoyage de la souscription")
      supabase.removeChannel(projectsSubscription)
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "À l'instant"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} jours`
    return `${Math.floor(diffInHours / 168)} semaines`
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
      setProfile({
        ...updatedProfile,
        nom: updatedProfile.nom ?? "",
        prenom: updatedProfile.prenom ?? "",
        matricule: updatedProfile.matricule ?? "",
        email: updatedProfile.email ?? "",
        date_de_naissance: updatedProfile.date_de_naissance ?? undefined,
        sexe: updatedProfile.sexe ?? undefined,
        photo_profil_url: updatedProfile.photo_profil_url ?? undefined,
      })
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
      setPhotoUrl(result.assets[0].uri)
    }
  }

  const openSettings = () => {
    router.push("/settings")
  }

  const addLanguage = () => {
    Alert.prompt("Ajouter un langage", "Entrez le nom du langage de programmation", async (language) => {
      if (language && language.trim()) {
        try {
          const { error } = await supabase.from("competences").insert({
            utilisateur_id: profile?.id,
            nom: language.trim(),
            type: "langage_programmation",
            niveau: "intermediaire",
          })

          if (error && error.code !== "23505") {
            throw error
          }

          setProgrammingLanguages([...programmingLanguages, language.trim()])
          Alert.alert("Succès", "Langage ajouté avec succès !")
        } catch (error) {
          console.error("Erreur lors de l'ajout du langage:", error)
          Alert.alert("Erreur", "Impossible d'ajouter le langage")
        }
      }
    })
  }

  const removeLanguage = async (language: string) => {
    try {
      const { error } = await supabase
        .from("competences")
        .delete()
        .eq("utilisateur_id", profile?.id)
        .eq("nom", language)
        .eq("type", "langage_programmation")

      if (error) throw error

      setProgrammingLanguages(programmingLanguages.filter((lang) => lang !== language))
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      Alert.alert("Erreur", "Impossible de supprimer le langage")
    }
  }

  const addProject = () => {
    setEditingProject(null)
    setShowProjectModal(true)
  }

  const editProject = (project: any) => {
    setEditingProject(project)
    setShowProjectModal(true)
  }

  const deleteProject = async (projectId: string) => {
    Alert.alert("Supprimer le projet", "Êtes-vous sûr de vouloir supprimer ce projet ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("projets")
              .delete()
              .eq("id", projectId)
              .eq("proprietaire_id", profile?.id)

            if (error) throw error

            setProjects(projects.filter((p) => p.id !== projectId))
            Alert.alert("Succès", "Projet supprimé avec succès !")
          } catch (error) {
            console.error("Erreur lors de la suppression:", error)
            Alert.alert("Erreur", "Impossible de supprimer le projet")
          }
        },
      },
    ])
  }

  const editSkill = (skill: any) => {
    setEditingSkill(skill)
    setShowSkillModal(true)
  }

  const deleteSkill = async (skillId: string) => {
    Alert.alert("Supprimer la compétence", "Êtes-vous sûr de vouloir supprimer cette compétence ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("competences")
              .delete()
              .eq("id", skillId)
              .eq("utilisateur_id", profile?.id)

            if (error) throw error

            setSkills(skills.filter((s) => s.id !== skillId))
            Alert.alert("Succès", "Compétence supprimée avec succès !")
          } catch (error) {
            console.error("Erreur lors de la suppression:", error)
            Alert.alert("Erreur", "Impossible de supprimer la compétence")
          }
        },
      },
    ])
  }

  const addSpokenLanguage = () => {
    setEditingLanguage(null)
    setShowLanguageModal(true)
  }

  const editSpokenLanguage = (language: any) => {
    setEditingLanguage(language)
    setShowLanguageModal(true)
  }

  const deleteSpokenLanguage = async (languageId: string) => {
    Alert.alert("Supprimer la langue", "Êtes-vous sûr de vouloir supprimer cette langue ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("langues_parlees")
              .delete()
              .eq("id", languageId)
              .eq("utilisateur_id", profile?.id)

            if (error) throw error

            setSpokenLanguages(spokenLanguages.filter((l) => l.id !== languageId))
            Alert.alert("Succès", "Langue supprimée avec succès !")
          } catch (error) {
            console.error("Erreur lors de la suppression:", error)
            Alert.alert("Erreur", "Impossible de supprimer la langue")
          }
        },
      },
    ])
  }

  const addHobby = () => {
    setEditingHobby(null)
    setShowHobbyModal(true)
  }

  const editHobby = (hobby: any) => {
    setEditingHobby(hobby)
    setShowHobbyModal(true)
  }

  const deleteHobby = async (hobbyId: string) => {
    Alert.alert("Supprimer le loisir", "Êtes-vous sûr de vouloir supprimer ce loisir ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("loisirs")
              .delete()
              .eq("id", hobbyId)
              .eq("utilisateur_id", profile?.id)

            if (error) throw error

            setHobbies(hobbies.filter((h) => h.id !== hobbyId))
            Alert.alert("Succès", "Loisir supprimé avec succès !")
          } catch (error) {
            console.error("Erreur lors de la suppression:", error)
            Alert.alert("Erreur", "Impossible de supprimer le loisir")
          }
        },
      },
    ])
  }

  const generateCV = async () => {
    try {
      const cvHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CV - ${profile?.prenom} ${profile?.nom}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007AFF; padding-bottom: 20px; }
        .name { font-size: 28px; font-weight: bold; color: #007AFF; margin-bottom: 10px; }
        .contact { margin: 5px 0; color: #666; }
        .section { margin: 25px 0; }
        .section-title { font-size: 20px; font-weight: bold; color: #007AFF; border-bottom: 1px solid #007AFF; padding-bottom: 5px; margin-bottom: 15px; }
        .item { margin: 15px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid #007AFF; }
        .item-title { font-weight: bold; color: #333; font-size: 16px; }
        .item-level { display: inline-block; background: #007AFF; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px; }
        .item-description { margin-top: 8px; color: #666; }
        .languages-grid, .hobbies-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .project-languages { margin-top: 8px; }
        .project-language { display: inline-block; background: #FFD700; color: #333; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${profile?.prenom} ${profile?.nom}</div>
        <div class="contact">📧 ${profile?.email}</div>
        <div class="contact">🆔 Matricule: ${profile?.matricule}</div>
        ${profile?.date_de_naissance ? `<div class="contact">📅 ${new Date(profile.date_de_naissance).toLocaleDateString("fr-FR")}</div>` : ""}
      </div>
      
      ${
        skills.length > 0
          ? `
      <div class="section">
        <div class="section-title">🎯 Compétences Professionnelles</div>
        ${skills
          .map(
            (skill) => `
          <div class="item">
            <div class="item-title">${skill.nom}<span class="item-level">${skill.niveau}</span></div>
            ${skill.description ? `<div class="item-description">${skill.description}</div>` : ""}
            ${skill.experience ? `<div class="item-description"><strong>Expérience:</strong> ${skill.experience}</div>` : ""}
            ${skill.certifications ? `<div class="item-description"><strong>Certifications:</strong> ${skill.certifications}</div>` : ""}
          </div>
        `,
          )
          .join("")}
      </div>
      `
          : ""
      }
      
      ${
        programmingLanguages.length > 0
          ? `
      <div class="section">
        <div class="section-title">💻 Langages de Programmation</div>
        <div class="item">
          <div class="item-description">${programmingLanguages.join(", ")}</div>
        </div>
      </div>
      `
          : ""
      }
      
      ${
        spokenLanguages.length > 0
          ? `
      <div class="section">
        <div class="section-title">🌍 Langues Parlées</div>
        <div class="languages-grid">
          ${spokenLanguages
            .map(
              (lang) => `
            <div class="item">
              <div class="item-title">${lang.langue}<span class="item-level">${lang.niveau}</span></div>
              ${lang.certification ? `<div class="item-description"><strong>Certification:</strong> ${lang.certification}</div>` : ""}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
      `
          : ""
      }
      
      ${
        projects.length > 0
          ? `
      <div class="section">
        <div class="section-title">🚀 Projets</div>
        ${projects
          .map(
            (project) => `
          <div class="item">
            <div class="item-title">${project.name}</div>
            <div class="item-description">${project.description}</div>
            ${
              project.languages.length > 0
                ? `
              <div class="project-languages">
                ${project.languages.map((lang) => `<span class="project-language">${lang}</span>`).join("")}
              </div>
            `
                : ""
            }
          </div>
        `,
          )
          .join("")}
      </div>
      `
          : ""
      }
      
      ${
        hobbies.length > 0
          ? `
      <div class="section">
        <div class="section-title">🎨 Loisirs & Centres d'intérêt</div>
        <div class="hobbies-grid">
          ${hobbies
            .map(
              (hobby) => `
            <div class="item">
              <div class="item-title">${hobby.nom}${hobby.niveau ? `<span class="item-level">${hobby.niveau}</span>` : ""}</div>
              ${hobby.description ? `<div class="item-description">${hobby.description}</div>` : ""}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
      `
          : ""
      }
      
      <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
        CV généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}
      </div>
    </body>
    </html>
  `

      const { uri } = await Print.printToFileAsync({ html: cvHTML })
      await Sharing.shareAsync(uri)
    } catch (error) {
      console.error("Erreur génération CV:", error)
      Alert.alert("Erreur", "Impossible de générer le CV")
    }
  }

  const openCodeEditor = () => {
    Alert.alert("Environnement de développement", "Choisissez votre environnement :", [
      { text: "VS Code Web", onPress: () => openWebEditor("vscode") },
      { text: "CodePen", onPress: () => openWebEditor("codepen") },
      { text: "JSFiddle", onPress: () => openWebEditor("jsfiddle") },
      { text: "Repl.it", onPress: () => openWebEditor("replit") },
      { text: "GitHub Codespaces", onPress: () => openWebEditor("codespaces") },
      { text: "StackBlitz", onPress: () => openWebEditor("stackblitz") },
      { text: "Annuler", style: "cancel" },
    ])
  }

  const openWebEditor = async (editor: string) => {
    const urls = {
      vscode: "https://vscode.dev",
      codepen: "https://codepen.io/pen/",
      jsfiddle: "https://jsfiddle.net",
      replit: "https://replit.com",
      codespaces: "https://github.com/codespaces",
      stackblitz: "https://stackblitz.com",
    }

    const url = urls[editor as keyof typeof urls]

    try {
      console.log(`🚀 Ouverture de ${editor}: ${url}`)

      // Vérifier si l'URL peut être ouverte
      const supported = await Linking.canOpenURL(url)

      if (supported) {
        await Linking.openURL(url)
        console.log(`✅ ${editor} ouvert avec succès`)
      } else {
        console.warn(`⚠️ Impossible d'ouvrir ${url}`)
        Alert.alert(
          "Erreur",
          `Impossible d'ouvrir ${editor}. Veuillez vérifier que vous avez un navigateur installé.`,
          [
            {
              text: "Copier l'URL",
              onPress: () => {
                // Dans une vraie app, vous pourriez utiliser Clipboard.setString(url)
                Alert.alert("URL copiée", `URL: ${url}`)
              },
            },
            { text: "OK" },
          ],
        )
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'ouverture de ${editor}:`, error)
      Alert.alert(
        "Erreur",
        `Impossible d'ouvrir ${editor}.\n\nURL: ${url}\n\nVous pouvez copier cette URL et l'ouvrir manuellement dans votre navigateur.`,
        [
          {
            text: "Copier l'URL",
            onPress: () => {
              Alert.alert("URL", url)
            },
          },
          { text: "OK" },
        ],
      )
    }
  }

  useEffect(() => {
    return () => {
      // Nettoyage global au démontage du composant
      console.log("🧹 Nettoyage global des souscriptions")
      supabase.removeAllChannels()
    }
  }, [])

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
      <StatusBar style="auto" />

      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.photoContainer}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderPhoto}>
                <UserIcon size={30} color={Colors.gray} />
              </View>
            )}
            {editing && (
              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <Camera size={16} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.profileInfo}>
            {editing ? (
              <View>
                <TextInput
                  style={styles.editNameInput}
                  value={`${prenom} ${nom}`}
                  onChangeText={(text) => {
                    const parts = text.split(" ")
                    setPrenom(parts[0] || "")
                    setNom(parts.slice(1).join(" ") || "")
                  }}
                  placeholder="Nom complet"
                />
                <TextInput
                  style={styles.editMatriculeInput}
                  value={matricule}
                  onChangeText={setMatricule}
                  placeholder="Matricule"
                />
              </View>
            ) : (
              <View>
                <Text style={styles.profileName}>
                  {profile?.prenom} {profile?.nom}
                </Text>
                <Text style={styles.profileMatricule}>Matricule: {profile?.matricule || "Non défini"}</Text>
                <Text style={styles.profileSchool}>{profile?.email}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => (editing ? saveProfile() : setEditing(true))}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Edit3 size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
            <Settings size={24} color={Colors.darkGray} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "journey" && styles.activeTab]}
          onPress={() => setActiveTab("journey")}
        >
          <Text style={[styles.tabText, activeTab === "journey" && styles.activeTabText]}>Mon Parcours</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "colleagues" && styles.activeTab]}
          onPress={() => setActiveTab("colleagues")}
        >
          <Text style={[styles.tabText, activeTab === "colleagues" && styles.activeTabText]}>
            Collègues ({colleagues.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "achievements" && styles.activeTab]}
          onPress={() => setActiveTab("achievements")}
        >
          <Text style={[styles.tabText, activeTab === "achievements" && styles.activeTabText]}>
            Réalisations ({achievements.filter((a) => a.earned).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loadingData && (
          <View style={styles.loadingDataContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingDataText}>Chargement des données...</Text>
          </View>
        )}

        {activeTab === "journey" && (
          <View>
            {/* Informations personnelles en mode édition */}
            {editing && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informations personnelles</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date de naissance</Text>
                  <TextInput
                    style={styles.input}
                    value={dateNaissance}
                    onChangeText={setDateNaissance}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.gray}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Sexe</Text>
                  <TextInput
                    style={styles.input}
                    value={sexe}
                    onChangeText={setSexe}
                    placeholder="Masculin/Féminin/Autre"
                    placeholderTextColor={Colors.gray}
                  />
                </View>
              </View>
            )}

            {/* Programming Languages */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Langages de programmation</Text>
                <TouchableOpacity style={styles.addButton} onPress={addLanguage}>
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
              {programmingLanguages.length > 0 ? (
                <View style={styles.languagesContainer}>
                  {programmingLanguages.map((language, index) => (
                    <View key={index} style={styles.languageChip}>
                      <Text style={styles.languageText}>{language}</Text>
                      <TouchableOpacity style={styles.removeLanguageButton} onPress={() => removeLanguage(language)}>
                        <X size={14} color={Colors.gray} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Aucun langage ajouté</Text>
              )}
            </View>

            {/* Projects */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Projets ({projects.length})</Text>
                <TouchableOpacity style={styles.addButton} onPress={addProject}>
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>

              {projects.length > 0 ? (
                projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.projectCard}
                    onPress={() => editProject(project)}
                    onLongPress={() => deleteProject(project.id)}
                  >
                    <View style={styles.projectHeader}>
                      <Text style={styles.projectName}>{project.name}</Text>
                      <View style={styles.projectStatus}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: project.status === "termine" ? Colors.success : Colors.warning },
                          ]}
                        />
                        <ChevronRight size={16} color={Colors.darkGray} />
                      </View>
                    </View>
                    <Text style={styles.projectDescription}>{project.description}</Text>

                    {project.languages.length > 0 && (
                      <View style={styles.projectLanguages}>
                        {project.languages.map((language, index) => (
                          <View key={index} style={styles.projectLanguageChip}>
                            <Text style={styles.projectLanguageText}>{language}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.projectFooter}>
                      <View style={styles.projectCollaborators}>
                        <Users size={14} color={Colors.textLight} />
                        <Text style={styles.projectFooterText}>
                          {project.collaborators} collaborateur{project.collaborators > 1 ? "s" : ""}
                        </Text>
                      </View>
                      <View style={styles.projectLastUpdated}>
                        <Clock size={14} color={Colors.textLight} />
                        <Text style={styles.projectFooterText}>il y a {project.lastUpdated}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>Aucun projet créé</Text>
              )}
            </View>

            {/* Skills Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Compétences Professionnelles</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowSkillModal(true)}>
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>

              {skills.length > 0 ? (
                skills.map((skill) => (
                  <TouchableOpacity
                    key={skill.id}
                    style={styles.skillCard}
                    onPress={() => editSkill(skill)}
                    onLongPress={() => deleteSkill(skill.id)}
                  >
                    <View style={styles.skillHeader}>
                      <Text style={styles.skillName}>{skill.nom}</Text>
                      <View
                        style={[
                          styles.skillLevel,
                          {
                            backgroundColor:
                              skill.niveau === "expert"
                                ? "#4CAF50"
                                : skill.niveau === "avance"
                                  ? "#FF9500"
                                  : skill.niveau === "intermediaire"
                                    ? "#007AFF"
                                    : "#8E8E93",
                          },
                        ]}
                      >
                        <Text style={styles.skillLevelText}>{skill.niveau}</Text>
                      </View>
                    </View>
                    {skill.description && <Text style={styles.skillDescription}>{skill.description}</Text>}
                    {skill.experience && <Text style={styles.skillExperience}>Expérience: {skill.experience}</Text>}
                    {skill.certifications && (
                      <Text style={styles.skillCertifications}>Certifications: {skill.certifications}</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>Aucune compétence ajoutée</Text>
              )}
            </View>

            {/* Langues parlées */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Langues parlées ({spokenLanguages.length})</Text>
                <TouchableOpacity style={styles.addButton} onPress={addSpokenLanguage}>
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>

              {spokenLanguages.length > 0 ? (
                spokenLanguages.map((language) => (
                  <TouchableOpacity
                    key={language.id}
                    style={styles.skillCard}
                    onPress={() => editSpokenLanguage(language)}
                    onLongPress={() => deleteSpokenLanguage(language.id)}
                  >
                    <View style={styles.skillHeader}>
                      <Text style={styles.skillName}>{language.langue}</Text>
                      <View
                        style={[
                          styles.skillLevel,
                          {
                            backgroundColor:
                              language.niveau === "natif"
                                ? "#4CAF50"
                                : language.niveau === "avance"
                                  ? "#FF9500"
                                  : language.niveau === "intermediaire"
                                    ? "#007AFF"
                                    : "#8E8E93",
                          },
                        ]}
                      >
                        <Text style={styles.skillLevelText}>{language.niveau}</Text>
                      </View>
                    </View>
                    {language.certification && (
                      <Text style={styles.skillCertifications}>Certification: {language.certification}</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>Aucune langue ajoutée</Text>
              )}
            </View>

            {/* Loisirs */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Loisirs & Centres d'intérêt ({hobbies.length})</Text>
                <TouchableOpacity style={styles.addButton} onPress={addHobby}>
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>

              {hobbies.length > 0 ? (
                hobbies.map((hobby) => (
                  <TouchableOpacity
                    key={hobby.id}
                    style={styles.skillCard}
                    onPress={() => editHobby(hobby)}
                    onLongPress={() => deleteHobby(hobby.id)}
                  >
                    <View style={styles.skillHeader}>
                      <Text style={styles.skillName}>{hobby.nom}</Text>
                      {hobby.niveau && (
                        <View
                          style={[
                            styles.skillLevel,
                            {
                              backgroundColor:
                                hobby.niveau === "expert"
                                  ? "#4CAF50"
                                  : hobby.niveau === "avance"
                                    ? "#FF9500"
                                    : hobby.niveau === "intermediaire"
                                      ? "#007AFF"
                                      : "#8E8E93",
                            },
                          ]}
                        >
                          <Text style={styles.skillLevelText}>{hobby.niveau}</Text>
                        </View>
                      )}
                    </View>
                    {hobby.description && <Text style={styles.skillDescription}>{hobby.description}</Text>}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>Aucun loisir ajouté</Text>
              )}
            </View>

            {/* Tools */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Outils</Text>

              <TouchableOpacity style={styles.toolCard} onPress={generateCV}>
                <View style={styles.toolIcon}>
                  <FileText size={24} color={Colors.white} />
                </View>
                <View style={styles.toolInfo}>
                  <Text style={styles.toolName}>Générer CV</Text>
                  <Text style={styles.toolDescription}>Créer un CV professionnel basé sur vos données de profil</Text>
                </View>
                <ChevronRight size={16} color={Colors.darkGray} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.toolCard} onPress={openCodeEditor}>
                <View style={[styles.toolIcon, { backgroundColor: "#4CAF50" }]}>
                  <Code size={24} color={Colors.white} />
                </View>
                <View style={styles.toolInfo}>
                  <Text style={styles.toolName}>Environnements de développement</Text>
                  <Text style={styles.toolDescription}>Accéder aux environnements de codage en ligne</Text>
                </View>
                <ChevronRight size={16} color={Colors.darkGray} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === "colleagues" && (
          <View>
            {colleagues.length > 0 ? (
              <View style={styles.section}>
                {colleagues.map((colleague) => (
                  <TouchableOpacity key={colleague.id} style={styles.colleagueCard}>
                    <View style={styles.colleaguePhoto}>
                      {colleague.photo ? (
                        <Image source={{ uri: colleague.photo }} style={styles.colleagueImage} />
                      ) : (
                        <View style={styles.colleaguePlaceholder}>
                          <UserIcon size={20} color={Colors.gray} />
                        </View>
                      )}
                    </View>
                    <View style={styles.colleagueInfo}>
                      <Text style={styles.colleagueName}>{colleague.name}</Text>
                      <Text style={styles.colleagueClubs}>
                        {colleague.commonClubs} club{colleague.commonClubs > 1 ? "s" : ""} en commun
                      </Text>
                    </View>
                    <ChevronRight size={16} color={Colors.darkGray} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Users size={48} color={Colors.lightGray} />
                <Text style={styles.emptyStateTitle}>Aucun collègue pour le moment</Text>
                <Text style={styles.emptyStateSubtitle}>Rejoignez des clubs pour rencontrer d'autres étudiants</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "achievements" && (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vos Réalisations</Text>
              {achievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[styles.achievementCard, achievement.earned && styles.achievementEarned]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={[styles.achievementName, achievement.earned && styles.achievementNameEarned]}>
                      {achievement.name}
                    </Text>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${achievement.progress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{Math.round(achievement.progress)}%</Text>
                    </View>
                  </View>
                  {achievement.earned && (
                    <View style={styles.achievementBadge}>
                      <Text style={styles.achievementBadgeText}>✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        onSave={(updatedProfile) => {
          setProfile(updatedProfile)
          loadUserData()
        }}
      />

      <AddSkillModal
        visible={showSkillModal}
        onClose={() => {
          setShowSkillModal(false)
          setEditingSkill(null)
        }}
        userId={profile?.id || ""}
        onSkillAdded={() => {
          loadUserData()
        }}
        skill={editingSkill}
      />

      <AddProjectModal
        visible={showProjectModal}
        onClose={() => {
          setShowProjectModal(false)
          setEditingProject(null)
        }}
        userId={profile?.id || ""}
        onProjectAdded={() => {
          loadUserData()
        }}
        project={editingProject}
      />

      <AddLanguageModal
        visible={showLanguageModal}
        onClose={() => {
          setShowLanguageModal(false)
          setEditingLanguage(null)
        }}
        userId={profile?.id || ""}
        onLanguageAdded={() => {
          loadUserData()
        }}
        language={editingLanguage}
      />

      <AddHobbyModal
        visible={showHobbyModal}
        onClose={() => {
          setShowHobbyModal(false)
          setEditingHobby(null)
        }}
        userId={profile?.id || ""}
        onHobbyAdded={() => {
          loadUserData()
        }}
        hobby={editingHobby}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
  loadingDataContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingDataText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.gray,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  photoContainer: {
    position: "relative",
    marginRight: 12,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  placeholderPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: {
    justifyContent: "center",
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textDark,
    marginBottom: 2,
  },
  profileMatricule: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 2,
  },
  profileSchool: {
    fontSize: 14,
    color: Colors.gold,
  },
  editNameInput: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingVertical: 2,
    marginBottom: 4,
  },
  editMatriculeInput: {
    fontSize: 14,
    color: Colors.textLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingVertical: 2,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.gold,
  },
  tabText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  activeTabText: {
    color: Colors.gold,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textDark,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.gold,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 16,
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
  languagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  languageChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
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
  removeLanguageButton: {
    padding: 2,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    fontStyle: "italic",
  },
  projectCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textDark,
    flex: 1,
  },
  projectStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  projectLanguages: {
    flexDirection: "row",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  projectLanguageChip: {
    backgroundColor: Colors.gold + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  projectLanguageText: {
    fontSize: 12,
    color: Colors.gold,
    fontWeight: "500",
  },
  projectFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  projectCollaborators: {
    flexDirection: "row",
    alignItems: "center",
  },
  projectLastUpdated: {
    flexDirection: "row",
    alignItems: "center",
  },
  projectFooterText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
  },
  toolCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: Colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textDark,
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  colleagueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: Colors.textDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  colleaguePhoto: {
    marginRight: 12,
  },
  colleagueImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colleaguePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  colleagueInfo: {
    flex: 1,
  },
  colleagueName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textDark,
    marginBottom: 2,
  },
  colleagueClubs: {
    fontSize: 14,
    color: Colors.textLight,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    minHeight: 300,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
  },
  skillCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skillHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  skillName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textDark,
    flex: 1,
  },
  skillLevel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillLevelText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  skillDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  skillExperience: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: "italic",
  },
  skillCertifications: {
    fontSize: 12,
    color: Colors.gold,
    fontWeight: "500",
  },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    opacity: 0.6,
  },
  achievementEarned: {
    backgroundColor: Colors.white,
    opacity: 1,
    shadowColor: Colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textLight,
    marginBottom: 2,
  },
  achievementNameEarned: {
    color: Colors.textDark,
  },
  achievementDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  achievementBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementBadgeText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: "bold",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textLight,
    minWidth: 35,
  },
})
