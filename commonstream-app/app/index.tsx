import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Glow from '@/components/ui/glow';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <Glow/>
      <ThemedText type="title" style={styles.text}>
        Hello Commonstream
      </ThemedText>
      
      <Pressable 
        style={styles.button}
        onPress={() => router.push('/(screens)/home' as any)}
      >
        <ThemedText style={styles.buttonText}>
          Go to Home
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
