import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

// Clés Supabase (assurez-vous que ce sont les bonnes valeurs)
const supabaseUrl = 'https://ppfvnxscqdlhnpvwexjw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZnZueHNjcWRsaG5wdndleGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1ODMxMjAsImV4cCI6MjA2NjE1OTEyMH0.j5LEupFPzNgwwDticLnVoFoXFNtsotZA9BEfGFaDNNM';

// Configuration du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Stockage persistant des sessions avec AsyncStorage
    autoRefreshToken: true, // Rafraîchissement automatique des tokens
    persistSession: true, // Persistance des sessions
    detectSessionInUrl: false, // Désactivé pour React Native (pas de gestion d'URL)
  },
  // Ajout de la configuration pour Realtime (WebSocket)
  realtime: {
    params: {
      apikey: supabaseAnonKey, // Clé anonyme pour Realtime
    },
  },
});

export default supabase;