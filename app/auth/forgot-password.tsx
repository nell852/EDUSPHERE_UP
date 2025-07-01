"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from "react-native"
import { supabase } from "@/lib/supabase"
import { useRouter } from "expo-router"
import { Mail, ArrowLeft } from "lucide-react-native"
import { StatusBar } from "expo-status-bar"

const { width, height } = Dimensions.get("window")

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Erreur", "Veuillez entrer votre email.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "exp://apbk4um-nellito-8081.exp.direct", // Remplacez par votre URL de redirection
      })

      if (error) throw error

      Alert.alert("Succès", "Un lien de réinitialisation a été envoyé à votre email.")
      router.push("/auth/login") // Redirige vers la page de connexion après succès
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert("Erreur", error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <StatusBar style="dark" />

        {/* Background decorative elements */}
        <View style={styles.backgroundElements}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <ArrowLeft size={24} color="#3B82F6" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image source={require("@/assets/images/logo.png")} style={styles.logo} />
              </View>
            </View>
            <Text style={styles.logoText}>EduSphere</Text>
            <Text style={styles.logoSubtext}>Educational Platform</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.title}>Mot de passe oublié</Text>
              <Text style={styles.subtitle}>Entrez votre email pour recevoir un lien de réinitialisation.</Text>
            </View>

            {/* Input Field */}
            <View style={styles.inputsSection}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Mail size={22} color="#3B82F6" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Adresse email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.resetButton, loading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.resetButtonText}>Envoi en cours...</Text>
                </View>
              ) : (
                <Text style={styles.resetButtonText}>Envoyer lien de réinitialisation</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Vous vous souvenez de votre mot de passe ? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/login")} activeOpacity={0.7}>
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  backgroundElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    opacity: 0.1,
  },
  circle1: {
    width: 120,
    height: 120,
    backgroundColor: "#3B82F6",
    top: -30,
    right: -30,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: "#60A5FA",
    bottom: -30,
    left: -30,
  },
  circle3: {
    width: 120,
    height: 120,
    backgroundColor: "#93C5FD",
    top: height * 0.4,
    right: -20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  headerSection: {
    alignItems: "center",
    paddingTop: height * 0.02,
    paddingBottom: height * 0.005,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: height * 0.02,
    left: 0,
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 8,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 40,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E40AF",
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  logoSubtext: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeSection: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "400",
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  inputsSection: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIconContainer: {
    marginRight: 12,
    padding: 4,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  resetButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    flexWrap: "wrap",
  },
  loginText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "400",
    textAlign: "center",
  },
  loginLink: {
    fontSize: 15,
    color: "#3B82F6",
    fontWeight: "700",
  },
})
