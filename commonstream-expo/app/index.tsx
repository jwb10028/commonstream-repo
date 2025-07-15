import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { Ionicons } from '@expo/vector-icons';
import Glow from '@/app/(widgets)/ui/glow';

export default function AuthScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { login, isLoading: spotifyLoading, error } = useSpotifyAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  if (authLoading) {
    return (
      <ThemedView style={styles.container}>
        <Glow />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#1DB954" />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

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
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
      
      {/* Footer with login button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.loginButton, spotifyLoading && styles.loginButtonDisabled]} 
          onPress={handleLogin}
          disabled={spotifyLoading}
        >
          {spotifyLoading ? (
            <ActivityIndicator color="black" size="small" />
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="musical-notes" size={24} color="black" style={styles.spotifyIcon} />
              <Text style={styles.loginButtonText}>Continue with Spotify</Text>
            </View>
          )}
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
    shadowColor: '#000',
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
