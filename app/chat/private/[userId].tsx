"use client"

import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Send, ArrowLeft, Phone, Video, MessageCircle } from "lucide-react-native"
import { chatService, type ChatMessage } from "../../../services/chatService"
import { userService } from "../../../services/userService"
import { supabase } from "../../../lib/supabase"

export default function PrivateChatScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name: string }>()
  const router = useRouter()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)

  const flatListRef = useRef<FlatList>(null)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    console.log("Paramètres reçus:", { userId, name })

    if (!userId || userId === "null" || userId === "undefined") {
      Alert.alert("Erreur", "ID utilisateur invalide")
      router.back()
      return
    }

    initializeChat()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [userId])

  const initializeChat = async () => {
    try {
      if (!userId || userId === "null" || userId === "undefined") {
        throw new Error("ID utilisateur invalide")
      }

      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        Alert.alert("Erreur", "Vous devez être connecté")
        router.back()
        return
      }

      console.log("Utilisateur actuel:", user.user.id)
      console.log("Utilisateur cible:", userId)

      setCurrentUserId(user.user.id)

      const currentUserProfile = await userService.ensureProfileExists()
      setCurrentUser(currentUserProfile)

      const otherUserProfile = await userService.getUserById(userId)
      if (otherUserProfile) {
        setOtherUser(otherUserProfile)
      } else {
        Alert.alert("Erreur", "Utilisateur introuvable")
        router.back()
        return
      }

      await loadMessages(user.user.id, userId)

      subscriptionRef.current = supabase
        .channel(`private-${user.user.id}-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `and(or(and(expediteur_id.eq.${user.user.id},destinataire_id.eq.${userId}),and(expediteur_id.eq.${userId},destinataire_id.eq.${user.user.id})),club_id.is.null)`,
          },
          async (payload) => {
            const expediteurProfile = await userService.getUserById(payload.new.expediteur_id)
            const messageWithSender: ChatMessage = {
              ...(payload.new as any),
              expediteur: expediteurProfile,
            }

            setMessages((prev) => {
              const withoutTemp = prev.filter((m) => !m.id.startsWith("temp-"))
              const messageExists = withoutTemp.some((m) => m.id === messageWithSender.id)
              if (messageExists) return prev

              const newMessages = [...withoutTemp, messageWithSender]
              return newMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            })

            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true })
            }, 100)
          },
        )
        .subscribe()
    } catch (error) {
      console.error("Erreur lors de l'initialisation du chat:", error)
      Alert.alert("Erreur", "Impossible de charger le chat")
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (currentUserIdParam: string, targetUserIdParam: string) => {
    try {
      if (
        !currentUserIdParam ||
        !targetUserIdParam ||
        currentUserIdParam === "null" ||
        targetUserIdParam === "null" ||
        currentUserIdParam === "undefined" ||
        targetUserIdParam === "undefined"
      ) {
        console.error("IDs invalides:", { currentUserIdParam, targetUserIdParam })
        return
      }

      console.log("Chargement des messages entre:", currentUserIdParam, "et", targetUserIdParam)

      const [{ data: sentMessages, error: sentError }, { data: receivedMessages, error: receivedError }] =
        await Promise.all([
          supabase
            .from("messages")
            .select(`
            *,
            expediteur:utilisateurs!messages_expediteur_id_fkey(nom, prenom, photo_profil_url)
          `)
            .eq("expediteur_id", currentUserIdParam)
            .eq("destinataire_id", targetUserIdParam)
            .is("club_id", null),
          supabase
            .from("messages")
            .select(`
            *,
            expediteur:utilisateurs!messages_expediteur_id_fkey(nom, prenom, photo_profil_url)
          `)
            .eq("expediteur_id", targetUserIdParam)
            .eq("destinataire_id", currentUserIdParam)
            .is("club_id", null),
        ])

      if (sentError) {
        console.error("Erreur messages envoyés:", sentError)
        throw sentError
      }

      if (receivedError) {
        console.error("Erreur messages reçus:", receivedError)
        throw receivedError
      }

      const allMessages = [...(sentMessages || []), ...(receivedMessages || [])]
      const uniqueMessages = allMessages.filter(
        (message, index, self) => index === self.findIndex((m) => m.id === message.id),
      )

      const sortedMessages = uniqueMessages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )

      console.log("Messages chargés:", sortedMessages.length)
      setMessages(sortedMessages)

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false })
      }, 100)
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !currentUserId || !userId) return

    const messageText = newMessage.trim()
    const tempId = `temp-${Date.now()}-${Math.random()}`
    setNewMessage("")

    const tempMessage: ChatMessage = {
      id: tempId,
      expediteur_id: currentUserId,
      destinataire_id: userId,
      club_id: null,
      contenu: messageText,
      type: "texte",
      media_url: null,
      created_at: new Date().toISOString(),
      read_at: null,
      expediteur: currentUser,
    }

    setMessages((prev) => [...prev, tempMessage])
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)

    setSending(true)

    try {
      await chatService.sendPrivateMessage(userId, messageText)
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
      Alert.alert("Erreur", "Impossible d'envoyer le message")
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMyMessage = item.expediteur_id === currentUserId
    const isTemporary = item.id.startsWith("temp-")

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        <View style={[styles.messageBubble, isTemporary && styles.temporaryMessage]}>
          <LinearGradient
            colors={
              isMyMessage ? ["#3B82F6", "#60A5FA"] : isTemporary ? ["#F3F4F6", "#E5E7EB"] : ["#F8F9FA", "#FFFFFF"]
            }
            style={[styles.messageBubbleGradient, isMyMessage ? styles.myMessage : styles.otherMessage]}
          >
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
            <Text style={styles.loadingText}>💬 Chargement du chat privé...</Text>
          </LinearGradient>
        </View>
      </SafeAreaView>
    )
  }

  const displayName = otherUser
    ? `${otherUser.prenom || ""} ${otherUser.nom || ""}`.trim()
    : decodeURIComponent(name || "Chat privé")

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.iconButton}>
            <ArrowLeft size={18} color="#3B82F6" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: otherUser?.photo_profil_url || "https://via.placeholder.com/40",
              }}
              style={styles.headerAvatar}
            />
            <LinearGradient colors={["#10B981", "#34D399"]} style={styles.onlineIndicator} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>👤 {displayName || "Utilisateur"}</Text>
            <Text style={styles.headerSubtitle}>🟢 En ligne</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.actionButtonGradient}>
              <Phone size={16} color="#3B82F6" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.actionButtonGradient}>
              <Video size={16} color="#3B82F6" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <LinearGradient colors={["#EBF4FF", "#DBEAFE"]} style={styles.emptyStateCard}>
                <MessageCircle size={32} color="#3B82F6" />
                <Text style={styles.emptyStateText}>💬 Aucun message</Text>
                <Text style={styles.emptyStateSubtext}>Commencez la conversation !</Text>
              </LinearGradient>
            </View>
          }
        />

        {/* Input Container */}
        <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.inputContainer}>
          <LinearGradient colors={["#F8F9FA", "#FFFFFF"]} style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="💭 Tapez votre message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
              placeholderTextColor="#9CA3AF"
            />
          </LinearGradient>

          <TouchableOpacity
            style={styles.sendButtonContainer}
            onPress={sendMessage}
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
    </SafeAreaView>
  )
}

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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    marginRight: 12,
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
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#10B981",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  actionButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
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
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    marginTop: 12,
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
