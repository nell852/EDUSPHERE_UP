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
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Send, ArrowLeft, Phone, Video } from "lucide-react-native"
import { chatService, type ChatMessage } from "../../../services/chatService"
import { supabase } from "../../../lib/supabase"

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
  myMessage: "#007AFF",
  otherMessage: "#E5E5EA",
}

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

    // Vérifier que userId est valide
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
      // Vérifier que userId est valide
      if (!userId || userId === "null" || userId === "undefined") {
        throw new Error("ID utilisateur invalide")
      }

      // Récupérer l'utilisateur actuel
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        Alert.alert("Erreur", "Vous devez être connecté")
        router.back()
        return
      }

      console.log("Utilisateur actuel:", user.user.id)
      console.log("Utilisateur cible:", userId)

      // Définir l'ID utilisateur AVANT de charger les messages
      setCurrentUserId(user.user.id)

      // Récupérer les infos de l'utilisateur actuel
      const { data: currentUserData } = await supabase
        .from("utilisateurs")
        .select("nom, prenom, photo_profil_url")
        .eq("id", user.user.id)
        .single()

      setCurrentUser(currentUserData)

      // Récupérer les infos de l'autre utilisateur
      const { data: otherUserData } = await supabase.from("utilisateurs").select("*").eq("id", userId).single()

      if (otherUserData) {
        setOtherUser(otherUserData)
      } else {
        Alert.alert("Erreur", "Utilisateur introuvable")
        router.back()
        return
      }

      // Charger les messages APRÈS avoir défini currentUserId
      await loadMessages(user.user.id, userId)

      // S'abonner aux nouveaux messages privés
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
            // Récupérer les détails de l'expéditeur
            const { data: expediteur } = await supabase
              .from("utilisateurs")
              .select("nom, prenom, photo_profil_url")
              .eq("id", payload.new.expediteur_id)
              .single()

            const messageWithSender: ChatMessage = {
              ...(payload.new as any),
              expediteur: expediteur,
            }

            setMessages((prev) => {
              // Supprimer le message temporaire s'il existe
              const withoutTemp = prev.filter((m) => !m.id.startsWith("temp-"))

              // Vérifier si le message existe déjà
              const messageExists = withoutTemp.some((m) => m.id === messageWithSender.id)
              if (messageExists) return prev

              // Ajouter le nouveau message et trier par date
              const newMessages = [...withoutTemp, messageWithSender]
              return newMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            })

            // Auto-scroll vers le bas
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
      // Vérifications strictes
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

      // Utiliser deux requêtes séparées au lieu d'une requête OR complexe
      const [{ data: sentMessages, error: sentError }, { data: receivedMessages, error: receivedError }] =
        await Promise.all([
          // Messages envoyés par l'utilisateur actuel
          supabase
            .from("messages")
            .select(`
            *,
            expediteur:utilisateurs!messages_expediteur_id_fkey(nom, prenom, photo_profil_url)
          `)
            .eq("expediteur_id", currentUserIdParam)
            .eq("destinataire_id", targetUserIdParam)
            .is("club_id", null),

          // Messages reçus par l'utilisateur actuel
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

      // Combiner et trier les messages, en supprimant les doublons
      const allMessages = [...(sentMessages || []), ...(receivedMessages || [])]

      // Supprimer les doublons basés sur l'ID
      const uniqueMessages = allMessages.filter(
        (message, index, self) => index === self.findIndex((m) => m.id === message.id),
      )

      const sortedMessages = uniqueMessages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )

      console.log("Messages chargés:", sortedMessages.length)
      setMessages(sortedMessages)

      // Auto-scroll vers le bas après chargement
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
    setNewMessage("") // Vider le champ immédiatement

    // Créer un message temporaire pour l'affichage immédiat
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

    // Ajouter le message temporaire à l'affichage
    setMessages((prev) => [...prev, tempMessage])
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)

    setSending(true)
    try {
      await chatService.sendPrivateMessage(userId, messageText)

      // Le message temporaire sera automatiquement remplacé par le vrai message
      // via l'abonnement temps réel
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
      Alert.alert("Erreur", "Impossible d'envoyer le message")

      // Supprimer le message temporaire en cas d'erreur
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
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            isTemporary && styles.temporaryMessage,
          ]}
        >
          <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
            {item.contenu}
          </Text>
          <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
            {new Date(item.created_at).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {isTemporary && " ⏳"}
          </Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Chargement du chat...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Image
          source={{
            uri: otherUser?.photo_profil_url || "https://via.placeholder.com/40",
          }}
          style={styles.headerAvatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{decodeURIComponent(name || "Chat privé")}</Text>
          <Text style={styles.headerSubtitle}>En ligne</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Phone size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Video size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `${item.id}-${index}`} // Clé unique combinée
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Tapez votre message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
            placeholderTextColor={Colors.gray}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Send size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  backButton: {
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.black,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.success,
  },
  headerActions: {
    flexDirection: "row",
  },
  actionButton: {
    marginLeft: 16,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: Colors.myMessage,
  },
  otherMessageBubble: {
    backgroundColor: Colors.otherMessage,
  },
  temporaryMessage: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.white,
  },
  otherMessageText: {
    color: Colors.black,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: Colors.white,
    opacity: 0.7,
    textAlign: "right",
  },
  otherMessageTime: {
    color: Colors.gray,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    color: Colors.black,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray,
  },
})
