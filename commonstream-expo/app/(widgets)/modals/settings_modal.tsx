import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/context/ThemeContext';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { useUserStorage } from '@/hooks/useUserStorage';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** Icon name helper types */
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type IconComponent = typeof Ionicons | typeof MaterialCommunityIcons;

/** Services config with per-service icon component + typed icon name */
const SERVICES = [
  {
    key: 'spotify',
    name: 'Spotify',
    Icon: MaterialCommunityIcons as IconComponent,
    iconName: 'spotify' as MCIName,
    isManaged: true,
  },
  {
    key: 'applemusic',
    name: 'Apple Music',
    Icon: Ionicons as IconComponent,
    iconName: 'musical-notes-outline' as IoniconName,
    isManaged: false,
  },
] as const;

export default function SettingsModal({ visible, onClose }: Props) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    appearance: true,
    services: true,
    manage: true,
  });

  // Fixed sheet height: 80% of screen
  const { height: screenH } = useWindowDimensions();
  const SHEET_HEIGHT = Math.max(360, Math.floor(screenH * 0.887)); // small-screen guard

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  // Theme
  const { colorScheme, toggleTheme } = useTheme();
  const isDarkMode = colorScheme === 'dark';

  // Spotify Auth
  const {
    login: spotifyLogin,
    logout: spotifyLogout,
    isLoading: spotifyLoading,
    isAuthenticated: spotifyConnected,
  } = useSpotifyAuth();

  // Profile management
  const { clearUserProfile } = useUserStorage();
  const [clearing, setClearing] = useState(false);

  const toggleSection = (id: string) =>
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));

  const handleClearProfile = async () => {
    try {
      setClearing(true);
      await clearUserProfile();
      onClose();
    } finally {
      setClearing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* Tap outside sheet to close */}
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor,
                borderColor: iconColor + '22',
                height: SHEET_HEIGHT,     // <-- fixed 80% height
              },
            ]}
          >
            {/* Handle + header */}
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <ThemedText type="title" style={[styles.sheetTitle, { color: textColor }]}>
                Settings
              </ThemedText>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={textColor} />
              </TouchableOpacity>
            </View>
            <ThemedText style={[styles.subtitle, { color: iconColor }]}>
              Manage your app preferences
            </ThemedText>

            {/* Make scroll area fill the sheet */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Appearance */}
              <View
                style={[
                  styles.accordionSection,
                  {
                    backgroundColor: backgroundColor === '#fff' ? '#f8f8f8' : '#2A2A2A',
                    borderColor: iconColor + '33',
                  },
                ]}
              >
                <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('appearance')}>
                  <View style={styles.accordionHeaderLeft}>
                    <Ionicons name="color-palette-outline" size={24} color={iconColor} />
                    <ThemedText style={[styles.accordionTitle, { color: textColor }]}>
                      Appearance
                    </ThemedText>
                  </View>
                  <Ionicons
                    name={expandedSections.appearance ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={iconColor}
                  />
                </TouchableOpacity>

                {expandedSections.appearance && (
                  <View style={styles.accordionContent}>
                    <View style={styles.settingItem}>
                      <View style={styles.settingLeft}>
                        <ThemedText style={[styles.settingTitle, { color: textColor }]}>Dark Mode</ThemedText>
                        <ThemedText style={[styles.settingDescription, { color: iconColor }]}>
                          Switch between light and dark theme
                        </ThemedText>
                      </View>
                      <Switch
                        value={isDarkMode}
                        onValueChange={toggleTheme}
                        trackColor={{ false: iconColor + '33', true: tintColor }}
                        thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Services */}
              <View
                style={[
                  styles.accordionSection,
                  {
                    backgroundColor: backgroundColor === '#fff' ? '#f8f8f8' : '#2A2A2A',
                    borderColor: iconColor + '33',
                  },
                ]}
              >
                <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('services')}>
                  <View style={styles.accordionHeaderLeft}>
                    <Ionicons name="link-outline" size={24} color={iconColor} />
                    <ThemedText style={[styles.accordionTitle, { color: textColor }]}>
                      Third Party Services
                    </ThemedText>
                  </View>
                  <Ionicons
                    name={expandedSections.services ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={iconColor}
                  />
                </TouchableOpacity>

                {expandedSections.services && (
                  <View style={styles.accordionContent}>
                    {SERVICES.map(service => {
                      const IconCmp = service.Icon as React.ComponentType<any>;
                      const isSpotify = service.key === 'spotify';
                      const btnLabel = isSpotify
                        ? spotifyConnected
                          ? spotifyLoading
                            ? 'Logging out…'
                            : 'Logout'
                          : spotifyLoading
                          ? 'Connecting…'
                          : 'Connect'
                        : 'Connect';

                      return (
                        <View key={service.key} style={styles.settingItem}>
                          <View style={styles.settingLeft}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <IconCmp name={service.iconName as any} size={22} color={iconColor} />
                              <ThemedText
                                style={[styles.settingTitle, { color: textColor, marginLeft: 10 }]}
                              >
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
                              opacity: isSpotify && spotifyLoading ? 0.8 : 1,
                            }}
                            onPress={
                              isSpotify ? (spotifyConnected ? spotifyLogout : spotifyLogin) : undefined
                            }
                            disabled={isSpotify && spotifyLoading}
                          >
                            <ThemedText style={{ color: '#222', fontWeight: '600' }}>{btnLabel}</ThemedText>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Manage Profile */}
              <View
                style={[
                  styles.accordionSection,
                  {
                    backgroundColor: backgroundColor === '#fff' ? '#f8f8f8' : '#2A2A2A',
                    borderColor: iconColor + '33',
                  },
                ]}
              >
                <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('manage')}>
                  <View style={styles.accordionHeaderLeft}>
                    <Ionicons name="person-circle-outline" size={24} color={iconColor} />
                    <ThemedText style={[styles.accordionTitle, { color: textColor }]}>
                      Manage Profile
                    </ThemedText>
                  </View>
                  <Ionicons
                    name={expandedSections.manage ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={iconColor}
                  />
                </TouchableOpacity>

                {expandedSections.manage && (
                  <View style={styles.accordionContent}>
                    <View style={styles.settingItem}>
                      <View style={styles.settingLeft}>
                        <ThemedText style={[styles.settingTitle, { color: textColor }]}>
                          Clear Profile
                        </ThemedText>
                        <ThemedText style={[styles.settingDescription, { color: iconColor }]}>
                          Remove all locally stored profile data
                        </ThemedText>
                      </View>

                      <TouchableOpacity
                        onPress={handleClearProfile}
                        disabled={clearing}
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: 8,
                          paddingHorizontal: 18,
                          paddingVertical: 8,
                          borderWidth: 1,
                          borderColor: iconColor + '33',
                          opacity: clearing ? 0.7 : 1,
                        }}
                      >
                        <ThemedText style={{ color: '#c1121f', fontWeight: '700' }}>
                          {clearing ? 'Clearing…' : 'Clear'}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  /* Sheet */
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    borderTopWidth: 1,
    // NOTE: height is injected dynamically (80% of screen)
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#999',
    marginBottom: 12,
    opacity: 0.6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 6,
    marginBottom: 10,
  },

  /* Accordion */
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

  /* Items */
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
