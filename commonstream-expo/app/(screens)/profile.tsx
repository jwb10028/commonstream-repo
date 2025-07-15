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
        {/* Profile Header - Image and Info Side by Side */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {user.images && user.images.length > 0 ? (
              <Image 
                source={{ uri: user.images[0].url }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.defaultProfileImage}>
                <Ionicons name="person" size={40} color="#666" />
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <ThemedText type="title" style={styles.displayName}>
              {user.display_name || 'Spotify User'}
            </ThemedText>
            
            <ThemedText style={styles.email}>
              {user.email}
            </ThemedText>
          </View>
        </View>

        {/* Stats */}
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

        {/* Spacer to push logout button down */}
        <View style={styles.spacer} />

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="black" style={styles.logoutIcon} />
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
    flexGrow: 1,
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
    marginRight: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  defaultProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  userInfo: {
    alignItems: 'flex-start',
    marginBottom: 30,
    width: '100%',
  },
  displayName: {
    textAlign: 'left',
    marginBottom: 4,
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    textAlign: 'left',
    opacity: 0.7,
    marginBottom: 0,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 0,
    gap: 40,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'flex-start',
    flex: 0,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  statLabel: {
    opacity: 0.7,
    fontSize: 14,
    textAlign: 'left',
    marginTop: 4,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailLabel: {
    fontWeight: '500',
    opacity: 0.8,
    color: '#333',
  },
  detailValue: {
    fontWeight: '600',
    color: '#000',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
});
