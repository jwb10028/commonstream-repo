import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';

export default function LibraryScreen() {
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const libraryItems = [
    { id: 'playlists', name: 'Playlists', icon: 'list' as const, description: 'Your saved playlists' },
    { id: 'artists', name: 'Artists', icon: 'mic' as const, description: 'Followed artists' },
    { id: 'tracks', name: 'Tracks', icon: 'musical-notes' as const, description: 'Liked songs' },
    { id: 'recently-played', name: 'Recently Played', icon: 'time' as const, description: 'Your listening history' },
  ];

  const handleItemPress = (item: typeof libraryItems[0]) => {
    console.log(`Navigating to ${item.name}`);
    // Add navigation logic here when implementing specific library sections
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.title, { color: textColor }]}>
          Library
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.itemsContainer}>
          {libraryItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.libraryItem,
                { 
                  backgroundColor: backgroundColor === '#fff' ? '#F7FAFC' : '#3A3A3A',
                  borderColor: iconColor + '33'
                }
              ]}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.itemContent}>
                <Ionicons 
                  name={item.icon} 
                  size={28} 
                  color={textColor} 
                  style={styles.itemIcon}
                />
                <View style={styles.textContainer}>
                  <ThemedText style={[styles.itemTitle, { color: textColor }]}>
                    {item.name}
                  </ThemedText>
                  <ThemedText style={[styles.itemDescription, { color: iconColor }]}>
                    {item.description}
                  </ThemedText>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={iconColor} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  itemsContainer: {
    gap: 18,
    paddingBottom: 20,
  },
  libraryItem: {
    width: '100%',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'flex-start',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  itemIcon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'left',
  },
});