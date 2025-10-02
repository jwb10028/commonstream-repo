import HomeModal from '@/components/modals/home_modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Glow from '@/components/ui/glow';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
    const [homeModalOpen, setHomeModalOpen] = useState(true);
  
    return (
    <ThemedView style={styles.container}>
      <Glow/>
      <HomeModal visible={homeModalOpen} onClose={() => setHomeModalOpen(false)} />
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
