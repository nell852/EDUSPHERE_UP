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
import { Plus, Search, Users, MessageCircle, Calendar, Award, X, Bell } from "lucide-react-native"
import { clubService, type ClubWithDetails, type FeedItem } from "../../services/clubService"
import { supabase } from "../../lib/supabase"
import * as ImagePicker from "expo-image-picker"
import { router } from "expo-router"

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

  // Charger les données initiales
  useEffect(() => {
    loadInitialData()
    loadNotifications()

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
          // Recharger les notifications
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

      const { data: notifs, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("utilisateur_id", user.user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erreur lors du chargement des notifications:", error)
        throw error
      }

      console.log("Notifications trouvées:", notifs?.length || 0)
      setNotifications(notifs || [])
    } catch (err) {
      console.error("Erreur lors du chargement des notifications:", err)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

      if (error) throw error

      // Recharger les notifications
      await loadNotifications()
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification:", error)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadInitialData()
    await loadNotifications()
    setRefreshing(false)
  }, [])

  // Créer un club
  const createClub = async () => {
    if (!newClubName || !newClubDomain || !newClubDescription) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires")
      return
    }

    setCreatingClub(true)
    try {
      let avatarUrl = null

      // Upload de l'avatar si sélectionné
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

      // Réinitialiser le formulaire
      setNewClubName("")
      setNewClubDomain("")
      setNewClubDescription("")
      setNewClubAvatar(null)
      setShowCreateModal(false)

      Alert.alert("Succès", "Club créé avec succès !")

      // Recharger les données
      await loadMyClubs()
      await loadClubs()
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Erreur lors de la création du club")
    } finally {
      setCreatingClub(false)
    }
  }

  // Faire une demande d'adhésion
  const requestJoinClub = async (clubId: string, clubName: string) => {
    try {
      await clubService.requestJoinClub(clubId, `Je souhaite rejoindre le club ${clubName}`)
      Alert.alert("Demande envoyée", "Votre demande d'adhésion a été envoyée au propriétaire du club")

      // Recharger les clubs pour mettre à jour le statut
      await loadClubs(searchQuery)
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Erreur lors de la demande d'adhésion")
    }
  }

  // Sélectionner une image pour l'avatar
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

  // Rendu d'un club
  const renderClubItem = ({ item, showJoinButton = true }: { item: ClubWithDetails; showJoinButton?: boolean }) => (
    <TouchableOpacity style={styles.clubCard}>
      <Image source={{ uri: item.avatar_url || "https://via.placeholder.com/50" }} style={styles.clubAvatar} />
      <View style={styles.clubInfo}>
        <Text style={styles.clubName}>{item.nom}</Text>
        <Text style={styles.clubDomain}>{item.domaine}</Text>
        <View style={styles.clubMembersContainer}>
          <Users size={14} color={Colors.gray} />
          <Text style={styles.clubMembers}>{item.membres_count} membres</Text>
        </View>
        <Text style={styles.clubDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      {showJoinButton && !item.is_member && (
        <TouchableOpacity
          style={[styles.joinButton, item.demande_pending && styles.pendingButton]}
          onPress={() => requestJoinClub(item.id, item.nom)}
          disabled={item.demande_pending}
        >
          <Text style={[styles.joinButtonText, item.demande_pending && styles.pendingButtonText]}>
            {item.demande_pending ? "En attente" : "Rejoindre"}
          </Text>
        </TouchableOpacity>
      )}
      {item.is_member && (
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => router.push(`/chat/club/${item.id}?name=${encodeURIComponent(item.nom)}`)}
        >
          <MessageCircle size={16} color={Colors.white} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )

  // Rendu d'un élément du flux
  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    let icon, backgroundColor
    switch (item.type) {
      case "event":
        icon = <Calendar size={20} color={Colors.white} />
        backgroundColor = Colors.primary
        break
      case "challenge":
        icon = <Award size={20} color={Colors.white} />
        backgroundColor = Colors.success
        break
      case "discussion":
        icon = <MessageCircle size={20} color={Colors.white} />
        backgroundColor = Colors.secondary
        break
      default:
        icon = null
        backgroundColor = Colors.primary
    }

    return (
      <TouchableOpacity
        style={styles.feedItem}
        onPress={() => router.push(`/chat/club/${item.club_id}?name=${encodeURIComponent(item.club)}`)}
      >
        <View style={[styles.feedItemIcon, { backgroundColor }]}>{icon}</View>
        <View style={styles.feedItemContent}>
          <Text style={styles.feedItemTitle}>{item.title}</Text>
          <Text style={styles.feedItemClub}>{item.club}</Text>
          <View style={styles.feedItemDetails}>
            <Text style={styles.feedItemDate}>{new Date(item.date).toLocaleDateString("fr-FR")}</Text>
            <View style={styles.feedItemParticipants}>
              <Users size={12} color={Colors.gray} />
              <Text style={styles.feedItemParticipantsText}>{item.participants}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = (title: string, subtitle: string, buttonText?: string, onButtonPress?: () => void) => (
    <View style={styles.emptyState}>
      <Users size={48} color={Colors.lightGray} />
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
      {buttonText && onButtonPress && (
        <TouchableOpacity style={styles.emptyStateButton} onPress={onButtonPress}>
          <Text style={styles.emptyStateButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des clubs, discussions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.gray}
          />
        </View>

        <TouchableOpacity style={styles.notificationButton} onPress={() => setShowNotifications(true)}>
          <Bell size={20} color={Colors.primary} />
          {notifications.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "feed" && styles.activeTab]}
          onPress={() => setActiveTab("feed")}
        >
          <Text style={[styles.tabText, activeTab === "feed" && styles.activeTabText]}>Flux</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "clubs" && styles.activeTab]}
          onPress={() => setActiveTab("clubs")}
        >
          <Text style={[styles.tabText, activeTab === "clubs" && styles.activeTabText]}>Clubs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "my-clubs" && styles.activeTab]}
          onPress={() => setActiveTab("my-clubs")}
        >
          <Text style={[styles.tabText, activeTab === "my-clubs" && styles.activeTabText]}>Mes Clubs</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur : {error}</Text>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Créer un nouveau club</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.modalInput}
                placeholder="Nom du club"
                value={newClubName}
                onChangeText={setNewClubName}
                placeholderTextColor={Colors.gray}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Domaine (ex: Technologie)"
                value={newClubDomain}
                onChangeText={setNewClubDomain}
                placeholderTextColor={Colors.gray}
              />

              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Description"
                value={newClubDescription}
                onChangeText={setNewClubDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={Colors.gray}
              />

              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Text style={styles.imagePickerText}>{newClubAvatar ? "Image sélectionnée" : "Choisir un avatar"}</Text>
              </TouchableOpacity>

              {newClubAvatar && <Image source={{ uri: newClubAvatar }} style={styles.avatarPreview} />}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
                disabled={creatingClub}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButtonStyle]}
                onPress={createClub}
                disabled={creatingClub}
              >
                {creatingClub ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.createButtonText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal des notifications */}
      <Modal visible={showNotifications} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <X size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.viewAllRequestsButton}
                onPress={() => {
                  setShowNotifications(false)
                  router.push("/club-requests")
                }}
              >
                <Text style={styles.viewAllRequestsText}>Voir toutes les demandes</Text>
              </TouchableOpacity>
            )}

            {notifications.length > 0 ? (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.notificationItem} onPress={() => markNotificationAsRead(item.id)}>
                    <Text style={styles.notificationMessage}>{item.message}</Text>
                    <Text style={styles.notificationDate}>{new Date(item.created_at).toLocaleDateString("fr-FR")}</Text>
                    <Text style={styles.notificationType}>Type: {item.type}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyNotifications}>
                <Text style={styles.emptyNotificationsText}>Aucune notification</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.white,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: Colors.black,
    fontSize: 16,
  },
  notificationButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  createButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.gray,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: "600",
  },
  clubsList: {
    padding: 16,
  },
  clubCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clubAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 2,
  },
  clubDomain: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 4,
  },
  clubMembersContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  clubMembers: {
    fontSize: 12,
    color: Colors.gray,
    marginLeft: 4,
  },
  clubDescription: {
    fontSize: 12,
    color: Colors.darkGray,
    lineHeight: 16,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  joinButtonText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  pendingButton: {
    backgroundColor: Colors.warning,
  },
  pendingButtonText: {
    color: Colors.white,
  },
  feedList: {
    padding: 16,
  },
  feedItem: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  feedItemContent: {
    flex: 1,
  },
  feedItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 2,
  },
  feedItemClub: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  feedItemDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  feedItemDate: {
    fontSize: 12,
    color: Colors.gray,
  },
  feedItemParticipants: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedItemParticipantsText: {
    fontSize: 12,
    color: Colors.gray,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 24,
    textAlign: "center",
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 16,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.black,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: Colors.black,
  },
  textArea: {
    height: 80,
  },
  imagePickerButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  imagePickerText: {
    color: Colors.black,
    fontSize: 16,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
    marginRight: 8,
  },
  cancelButtonText: {
    color: Colors.darkGray,
    fontWeight: "600",
  },
  createButtonStyle: {
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  createButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  notificationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.black,
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: Colors.gray,
  },
  emptyNotifications: {
    padding: 24,
    alignItems: "center",
  },
  emptyNotificationsText: {
    fontSize: 16,
    color: Colors.gray,
  },
  chatButton: {
    backgroundColor: Colors.success,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
    marginTop: 8,
  },
  notificationType: {
    fontSize: 10,
    color: Colors.gray,
    marginTop: 2,
  },
  viewAllRequestsButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  viewAllRequestsText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
})
