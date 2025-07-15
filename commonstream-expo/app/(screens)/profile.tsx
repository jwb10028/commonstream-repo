import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/context/ThemeContext';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  
  // Get current theme
  const { colorScheme } = useTheme();
  const isLightMode = colorScheme === 'light';

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
          <View style={[styles.profileImageContainer, { borderColor: iconColor + '33' }]}>
            {user.images && user.images.length > 0 ? (
              <Image 
                source={{ uri: user.images[0].url }} 
                style={[styles.profileImage, { borderColor: iconColor + '33' }]}
              />
            ) : (
              <View style={[styles.defaultProfileImage, { backgroundColor: backgroundColor, borderColor: iconColor + '33' }]}>
                <Ionicons name="person" size={40} color={iconColor} />
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
        <View style={[styles.statsContainer, { backgroundColor: backgroundColor, borderColor: iconColor + '33' }]}>
          <View style={styles.statItem}>
            <ThemedText type="subtitle" style={[styles.statNumber, { color: textColor }]}>
              {user.followers?.total || 0}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: iconColor }]}>
              Followers
            </ThemedText>
          </View>
          
          <View style={styles.statItem}>
            <ThemedText type="subtitle" style={[styles.statNumber, { color: textColor }]}>
              {user.product === 'premium' ? 'Premium' : 'Free'}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: iconColor }]}>
              Account Type
            </ThemedText>
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.detailsContainer}>
          <View style={[styles.detailItem, { backgroundColor: backgroundColor, borderColor: iconColor + '33' }]}>
            <ThemedText style={[styles.detailLabel, { color: iconColor }]}>User ID:</ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {user.id}
            </ThemedText>
          </View>
          
          <View style={[styles.detailItem, { backgroundColor: backgroundColor, borderColor: iconColor + '33' }]}>
            <ThemedText style={[styles.detailLabel, { color: iconColor }]}>Country:</ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {user.country}
            </ThemedText>
          </View>
        </View>

        {/* Spacer to push logout button down */}
        <View style={styles.spacer} />

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: backgroundColor === '#fff' ? 'white' : '#3A3A3A', borderColor: iconColor + '33' }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={textColor} style={styles.logoutIcon} />
          <ThemedText style={[styles.logoutButtonText, { color: textColor }]}>
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
  },
  defaultProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
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
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
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
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 20,
    borderWidth: 1,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
