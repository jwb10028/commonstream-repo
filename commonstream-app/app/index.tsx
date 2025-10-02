import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Glow from '@/components/ui/glow';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.centerContent}>
        <Glow/>
        <ThemedText type="title" style={styles.text}>
          CommonStream
        </ThemedText>
      </ThemedView>
      
      <Pressable style={styles.button} onPress={() => router.push('/(screens)/home' as any)}>
        <ThemedText style={styles.buttonText}>
          Register & Login
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  button: {
    position: 'absolute',
    bottom: 60,
    left: 50,
    backgroundColor: '#ffffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    width: 300,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
