"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRoute, useNavigation } from "@react-navigation/native"
import { Users, ArrowLeft, Send } from "lucide-react-native"
import ClubMembersList from "../../../components/ClubMembersList"
import { chatService, type ChatMessage } from "../../../services/chatService"
import { supabase } from "../../../lib/supabase"

const ClubChatScreen = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { id, name } = route.params as { id: string; name: string }

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showMembers, setShowMembers] = useState(false)

  const flatListRef = useRef<FlatList>(null)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    if (id) {
      initializeChat()
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [id])

  const initializeChat = async () => {
    try {
      // Vérifier l'authentification
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        Alert.alert("Erreur", "Vous devez être connecté")
        navigation.goBack()
        return
      }

      setCurrentUserId(user.user.id)

      // Récupérer les infos de l'utilisateur actuel
      const { data: userData } = await supabase
        .from("utilisateurs")
        .select("nom, prenom, photo_profil_url")
        .eq("id", user.user.id)
        .single()

      setCurrentUser(userData)

      // Vérifier l'appartenance au club
      const { data: membership } = await supabase
        .from("club_membres")
        .select("*")
        .eq("club_id", id)
        .eq("membre_id", user.user.id)
        .single()

      if (!membership) {
        Alert.alert("Erreur", "Vous n'êtes pas membre de ce club")
        navigation.goBack()
        return
      }

      // Charger les messages
      await loadMessages()

      // S'abonner aux nouveaux messages du club
      subscriptionRef.current = chatService.subscribeToClubMessages(id, (message) => {
        // Éviter les doublons - ne pas ajouter si c'est notre propre message qu'on vient d'envoyer
        setMessages((prev) => {
          const messageExists = prev.some((m) => m.id === message.id)
          if (messageExists) return prev
          return [...prev, message]
        })

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true })
        }, 100)
      })
    } catch (error) {
      console.error("Erreur lors de l'initialisation du chat:", error)
      Alert.alert("Erreur", "Impossible de charger le chat")
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const messagesData = await chatService.getClubMessages(id)
      setMessages(messagesData)
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false })
      }, 100)
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    const messageText = newMessage.trim()
    setNewMessage("") // Vider le champ immédiatement

    // Créer un message temporaire pour l'affichage immédiat
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      expediteur_id: currentUserId,
      destinataire_id: null,
      club_id: id,
      contenu: messageText,
      type: "texte",
      media_url: null,
      created_at: new Date().toISOString(),
      read_at: null,
      expediteur: currentUser,
    }

    // Ajouter le message temporaire à l'affichage
    setMessages((prev) => [...prev, tempMessage])
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)

    setSending(true)

    try {
      // Envoyer le message réel
      await chatService.sendClubMessage(id, messageText)

      // Remplacer le message temporaire par le vrai message quand il arrive via l'abonnement
      // (cela se fera automatiquement via subscribeToClubMessages)
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
      Alert.alert("Erreur", "Impossible d'envoyer le message")

      // Supprimer le message temporaire en cas d'erreur
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
    } finally {
      setSending(false)
    }
  }

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.expediteur_id === currentUserId
    const senderName = `${item.expediteur?.prenom || ""} ${item.expediteur?.nom || ""}`.trim()
    const isTemporary = item.id.startsWith("temp-")

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        {!isMyMessage && (
          <Image
            source={{
              uri: item.expediteur?.photo_profil_url || "https://via.placeholder.com/30",
            }}
            style={styles.senderAvatar}
          />
        )}
        <View style={[styles.messageBubble, isTemporary && styles.temporaryMessage]}>
          <LinearGradient
            colors={
              isMyMessage ? ["#3B82F6", "#60A5FA"] : isTemporary ? ["#F3F4F6", "#E5E7EB"] : ["#F8F9FA", "#FFFFFF"]
            }
            style={[styles.messageBubbleGradient, isMyMessage ? styles.myMessage : styles.otherMessage]}
          >
            {!isMyMessage && <Text style={styles.senderName}>👤 {senderName || "Utilisateur"}</Text>}
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
              {item.contenu}
            </Text>
            <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
              🕐{" "}
              {new Date(item.created_at).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {isTemporary && " ⏳"}
            </Text>
          </LinearGradient>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}> Chargement du chat...</Text>
          </LinearGradient>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.iconButton}>
            <ArrowLeft size={18} color="#3B82F6" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}> {name}</Text>
          <Text style={styles.subtitle}>Chat du club</Text>
        </View>

        <TouchableOpacity style={styles.membersButton} onPress={() => setShowMembers(true)} activeOpacity={0.8}>
          <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.iconButton}>
            <Users size={18} color="#3B82F6" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.emptyStateCard}>
                <Text style={styles.emptyStateText}>💬 Aucun message</Text>
                <Text style={styles.emptyStateSubtext}>Soyez le premier à écrire !</Text>
              </LinearGradient>
            </View>
          }
        />

        {/* Input Container */}
        <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.inputContainer}>
          <LinearGradient colors={["#F8F9FA", "#FFFFFF"]} style={styles.textInputContainer}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="💭 Tapez votre message..."
              style={styles.textInput}
              multiline
              maxLength={1000}
              placeholderTextColor="#9CA3AF"
            />
          </LinearGradient>

          <TouchableOpacity
            onPress={sendMessage}
            style={styles.sendButtonContainer}
            disabled={!newMessage.trim() || sending}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={!newMessage.trim() || sending ? ["#D1D5DB", "#9CA3AF"] : ["#3B82F6", "#60A5FA"]}
              style={styles.sendButton}
            >
              {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Send size={16} color="#FFFFFF" />}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </KeyboardAvoidingView>

      <ClubMembersList clubId={id} visible={showMembers} onClose={() => setShowMembers(false)} />
    </SafeAreaView>
  )
}

export default ClubChatScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  membersButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 2,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-end",
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  messageBubble: {
    marginVertical: 2,
    maxWidth: "75%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageBubbleGradient: {
    padding: 10,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  temporaryMessage: {
    opacity: 0.7,
  },
  senderName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#3B82F6",
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#1F2937",
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
  },
  myMessageTime: {
    color: "#FFFFFF",
    opacity: 0.8,
    textAlign: "right",
  },
  otherMessageTime: {
    color: "#6B7280",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyStateCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: "#6B7280",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    gap: 8,
  },
  textInputContainer: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textInput: {
    fontSize: 14,
    color: "#1F2937",
    maxHeight: 80,
    minHeight: 36,
  },
  sendButtonContainer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
})
