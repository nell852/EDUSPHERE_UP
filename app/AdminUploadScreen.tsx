import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';

// Interface pour les métadonnées du livre
interface BookData {
  titre: string;
  domaine: string;
  sousDomaine: string;
  description: string;
  particularite: string;
  auteur: string;
  popularite?: number; // Champ optionnel pour définir une popularité initiale
  niveau: string; // Champ pour le niveau
}

// Interface pour le résultat de DocumentPicker, basée sur DocumentPickerAsset
interface DocumentAsset {
  uri: string;
  name: string;
  mimeType?: string; // mimeType est optionnel, car il peut être absent
  size?: number; // size est optionnel pour éviter des erreurs
}

export default function AdminUploadScreen() {
  const [bookData, setBookData] = useState<BookData>({
    titre: '',
    domaine: '',
    sousDomaine: '',
    description: '',
    particularite: '',
    auteur: '',
    popularite: 0, // Valeur par défaut
    niveau: '', // Initialisation du champ niveau
  });
  const [pdfFile, setPdfFile] = useState<DocumentAsset | null>(null);
  const [coverImage, setCoverImage] = useState<DocumentAsset | null>(null);

  // Fonction pour convertir un URI en Blob
  async function uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  }

  // Fonction pour uploader les fichiers
  async function uploadPhotos(pdfFile: DocumentAsset, coverImage: DocumentAsset, bookTitle: string) {
    try {
      // Convertir le PDF en Blob
      const pdfBlob = await uriToBlob(pdfFile.uri);
      const pdfFileName = `${bookTitle}_${Date.now()}.pdf`;
      const { error: pdfError } = await supabase.storage
        .from('book-documents')
        .upload(pdfFileName, pdfBlob, {
          contentType: 'application/pdf',
        });

      if (pdfError) {
        console.error('Erreur upload PDF:', pdfError.message);
        return null;
      }

      // Obtenir l'URL signée pour le PDF (valide 1 an)
      const { data: pdfSignedData, error: pdfSignedError } = await supabase.storage
        .from('book-documents')
        .createSignedUrl(pdfFileName, 31536000); // 1 an en secondes

      if (pdfSignedError) {
        console.error('Erreur URL signée PDF:', pdfSignedError.message);
        return null;
      }

      // Convertir l'image de couverture en Blob
      const coverBlob = await uriToBlob(coverImage.uri);
      const coverFileName = `${bookTitle}_${Date.now()}.jpg`;
      const { error: coverError } = await supabase.storage
        .from('book-covers')
        .upload(coverFileName, coverBlob, {
          contentType: 'image/jpeg',
        });

      if (coverError) {
        console.error('Erreur upload couverture:', coverError.message);
        return null;
      }

      // Obtenir l'URL publique pour la couverture
      const coverUrl = supabase.storage.from('book-covers').getPublicUrl(coverFileName).data.publicUrl;

      return {
        documentUrl: pdfSignedData.signedUrl,
        coverUrl,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur inattendue:', error.message);
      }
      return null;
    }
  }

  // Fonction pour insérer les métadonnées dans public.livres
  async function addBookToDatabase(bookData: BookData, documentUrl: string, coverUrl: string) {
    try {
      const { data, error } = await supabase.from('livres').insert([
        {
          titre: bookData.titre,
          domaine: bookData.domaine,
          sous_domaine: bookData.sousDomaine || null,
          description: bookData.description || null,
          couverture_url: coverUrl,
          document_url: documentUrl,
          particularite: bookData.particularite || null,
          popularite: bookData.popularite || 0,
          auteur: bookData.auteur || 'Auteur inconnu',
          niveau: bookData.niveau || null, // Champ niveau
        },
      ]).select().single();

      if (error) {
        console.error('Erreur insertion livre:', error.message);
        return null;
      }
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur inattendue:', error.message);
      }
      return null;
    }
  }

  // Sélectionner le PDF
  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        setPdfFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size,
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert('Erreur', `Erreur lors de la sélection du PDF : ${error.message}`);
      }
    }
  };

  // Sélectionner l'image de couverture
  const pickCover = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        setCoverImage({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size,
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert('Erreur', `Erreur lors de la sélection de l'image : ${error.message}`);
      }
    }
  };

  // Gérer l'upload
  const handleUpload = async () => {
    if (
      !pdfFile ||
      !coverImage ||
      !bookData.titre ||
      !bookData.domaine ||
      !bookData.auteur ||
      !bookData.niveau
    ) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis et sélectionner les fichiers.');
      return;
    }

    try {
      const urls = await uploadPhotos(pdfFile, coverImage, bookData.titre);
      if (urls) {
        const book = await addBookToDatabase(bookData, urls.documentUrl, urls.coverUrl);
        if (book) {
          Alert.alert('Succès', 'Livre ajouté avec succès !');
          // Réinitialiser le formulaire
          setBookData({
            titre: '',
            domaine: '',
            sousDomaine: '',
            description: '',
            particularite: '',
            auteur: '',
            popularite: 0,
            niveau: '',
          });
          setPdfFile(null);
          setCoverImage(null);
        } else {
          Alert.alert('Erreur', 'Échec de l\'ajout du livre dans la base de données.');
        }
      } else {
        Alert.alert('Erreur', 'Échec de l\'upload des fichiers.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert('Erreur', `Erreur inattendue : ${error.message}`);
      }
    }
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled" // Permet de gérer les taps sur le formulaire sans fermer le clavier
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Ajouter un livre</Text>
        <TextInput
          style={styles.input}
          placeholder="Titre"
          value={bookData.titre}
          onChangeText={(text) => setBookData({ ...bookData, titre: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Domaine (ex: cybersécurité)"
          value={bookData.domaine}
          onChangeText={(text) => setBookData({ ...bookData, domaine: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Sous-domaine (optionnel)"
          value={bookData.sousDomaine}
          onChangeText={(text) => setBookData({ ...bookData, sousDomaine: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Description (optionnel)"
          value={bookData.description}
          onChangeText={(text) => setBookData({ ...bookData, description: text })}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Particularité (ex: Interdiction de capture, optionnel)"
          value={bookData.particularite}
          onChangeText={(text) => setBookData({ ...bookData, particularite: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Auteur"
          value={bookData.auteur}
          onChangeText={(text) => setBookData({ ...bookData, auteur: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Niveau (ex: Débutant, Intermédiaire, Avancé)"
          value={bookData.niveau}
          onChangeText={(text) => setBookData({ ...bookData, niveau: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Popularité initiale (optionnel)"
          value={bookData.popularite?.toString() || ''}
          onChangeText={(text) => setBookData({ ...bookData, popularite: text ? parseInt(text) || 0 : 0 })}
          keyboardType="numeric"
        />
        <Button title="Choisir PDF" onPress={pickPdf} color={Colors.light.gold} />
        <Text style={styles.fileText}>{pdfFile ? pdfFile.name : 'Aucun PDF sélectionné'}</Text>
        <Button title="Choisir couverture" onPress={pickCover} color={Colors.light.gold} />
        <Text style={styles.fileText}>{coverImage ? coverImage.name : 'Aucune image sélectionnée'}</Text>
        <Button title="Uploader" onPress={handleUpload} color={Colors.light.gold} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flexGrow: 1, // Permet au contenu de s'étendre pour être défilant
  },
  innerContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.textDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: Colors.light.textDark,
  },
  fileText: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginVertical: 8,
  },
});