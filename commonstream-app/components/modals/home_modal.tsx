import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

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
  const router = useRouter();
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  // Create dynamic styles
  const styles = createStyles(backgroundColor, textColor, iconColor, tintColor);

  const navigationOptions = [
    { name: 'Discover', id: 'discover', icon: 'compass' as const, description: 'Find new music & artists' },
    { name: 'Connect', id: 'connect', icon: 'analytics-outline' as const, description: 'Create your footprint' },
    { name: 'Library', id: 'library', icon: 'library' as const, description: 'Your saved content' },
    { name: 'Profile', id: 'profile', icon: 'person' as const, description: 'Your account & preferences' },
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
    // setIsExpanded(false);
    // onClose(); // Close the modal first
    
    // Navigate based on the option selected
    if (optionId === 'profile') {
      // add route logic to profile here
      // example: router.push('/(screens)/profile)
    } else if (optionId === 'library') {
      // add route logic to library here
    } else if (optionId === 'discover') {
      // add route logic to discover here
    } else if (optionId === 'connect') {
      // add route logic to connect here or remove
    }
    // Add more navigation cases here as you implement other screens
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.bottomSheet, { height: animatedHeight, backgroundColor }]}>
      {/* Handle bar */}
      <TouchableOpacity style={styles.handle} onPress={toggleExpanded}>
        <View style={[styles.handleBar, { backgroundColor: iconColor + '66' }]} />
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
                style={[styles.bubble, { backgroundColor: backgroundColor === '#fff' ? '#F7FAFC' : '#3A3A3A', borderColor: iconColor + '33' }]}
                onPress={() => handleNavigation(option.name, option.id)}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <Ionicons 
                    name={option.icon} 
                    size={28} 
                    color={textColor} 
                    style={styles.buttonIcon}
                  />
                  <View style={styles.textContainer}>
                    <Text style={[styles.bubbleText, { color: textColor }]}>{option.name}</Text>
                    <Text style={[styles.descriptionText, { color: iconColor }]}>{option.description}</Text>
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

// Create styles function to access theme colors
const createStyles = (backgroundColor: string, textColor: string, iconColor: string, tintColor: string) => StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: backgroundColor,
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
    backgroundColor: iconColor,
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
    backgroundColor: tintColor,
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
    borderColor: iconColor,
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
    color: textColor,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 2,
  },
  descriptionText: {
    color: iconColor,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'left',
  },
});
