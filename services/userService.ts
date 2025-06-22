import { supabase } from "../lib/supabase"
import type { Database } from "../lib/database.types"

type User = Database["public"]["Tables"]["utilisateurs"]["Row"]
type UserUpdate = Database["public"]["Tables"]["utilisateurs"]["Update"]

class UserService {
  // Créer ou mettre à jour le profil utilisateur
  async createOrUpdateProfile(userData: {
    nom?: string
    prenom?: string
    matricule?: string
    date_de_naissance?: string
    sexe?: string
    photo_profil_url?: string
  }): Promise<User> {
    try {
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) throw new Error("Utilisateur non connecté")

      // Vérifier si le profil existe (sans utiliser .single())
      const { data: existingProfiles, error: selectError } = await supabase
        .from("utilisateurs")
        .select("*")
        .eq("id", authUser.user.id)

      if (selectError) {
        console.error("Erreur lors de la vérification du profil:", selectError)
        throw selectError
      }

      if (existingProfiles && existingProfiles.length > 0) {
        // Mettre à jour le profil existant
        const { data: updatedProfile, error } = await supabase
          .from("utilisateurs")
          .update({
            ...userData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.user.id)
          .select()
          .single()

        if (error) throw error
        return updatedProfile
      } else {
        // Créer un nouveau profil
        const { data: newProfile, error } = await supabase
          .from("utilisateurs")
          .insert({
            id: authUser.user.id,
            email: authUser.user.email || "",
            ...userData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error
        return newProfile
      }
    } catch (error) {
      console.error("Erreur lors de la création/mise à jour du profil:", error)
      throw error
    }
  }

  // Récupérer le profil utilisateur actuel (version sécurisée)
  async getCurrentProfile(): Promise<User | null> {
    try {
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) return null

      // Utiliser select() sans .single() pour éviter l'erreur PGRST116
      const { data: profiles, error } = await supabase.from("utilisateurs").select("*").eq("id", authUser.user.id)

      if (error) {
        console.error("Erreur lors de la récupération du profil:", error)
        return null
      }

      // Retourner le premier profil trouvé ou null
      return profiles && profiles.length > 0 ? profiles[0] : null
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error)
      return null
    }
  }

  // Vérifier et créer le profil si nécessaire (version améliorée)
  async ensureProfileExists(): Promise<User> {
    try {
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) throw new Error("Utilisateur non connecté")

      // D'abord essayer de récupérer le profil existant
      const existingProfile = await this.getCurrentProfile()

      if (existingProfile) {
        return existingProfile
      }

      // Le profil n'existe pas, le créer
      console.log("Création du profil utilisateur...")
      const { data: newProfile, error: createError } = await supabase
        .from("utilisateurs")
        .insert({
          id: authUser.user.id,
          email: authUser.user.email || "",
          nom: "Utilisateur", // Nom par défaut
          prenom: "Nouveau", // Prénom par défaut
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        console.error("Erreur lors de la création du profil:", createError)
        throw createError
      }

      return newProfile
    } catch (error) {
      console.error("Erreur lors de la vérification du profil:", error)
      throw error
    }
  }

  // Version avec debugging intensif
  async getUserById(userId: string): Promise<User | null> {
    console.log("🔍 getUserById appelé avec:", userId)

    try {
      if (!userId || userId === "null" || userId === "undefined") {
        console.error("❌ ID utilisateur invalide:", userId)
        return null
      }

      console.log("🔍 Recherche de l'utilisateur dans la table utilisateurs...")

      // Essayer de récupérer l'utilisateur
      const { data: users, error } = await supabase.from("utilisateurs").select("*").eq("id", userId)

      console.log("🔍 Résultat de la requête:", { users, error })

      if (error) {
        console.error("❌ Erreur lors de la récupération:", error)
        return null
      }

      if (users && users.length > 0) {
        console.log("✅ Utilisateur trouvé:", users[0])
        return users[0]
      }

      console.log("⚠️ Utilisateur non trouvé, tentative de création...")

      // Essayer de créer le profil
      return await this.createMissingUserProfile(userId)
    } catch (error) {
      console.error("❌ Erreur générale dans getUserById:", error)
      return null
    }
  }

  // Nouvelle méthode pour créer un profil manquant
  private async createMissingUserProfile(userId: string): Promise<User | null> {
    try {
      console.log("🔧 Tentative de création du profil pour:", userId)

      // Essayer d'insérer un profil basique
      const { data: newProfile, error: insertError } = await supabase
        .from("utilisateurs")
        .insert({
          id: userId,
          email: `user-${userId.slice(0, 8)}@unknown.com`, // Email temporaire
          nom: "Utilisateur",
          prenom: "Inconnu",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error("❌ Erreur lors de l'insertion:", insertError)

        // Si l'insertion échoue, retourner un profil temporaire
        console.log("🔧 Création d'un profil temporaire...")
        return {
          id: userId,
          email: `user-${userId.slice(0, 8)}@unknown.com`,
          nom: "Utilisateur",
          prenom: "Inconnu",
          matricule: null,
          date_de_naissance: null,
          sexe: null,
          photo_profil_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as User
      }

      console.log("✅ Profil créé avec succès:", newProfile)
      return newProfile
    } catch (error) {
      console.error("❌ Erreur lors de la création du profil:", error)

      // En dernier recours, retourner un profil temporaire
      console.log("🔧 Retour d'un profil temporaire en dernier recours...")
      return {
        id: userId,
        email: `user-${userId.slice(0, 8)}@unknown.com`,
        nom: "Utilisateur",
        prenom: "Inconnu",
        matricule: null,
        date_de_naissance: null,
        sexe: null,
        photo_profil_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User
    }
  }

  // Rechercher des utilisateurs
  async searchUsers(query: string): Promise<User[]> {
    try {
      const { data: users, error } = await supabase
        .from("utilisateurs")
        .select("*")
        .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20)

      if (error) throw error
      return users || []
    } catch (error) {
      console.error("Erreur lors de la recherche d'utilisateurs:", error)
      return []
    }
  }

  // Méthode utilitaire pour vérifier si un utilisateur existe
  async userExists(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId)
      return user !== null
    } catch (error) {
      console.error("Erreur lors de la vérification de l'existence de l'utilisateur:", error)
      return false
    }
  }

  // Méthode de diagnostic
  async debugUser(userId: string) {
    console.log("🔍 === DIAGNOSTIC UTILISATEUR ===")
    console.log("🔍 ID utilisateur:", userId)

    try {
      // Vérifier dans la table utilisateurs
      const { data: users, error: usersError } = await supabase.from("utilisateurs").select("*").eq("id", userId)

      console.log("🔍 Résultat table utilisateurs:", { users, usersError })

      // Vérifier les permissions
      const { data: testInsert, error: insertError } = await supabase
        .from("utilisateurs")
        .insert({
          id: "test-" + Date.now(),
          email: "test@test.com",
          nom: "Test",
          prenom: "Test",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      console.log("🔍 Test d'insertion:", { testInsert, insertError })

      // Nettoyer le test
      if (testInsert && testInsert.length > 0) {
        await supabase.from("utilisateurs").delete().eq("id", testInsert[0].id)
      }
    } catch (error) {
      console.error("❌ Erreur lors du diagnostic:", error)
    }

    console.log("🔍 === FIN DIAGNOSTIC ===")
  }
}

export const userService = new UserService()
