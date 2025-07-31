import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/context/ThemeContext';
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";


const SERVICES = [
  { key: 'spotify', name: 'Spotify', icon: 'logo-spotify' },
  { key: 'applemusic', name: 'Apple Music', icon: 'musical-notes-outline' },
  { key: 'tidal', name: 'Tidal', icon: 'water-outline' },
  { key: 'soundcloud', name: 'SoundCloud', icon: 'cloud-outline' },
];

export default function SettingsScreen() {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  
  // Current theme from our context
  const { colorScheme, toggleTheme } = useTheme();
  const isDarkMode = colorScheme === 'dark';

  // Spotify Auth
  const { login: spotifyLogin, isLoading: spotifyLoading, isAuthenticated: spotifyConnected } = useSpotifyAuth();

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleThemeToggle = (value: boolean) => {
    toggleTheme();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.title, { color: textColor }]}> 
          Settings
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: iconColor }]}> 
          Manage your app preferences
        </ThemedText>
      </View>

      <View style={styles.content}>
        {/* Appearance Section */}
        <View style={[styles.accordionSection, { backgroundColor: backgroundColor === '#fff' ? '#f8f8f8' : '#2A2A2A', borderColor: iconColor + '33' }]}> 
          <TouchableOpacity 
            style={styles.accordionHeader}
            onPress={() => toggleSection('appearance')}
          >
            <View style={styles.accordionHeaderLeft}>
              <Ionicons name="color-palette-outline" size={24} color={iconColor} />
              <ThemedText style={[styles.accordionTitle, { color: textColor }]}> 
                Appearance
              </ThemedText>
            </View>
            <Ionicons 
              name={expandedSections.appearance ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={iconColor} 
            />
          </TouchableOpacity>

          {expandedSections.appearance && (
            <View style={styles.accordionContent}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <ThemedText style={[styles.settingTitle, { color: textColor }]}> 
                    Dark Mode
                  </ThemedText>
                  <ThemedText style={[styles.settingDescription, { color: iconColor }]}> 
                    Switch between light and dark theme
                  </ThemedText>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={handleThemeToggle}
                  trackColor={{ false: iconColor + '33', true: tintColor }}
                  thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>
          )}
        </View>

        {/* Third Party Services Section */}
        <View style={[styles.accordionSection, { backgroundColor: backgroundColor === '#fff' ? '#f8f8f8' : '#2A2A2A', borderColor: iconColor + '33' }]}> 
          <TouchableOpacity 
            style={styles.accordionHeader}
            onPress={() => toggleSection('services')}
          >
            <View style={styles.accordionHeaderLeft}>
              <Ionicons name="link-outline" size={24} color={iconColor} />
              <ThemedText style={[styles.accordionTitle, { color: textColor }]}> 
                Third Party Services
              </ThemedText>
            </View>
            <Ionicons 
              name={expandedSections.services ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={iconColor} 
            />
          </TouchableOpacity>

          {expandedSections.services && (
            <View style={styles.accordionContent}>
              {SERVICES.map(service => (
                <View key={service.key} style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name={service.icon as any} size={22} color={iconColor} />
                      <ThemedText style={[styles.settingTitle, { color: textColor, marginLeft: 10 }]}> 
                        {service.name}
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      paddingHorizontal: 18,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: iconColor + '33',
                      opacity: service.key === 'spotify' && spotifyConnected ? 0.5 : 1,
                    }}
                    onPress={service.key === 'spotify' ? spotifyLogin : undefined}
                    disabled={service.key === 'spotify' && spotifyConnected}
                  >
                    <ThemedText style={{ color: '#222', fontWeight: '600' }}>
                      {service.key === 'spotify'
                        ? (spotifyConnected ? 'Connected' : (spotifyLoading ? 'Connecting...' : 'Connect'))
                        : 'Connect'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  content: {
    flex: 1,
  },
  title: {
    textAlign: 'left',
    marginBottom: 8,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'left',
    opacity: 0.7,
    fontSize: 16,
  },
  
  // Accordion Styles
  accordionSection: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accordionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  
  // Setting Item Styles
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
});
