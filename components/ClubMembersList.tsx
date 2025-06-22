"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, Modal, SafeAreaView } from "react-native"
import { X, MessageCircle } from "lucide-react-native"
import { supabase } from "../lib/supabase"
import { useRouter } from "expo-router"

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

interface Member {
  membre_id: string
  role: string
  date_adhesion: string
  utilisateurs: {
    nom: string | null
    prenom: string | null
    photo_profil_url: string | null
    email: string
  }
}

interface ClubMembersListProps {
  clubId: string
  visible: boolean
  onClose: () => void
}

export default function ClubMembersList({ clubId, visible, onClose }: ClubMembersListProps) {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && clubId) {
      loadMembers()
    }
  }, [visible, clubId])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const { data: membersData, error } = await supabase
        .from("club_membres")
        .select(`
          *,
          utilisateurs(nom, prenom, photo_profil_url, email)
        `)
        .eq("club_id", clubId)
        .order("date_adhesion", { ascending: false })

      if (error) throw error
      setMembers(membersData || [])
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error)
    } finally {
      setLoading(false)
    }
  }

  const startPrivateChat = (memberId: string, memberName: string) => {
    onClose()
    router.push({
      pathname: "/chat/private/[userId]",
      params: { userId: memberId, name: memberName },
    })
  }

  const renderMember = ({ item }: { item: Member }) => {
    const memberName = `${item.utilisateurs?.prenom || ""} ${item.utilisateurs?.nom || ""}`.trim()

    return (
      <View style={styles.memberItem}>
        <Image
          source={{
            uri: item.utilisateurs?.photo_profil_url || "https://via.placeholder.com/50",
          }}
          style={styles.memberAvatar}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{memberName || "Utilisateur"}</Text>
          <Text style={styles.memberRole}>{item.role}</Text>
          <Text style={styles.memberDate}>
            Membre depuis {new Date(item.date_adhesion).toLocaleDateString("fr-FR")}
          </Text>
        </View>
        <TouchableOpacity style={styles.chatButton} onPress={() => startPrivateChat(item.membre_id, memberName)}>
          <MessageCircle size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Membres du club</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={Colors.black} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Chargement des membres...</Text>
            </View>
          ) : (
            <FlatList
              data={members}
              renderItem={renderMember}
              keyExtractor={(item) => item.membre_id}
              style={styles.membersList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 2,
  },
  memberDate: {
    fontSize: 12,
    color: Colors.gray,
  },
  chatButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
})
