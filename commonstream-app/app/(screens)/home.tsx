import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Glow from '@/components/ui/glow';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <Glow/>
      <ThemedText type="title" style={styles.text}>
        CommonStream Home
      </ThemedText>
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
});
