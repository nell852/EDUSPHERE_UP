import { supabase } from "../lib/supabase"
import type { Database } from "../lib/database.types"

type Message = Database["public"]["Tables"]["messages"]["Row"]
type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"]

export interface ChatMessage extends Message {
  expediteur?: {
    nom: string | null
    prenom: string | null
    photo_profil_url: string | null
  } | null
}

class ChatService {
  // Envoyer un message dans un club
  async sendClubMessage(clubId: string, contenu: string): Promise<Message> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          expediteur_id: user.user.id,
          club_id: clubId,
          contenu: contenu,
          type: "texte",
        })
        .select()
        .single()

      if (error) throw error

      return message
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
      throw error
    }
  }

  // Récupérer les messages d'un club
  async getClubMessages(clubId: string, limit = 50): Promise<ChatMessage[]> {
    try {
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          *,
          expediteur:utilisateurs!messages_expediteur_id_fkey(nom, prenom, photo_profil_url)
        `)
        .eq("club_id", clubId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error

      return (messages || []).reverse()
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error)
      throw error
    }
  }

  // S'abonner aux nouveaux messages d'un club
  subscribeToClubMessages(clubId: string, callback: (message: ChatMessage) => void) {
    return supabase
      .channel(`club-${clubId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `club_id=eq.${clubId}`,
        },
        async (payload) => {
          // Récupérer les détails de l'expéditeur
          const { data: expediteur } = await supabase
            .from("utilisateurs")
            .select("nom, prenom, photo_profil_url")
            .eq("id", payload.new.expediteur_id)
            .single()

          const messageWithSender: ChatMessage = {
            ...(payload.new as Message),
            expediteur: expediteur || null,
          }

          callback(messageWithSender)
        },
      )
      .subscribe()
  }

  // Envoyer un message privé
  async sendPrivateMessage(destinataireId: string, contenu: string): Promise<Message> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          expediteur_id: user.user.id,
          destinataire_id: destinataireId,
          contenu: contenu,
          type: "texte",
        })
        .select()
        .single()

      if (error) throw error

      return message
    } catch (error) {
      console.error("Erreur lors de l'envoi du message privé:", error)
      throw error
    }
  }

  // Récupérer les conversations privées
  async getPrivateConversations(): Promise<any[]> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      const { data: conversations, error } = await supabase
        .from("messages")
        .select(`
          *,
          expediteur:utilisateurs!messages_expediteur_id_fkey(nom, prenom, photo_profil_url),
          destinataire:utilisateurs!messages_destinataire_id_fkey(nom, prenom, photo_profil_url)
        `)
        .or(`expediteur_id.eq.${user.user.id},destinataire_id.eq.${user.user.id}`)
        .is("club_id", null)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Grouper par conversation
      const conversationsMap = new Map()

      conversations?.forEach((message) => {
        const otherUserId = message.expediteur_id === user.user.id ? message.destinataire_id : message.expediteur_id

        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            userId: otherUserId,
            user: message.expediteur_id === user.user.id ? message.destinataire : message.expediteur,
            lastMessage: message,
            unreadCount: 0,
          })
        }
      })

      return Array.from(conversationsMap.values())
    } catch (error) {
      console.error("Erreur lors de la récupération des conversations:", error)
      throw error
    }
  }
}

export const chatService = new ChatService()
