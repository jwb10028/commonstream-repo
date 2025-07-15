import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';

interface StreamTimelineProps {
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
}

export default function StreamTimeline({ 
  currentTime = 45, 
  duration = 180, 
  onSeek 
}: StreamTimelineProps) {
  const textColor = useThemeColor({ light: Colors.light.text, dark: Colors.dark.text }, 'text');
  const iconColor = useThemeColor({ light: Colors.light.icon, dark: Colors.dark.icon }, 'icon');
  const backgroundColor = useThemeColor({ light: Colors.light.background, dark: Colors.dark.background }, 'background');
  
  // Use text color for progress fill instead of tint color
  const progressColor = textColor;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (currentTime / duration) * 100;

  const handleProgressTouch = (event: any) => {
    // Calculate position and convert to time for seeking
    const { locationX } = event.nativeEvent;
    const { width } = event.currentTarget.measure ? event.currentTarget : { width: 300 };
    const seekTime = Math.floor((locationX / width) * duration);
    onSeek?.(seekTime);
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <TouchableOpacity 
        style={styles.progressContainer}
        onPress={handleProgressTouch}
        activeOpacity={0.8}
      >
        <View style={[styles.progressTrack, { backgroundColor: iconColor + '30' }]}>
          <View 
            style={[
              styles.progressFill, 
              { backgroundColor: progressColor, width: `${progressPercentage}%` }
            ]} 
          />
          <View 
            style={[
              styles.progressThumb,
              { backgroundColor: progressColor, left: `${progressPercentage}%` }
            ]}
          />
        </View>
      </TouchableOpacity>
      
      {/* Time Display */}
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: textColor }]}>
          {formatTime(currentTime)}
        </Text>
        <Text style={[styles.timeText, { color: iconColor }]}>
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  progressContainer: {
    width: '100%',
    paddingVertical: 15,
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
