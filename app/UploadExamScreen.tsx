import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { useNavigation } from 'expo-router';

// Fonction pour convertir un URI en Blob
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
}

export default function UploadExamScreen() {
  const [matiere, setMatiere] = useState('');
  const [ecole, setEcole] = useState('cs');
  const [niveau, setNiveau] = useState('b3');
  const [annee, setAnnee] = useState('');
  const [description, setDescription] = useState('');
  const [difficulte, setDifficulte] = useState('Moyen');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const navigation = useNavigation();

  const handleUpload = async () => {
    if (!matiere || !annee || !file) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs et sélectionner un fichier.');
      return;
    }

    // Validation de l'année
    const yearNum = parseInt(annee, 10);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Erreur', 'Veuillez entrer une année valide (ex. 2024).');
      return;
    }

    try {
      // Convertir le fichier en Blob
      const fileBlob = await uriToBlob(file.uri);

      // Upload du fichier dans le bucket
      const fileExtension = file.name.split('.').pop() || 'pdf';
      const fileName = `${Date.now()}_${matiere.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('exam-documents')
        .upload(fileName, fileBlob, {
          contentType: file.type || 'application/pdf',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Générer une URL signée
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('exam-documents')
        .createSignedUrl(fileName, 31536000); // 1 an de validité
      if (signedUrlError) throw signedUrlError;
      const contenuUrl = signedUrlData.signedUrl;

      // Préparer les tags comme une chaîne JSON
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const tagsJson = tagsArray.length > 0 ? JSON.stringify(tagsArray) : null;

      // Insérer dans la table examens
      const { error: insertError } = await supabase.from('examens').insert({
        matiere,
        ecole,
        niveau,
        annee: yearNum,
        contenu_url: contenuUrl,
        description: description || null,
        difficulte,
        tags: tagsJson,
      });

      if (insertError) {
        throw new Error(insertError.message || 'Erreur lors de l\'insertion dans la table.');
      }

      Alert.alert('Succès', 'Examen uploadé avec succès !');
      navigation.goBack();
    } catch (error) {
      console.error('Upload error:', error instanceof Error ? error.message : error);
      Alert.alert('Erreur', `Une erreur est survenue : ${error instanceof Error ? error.message : 'Vérifiez les logs.'}`);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/pdf',
      });
    } else {
      Alert.alert('Erreur', 'Aucun fichier sélectionné.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Exam</Text>
      </View>
      <ScrollView style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Subject (Matière)"
          value={matiere}
          onChangeText={setMatiere}
        />
        <TextInput
          style={styles.input}
          placeholder="School (École)"
          value={ecole}
          onChangeText={setEcole}
        />
        <TextInput
          style={styles.input}
          placeholder="Level (Niveau)"
          value={niveau}
          onChangeText={setNiveau}
        />
        <TextInput
          style={styles.input}
          placeholder="Year (Année)"
          value={annee}
          onChangeText={setAnnee}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Difficulty (Difficulte)"
          value={difficulte}
          onChangeText={setDifficulte}
        />
        <TextInput
          style={styles.input}
          placeholder="Tags (séparés par des virgules)"
          value={tags}
          onChangeText={setTags}
        />
        <TouchableOpacity style={styles.fileButton} onPress={pickDocument}>
          <Text style={styles.fileButtonText}>
            {file ? file.name : 'Select PDF File'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <Text style={styles.uploadButtonText}>Upload Exam</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.white,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.textDark,
  },
  content: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: Colors.light.textDark,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  fileButton: {
    borderWidth: 1,
    borderColor: Colors.light.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  fileButtonText: {
    fontSize: 16,
    color: Colors.light.textDark,
  },
  uploadButton: {
    backgroundColor: Colors.light.gold,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
