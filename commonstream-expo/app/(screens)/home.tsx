// app/home.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import Glow from '../(widgets)/ui/glow';               // <- if this file is in app/(tabs)/, change to "../(widgets)/ui/glow"
import HomeModal from '../(widgets)/modals/home_modal'; // <- if in app/(tabs)/, change to "../(widgets)/modals/home_modal"
import HomeQuery from '../(widgets)/ui/home-query';                  // <- if in app/(tabs)/, change to "../home_query"

export default function HomeScreen() {
  const [homeModalOpen, setHomeModalOpen] = useState(true);

  return (
    <ThemedView style={styles.container}>
      <Glow />

      {/* Include the Home modal */}
      <HomeModal visible={homeModalOpen} onClose={() => setHomeModalOpen(false)} />

      <View style={styles.content}>
        <HomeQuery />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    maxWidth: 330,
    width: '100%',
    zIndex: 1,
  },
});
