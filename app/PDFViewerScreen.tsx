import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ScreenCapture from 'expo-screen-capture';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function ExamViewerScreen() {
  const { pdfUrl, title } = useLocalSearchParams<{ pdfUrl: string; title: string }>();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    // Tentative de désactiver les captures d'écran (limité avec Expo Go)
    const preventCapture = async () => {
      await ScreenCapture.preventScreenCaptureAsync();
    };
    preventCapture();

    // Masquer le message d'avertissement après 5 secondes
    const timer = setTimeout(() => {
      setShowWarning(false);
    }, 5000); // 5000 ms = 5 secondes

    // Réactiver les captures à la fermeture
    return () => {
      clearTimeout(timer); // Nettoyer le timer au démontage
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  if (!pdfUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Aucun PDF disponible</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header} pointerEvents="box-none">
        <Text style={styles.headerTitle}>{title || 'Visualiseur d\'Examen'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Fermer</Text>
        </TouchableOpacity>
      </View>
      <WebView
        source={{ uri: pdfUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
      {showWarning && (
        <View style={styles.warningOverlay}>
          <Text style={styles.warningText}>
            Les captures d'écran sont interdites. Toute tentative peut entraîner des sanctions.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    zIndex: 20,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    width: width,
    height: height - 60, // Ajuster pour laisser de la place au header
  },
  warningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  warningText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 10,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});