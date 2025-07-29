import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';

interface StreamTransportProps {
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onShuffle?: () => void;
  onRepeat?: () => void;
  isShuffled?: boolean;
  repeatMode?: 'track' | 'context' | 'off';
}

export default function StreamTransport({
  isPlaying = false,
  onPlayPause,
  onPrevious,
  onNext,
  onShuffle,
  onRepeat,
  isShuffled,
  repeatMode = 'off'
}: StreamTransportProps) {
  const textColor = useThemeColor({ light: Colors.light.text, dark: Colors.dark.text }, 'text');
  const iconColor = useThemeColor({ light: Colors.light.icon, dark: Colors.dark.icon }, 'icon');
  const backgroundColor = useThemeColor({ light: Colors.light.background, dark: Colors.dark.background }, 'background');
  
  // Use text color for the play button background (black in light, white in dark)
  const playButtonColor = textColor;

  const handlePlayPause = () => {
    onPlayPause?.();
  };

  const handlePrevious = () => {
    onPrevious?.();
  };

  const handleNext = () => {
    onNext?.();
  };

  const handleShuffle = () => {
    onShuffle?.();
  };

  const handleRepeat = () => {
    onRepeat?.();
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'track':
        return 'repeat-outline';
      case 'context':
        return 'repeat';
      default:
        return 'repeat';
    }
  };

  return (
    <View style={styles.container}>
      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleShuffle}
        >
          <Ionicons 
            name="shuffle" 
            size={22} 
            color={isShuffled ? playButtonColor : iconColor} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleRepeat}
        >
          <Ionicons 
            name={getRepeatIcon()} 
            size={22} 
            color={repeatMode !== 'off' ? playButtonColor : iconColor} 
          />
          {repeatMode === 'track' && (
            <View style={[styles.repeatIndicator, { backgroundColor: playButtonColor }]}>
              <Ionicons name="finger-print" size={8} color={backgroundColor} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Transport Controls */}
      <View style={styles.mainControls}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handlePrevious}
        >
          <Ionicons name="play-skip-back" size={36} color={textColor} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.playButton, { backgroundColor: playButtonColor }]}
          onPress={handlePlayPause}
        >
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={38} 
            color={backgroundColor}
            style={!isPlaying ? styles.playIcon : undefined}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleNext}
        >
          <Ionicons name="play-skip-forward" size={36} color={textColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
    marginBottom: 20,
  },
  secondaryButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  repeatIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 45,
  },
  skipButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  playIcon: {
    marginLeft: 3, // Slight offset for play icon to look more centered
  },
});
