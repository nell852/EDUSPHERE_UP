"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  SafeAreaView,
} from "react-native"
import { router } from "expo-router"
import { Eye, EyeOff, Lock, User } from "lucide-react-native"
import { StatusBar } from "expo-status-bar"
import { supabase } from "@/lib/supabase"

const { width, height } = Dimensions.get("window")

export default function LoginScreen() {
  const [matricule, setMatricule] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!matricule || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(matricule)) {
      Alert.alert("Erreur", "Veuillez entrer un matricule au format email valide")
      return
    }

    if (password.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: matricule,
        password,
      })

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          Alert.alert("Erreur", "Veuillez confirmer votre email avant de vous connecter.")
        } else if (error.message.includes("Invalid login credentials")) {
          Alert.alert("Erreur", "Matricule ou mot de passe incorrect")
        } else {
          Alert.alert("Erreur", error.message)
        }
      } else if (!data.user) {
        Alert.alert("Erreur", "Aucun utilisateur trouvé")
      } else {
        router.replace("/(tabs)")
      }
    } catch (error) {
      Alert.alert("Erreur", "Erreur inconnue lors de la connexion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "facebook" | "apple") => {
    setIsLoading(true)
    try {
      const redirectTo =
        Platform.OS === "web" && process.env.NODE_ENV === "development"
          ? "http://localhost:8081/auth/callback"
          : "https://ppfvnxscqdlhnpvwexjw.supabase.co/auth/v1/callback"

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      })

      if (error) {
        if (error.message.includes("redirect_uri_mismatch")) {
          Alert.alert("Erreur", `L'URL de redirection ne correspond pas pour ${provider}.`)
        } else {
          Alert.alert("Erreur", error.message)
        }
      }
    } catch (error) {
      Alert.alert("Erreur", "Erreur inconnue lors de la connexion sociale")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar style="dark" />
        <View style={styles.backgroundElements}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoWrapper}>
              <Image source={require("@/assets/images/logo.png")} style={styles.logo} />
            </View>
            <Text style={styles.logoText}>EduSphere</Text>
            <Text style={styles.logoSubtext}>Educational Platform</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Bon retour !</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>

            <View style={styles.inputContainer}>
              <User size={22} color="#3B82F6" />
              <TextInput
                placeholder="Matricule (email)"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={matricule}
                onChangeText={setMatricule}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={22} color="#3B82F6" />
              <TextInput
                placeholder="Mot de passe"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={22} color="#9CA3AF" /> : <Eye size={22} color="#9CA3AF" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => router.push("./forgot-password")}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? "Connexion..." : "Se connecter"}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Ou continuer avec</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin("google")}
              >
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin("facebook")}
              >
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin("apple")}
              >
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Pas encore de compte ? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/signup")}>
                <Text style={styles.signupLink}>S'inscrire</Text>
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
    lineHeight: 24,
  },
  inputsSection: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 28,
    marginBottom: 12,
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
    height: 48,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  eyeIconContainer: {
    padding: 8,
    marginLeft: 8,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 16,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 28,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
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
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E9ECEF",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 44,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  socialButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  signupText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "400",
  },
  signupLink: {
    fontSize: 15,
    color: "#3B82F6",
    fontWeight: "700",
  },
})
