import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.title, { color: textColor }]}>
          Discover
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Query Field */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: backgroundColor === '#fff' ? '#F7FAFC' : '#3A3A3A',
                  borderColor: iconColor + '33',
                  color: textColor,
                }
              ]}
              placeholder="..."
              placeholderTextColor={iconColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={() => {
                console.log('Searching for:', searchQuery);
                // Add search logic here
              }}
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => {
                console.log('Searching for:', searchQuery);
                // Add search logic here
              }}
            >
              <Ionicons 
                name="paper-plane" 
                size={20} 
                color={textColor} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
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
    paddingBottom: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: 30,
    marginTop: 5,
  },
  searchInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 55,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});