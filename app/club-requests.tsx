"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { ArrowLeft, Check, X } from "lucide-react-native"
import { clubService } from "../services/clubService"
import { supabase } from "../lib/supabase"

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
}

interface PendingRequest {
  id: string
  club_id: string
  demandeur_id: string
  message: string | null
  created_at: string
  clubs: {
    nom: string
  }
  utilisateurs: {
    nom: string | null
    prenom: string | null
    photo_profil_url: string | null
  }
}

export default function ClubRequestsScreen() {
  const router = useRouter()
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadPendingRequests()
  }, [])

  const loadPendingRequests = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: requestsData, error } = await supabase
        .from("demandes_adhesion")
        .select(`
          *,
          clubs!inner(nom, proprietaire_id),
          utilisateurs(nom, prenom, photo_profil_url)
        `)
        .eq("clubs.proprietaire_id", user.user.id)
        .eq("statut", "en_attente")
        .order("created_at", { ascending: false })

      if (error) throw error

      console.log("Demandes trouvées:", requestsData?.length || 0)
      setRequests(requestsData || [])
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async (requestId: string, action: "accepter" | "refuser") => {
    setProcessing(requestId)
    try {
      await clubService.handleJoinRequest(requestId, action)
      Alert.alert("Succès", action === "accepter" ? "Demande acceptée !" : "Demande refusée")
      await loadPendingRequests()
    } catch (error) {
      Alert.alert("Erreur", "Impossible de traiter la demande")
      console.error("Erreur:", error)
    } finally {
      setProcessing(null)
    }
  }

  const renderRequest = ({ item }: { item: PendingRequest }) => {
    const memberName = `${item.utilisateurs?.prenom || ""} ${item.utilisateurs?.nom || ""}`.trim()

    return (
      <View style={styles.requestCard}>
        <Image
          source={{
            uri: item.utilisateurs?.photo_profil_url || "https://via.placeholder.com/50",
          }}
          style={styles.memberAvatar}
        />
        <View style={styles.requestInfo}>
          <Text style={styles.memberName}>{memberName || "Utilisateur"}</Text>
          <Text style={styles.clubName}>Club: {item.clubs.nom}</Text>
          {item.message && <Text style={styles.requestMessage}>"{item.message}"</Text>}
          <Text style={styles.requestDate}>{new Date(item.created_at).toLocaleDateString("fr-FR")}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleRequest(item.id, "accepter")}
            disabled={processing === item.id}
          >
            {processing === item.id ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Check size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRequest(item.id, "refuser")}
            disabled={processing === item.id}
          >
            <X size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Demandes d'adhésion</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : requests.length > 0 ? (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.requestsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aucune demande en attente</Text>
        </View>
      )}
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  requestsList: {
    padding: 16,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 2,
  },
  clubName: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  requestMessage: {
    fontSize: 12,
    color: Colors.darkGray,
    fontStyle: "italic",
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: Colors.gray,
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.danger,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.gray,
  },
})
