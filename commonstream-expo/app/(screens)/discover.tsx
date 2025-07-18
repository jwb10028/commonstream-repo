import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useDiscover } from '@/hooks/useDiscover';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { loading, result, error, search } = useDiscover();

  // Accordion state: [title, description, tracks, links]
  const [accordion, setAccordion] = useState([true, false, false, false]);

  const toggleAccordion = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAccordion(prev => prev.map((open, i) => (i === idx ? !open : open)));
  };

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const isDark = backgroundColor === Colors.dark.background;
  const accordionBg = isDark ? '#23272A' : '#F2F4F8';
  const accordionBorder = isDark ? '#33383D' : '#E0E3E7';

  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      search(searchQuery);
      setSearchQuery('');
    }
  };

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
              onSubmitEditing={handleSearch}
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={loading}
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
          {loading && (
            <ThemedText style={{ color: textColor, fontSize: 16 }}>Searching...</ThemedText>
          )}
          {error && !loading && (
            <ThemedText style={{ color: 'red', fontSize: 16 }}>{error}</ThemedText>
          )}
          {result && !loading && (
            <View style={{ width: '100%' }}>
              {/* Accordion: Info (Title & Artist) */}
              <TouchableOpacity onPress={() => toggleAccordion(0)} style={[styles.accordionHeader, { backgroundColor: accordionBg, borderColor: accordionBorder }]}> 
                <ThemedText style={{ color: textColor, fontWeight: 'bold' }}>Info</ThemedText>
                <Ionicons name={accordion[0] ? 'chevron-up' : 'chevron-down'} size={20} color={iconColor} />
              </TouchableOpacity>
              {accordion[0] && (
                <View style={styles.accordionContent}>
                  <ThemedText type="subtitle" style={{ color: textColor, fontSize: 20, marginBottom: 4 }}>
                    {result.search_title}
                  </ThemedText>
                  <ThemedText style={{ color: tintColor, fontSize: 16 }}>
                    {result.search_subtitle}
                  </ThemedText>
                </View>
              )}

              {/* Accordion: Description */}
              {result.description ? (
                <TouchableOpacity onPress={() => toggleAccordion(1)} style={[styles.accordionHeader, { backgroundColor: accordionBg, borderColor: accordionBorder }]}> 
                  <ThemedText style={{ color: textColor, fontWeight: 'bold' }}>Description</ThemedText>
                  <Ionicons name={accordion[1] ? 'chevron-up' : 'chevron-down'} size={20} color={iconColor} />
                </TouchableOpacity>
              ) : null}
              {result.description && accordion[1] && (
                <View style={styles.accordionContent}>
                  <ThemedText style={{ color: textColor, marginBottom: 10 }}>{result.description}</ThemedText>
                </View>
              )}

              {/* Accordion: Suggested Tracks */}
              {result.trackSuggestions && result.trackSuggestions.length > 0 && (
                <TouchableOpacity onPress={() => toggleAccordion(2)} style={[styles.accordionHeader, { backgroundColor: accordionBg, borderColor: accordionBorder }]}> 
                  <ThemedText style={{ color: textColor, fontWeight: 'bold' }}>Suggested Tracks</ThemedText>
                  <Ionicons name={accordion[2] ? 'chevron-up' : 'chevron-down'} size={20} color={iconColor} />
                </TouchableOpacity>
              )}
              {result.trackSuggestions && result.trackSuggestions.length > 0 && accordion[2] && (
                <View style={styles.accordionContent}>
                  {result.trackSuggestions.map((track, idx) => (
                    <ThemedText key={track.artist + track.title + idx} style={{ color: textColor, marginLeft: 8, marginBottom: 2 }}>
                      • {track.title} <ThemedText style={{ color: tintColor }}>by {track.artist}</ThemedText>
                      {track.reasoning ? ` — ${track.reasoning}` : ''}
                    </ThemedText>
                  ))}
                </View>
              )}

              {/* Accordion: Links */}
              {result.relevantLinks && result.relevantLinks.length > 0 && (
                <TouchableOpacity onPress={() => toggleAccordion(3)} style={[styles.accordionHeader, { backgroundColor: accordionBg, borderColor: accordionBorder }]}> 
                  <ThemedText style={{ color: textColor, fontWeight: 'bold' }}>Links</ThemedText>
                  <Ionicons name={accordion[3] ? 'chevron-up' : 'chevron-down'} size={20} color={iconColor} />
                </TouchableOpacity>
              )}
              {result.relevantLinks && result.relevantLinks.length > 0 && accordion[3] && (
                <View style={styles.accordionContent}>
                  {result.relevantLinks.map((link, idx) => (
                    <ThemedText key={link.url + idx} style={{ color: tintColor, marginLeft: 8 }}>
                      {link.type}: {link.url}
                    </ThemedText>
                  ))}
                </View>
              )}
            </View>
          )}
          {!loading && !result && !error && (
            <ThemedText style={styles.welcomeText}></ThemedText>
          )}
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
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    marginTop: 4,
    borderWidth: 1,
  },
  accordionContent: {
    paddingLeft: 12,
    paddingBottom: 8,
    marginBottom: 4,
  },
});