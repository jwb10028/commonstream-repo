import React from 'react';
import { View, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface KeyboardToolbarProps {
  visible: boolean;
  onDone?: () => void;
}

export default function KeyboardToolbar({ visible, onDone }: KeyboardToolbarProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'text');
  const textColor = useThemeColor({}, 'text');

  const handleDone = () => {
    Keyboard.dismiss();
    onDone?.();
  };

  if (!visible) return null;

  return (
    <View style={[styles.toolbar, { backgroundColor, borderTopColor: borderColor }]}>
      <View style={styles.leftSection}>
        {/* You can add additional buttons here if needed */}
      </View>
      
      <View style={styles.centerSection}>
        {/* Center section for potential future use */}
      </View>
      
      <View style={styles.rightSection}>
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={handleDone}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={textColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced from 12 to 8 to prevent button cutoff
    borderTopWidth: 0, // Removed top border
    height: 53, // Increased from 44 to make it 20% taller
    width: '100%',
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 8, // Reduced padding to ensure icon fits properly
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
