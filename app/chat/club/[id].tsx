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
import { useRoute, useNavigation } from "@react-navigation/native"
import { Users, ArrowLeft } from "phosphor-react-native"
import Colors from "../../../constants/Colors"
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
          const messageExists = prev.some(m => m.id === message.id)
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
    setMessages(prev => [...prev, tempMessage])
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
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
    } finally {
      setSending(false)
    }
  }

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.expediteur_id === currentUserId
    const senderName = `${item.expediteur?.prenom || ""} ${item.expediteur?.nom || ""}`.trim()
    const isTemporary = item.id.startsWith('temp-')

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
        <View style={[
          styles.messageBubble, 
          isMyMessage ? styles.myMessage : styles.otherMessage,
          isTemporary && styles.temporaryMessage
        ]}>
          {!isMyMessage && <Text style={styles.senderName}>{senderName || "Utilisateur"}</Text>}
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
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Chargement du chat...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={Colors.light.tint} />
        </TouchableOpacity>
        <Text style={styles.title}>{name}</Text>
        <TouchableOpacity style={styles.membersButton} onPress={() => setShowMembers(true)}>
          <Users size={24} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

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
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Tapez votre message..."
            style={styles.textInput}
            multiline
            maxLength={1000}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.sendButtonText}>Envoyer</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ClubMembersList clubId={id} visible={showMembers} onClose={() => setShowMembers(false)} />
    </SafeAreaView>
  )
}

export default ClubChatScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  membersButton: {
    padding: 8,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
    maxWidth: "70%",
  },
  myMessage: {
    backgroundColor: Colors.light.tint,
    alignSelf: "flex-end",
  },
  otherMessage: {
    backgroundColor: "#ECECEC",
    alignSelf: "flex-start",
  },
  temporaryMessage: {
    opacity: 0.7,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.tint,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: "white",
  },
  otherMessageText: {
    color: "#000",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: "white",
    opacity: 0.7,
    textAlign: "right",
  },
  otherMessageTime: {
    color: "#666",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  textInput: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "white",
    fontWeight: "600",
  },
})
