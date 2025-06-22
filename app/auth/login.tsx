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
  ScrollView,
  Alert,
  Dimensions,
  SafeAreaView,
} from "react-native"
import { router } from "expo-router"
import { Eye, EyeOff, Lock, User } from "lucide-react-native"
import Colors from "@/constants/Colors"
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
      console.log("Tentative de connexion:", { matricule })
      const { data, error } = await supabase.auth.signInWithPassword({
        email: matricule,
        password,
      })
      console.log("Réponse Supabase:", { data, error })

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          Alert.alert(
            "Erreur",
            "Votre email n'est pas confirmé. Veuillez vérifier votre boîte de réception ou le dossier spam pour le lien de confirmation.",
          )
        } else if (error.message.includes("Invalid login credentials")) {
          Alert.alert("Erreur", "Matricule ou mot de passe incorrect")
        } else {
          Alert.alert("Erreur", error.message)
        }
      } else if (!data.user) {
        Alert.alert("Erreur", "Aucun utilisateur trouvé. Vérifiez vos identifiants.")
      } else {
        router.replace("/(tabs)")
      }
    } catch (error) {
      console.log("Erreur complète:", error)
      Alert.alert("Erreur", "Erreur inconnue lors de la connexion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "facebook" | "apple") => {
    setIsLoading(true)
    try {
      console.log("Tentative de connexion sociale:", { provider })
      const redirectTo =
        Platform.OS === "web" && process.env.NODE_ENV === "development"
          ? "http://localhost:8081/auth/callback"
          : "https://nrwngoruunmsvvhsxbue.supabase.co/auth/v1/callback"
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      })
      console.log("Réponse Supabase:", { data, error })
      if (error) {
        if (error.message.includes("redirect_uri_mismatch")) {
          Alert.alert(
            "Erreur de connexion",
            `L'URL de redirection ne correspond pas pour ${provider}. Assurez-vous que '${redirectTo}' est ajoutée dans les paramètres du fournisseur dans la console du développeur (par exemple, Google Cloud Console pour Google).`,
          )
        } else if (error.message.includes("Unsupported provider")) {
          Alert.alert(
            "Erreur",
            `Le fournisseur ${provider} n'est pas activé. Vérifiez la configuration dans le tableau de bord Supabase.`,
          )
        } else {
          Alert.alert("Erreur", error.message)
        }
      }
    } catch (error) {
      console.log("Erreur complète:", error)
      Alert.alert("Erreur", "Erreur inconnue lors de la connexion sociale")
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToSignup = () => {
    router.push("/auth/signup")
  }

  const navigateToForgotPassword = () => {
    router.push("./forgot-password")
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          {/* Header avec gradient visuel */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image source={require("@/assets/images/edusphere-logo.png")} style={styles.logo} />
              </View>
              <Text style={styles.logoText}>EduSphere</Text>
              <Text style={styles.logoSubtext}>Educational Platform</Text>
            </View>
          </View>

          {/* Formulaire principal */}
          <View style={styles.formContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.title}>Bon retour !</Text>
              <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
            </View>

            {/* Champs de saisie ovales */}
            <View style={styles.inputsSection}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <User size={22} color={Colors.light.gold} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Matricule (email)"
                  value={matricule}
                  onChangeText={setMatricule}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Lock size={22} color={Colors.light.gold} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={Colors.light.textLight}
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={22} color={Colors.light.textLight} />
                  ) : (
                    <Eye size={22} color={Colors.light.textLight} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={navigateToForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Bouton de connexion principal */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>{isLoading ? "Connexion..." : "Se connecter"}</Text>
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Ou continuer avec</Text>
              <View style={styles.divider} />
            </View>

            {/* Boutons sociaux */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin("google")}
                activeOpacity={0.8}
              >
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin("facebook")}
                activeOpacity={0.8}
              >
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin("apple")}
                activeOpacity={0.8}
              >
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Lien d'inscription */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Pas encore de compte ? </Text>
              <TouchableOpacity onPress={navigateToSignup} activeOpacity={0.7}>
                <Text style={styles.signupLink}>S'inscrire</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  headerContainer: {
    paddingTop: height * 0.08,
    paddingBottom: height * 0.04,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.gold,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.light.gold,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  logoSubtext: {
    fontSize: 16,
    color: Colors.light.textLight,
    fontWeight: "500",
  },
  formContainer: {
    flex: 1,
    backgroundColor: Colors.light.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
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
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.textDark,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textLight,
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
    marginBottom: 16,
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
    color: Colors.light.textDark,
    fontWeight: "500",
  },
  eyeIconContainer: {
    padding: 8,
    marginLeft: 8,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 32,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.light.gold,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: Colors.light.gold,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: Colors.light.gold,
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
    color: Colors.light.white,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E9ECEF",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: Colors.light.textLight,
    fontSize: 14,
    fontWeight: "500",
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 52,
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
    color: Colors.light.textDark,
    fontSize: 15,
    fontWeight: "600",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  signupText: {
    fontSize: 15,
    color: Colors.light.textLight,
    fontWeight: "400",
  },
  signupLink: {
    fontSize: 15,
    color: Colors.light.gold,
    fontWeight: "700",
  },
})
