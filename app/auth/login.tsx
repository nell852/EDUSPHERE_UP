import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock, User } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!matricule || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(matricule)) {
      Alert.alert('Erreur', 'Veuillez entrer un matricule au format email valide');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Tentative de connexion:', { matricule });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: matricule,
        password,
      });
      console.log('Réponse Supabase:', { data, error });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          Alert.alert(
            'Erreur',
            'Votre email n\'est pas confirmé. Veuillez vérifier votre boîte de réception ou le dossier spam pour le lien de confirmation.'
          );
        } else if (error.message.includes('Invalid login credentials')) {
          Alert.alert('Erreur', 'Matricule ou mot de passe incorrect');
        } else {
          Alert.alert('Erreur', error.message);
        }
      } else if (!data.user) {
        Alert.alert('Erreur', 'Aucun utilisateur trouvé. Vérifiez vos identifiants.');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.log('Erreur complète:', error);
      Alert.alert('Erreur', 'Erreur inconnue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setIsLoading(true);
    try {
      console.log('Tentative de connexion sociale:', { provider });
      const redirectTo = Platform.OS === 'web' && process.env.NODE_ENV === 'development'
        ? 'http://localhost:8081/auth/callback'
        : 'https://nrwngoruunmsvvhsxbue.supabase.co/auth/v1/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });
      console.log('Réponse Supabase:', { data, error });
      if (error) {
        if (error.message.includes('redirect_uri_mismatch')) {
          Alert.alert(
            'Erreur de connexion',
            `L'URL de redirection ne correspond pas pour ${provider}. Assurez-vous que '${redirectTo}' est ajoutée dans les paramètres du fournisseur dans la console du développeur (par exemple, Google Cloud Console pour Google).`
          );
        } else if (error.message.includes('Unsupported provider')) {
          Alert.alert(
            'Erreur',
            `Le fournisseur ${provider} n'est pas activé. Vérifiez la configuration dans le tableau de bord Supabase.`
          );
        } else {
          Alert.alert('Erreur', error.message);
        }
      }
    } catch (error) {
      console.log('Erreur complète:', error);
      Alert.alert('Erreur', 'Erreur inconnue lors de la connexion sociale');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignup = () => {
    router.push('/auth/signup');
  };

  const navigateToForgotPassword = () => {
    router.push('../forgot-password');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/6121160/pexels-photo-6121160.jpeg?auto=compress&cs=tinysrgb&w=600' }}
            style={styles.logo}
          />
          <Text style={styles.logoText}>Educational Platform</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Welcome back! Please enter your details</Text>

          <View style={styles.inputContainer}>
            <User size={20} color={Colors.light.textLight} style={styles.inputIcon} />
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
            <Lock size={20} color={Colors.light.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={Colors.light.textLight}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={Colors.light.textLight} />
              ) : (
                <Eye size={20} color={Colors.light.textLight} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPasswordContainer} onPress={navigateToForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('google')}
            >
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('facebook')}
            >
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('apple')}
            >
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={navigateToSignup}>
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.gold,
    marginTop: 12,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textLight,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.lightGray,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.white,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.light.textDark,
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.light.gold,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: Colors.light.gold,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.lightGray,
  },
  dividerText: {
    paddingHorizontal: 12,
    color: Colors.light.textLight,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.light.lightGray,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  socialButtonText: {
    color: Colors.light.textDark,
    fontSize: 14,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  signupLink: {
    fontSize: 14,
    color: Colors.light.gold,
    fontWeight: '600',
  },
});