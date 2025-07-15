import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

interface HomeModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = height * 0.8;
const BOTTOM_SHEET_MIN_HEIGHT = 100;

export default function HomeModal({ visible, onClose }: HomeModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;

  const navigationOptions = [
    { name: 'Stream Mix', id: 'stream-mix', icon: 'play-circle' as const, description: 'Curated playlists & mixes' },
    { name: 'Library', id: 'library', icon: 'library' as const, description: 'Your saved content' },
    { name: 'Discover', id: 'discover', icon: 'compass' as const, description: 'Find new music & artists' },
    { name: 'Linked Devices', id: 'linked-devices', icon: 'phone-portrait' as const, description: 'Manage connected devices' },
    { name: 'Profile', id: 'profile', icon: 'person' as const, description: 'Your account & preferences' },
    { name: 'Settings', id: 'settings', icon: 'settings' as const, description: 'App configuration' },
  ];

  useEffect(() => {
    if (visible) {
      Animated.timing(animatedHeight, {
        toValue: isExpanded ? BOTTOM_SHEET_MAX_HEIGHT : BOTTOM_SHEET_MIN_HEIGHT,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, isExpanded]);

  const handleNavigation = (optionName: string, optionId: string) => {
    console.log(`Navigating to ${optionName} (${optionId})`);
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.bottomSheet, { height: animatedHeight }]}>
      {/* Handle bar */}
      <TouchableOpacity style={styles.handle} onPress={toggleExpanded}>
        <View style={styles.handleBar} />
      </TouchableOpacity>

      {/* Content - only show when expanded */}
      {isExpanded && (
        <View style={styles.content}>
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bubbleContainer}
          >
            {navigationOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={styles.bubble}
                onPress={() => handleNavigation(option.name, option.id)}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <Ionicons 
                    name={option.icon} 
                    size={28} 
                    color="#3d3d3dff" 
                    style={styles.buttonIcon}
                  />
                  <View style={styles.textContainer}>
                    <Text style={styles.bubbleText}>{option.name}</Text>
                    <Text style={styles.descriptionText}>{option.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999, // High z-index to appear above all other content
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  bubbleContainer: {
    width: '100%',
    gap: 18,
    paddingBottom: 20,
  },
  bubble: {
    width: '100%',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
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
    borderColor: '#E2E8F0',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  buttonIcon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  bubbleText: {
    color: '#3d3d3dff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 2,
  },
  descriptionText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'left',
  },
});
