import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';

export default function Transport() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45); // Current time in seconds
  const [duration, setDuration] = useState(180); // Total duration in seconds
  
  const borderColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  
  // Always use day mode color for transport buttons
  const buttonColor = Colors.light.text; // '#11181C' - black

  // Mock song data
  const songData = {
    title: "Blinding Lights",
    artist: "The Weeknd",
    coverArt: "https://picsum.photos/80/80?random=1" // Random image placeholder
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (currentTime / duration) * 100;

  const handlePreviousTrack = () => {
    console.log('Previous track pressed');
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log(isPlaying ? 'Pause pressed' : 'Play pressed');
  };

  const handleNextTrack = () => {
    console.log('Next track pressed');
  };

  return (
    <View style={styles.container}>
      {/* Music Info Card */}
      <View style={[styles.musicCard, { backgroundColor: cardBackground, borderColor }]}>
        <Image 
          source={{ uri: songData.coverArt }}
          style={styles.coverArt}
        />
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: borderColor }]} numberOfLines={1}>
            {songData.title}
          </Text>
          <Text style={[styles.artistName, { color: borderColor }]} numberOfLines={1}>
            {songData.artist}
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: borderColor, opacity: 0.3 }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { backgroundColor: borderColor, width: `${progressPercentage}%` }
                ]} 
              />
            </View>
          </View>
          
          {/* Time Display */}
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: borderColor }]}>
              {formatTime(currentTime)}
            </Text>
            <Text style={[styles.timeText, { color: borderColor }]}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>
      </View>

      {/* Transport Controls */}
      <View style={styles.transportContainer}>
        <TouchableOpacity 
          style={styles.transportButton}
          onPress={handlePreviousTrack}
        >
          <Ionicons name="play-skip-back" size={31} color={buttonColor} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.playButton}
          onPress={handlePlayPause}
        >
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={31} 
            color={buttonColor} 
            style={!isPlaying ? styles.playIcon : undefined}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.transportButton}
          onPress={handleNextTrack}
        >
          <Ionicons name="play-skip-forward" size={31} color={buttonColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%', // Ensure full width container
  },
  musicCard: {
    flexDirection: 'row',
    padding: 35, // Increased from 28 for more internal spacing
    borderRadius: 12,
    marginBottom: 20,
    width: '100%', // Match the query box width exactly
    minHeight: 195, // Increased from 145 to make it 35% taller
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8, // For Android shadow
  },
  coverArt: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  songInfo: {
    flex: 1,
    justifyContent: 'flex-start', // Changed from space-between to start
    height: 80, // Match the cover art height exactly
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2, // Reduced from 4 to tighten spacing
  },
  artistName: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8, // Reduced from 12 to tighten spacing
  },
  progressContainer: {
    marginBottom: 4, // Reduced from 8 to tighten spacing
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    opacity: 0.7,
  },
  transportContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  transportButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    marginLeft: 3, // Slight offset for play icon to look more centered
  },
});
