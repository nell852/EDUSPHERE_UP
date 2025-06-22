import { supabase } from "../lib/supabase"
import type { Database } from "../lib/database.types"

type Club = Database["public"]["Tables"]["clubs"]["Row"]
type ClubInsert = Database["public"]["Tables"]["clubs"]["Insert"]
type ClubMember = Database["public"]["Tables"]["club_membres"]["Row"]
type Publication = Database["public"]["Tables"]["publications"]["Row"]
type DemandeAdhesion = Database["public"]["Tables"]["demandes_adhesion"]["Row"]

export interface ClubWithDetails extends Club {
  membres_count: number
  is_member: boolean
  is_owner: boolean
  demande_pending: boolean
}

export interface FeedItem {
  id: string
  type: "event" | "challenge" | "discussion"
  title: string
  club: string
  club_id: string
  date: string
  participants: number
}

class ClubService {
  // Récupérer tous les clubs publics
  async getAllClubs(searchQuery = ""): Promise<ClubWithDetails[]> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      let query = supabase
        .from("clubs")
        .select(`
          *,
          club_membres(count),
          demandes_adhesion(*)
        `)
        .eq("type", "public")

      if (searchQuery) {
        query = query.or(`nom.ilike.%${searchQuery}%,domaine.ilike.%${searchQuery}%`)
      }

      const { data: clubs, error } = await query

      if (error) throw error

      // Enrichir les données des clubs
      const enrichedClubs = await Promise.all(
        clubs.map(async (club) => {
          // Compter les membres
          const { count: membersCount } = await supabase
            .from("club_membres")
            .select("*", { count: "exact", head: true })
            .eq("club_id", club.id)

          // Vérifier si l'utilisateur est membre
          const { data: membership } = await supabase
            .from("club_membres")
            .select("*")
            .eq("club_id", club.id)
            .eq("membre_id", user.user.id)
            .single()

          // Vérifier s'il y a une demande en attente
          const { data: pendingRequest } = await supabase
            .from("demandes_adhesion")
            .select("*")
            .eq("club_id", club.id)
            .eq("demandeur_id", user.user.id)
            .eq("statut", "en_attente")
            .single()

          return {
            ...club,
            membres_count: membersCount || 0,
            is_member: !!membership,
            is_owner: club.proprietaire_id === user.user.id,
            demande_pending: !!pendingRequest,
          }
        }),
      )

      return enrichedClubs
    } catch (error) {
      console.error("Erreur lors de la récupération des clubs:", error)
      throw error
    }
  }

  // Récupérer les clubs de l'utilisateur
  async getMyClubs(): Promise<ClubWithDetails[]> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      const { data: memberships, error } = await supabase
        .from("club_membres")
        .select(`
          *,
          clubs(*)
        `)
        .eq("membre_id", user.user.id)

      if (error) throw error

      const enrichedClubs = await Promise.all(
        memberships.map(async (membership) => {
          const club = membership.clubs as Club

          // Compter les membres
          const { count: membersCount } = await supabase
            .from("club_membres")
            .select("*", { count: "exact", head: true })
            .eq("club_id", club.id)

          return {
            ...club,
            membres_count: membersCount || 0,
            is_member: true,
            is_owner: club.proprietaire_id === user.user.id,
            demande_pending: false,
          }
        }),
      )

      return enrichedClubs
    } catch (error) {
      console.error("Erreur lors de la récupération de mes clubs:", error)
      throw error
    }
  }

  // Créer un club
  async createClub(clubData: {
    nom: string
    domaine: string
    description: string
    avatar_url?: string
  }): Promise<Club> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      // Créer le club
      const { data: club, error: clubError } = await supabase
        .from("clubs")
        .insert({
          nom: clubData.nom,
          domaine: clubData.domaine,
          description: clubData.description,
          avatar_url: clubData.avatar_url,
          proprietaire_id: user.user.id,
          type: "public",
        })
        .select()
        .single()

      if (clubError) throw clubError

      // Ajouter le créateur comme membre administrateur
      const { error: memberError } = await supabase.from("club_membres").insert({
        club_id: club.id,
        membre_id: user.user.id,
        role: "administrateur",
      })

      if (memberError) throw memberError

      return club
    } catch (error) {
      console.error("Erreur lors de la création du club:", error)
      throw error
    }
  }

  // Faire une demande d'adhésion
  async requestJoinClub(clubId: string, message?: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      console.log("=== DÉBUT DEMANDE D'ADHÉSION (CLUBSERVICE) ===")
      console.log("Club ID:", clubId)
      console.log("Demandeur ID:", user.user.id)

      // Supprimer toute demande existante d'abord (pour éviter les doublons)
      console.log("Suppression des demandes existantes...")
      await supabase.from("demandes_adhesion").delete().eq("club_id", clubId).eq("demandeur_id", user.user.id)

      // Attendre un peu pour que la suppression soit effective
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Créer la demande d'adhésion
      console.log("Création de la demande d'adhésion...")
      const { data: newRequest, error: requestError } = await supabase
        .from("demandes_adhesion")
        .insert({
          club_id: clubId,
          demandeur_id: user.user.id,
          message: message,
          statut: "en_attente",
        })
        .select()
        .single()

      if (requestError) {
        console.error("Erreur lors de la création de la demande:", requestError)
        throw requestError
      }

      console.log("Demande créée:", newRequest)

      // Récupérer les infos du club
      console.log("Récupération des infos du club...")
      const { data: club, error: clubError } = await supabase
        .from("clubs")
        .select("nom, proprietaire_id")
        .eq("id", clubId)
        .single()

      if (clubError) {
        console.error("Erreur lors de la récupération du club:", clubError)
        throw clubError
      }

      console.log("Club trouvé:", club)

      // Récupérer les infos du demandeur
      console.log("Récupération des infos du demandeur...")
      const { data: demandeur, error: demandeurError } = await supabase
        .from("utilisateurs")
        .select("nom, prenom")
        .eq("id", user.user.id)
        .single()

      if (demandeurError) {
        console.error("Erreur lors de la récupération du demandeur:", demandeurError)
        throw demandeurError
      }

      console.log("Demandeur trouvé:", demandeur)

      if (club && demandeur && club.proprietaire_id) {
        console.log("Création de la notification...")
        console.log("Propriétaire du club:", club.proprietaire_id)

        // Créer une notification pour le propriétaire du club
        const notificationData = {
          utilisateur_id: club.proprietaire_id,
          type: "demande_adhesion",
          message: `${demandeur.nom} ${demandeur.prenom} souhaite rejoindre votre club "${club.nom}"`,
          source: "club",
          url_cible: `/clubs/${clubId}/demandes`,
          read: false,
        }

        console.log("Données de notification:", notificationData)

        // Maintenant que RLS est désactivé, cela devrait fonctionner
        const { data: notification, error: notifError } = await supabase
          .from("notifications")
          .insert(notificationData)
          .select()
          .single()

        if (notifError) {
          console.error("Erreur lors de la création de la notification:", notifError)
          console.error("Détails de l'erreur:", notifError.message, notifError.details, notifError.hint)
          // Ne pas faire échouer toute l'opération pour une erreur de notification
        } else {
          console.log("Notification créée avec succès:", notification)
        }
      } else {
        console.log("Données manquantes pour créer la notification:")
        console.log("- Club:", !!club)
        console.log("- Demandeur:", !!demandeur)
        console.log("- Propriétaire ID:", club?.proprietaire_id)
      }

      console.log("=== FIN DEMANDE D'ADHÉSION (CLUBSERVICE) ===")
    } catch (error) {
      console.error("Erreur lors de la demande d'adhésion:", error)
      throw error
    }
  }

  // Récupérer le flux d'activités
  async getFeedItems(): Promise<FeedItem[]> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      // Récupérer les clubs dont l'utilisateur est membre
      const { data: memberships } = await supabase.from("club_membres").select("club_id").eq("membre_id", user.user.id)

      if (!memberships || memberships.length === 0) {
        return []
      }

      const clubIds = memberships.map((m) => m.club_id)

      // Récupérer les publications des clubs
      const { data: publications, error } = await supabase
        .from("publications")
        .select(`
          *,
          clubs(nom),
          commentaires(count)
        `)
        .in("club_id", clubIds)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      return publications.map((pub) => ({
        id: pub.id,
        type: pub.type === "defi" ? "challenge" : pub.type === "annonce" ? "event" : "discussion",
        title: pub.titre,
        club: (pub.clubs as any)?.nom || "Club inconnu",
        club_id: pub.club_id,
        date: pub.created_at,
        participants: Array.isArray(pub.commentaires) ? pub.commentaires.length : 0,
      }))
    } catch (error) {
      console.error("Erreur lors de la récupération du flux:", error)
      throw error
    }
  }

  // Récupérer les demandes d'adhésion pour les clubs de l'utilisateur
  async getPendingRequests(): Promise<any[]> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      const { data: requests, error } = await supabase
        .from("demandes_adhesion")
        .select(`
          *,
          clubs(nom),
          utilisateurs(nom, prenom, photo_profil_url)
        `)
        .eq("clubs.proprietaire_id", user.user.id)
        .eq("statut", "en_attente")

      if (error) throw error

      return requests || []
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes:", error)
      throw error
    }
  }

  // Accepter/Refuser une demande d'adhésion
  async handleJoinRequest(requestId: string, action: "accepter" | "refuser"): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      // Récupérer la demande
      const { data: request, error: requestError } = await supabase
        .from("demandes_adhesion")
        .select("*")
        .eq("id", requestId)
        .single()

      if (requestError) throw requestError

      // Mettre à jour le statut de la demande
      const { error: updateError } = await supabase
        .from("demandes_adhesion")
        .update({ statut: action === "accepter" ? "acceptee" : "refusee" })
        .eq("id", requestId)

      if (updateError) throw updateError

      if (action === "accepter") {
        // Ajouter le membre au club
        const { error: memberError } = await supabase.from("club_membres").insert({
          club_id: request.club_id,
          membre_id: request.demandeur_id,
          role: "membre",
        })

        if (memberError) throw memberError
      }

      // Créer une notification pour le demandeur
      const { data: club } = await supabase.from("clubs").select("nom").eq("id", request.club_id).single()

      if (club) {
        const { error: notifError } = await supabase.from("notifications").insert({
          utilisateur_id: request.demandeur_id,
          type: "reponse_adhesion",
          message:
            action === "accepter"
              ? `Votre demande d'adhésion au club "${club.nom}" a été acceptée !`
              : `Votre demande d'adhésion au club "${club.nom}" a été refusée.`,
          source: "club",
          url_cible: `/clubs/${request.club_id}`,
          read: false,
        })

        if (notifError) {
          console.error("Erreur lors de la création de la notification de réponse:", notifError)
        }
      }
    } catch (error) {
      console.error("Erreur lors du traitement de la demande:", error)
      throw error
    }
  }
}

export const clubService = new ClubService()
