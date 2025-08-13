import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
// ...existing code...
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Glow from '@/app/(widgets)/ui/glow';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AuthScreen() {
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const handleLogin = () => {
    // add auth logic here if needed
    router.replace('/home');
  };

  return (
    <ThemedView style={styles.container}>
      <Glow />
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>
            Common
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            Stream
          </ThemedText>
        </View>
      </View>
      {/* Footer with login button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="musical-notes" size={24} color="black" style={styles.spotifyIcon} />
            <Text style={styles.loginButtonText}>Continue to app</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loginButton: {
    backgroundColor: 'white',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 12, // More square, less rounded
    minWidth: 320,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotifyIcon: {
    marginRight: 12,
  },
  loginButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
});
