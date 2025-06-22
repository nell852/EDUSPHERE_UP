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
  TextInput,
  ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { Search, MessageCircle, Plus } from "lucide-react-native"
import { chatService } from "../../services/chatService"
import { supabase } from "../../lib/supabase"

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

interface Conversation {
  userId: string
  user: {
    nom: string | null
    prenom: string | null
    photo_profil_url: string | null
  }
  lastMessage: {
    contenu: string | null
    created_at: string
    expediteur_id: string | null
  }
  unreadCount: number
}

export default function MessagesScreen() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    initializeMessages()
  }, [])

  const initializeMessages = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        setCurrentUserId(user.user.id)
        await loadConversations()
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation des messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async () => {
    try {
      const conversationsData = await chatService.getPrivateConversations()
      setConversations(conversationsData)
    } catch (error) {
      console.error("Erreur lors du chargement des conversations:", error)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const userName = `${conv.user?.prenom || ""} ${conv.user?.nom || ""}`.toLowerCase()
    return userName.includes(searchQuery.toLowerCase())
  })

  const renderConversation = ({ item }: { item: Conversation }) => {
    const isLastMessageFromMe = item.lastMessage.expediteur_id === currentUserId
    const userName = `${item.user?.prenom || ""} ${item.user?.nom || "Utilisateur"}`.trim()

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          router.push({
            pathname: `/chat/private/[userId]`,
            params: { userId: item.userId, name: userName },
          })
        }
      >
        <Image
          source={{
            uri: item.user?.photo_profil_url || "https://via.placeholder.com/50",
          }}
          style={styles.avatar}
        />
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.messageTime}>
              {new Date(item.lastMessage.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.lastMessageContainer}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {isLastMessageFromMe ? "Vous: " : ""}
              {item.lastMessage.contenu || "Message"}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={48} color={Colors.lightGray} />
      <Text style={styles.emptyStateTitle}>Aucune conversation</Text>
      <Text style={styles.emptyStateSubtitle}>Commencez une conversation en contactant un membre depuis un club</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une conversation..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.gray}
        />
      </View>

      {/* Conversations */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.userId}
          style={styles.conversationsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.black,
  },
  newMessageButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: Colors.black,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.gray,
  },
  lastMessageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadCount: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
  },
})
