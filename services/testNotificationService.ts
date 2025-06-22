import { supabase } from "../lib/supabase"

export class TestNotificationService {
  // Test direct de création de notification
  static async testCreateNotification(): Promise<void> {
    try {
      console.log("=== TEST CRÉATION NOTIFICATION ===")

      // Récupérer l'utilisateur actuel
      const { data: user, error: userError } = await supabase.auth.getUser()
      if (userError || !user.user) {
        console.error("Erreur utilisateur:", userError)
        throw new Error("Utilisateur non connecté")
      }

      console.log("Utilisateur connecté:", user.user.id)

      // Test 1: Vérifier les politiques RLS actuelles
      console.log("Test 1: Vérification des politiques RLS...")
      const { data: policies, error: policiesError } = await supabase
        .from("pg_policies")
        .select("*")
        .eq("tablename", "notifications")

      if (policiesError) {
        console.error("Erreur récupération politiques:", policiesError)
      } else {
        console.log("Politiques RLS actuelles:", policies)
      }

      // Test 2: Insertion directe simple (pour soi-même)
      console.log("Test 2: Insertion directe pour soi-même...")
      const { data: notification1, error: error1 } = await supabase
        .from("notifications")
        .insert({
          utilisateur_id: user.user.id,
          type: "test_direct_self",
          message: "Test de notification directe pour moi",
          source: "test",
          url_cible: "/test",
          read: false,
        })
        .select()

      if (error1) {
        console.error("Erreur test 2:", error1)
        console.error("Code:", error1.code)
        console.error("Message:", error1.message)
      } else {
        console.log("Test 2 réussi:", notification1)
      }

      // Test 3: Vérifier si RLS est activé
      console.log("Test 3: Vérification statut RLS...")
      const { data: tableInfo, error: tableError } = await supabase
        .from("pg_tables")
        .select("tablename, rowsecurity")
        .eq("tablename", "notifications")

      if (tableError) {
        console.error("Erreur info table:", tableError)
      } else {
        console.log("Info table notifications:", tableInfo)
      }

      // Test 4: Essayer d'insérer pour un autre utilisateur
      console.log("Test 4: Insertion pour un autre utilisateur...")
      const testUserId = "194a22f5-a71f-4e91-8844-2df0ccf18338" // ID du propriétaire du club

      const { data: notification2, error: error2 } = await supabase
        .from("notifications")
        .insert({
          utilisateur_id: testUserId,
          type: "test_cross_user",
          message: "Test de notification pour autre utilisateur",
          source: "test",
          url_cible: "/test",
          read: false,
        })
        .select()

      if (error2) {
        console.error("Erreur test 4:", error2)
        console.error("Code:", error2.code)
        console.error("Message:", error2.message)
        console.error("Détails:", error2.details)
        console.error("Hint:", error2.hint)
      } else {
        console.log("Test 4 réussi:", notification2)
      }

      console.log("=== FIN TEST ===")
    } catch (error) {
      console.error("Erreur générale test:", error)
    }
  }

  // Test avec désactivation temporaire de RLS
  static async testWithoutRLS(): Promise<void> {
    try {
      console.log("=== TEST SANS RLS ===")

      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      console.log("Utilisateur connecté:", user.user.id)

      // Désactiver RLS temporairement (nécessite des privilèges admin)
      console.log("Tentative de désactivation RLS...")
      const { error: disableError } = await supabase.rpc("disable_rls_notifications")

      if (disableError) {
        console.log("Impossible de désactiver RLS (normal si pas admin):", disableError.message)
      }

      // Test d'insertion
      const testUserId = "194a22f5-a71f-4e91-8844-2df0ccf18338"

      const { data: notification, error: notifError } = await supabase
        .from("notifications")
        .insert({
          utilisateur_id: testUserId,
          type: "test_without_rls",
          message: "Test sans RLS",
          source: "test",
          url_cible: "/test",
          read: false,
        })
        .select()

      if (notifError) {
        console.error("Erreur même sans RLS:", notifError)
      } else {
        console.log("Succès sans RLS:", notification)
      }

      console.log("=== FIN TEST SANS RLS ===")
    } catch (error) {
      console.error("Erreur test sans RLS:", error)
    }
  }

  // Test de création via une vraie demande d'adhésion
  static async testRealJoinRequest(clubId: string): Promise<void> {
    try {
      console.log("=== TEST VRAIE DEMANDE D'ADHÉSION ===")
      console.log("Club ID:", clubId)

      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      // Nettoyer TOUTES les demandes existantes pour cet utilisateur et ce club
      console.log("Nettoyage complet des demandes existantes...")
      const { error: deleteError } = await supabase
        .from("demandes_adhesion")
        .delete()
        .eq("club_id", clubId)
        .eq("demandeur_id", user.user.id)

      if (deleteError) {
        console.error("Erreur suppression:", deleteError)
      } else {
        console.log("Demandes supprimées avec succès")
      }

      // Attendre un peu pour que la suppression soit effective
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Vérifier qu'il n'y a plus de demandes
      const { data: remainingRequests, error: checkError } = await supabase
        .from("demandes_adhesion")
        .select("*")
        .eq("club_id", clubId)
        .eq("demandeur_id", user.user.id)

      console.log("Demandes restantes après suppression:", remainingRequests?.length || 0)

      if (remainingRequests && remainingRequests.length > 0) {
        console.log("ATTENTION: Il reste des demandes, suppression forcée...")
        for (const req of remainingRequests) {
          await supabase.from("demandes_adhesion").delete().eq("id", req.id)
        }
      }

      // Vérifier que le club a un propriétaire
      const { data: club, error: clubError } = await supabase
        .from("clubs")
        .select("nom, proprietaire_id")
        .eq("id", clubId)
        .single()

      if (clubError) {
        console.error("Erreur récupération club:", clubError)
        return
      }

      console.log("Club:", club)

      if (!club.proprietaire_id) {
        console.error("ERREUR: Ce club n'a pas de propriétaire !")
        return
      }

      // Créer la demande avec un timestamp unique
      console.log("Création de la nouvelle demande...")
      const uniqueMessage = `Test de demande d'adhésion - ${new Date().toISOString()} - ${Math.random()}`

      const { data: request, error: requestError } = await supabase
        .from("demandes_adhesion")
        .insert({
          club_id: clubId,
          demandeur_id: user.user.id,
          message: uniqueMessage,
          statut: "en_attente",
        })
        .select()
        .single()

      if (requestError) {
        console.error("Erreur création demande:", requestError)
        console.error("Code:", requestError.code)
        console.error("Message:", requestError.message)
        return
      }

      console.log("Demande créée:", request)

      // Récupérer les infos du demandeur
      const { data: demandeur, error: demandeurError } = await supabase
        .from("utilisateurs")
        .select("nom, prenom")
        .eq("id", user.user.id)
        .single()

      if (demandeurError) {
        console.error("Erreur demandeur:", demandeurError)
        return
      }

      console.log("Demandeur:", demandeur)

      // Créer la notification avec un message unique
      const notificationData = {
        utilisateur_id: club.proprietaire_id,
        type: "demande_adhesion",
        message: `${demandeur?.nom} ${demandeur?.prenom} souhaite rejoindre votre club "${club.nom}" - ${new Date().toLocaleTimeString()}`,
        source: "club",
        url_cible: `/clubs/${clubId}/demandes`,
        read: false,
      }

      console.log("Données notification:", notificationData)

      const { data: notification, error: notifError } = await supabase
        .from("notifications")
        .insert(notificationData)
        .select()

      if (notifError) {
        console.error("ERREUR CRÉATION NOTIFICATION:", notifError)
        console.error("Message:", notifError.message)
        console.error("Code:", notifError.code)
        console.error("Détails:", notifError.details)
        console.error("Hint:", notifError.hint)

        // Essayer une approche alternative : utiliser une fonction RPC
        console.log("Tentative avec fonction RPC...")
        const { data: rpcResult, error: rpcError } = await supabase.rpc("create_notification", {
          p_utilisateur_id: club.proprietaire_id,
          p_type: "demande_adhesion",
          p_message: notificationData.message,
          p_source: "club",
          p_url_cible: notificationData.url_cible,
        })

        if (rpcError) {
          console.error("Erreur RPC aussi:", rpcError)
        } else {
          console.log("Succès avec RPC:", rpcResult)
        }
      } else {
        console.log("NOTIFICATION CRÉÉE AVEC SUCCÈS:", notification)
      }

      console.log("=== FIN TEST VRAIE DEMANDE ===")
    } catch (error) {
      console.error("Erreur test vraie demande:", error)
    }
  }

  // Test spécifique pour les notifications de demande d'adhésion
  static async testJoinRequestNotification(): Promise<void> {
    try {
      console.log("=== TEST NOTIFICATION DEMANDE D'ADHÉSION ===")

      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Utilisateur non connecté")

      console.log("Utilisateur connecté:", user.user.id)

      // Test simple : créer une notification pour soi-même d'abord
      console.log("Test préliminaire : notification pour soi-même...")
      const { data: selfNotif, error: selfError } = await supabase
        .from("notifications")
        .insert({
          utilisateur_id: user.user.id,
          type: "test_self",
          message: "Test notification pour moi-même",
          source: "test",
          read: false,
        })
        .select()

      if (selfError) {
        console.error("Erreur notification pour soi-même:", selfError)
        return
      } else {
        console.log("Notification pour soi-même réussie:", selfNotif)
      }

      // Maintenant essayer pour un autre utilisateur
      const targetUserId = "194a22f5-a71f-4e91-8844-2df0ccf18338"

      console.log("Test principal : notification pour autre utilisateur...")
      const { data: otherNotif, error: otherError } = await supabase
        .from("notifications")
        .insert({
          utilisateur_id: targetUserId,
          type: "test_other",
          message: "Test notification pour autre utilisateur",
          source: "test",
          read: false,
        })
        .select()

      if (otherError) {
        console.error("Erreur notification pour autre:", otherError)
        console.error("Code:", otherError.code)
        console.error("Message:", otherError.message)

        // Diagnostic supplémentaire
        console.log("Diagnostic : vérification des permissions...")
        const { data: currentUser } = await supabase.auth.getUser()
        console.log("Utilisateur actuel:", currentUser.user?.id)
        console.log("Utilisateur cible:", targetUserId)
        console.log("Sont-ils identiques ?", currentUser.user?.id === targetUserId)
      } else {
        console.log("Notification pour autre utilisateur réussie:", otherNotif)
      }

      console.log("=== FIN TEST NOTIFICATION DEMANDE ===")
    } catch (error) {
      console.error("Erreur test notification demande:", error)
    }
  }
}
