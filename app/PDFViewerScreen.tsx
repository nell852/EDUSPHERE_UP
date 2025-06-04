import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Platform, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';

// Typage des paramètres de la route
type RouteParams = {
  pdfUrl?: string;
  title?: string;
};

export default function PDFViewerScreen() {
  const { pdfUrl, title } = useLocalSearchParams<RouteParams>();

  // Ouvrir le PDF dans un navigateur
  useEffect(() => {
    if (pdfUrl) {
      Linking.openURL(pdfUrl).catch((err) => {
        console.error('Erreur ouverture URL:', err);
        alert('Erreur lors de l\'ouverture du PDF.');
      });
    }
  }, [pdfUrl]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title || 'Sans titre'}</Text>
      <Text style={styles.message}>
        Le PDF s'ouvre dans votre navigateur. Si ce n'est pas le cas,{' '}
        <Text style={styles.link} onPress={() => pdfUrl && Linking.openURL(pdfUrl)}>
          cliquez ici
        </Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.textDark,
    padding: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.light.textDark,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  link: {
    color: Colors.light.gold,
    textDecorationLine: 'underline',
  },
});