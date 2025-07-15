import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import StreamTimeline from '@/app/(widgets)/ui/stream-timeline';
import StreamTransport from '@/app/(widgets)/ui/stream-transport';

export default function StreamScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [currentTime, setCurrentTime] = useState(45);
  const duration = 180;

  // Theme colors with explicit dark mode constants
  const backgroundColor = useThemeColor({ light: Colors.light.background, dark: Colors.dark.background }, 'background');
  const textColor = useThemeColor({ light: Colors.light.text, dark: Colors.dark.text }, 'text');
  const iconColor = useThemeColor({ light: Colors.light.icon, dark: Colors.dark.icon }, 'icon');
  const tintColor = useThemeColor({ light: Colors.light.tint, dark: Colors.dark.tint }, 'tint');

  // Mock current track data
  const currentTrack = {
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    coverArt: "https://picsum.photos/300/300?random=1", // Placeholder cover art
    year: "2020"
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log(isPlaying ? 'Pause pressed' : 'Play pressed');
  };

  const handlePrevious = () => {
    console.log('Previous track pressed');
  };

  const handleNext = () => {
    console.log('Next track pressed');
  };

  const handleShuffle = () => {
    setIsShuffled(!isShuffled);
    console.log('Shuffle toggled:', !isShuffled);
  };

  const handleRepeat = () => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
    console.log('Repeat mode:', nextMode);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    console.log('Seeking to:', time);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Album Cover Art */}
        <View style={styles.coverContainer}>
          <Image 
            source={{ uri: currentTrack.coverArt }}
            style={[styles.coverArt, { borderColor: iconColor + '20' }]}
            resizeMode="cover"
          />
        </View>

        {/* Track Information */}
        <View style={styles.trackInfo}>
          <ThemedText style={[styles.trackTitle, { color: textColor }]} numberOfLines={2}>
            {currentTrack.title}
          </ThemedText>
          <ThemedText style={[styles.artistName, { color: iconColor }]} numberOfLines={1}>
            {currentTrack.artist}
          </ThemedText>
          <ThemedText style={[styles.albumInfo, { color: iconColor }]} numberOfLines={1}>
            {currentTrack.album} • {currentTrack.year}
          </ThemedText>
        </View>

        {/* Timeline */}
        <View style={styles.timelineWrapper}>
          <StreamTimeline 
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
          />
        </View>

        {/* Transport Controls */}
        <View style={styles.transportWrapper}>
          <StreamTransport 
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onShuffle={handleShuffle}
            onRepeat={handleRepeat}
            isShuffled={isShuffled}
            repeatMode={repeatMode}
          />
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
  contentContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  coverContainer: {
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  coverArt: {
    width: 280,
    height: 280,
    borderRadius: 16,
    borderWidth: 1,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
    opacity: 0.8,
  },
  albumInfo: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
  },
  timelineWrapper: {
    width: '100%',
    marginBottom: 30,
  },
  transportWrapper: {
    width: '100%',
    alignItems: 'center',
  },
});