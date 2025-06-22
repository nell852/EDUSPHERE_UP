import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as ScreenCapture from 'expo-screen-capture';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

const ExamViewerScreen = () => {
  const { pdfUrl: initialPdfUrl, title } = useLocalSearchParams<{ pdfUrl: string; title: string }>();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const preventCapture = async () => {
      await ScreenCapture.preventScreenCaptureAsync();
    };
    preventCapture();

    const timer = setTimeout(() => {
      setShowWarning(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  useEffect(() => {
    const fetchPdfUrl = async () => {
      if (!initialPdfUrl) {
        setError('Aucun PDF disponible');
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('Tentative de chargement de l\'URL:', initialPdfUrl);
      try {
        const response = await fetch(initialPdfUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.log('URL non accessible, tentative de génération d\'URL signée:', initialPdfUrl);
          const fileName = initialPdfUrl.split('/').pop() || `exam_${Date.now()}.pdf`;
          const { data, error: storageError } = await supabase.storage
            .from('exam-documents')
            .createSignedUrl(fileName, 31536000); // URL signée valide pour 1 an
          if (storageError) {
            console.error('Erreur Storage:', storageError.message);
            throw new Error(`Erreur de stockage: ${storageError.message}`);
          }
          setPdfUrl(data.signedUrl);
          console.log('URL signée générée:', data.signedUrl);
        } else {
          setPdfUrl(initialPdfUrl);
          console.log('URL directement accessible:', initialPdfUrl);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Erreur fetch:', error.message);
          setError(`Impossible de charger le PDF: ${error.message}`);
        } else {
          setError('Une erreur inconnue est survenue');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPdfUrl();
  }, [initialPdfUrl]);

  if (error && !pdfUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title || 'Visualiseur d\'Examen'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title || 'Visualiseur d\'Examen'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Fermer</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement du PDF...</Text>
        </View>
      )}

      {!loading && pdfUrl && (
        <WebView
          source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}` }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('Erreur de chargement du PDF:', nativeEvent);
            setError('Impossible de charger le PDF');
          }}
        />
      )}

      {showWarning && (
        <View style={styles.warningOverlay}>
          <Text style={styles.warningText}>
            Les captures d'écran sont interdites. Toute tentative peut entraîner des sanctions.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

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
    height: height - 60,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 10,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
});

export default ExamViewerScreen;
