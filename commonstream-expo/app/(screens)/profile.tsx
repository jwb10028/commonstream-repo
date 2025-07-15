import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/'); // Redirect to index/login screen
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Profile
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            No user data available
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Picture */}
        <View style={styles.profileImageContainer}>
          {user.images && user.images.length > 0 ? (
            <Image 
              source={{ uri: user.images[0].url }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.defaultProfileImage}>
              <Ionicons name="person" size={60} color="#666" />
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <ThemedText type="title" style={styles.displayName}>
            {user.display_name || 'Spotify User'}
          </ThemedText>
          
          <ThemedText style={styles.email}>
            {user.email}
          </ThemedText>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText type="subtitle" style={styles.statNumber}>
                {user.followers?.total || 0}
              </ThemedText>
              <ThemedText style={styles.statLabel}>
                Followers
              </ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText type="subtitle" style={styles.statNumber}>
                {user.product === 'premium' ? 'Premium' : 'Free'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>
                Account Type
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <ThemedText style={styles.detailLabel}>User ID:</ThemedText>
            <ThemedText style={styles.detailValue}>{user.id}</ThemedText>
          </View>
          
          <View style={styles.detailItem}>
            <ThemedText style={styles.detailLabel}>Country:</ThemedText>
            <ThemedText style={styles.detailValue}>{user.country}</ThemedText>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="white" style={styles.logoutIcon} />
          <ThemedText style={styles.logoutButtonText}>
            Logout
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#1DB954',
  },
  defaultProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1DB954',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  displayName: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 20,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabel: {
    opacity: 0.7,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: '500',
    opacity: 0.8,
  },
  detailValue: {
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
