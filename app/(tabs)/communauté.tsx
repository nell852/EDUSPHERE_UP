"use client"

import { useState, useEffect, useCallback } from "react"
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Plus, Search, Users, MessageCircle, Calendar, Award, X, Bell, Check } from "lucide-react-native"
import { clubService, type ClubWithDetails, type FeedItem } from "../../services/clubService"
import { supabase } from "../../lib/supabase"
import * as ImagePicker from "expo-image-picker"
import { router } from "expo-router"

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

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<"feed" | "clubs" | "my-clubs">("feed")
  const [clubs, setClubs] = useState<ClubWithDetails[]>([])
  const [myClubs, setMyClubs] = useState<ClubWithDetails[]>([])
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // États pour la création de club
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClubName, setNewClubName] = useState("")
  const [newClubDomain, setNewClubDomain] = useState("")
  const [newClubDescription, setNewClubDescription] = useState("")
  const [newClubAvatar, setNewClubAvatar] = useState<string | null>(null)
  const [creatingClub, setCreatingClub] = useState(false)

  // États pour les notifications
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  // États pour la gestion des demandes
  const [showRequestsModal, setShowRequestsModal] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  // Charger les données initiales
  useEffect(() => {
    loadInitialData()
    loadNotifications()
    loadPendingRequests()

    // S'abonner aux nouvelles notifications
    const notificationSubscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("Nouvelle notification reçue:", payload)
          loadNotifications()
        },
      )
      .subscribe()

    return () => {
      notificationSubscription.unsubscribe()
    }
  }, [])

  // Rafraîchir les données lorsque l'onglet change
  useEffect(() => {
    if (activeTab === "feed") loadFeedItems()
    if (activeTab === "clubs") loadClubs()
    if (activeTab === "my-clubs") loadMyClubs()
  }, [activeTab])

  // Rechercher les clubs
  useEffect(() => {
    if (activeTab === "clubs") {
      loadClubs(searchQuery)
    }
  }, [searchQuery])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadFeedItems(), loadClubs(), loadMyClubs()])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const loadClubs = async (query = "") => {
    try {
      const clubsData = await clubService.getAllClubs(query)
      setClubs(clubsData)
    } catch (err) {
      console.error("Erreur lors du chargement des clubs:", err)
    }
  }

  const loadMyClubs = async () => {
    try {
      const myClubsData = await clubService.getMyClubs()
      setMyClubs(myClubsData)
    } catch (err) {
      console.error("Erreur lors du chargement de mes clubs:", err)
    }
  }

  const loadFeedItems = async () => {
    try {
      const feedData = await clubService.getFeedItems()
      setFeedItems(feedData)
    } catch (err) {
      console.error("Erreur lors du chargement du flux:", err)
    }
  }

  const loadNotifications = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      console.log("Chargement des notifications pour:", user.user.id)

      const { data: unreadNotifs, error: unreadError } = await supabase
        .from("notifications")
        .select("*")
        .eq("utilisateur_id", user.user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })

      if (unreadError) {
        console.error("Erreur lors du chargement des notifications non lues:", unreadError)
        throw unreadError
      }

      console.log("Notifications non lues trouvées:", unreadNotifs?.length || 0)
      setNotifications(unreadNotifs || [])
    } catch (err) {
      console.error("Erreur lors du chargement des notifications:", err)
    }
  }

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

      console.log("Demandes en attente trouvées:", requestsData?.length || 0)
      setPendingRequests(requestsData || [])
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
    }
  }

  const handleNotificationClick = async (notification: any) => {
    try {
      await markNotificationAsRead(notification.id)
      if (notification.type === "demande_adhesion") {
        setShowNotifications(false)
        setShowRequestsModal(true)
        await loadPendingRequests()
      }
    } catch (error) {
      console.error("Erreur lors du traitement de la notification:", error)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)
      if (error) throw error
      await loadNotifications()
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification:", error)
    }
  }

  const handleJoinRequest = async (requestId: string, action: "accepter" | "refuser") => {
    setProcessingRequest(requestId)
    try {
      await clubService.handleJoinRequest(requestId, action)
      Alert.alert("Succès", action === "accepter" ? "Demande acceptée !" : "Demande refusée")
      await Promise.all([loadPendingRequests(), loadNotifications(), loadMyClubs(), loadClubs()])
    } catch (error) {
      Alert.alert("Erreur", "Impossible de traiter la demande")
      console.error("Erreur:", error)
    } finally {
      setProcessingRequest(null)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([loadInitialData(), loadNotifications(), loadPendingRequests()])
    setRefreshing(false)
  }, [])

  const createClub = async () => {
    if (!newClubName || !newClubDomain || !newClubDescription) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires")
      return
    }

    setCreatingClub(true)
    try {
      let avatarUrl = null

      if (newClubAvatar) {
        const { data: user } = await supabase.auth.getUser()
        if (user.user) {
          const fileName = `club_avatars/${user.user.id}_${Date.now()}.jpg`
          const response = await fetch(newClubAvatar)
          const blob = await response.blob()
          const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, blob)
          if (uploadError) throw uploadError
          const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(fileName)
          avatarUrl = publicUrl.publicUrl
        }
      }

      await clubService.createClub({
        nom: newClubName,
        domaine: newClubDomain,
        description: newClubDescription,
        avatar_url: avatarUrl || undefined,
      })

      setNewClubName("")
      setNewClubDomain("")
      setNewClubDescription("")
      setNewClubAvatar(null)
      setShowCreateModal(false)
      Alert.alert("Succès", "Club créé avec succès !")

      await loadMyClubs()
      await loadClubs()
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Erreur lors de la création du club")
    } finally {
      setCreatingClub(false)
    }
  }

  const requestJoinClub = async (clubId: string, clubName: string) => {
    try {
      await clubService.requestJoinClub(clubId, `Je souhaite rejoindre le club ${clubName}`)
      Alert.alert("Demande envoyée", "Votre demande d'adhésion a été envoyée au propriétaire du club")
      await loadClubs(searchQuery)
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Erreur lors de la demande d'adhésion")
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
      setNewClubAvatar(result.assets[0].uri)
    }
  }

  const renderClubItem = ({ item, showJoinButton = true }: { item: ClubWithDetails; showJoinButton?: boolean }) => (
    <TouchableOpacity style={styles.clubCard} activeOpacity={0.8}>
      <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.clubCardGradient}>
        <Image source={{ uri: item.avatar_url || "https://via.placeholder.com/50" }} style={styles.clubAvatar} />
        <View style={styles.clubInfo}>
          <Text style={styles.clubName}>{item.nom}</Text>
          <Text style={styles.clubDomain}>🏷️ {item.domaine}</Text>
          <View style={styles.clubMembersContainer}>
            <Users size={12} color="#6B7280" />
            <Text style={styles.clubMembers}>{item.membres_count} membres</Text>
          </View>
          <Text style={styles.clubDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <View style={styles.clubActions}>
          {showJoinButton && !item.is_member && (
            <TouchableOpacity
              onPress={() => requestJoinClub(item.id, item.nom)}
              disabled={item.demande_pending}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={item.demande_pending ? ["#F59E0B", "#FBBF24"] : ["#3B82F6", "#60A5FA"]}
                style={styles.joinButton}
              >
                <Text style={styles.joinButtonText}>{item.demande_pending ? "En attente" : "Rejoindre"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {item.is_member && (
            <TouchableOpacity
              onPress={() => router.push(`/chat/club/${item.id}?name=${encodeURIComponent(item.nom)}`)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={["#10B981", "#34D399"]} style={styles.chatButton}>
                <MessageCircle size={14} color="#FFFFFF" />
                <Text style={styles.chatButtonText}>Chat</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    let icon: React.ReactNode
    let colors: [string, string]

    switch (item.type) {
      case "event":
        icon = <Calendar size={16} color="#FFFFFF" />
        colors = ["#3B82F6", "#60A5FA"]
        break
      case "challenge":
        icon = <Award size={16} color="#FFFFFF" />
        colors = ["#10B981", "#34D399"]
        break
      case "discussion":
        icon = <MessageCircle size={16} color="#FFFFFF" />
        colors = ["#8B5CF6", "#A78BFA"]
        break
      default:
        icon = null
        colors = ["#3B82F6", "#60A5FA"]
    }

    return (
      <TouchableOpacity
        style={styles.feedItem}
        onPress={() => router.push(`/chat/club/${item.club_id}?name=${encodeURIComponent(item.club)}`)}
        activeOpacity={0.8}
      >
        <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.feedItemGradient}>
          <LinearGradient colors={colors} style={styles.feedItemIcon}>
            {icon}
          </LinearGradient>
          <View style={styles.feedItemContent}>
            <Text style={styles.feedItemTitle}>{item.title}</Text>
            <Text style={styles.feedItemClub}>📍 {item.club}</Text>
            <View style={styles.feedItemDetails}>
              <Text style={styles.feedItemDate}>📅 {new Date(item.date).toLocaleDateString("fr-FR")}</Text>
              <View style={styles.feedItemParticipants}>
                <Users size={10} color="#6B7280" />
                <Text style={styles.feedItemParticipantsText}>{item.participants}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = (title: string, subtitle: string, buttonText?: string, onButtonPress?: () => void) => (
    <View style={styles.emptyState}>
      <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.emptyStateCard}>
        <Users size={32} color="#3B82F6" />
        <Text style={styles.emptyStateTitle}>{title}</Text>
        <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
        {buttonText && onButtonPress && (
          <TouchableOpacity onPress={onButtonPress} activeOpacity={0.8}>
            <LinearGradient colors={["#3B82F6", "#60A5FA"]} style={styles.emptyStateButton}>
              <Text style={styles.emptyStateButtonText}>{buttonText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  )

  const renderPendingRequest = ({ item }: { item: PendingRequest }) => {
    const memberName = `${item.utilisateurs?.prenom || ""} ${item.utilisateurs?.nom || ""}`.trim()

    return (
      <TouchableOpacity style={styles.requestCard} activeOpacity={0.8}>
        <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.requestCardGradient}>
          <Image
            source={{
              uri: item.utilisateurs?.photo_profil_url || "https://via.placeholder.com/50",
            }}
            style={styles.memberAvatar}
          />
          <View style={styles.requestInfo}>
            <Text style={styles.memberName}>{memberName || "Utilisateur"}</Text>
            <Text style={styles.clubName}>🏛️ {item.clubs.nom}</Text>
            {item.message && <Text style={styles.requestMessage}> "{item.message}"</Text>}
            <Text style={styles.requestDate}>📅 {new Date(item.created_at).toLocaleDateString("fr-FR")}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => handleJoinRequest(item.id, "accepter")}
              disabled={processingRequest === item.id}
              activeOpacity={0.8}
            >
              <LinearGradient colors={["#10B981", "#34D399"]} style={styles.actionButton}>
                {processingRequest === item.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Check size={16} color="#FFFFFF" />
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleJoinRequest(item.id, "refuser")}
              disabled={processingRequest === item.id}
              activeOpacity={0.8}
            >
              <LinearGradient colors={["#EF4444", "#F87171"]} style={styles.actionButton}>
                <X size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.header}>
        <View style={styles.searchContainer}>
          <LinearGradient colors={["#F8F9FA", "#FFFFFF"]} style={styles.searchInputContainer}>
            <Search size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher des clubs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </LinearGradient>
        </View>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setShowNotifications(true)}
          activeOpacity={0.8}
        >
          <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.iconButtonGradient}>
            <Bell size={16} color="#3B82F6" />
            {notifications.length > 0 && (
              <LinearGradient colors={["#EF4444", "#F87171"]} style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
              </LinearGradient>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {pendingRequests.length > 0 && (
          <TouchableOpacity
            style={styles.requestsButton}
            onPress={() => setShowRequestsModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={["#FEF3C7", "#FDE68A"]} style={styles.iconButtonGradient}>
              <Users size={16} color="#F59E0B" />
              <LinearGradient colors={["#F59E0B", "#FBBF24"]} style={styles.requestsBadge}>
                <Text style={styles.requestsBadgeText}>{pendingRequests.length}</Text>
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setShowCreateModal(true)} activeOpacity={0.8}>
          <LinearGradient colors={["#3B82F6", "#60A5FA"]} style={styles.createButton}>
            <Plus size={16} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("feed")} activeOpacity={0.8}>
          <LinearGradient
            colors={activeTab === "feed" ? ["#3B82F6", "#60A5FA"] : ["#F8F9FA", "#FFFFFF"]}
            style={styles.tabGradient}
          >
            <Text style={[styles.tabText, activeTab === "feed" && styles.activeTabText]}>Flux</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("clubs")} activeOpacity={0.8}>
          <LinearGradient
            colors={activeTab === "clubs" ? ["#3B82F6", "#60A5FA"] : ["#F8F9FA", "#FFFFFF"]}
            style={styles.tabGradient}
          >
            <Text style={[styles.tabText, activeTab === "clubs" && styles.activeTabText]}> Clubs</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("my-clubs")} activeOpacity={0.8}>
          <LinearGradient
            colors={activeTab === "my-clubs" ? ["#3B82F6", "#60A5FA"] : ["#F8F9FA", "#FFFFFF"]}
            style={styles.tabGradient}
          >
            <Text style={[styles.tabText, activeTab === "my-clubs" && styles.activeTabText]}>Mes Clubs</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </LinearGradient>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <LinearGradient colors={["#FEF2F2", "#FEE2E2"]} style={styles.errorCard}>
            <Text style={styles.errorText}>❌ Erreur : {error}</Text>
          </LinearGradient>
        </View>
      ) : (
        <>
          {activeTab === "feed" && (
            <>
              {feedItems.length > 0 ? (
                <FlatList
                  data={feedItems}
                  renderItem={renderFeedItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.feedList}
                  showsVerticalScrollIndicator={false}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
              ) : (
                renderEmptyState(
                  "Aucune publication",
                  "Rejoignez un club pour voir son flux",
                  "Parcourir les clubs",
                  () => setActiveTab("clubs"),
                )
              )}
            </>
          )}

          {activeTab === "clubs" && (
            <>
              {clubs.length > 0 ? (
                <FlatList
                  data={clubs}
                  renderItem={({ item }) => renderClubItem({ item, showJoinButton: true })}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.clubsList}
                  showsVerticalScrollIndicator={false}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
              ) : (
                renderEmptyState("Aucun club trouvé", "Essayez une autre recherche")
              )}
            </>
          )}

          {activeTab === "my-clubs" && (
            <>
              {myClubs.length > 0 ? (
                <FlatList
                  data={myClubs}
                  renderItem={({ item }) => renderClubItem({ item, showJoinButton: false })}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.clubsList}
                  showsVerticalScrollIndicator={false}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
              ) : (
                renderEmptyState(
                  "Aucun club rejoint",
                  "Rejoignez des clubs pour collaborer",
                  "Parcourir les clubs",
                  () => setActiveTab("clubs"),
                )
              )}
            </>
          )}
        </>
      )}

      {/* Modal pour créer un club */}
      <Modal visible={showCreateModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Créer un nouveau club</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} activeOpacity={0.8}>
                <LinearGradient colors={["#F3F4F6", "#E5E7EB"]} style={styles.closeButton}>
                  <X size={20} color="#6B7280" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <LinearGradient colors={["#F8F9FA", "#FFFFFF"]} style={styles.modalInput}>
                <TextInput
                  placeholder="Nom du club"
                  value={newClubName}
                  onChangeText={setNewClubName}
                  placeholderTextColor="#9CA3AF"
                  style={styles.inputText}
                />
              </LinearGradient>

              <LinearGradient colors={["#F8F9FA", "#FFFFFF"]} style={styles.modalInput}>
                <TextInput
                  placeholder="Domaine (ex: Technologie)"
                  value={newClubDomain}
                  onChangeText={setNewClubDomain}
                  placeholderTextColor="#9CA3AF"
                  style={styles.inputText}
                />
              </LinearGradient>

              <LinearGradient colors={["#F8F9FA", "#FFFFFF"]} style={[styles.modalInput, styles.textArea]}>
                <TextInput
                  placeholder="Description"
                  value={newClubDescription}
                  onChangeText={setNewClubDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                  style={styles.inputText}
                />
              </LinearGradient>

              <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.imagePickerButton}>
                  <Text style={styles.imagePickerText}>
                    {newClubAvatar ? "📷 Image sélectionnée" : "📷 Choisir un avatar"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {newClubAvatar && <Image source={{ uri: newClubAvatar }} style={styles.avatarPreview} />}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} disabled={creatingClub} activeOpacity={0.8}>
                <LinearGradient colors={["#F3F4F6", "#E5E7EB"]} style={styles.modalButton}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={createClub} disabled={creatingClub} activeOpacity={0.8}>
                <LinearGradient colors={["#10B981", "#34D399"]} style={styles.modalButton}>
                  {creatingClub ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.createButtonText}>Créer</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal des notifications */}
      <Modal visible={showNotifications} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔔 Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)} activeOpacity={0.8}>
                <LinearGradient colors={["#F3F4F6", "#E5E7EB"]} style={styles.closeButton}>
                  <X size={20} color="#6B7280" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {notifications.length > 0 ? (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleNotificationClick(item)} activeOpacity={0.8}>
                    <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.notificationItem}>
                      <Text style={styles.notificationMessage}>{item.message}</Text>
                      <Text style={styles.notificationDate}>
                        📅 {new Date(item.created_at).toLocaleDateString("fr-FR")}
                      </Text>
                      <Text style={styles.notificationType}>🏷️ {item.type}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyNotifications}>
                <Text style={styles.emptyNotificationsText}>📭 Aucune notification</Text>
              </View>
            )}
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal des demandes d'adhésion */}
      <Modal visible={showRequestsModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👥 Demandes d'adhésion</Text>
              <TouchableOpacity onPress={() => setShowRequestsModal(false)} activeOpacity={0.8}>
                <LinearGradient colors={["#F3F4F6", "#E5E7EB"]} style={styles.closeButton}>
                  <X size={20} color="#6B7280" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {pendingRequests.length > 0 ? (
              <FlatList
                data={pendingRequests}
                renderItem={renderPendingRequest}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyNotifications}>
                <Text style={styles.emptyNotificationsText}>📭 Aucune demande en attente</Text>
              </View>
            )}
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  searchContainer: {
    flex: 1,
    marginRight: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#1F2937",
    fontSize: 14,
  },
  notificationButton: {
    marginRight: 8,
  },
  requestsButton: {
    marginRight: 8,
  },
  iconButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  requestsBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  requestsBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  createButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    marginHorizontal: 2,
  },
  tabGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  tabText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  clubsList: {
    padding: 16,
  },
  clubCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  clubCardGradient: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 16,
  },
  clubAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  clubDomain: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },
  clubMembersContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  clubMembers: {
    fontSize: 10,
    color: "#6B7280",
    marginLeft: 4,
  },
  clubDescription: {
    fontSize: 11,
    color: "#374151",
    lineHeight: 16,
  },
  clubActions: {
    alignItems: "flex-end",
    gap: 4,
  },
  joinButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 11,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  feedList: {
    padding: 16,
  },
  feedItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  feedItemGradient: {
    flexDirection: "row",
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 16,
  },
  feedItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  feedItemContent: {
    flex: 1,
  },
  feedItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  feedItemClub: {
    fontSize: 11,
    color: "#3B82F6",
    marginBottom: 4,
  },
  feedItemDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  feedItemDate: {
    fontSize: 10,
    color: "#6B7280",
  },
  feedItemParticipants: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedItemParticipantsText: {
    fontSize: 10,
    color: "#6B7280",
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyStateCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 16,
    textAlign: "center",
  },
  emptyStateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalInput: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  inputText: {
    fontSize: 14,
    color: "#1F2937",
  },
  textArea: {
    minHeight: 80,
  },
  imagePickerButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  imagePickerText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "500",
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 14,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  notificationItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  notificationMessage: {
    fontSize: 12,
    color: "#1F2937",
    marginBottom: 4,
    fontWeight: "500",
  },
  notificationDate: {
    fontSize: 10,
    color: "#6B7280",
  },
  notificationType: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
  },
  emptyNotifications: {
    padding: 32,
    alignItems: "center",
  },
  emptyNotificationsText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  requestCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  requestCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 16,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  requestMessage: {
    fontSize: 11,
    color: "#374151",
    fontStyle: "italic",
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 10,
    color: "#6B7280",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
})
