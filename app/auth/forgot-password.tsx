import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ForgotPassword() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Forgot Password Screen</Text>
      {/* Ici tu peux ajouter la logique de reset par email */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, fontWeight: '600' },
});
