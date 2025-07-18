
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ConnectScreen() {
  const textColor = useThemeColor({}, 'text');
  return (
    <ThemedView style={styles.container}>
      <View style={styles.centered}>
        <ThemedText type="title" style={{ color: textColor, fontSize: 28 }}>
          Welcome to the Connect screen
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
