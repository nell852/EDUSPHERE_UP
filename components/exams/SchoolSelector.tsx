"use client"

import { useEffect } from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { GraduationCap, School } from "lucide-react-native"

type SchoolSelectorProps = {
  selectedSchool: string
  onSelectSchool: (schoolId: string) => void
  schools: string[] | undefined
}

// Mapping des écoles avec leurs logos et informations
const SCHOOL_LOGOS: Record<string, { name: string; logo: string; color: string[] }> = {
  ESATIC: {
    name: "ESATIC",
    logo: "https://esatic.edu.ci/wp-content/uploads/2021/03/logo-esatic.png",
    color: ["#1E40AF", "#3B82F6"],
  },
  "INP-HB": {
    name: "INP-HB",
    logo: "https://www.inphb.edu.ci/wp-content/uploads/2019/06/logo-inphb.png",
    color: ["#059669", "#10B981"],
  },
  ENSEA: {
    name: "ENSEA",
    logo: "https://www.ensea.edu.ci/images/logo-ensea.png",
    color: ["#DC2626", "#EF4444"],
  },
  UCAO: {
    name: "UCAO",
    logo: "https://ucao-uut.tg/wp-content/uploads/2020/09/logo-ucao.png",
    color: ["#7C3AED", "#8B5CF6"],
  },
  PIGIER: {
    name: "PIGIER",
    logo: "https://www.pigier.com/wp-content/uploads/2021/01/logo-pigier.png",
    color: ["#EA580C", "#F97316"],
  },
  SUPINFO: {
    name: "SUPINFO",
    logo: "https://www.supinfo.com/images/logo-supinfo.png",
    color: ["#0891B2", "#06B6D4"],
  },
  EPITECH: {
    name: "EPITECH",
    logo: "https://www.epitech.eu/wp-content/uploads/2021/01/logo-epitech.png",
    color: ["#BE185D", "#EC4899"],
  },
  ESIEA: {
    name: "ESIEA",
    logo: "https://www.esiea.fr/wp-content/uploads/2020/01/logo-esiea.png",
    color: ["#9333EA", "#A855F7"],
  },
  EFREI: {
    name: "EFREI",
    logo: "https://www.efrei.fr/wp-content/uploads/2020/01/logo-efrei.png",
    color: ["#0D9488", "#14B8A6"],
  },
  EPITA: {
    name: "EPITA",
    logo: "https://www.epita.fr/wp-content/uploads/2020/01/logo-epita.png",
    color: ["#B91C1C", "#DC2626"],
  },
}

export default function SchoolSelector({ selectedSchool, onSelectSchool, schools }: SchoolSelectorProps) {
  useEffect(() => {
    console.log("Schools received in SchoolSelector:", schools)
  }, [schools])

  const safeSchools = schools || []

  const getSchoolInfo = (schoolId: string) => {
    // Chercher une correspondance exacte d'abord
    if (SCHOOL_LOGOS[schoolId]) {
      return SCHOOL_LOGOS[schoolId]
    }

    // Chercher une correspondance partielle (insensible à la casse)
    const schoolKey = Object.keys(SCHOOL_LOGOS).find(
      (key) => key.toLowerCase().includes(schoolId.toLowerCase()) || schoolId.toLowerCase().includes(key.toLowerCase()),
    )

    if (schoolKey) {
      return SCHOOL_LOGOS[schoolKey]
    }

    // Retourner des valeurs par défaut
    return {
      name: schoolId,
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(schoolId)}&background=3B82F6&color=fff&size=128&bold=true`,
      color: ["#6B7280", "#9CA3AF"],
    }
  }

  return (
    <LinearGradient colors={["#FFFFFF", "#F8FAFF"]} style={styles.container}>
      <View style={styles.header}>
        <GraduationCap size={16} color="#3B82F6" />
        <Text style={styles.title}>Écoles</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.schoolsList}>
        {safeSchools.length > 0 ? (
          safeSchools.map((schoolId) => {
            const schoolInfo = getSchoolInfo(schoolId)
            const isSelected = selectedSchool === schoolId

            return (
              <TouchableOpacity
                key={schoolId}
                style={styles.schoolItem}
                onPress={() => onSelectSchool(schoolId)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isSelected ? (schoolInfo.color as import("react-native").ColorValue[]) : ["#F8F9FA", "#FFFFFF"]}
                  style={[styles.schoolCard, isSelected && styles.selectedSchoolCard]}
                >
                  <View style={styles.logoContainer}>
                    <Image
                      source={{ uri: schoolInfo.logo }}
                      style={[styles.schoolLogo, isSelected && styles.selectedSchoolLogo]}
                      onError={() => {
                        // Fallback en cas d'erreur de chargement d'image
                        console.log(`Erreur chargement logo pour ${schoolId}`)
                      }}
                    />
                    {isSelected && (
                      <LinearGradient
                        colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
                        style={styles.selectedOverlay}
                      />
                    )}
                  </View>

                  <Text style={[styles.schoolName, isSelected && styles.selectedSchoolName]} numberOfLines={2}>
                    {schoolInfo.name}
                  </Text>

                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )
          })
        ) : (
          <LinearGradient colors={["#FEF3C7", "#FDE68A"]} style={styles.noSchoolsContainer}>
            <School size={20} color="#92400E" />
            <Text style={styles.noSchoolsText}>Aucune école disponible</Text>
          </LinearGradient>
        )}
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    marginBottom: 10,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  schoolsList: {
    paddingHorizontal: 16,
  },
  schoolItem: {
    marginRight: 10,
  },
  schoolCard: {
    width: 70,
    alignItems: "center",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedSchoolCard: {
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoContainer: {
    position: "relative",
    marginBottom: 6,
  },
  schoolLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
  },
  selectedSchoolLogo: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  selectedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  schoolName: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 12,
  },
  selectedSchoolName: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  selectedIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIndicatorText: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "bold",
  },
  noSchoolsContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  noSchoolsText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "500",
  },
})
