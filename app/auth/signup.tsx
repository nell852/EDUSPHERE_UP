import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock, User } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';

export default function SignupScreen() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [matricule, setMatricule] = useState(''); // Utilisé comme email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    // Valider les champs
    if (!nom.trim() || !prenom.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom et prénom');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(matricule)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Tentative d\'inscription:', { matricule, nom, prenom });
      const { data, error } = await supabase.auth.signUp({
        email: matricule,
        password,
        options: {
          data: {
            nom,
            prenom,
          },
        },
      });
      console.log('Réponse Supabase:', { data, error });

      if (error) {
        Alert.alert('Erreur', error.message);
      } else if (!data.user) {
        Alert.alert('Erreur', 'Aucun utilisateur créé. Vérifiez la configuration.');
      } else {
        // Le trigger handle_new_user insère automatiquement dans public.utilisateurs
        Alert.alert('Succès', 'Compte créé ! Veuillez vérifier votre email pour confirmer.');
        router.replace('/auth/login');
      }
    } catch (error) {
      console.log('Erreur complète:', error);
      Alert.alert('Erreur', 'Erreur inconnue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Inscription</Text>
          <Text style={styles.subtitle}>Créer un nouveau compte</Text>

          <View style={styles.inputContainer}>
            <User size={20} color={Colors.light.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom"
              value={nom}
              onChangeText={setNom}
              autoCapitalize="words"
              placeholderTextColor={Colors.light.textLight}
            />
          </View>

          <View style={styles.inputContainer}>
            <User size={20} color={Colors.light.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Prénom"
              value={prenom}
              onChangeText={setPrenom}
              autoCapitalize="words"
              placeholderTextColor={Colors.light.textLight}
            />
          </View>

          <View style={styles.inputContainer}>
            <User size={20} color={Colors.light.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
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
              placeholder="Mot de passe"
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

          <TouchableOpacity
            style={[styles.signupButton, isLoading && styles.disabledButton]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? 'Inscription...' : 'S '+ 'inscrire'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
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
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textLight,
    marginBottom: 24,
    textAlign: 'center',
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
  signupButton: {
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
  signupButtonText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  loginLink: {
    fontSize: 14,
    color: Colors.light.gold,
    fontWeight: '600',
  },
});