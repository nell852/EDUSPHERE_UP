"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  SafeAreaView,
  Image,
} from "react-native"
import { router } from "expo-router"
import { Eye, EyeOff, Lock, User, Mail } from "lucide-react-native"
import { StatusBar } from "expo-status-bar"
import { supabase } from "@/lib/supabase"

const { width, height } = Dimensions.get("window")

export default function SignupScreen() {
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [matricule, setMatricule] = useState("") // Utilisé comme email
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async () => {
    // Valider les champs
    if (!nom.trim() || !prenom.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre nom et prénom")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(matricule)) {
      Alert.alert("Erreur", "Veuillez entrer un email valide")
      return
    }

    if (password.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    setIsLoading(true)
    try {
      console.log("Tentative d'inscription:", { matricule, nom, prenom })

      const { data, error } = await supabase.auth.signUp({
        email: matricule,
        password,
        options: {
          data: {
            nom,
            prenom,
          },
        },
      })

      console.log("Réponse Supabase:", { data, error })

      if (error) {
        Alert.alert("Erreur", error.message)
      } else if (!data.user) {
        Alert.alert("Erreur", "Aucun utilisateur créé. Vérifiez la configuration.")
      } else {
        // Le trigger handle_new_user insère automatiquement dans public.utilisateurs
        Alert.alert("Succès", "Compte créé ! Veuillez vérifier votre email pour confirmer.")
        router.replace("/auth/login")
      }
    } catch (error) {
      console.log("Erreur complète:", error)
      Alert.alert("Erreur", "Erreur inconnue lors de l'inscription")
    } finally {
      setIsLoading(false)
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
              <Text style={styles.title}>Inscription</Text>
              <Text style={styles.subtitle}>Créer un nouveau compte</Text>
            </View>

            {/* Input Fields */}
            <View style={styles.inputsSection}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <User size={20} color="#3B82F6" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nom"
                  value={nom}
                  onChangeText={setNom}
                  autoCapitalize="words"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <User size={20} color="#3B82F6" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Prénom"
                  value={prenom}
                  onChangeText={setPrenom}
                  autoCapitalize="words"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Mail size={20} color="#3B82F6" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={matricule}
                  onChangeText={setMatricule}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Lock size={20} color="#3B82F6" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.disabledButton]}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.signupButtonText}>{isLoading ? "Inscription..." : "S'inscrire"}</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
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
    alignItems: "center",
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
    marginBottom: 16,
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
    height: 44,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  eyeIconContainer: {
    padding: 8,
    marginLeft: 8,
  },
  signupButton: {
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
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  loginText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "400",
  },
  loginLink: {
    fontSize: 15,
    color: "#3B82F6",
    fontWeight: "700",
  },
})
