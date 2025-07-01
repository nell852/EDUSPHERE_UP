import { supabase } from "../lib/supabase"

export interface UserPresence {
  id: string
  user_id: string
  is_online: boolean
  last_seen: string
  created_at: string
  updated_at: string
}

class PresenceService {
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private currentUserId: string | null = null

  /**
   * Initialise le service de présence pour un utilisateur
   */
  async initialize(userId: string) {
    console.log("🟢 PresenceService: Initializing for user:", userId)
    this.currentUserId = userId

    try {
      // Marquer l'utilisateur comme en ligne
      await this.setUserOnline(userId)

      // Démarrer le heartbeat pour maintenir le statut en ligne
      this.startHeartbeat(userId)

      // Écouter les changements de présence
      this.subscribeToPresenceChanges()

      console.log("✅ PresenceService: Initialized successfully")
    } catch (error) {
      console.error("❌ PresenceService: Error initializing:", error)
    }
  }

  /**
   * Marque un utilisateur comme en ligne
   */
  async setUserOnline(userId: string) {
    try {
      const { error } = await supabase.rpc("set_user_online", {
        target_user_id: userId,
      })

      if (error) {
        console.error("❌ PresenceService: Error setting user online:", error)
        throw error
      }

      console.log("✅ PresenceService: User marked as online:", userId)
    } catch (error) {
      console.error("❌ PresenceService: Error in setUserOnline:", error)
    }
  }

  /**
   * Marque un utilisateur comme hors ligne
   */
  async setUserOffline(userId: string) {
    try {
      const { error } = await supabase.rpc("set_user_offline", {
        target_user_id: userId,
      })

      if (error) {
        console.error("❌ PresenceService: Error setting user offline:", error)
        throw error
      }

      console.log("✅ PresenceService: User marked as offline:", userId)
    } catch (error) {
      console.error("❌ PresenceService: Error in setUserOffline:", error)
    }
  }

  /**
   * Récupère le statut de présence d'un utilisateur
   */
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const { data, error } = await supabase.from("user_presence").select("*").eq("user_id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          // Aucun enregistrement trouvé, l'utilisateur est considéré comme hors ligne
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error("❌ PresenceService: Error getting user presence:", error)
      return null
    }
  }

  /**
   * Vérifie si un utilisateur est en ligne
   */
  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const presence = await this.getUserPresence(userId)

      if (!presence) {
        return false
      }

      // Vérifier si l'utilisateur est marqué comme en ligne et a été vu récemment (moins de 5 minutes)
      const lastSeen = new Date(presence.last_seen)
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

      const isOnline = presence.is_online && lastSeen > fiveMinutesAgo

      console.log("🔍 PresenceService: User online status:", {
        userId,
        isOnline,
        lastSeen: presence.last_seen,
        markedOnline: presence.is_online,
      })

      return isOnline
    } catch (error) {
      console.error("❌ PresenceService: Error checking if user is online:", error)
      return false
    }
  }

  /**
   * Démarre le heartbeat pour maintenir le statut en ligne
   */
  private startHeartbeat(userId: string) {
    // Nettoyer l'ancien heartbeat s'il existe
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    // Envoyer un heartbeat toutes les 2 minutes
    this.heartbeatInterval = setInterval(
      async () => {
        try {
          await this.setUserOnline(userId)
          console.log("💓 PresenceService: Heartbeat sent for user:", userId)
        } catch (error) {
          console.error("❌ PresenceService: Error sending heartbeat:", error)
        }
      },
      2 * 60 * 1000,
    ) // 2 minutes

    console.log("💓 PresenceService: Heartbeat started for user:", userId)
  }

  /**
   * S'abonne aux changements de présence en temps réel
   */
  private subscribeToPresenceChanges() {
    const subscription = supabase
      .channel("user_presence_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
        },
        (payload) => {
          console.log("📡 PresenceService: Presence change detected:", payload)
          // Ici vous pouvez émettre des événements ou mettre à jour l'UI
        },
      )
      .subscribe((status) => {
        console.log("📡 PresenceService: Subscription status:", status)
      })

    return subscription
  }

  /**
   * Nettoie le service de présence
   */
  async cleanup() {
    console.log("🧹 PresenceService: Cleaning up")

    // Arrêter le heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    // Marquer l'utilisateur comme hors ligne
    if (this.currentUserId) {
      await this.setUserOffline(this.currentUserId)
    }

    console.log("✅ PresenceService: Cleanup completed")
  }

  /**
   * Récupère tous les utilisateurs en ligne
   */
  async getOnlineUsers(): Promise<UserPresence[]> {
    try {
      const { data, error } = await supabase
        .from("user_presence")
        .select("*")
        .eq("is_online", true)
        .gte("last_seen", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Derniers 5 minutes

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error("❌ PresenceService: Error getting online users:", error)
      return []
    }
  }
}

export const presenceService = new PresenceService()
