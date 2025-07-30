import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import StreamTimeline from './stream-timeline';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { remoteApi } from '@/services/RemoteAPI'; // New import
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';

export default function Transport() {
  const { tokens } = useSpotifyAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [songData, setSongData] = useState({
    title: "Loading...",
    artist: "Loading...",
    album: "Loading...",
    album_year: "Loading...",
    album_cover: "https://picsum.photos/80/80?random=1",
  });
  const [deviceId, setDeviceId] = useState("Empty Id");
  const [repeatMode, setRepeatMode] = useState<"track" | "context" | "off">("off");
  const [shuffled, setShuffled] = useState(false);

  // Fetch playback state from API
  const fetchPlaybackState = async () => {
      if (!tokens) {
        // Handle case where tokens are not available
        return;
      }
  
      const playbackState = await remoteApi.getPlaybackState(tokens.access_token);
      //console.log("Playback state response:", playbackState); // Log the full response
      setSongData({
        title: playbackState.item.name,
        artist: playbackState.item.artists[0].name,
        album: playbackState.item.album.name,
        album_year: playbackState.item.album.release_date,
        album_cover: playbackState.item.album.images[0].url,
      });
      setDuration(Math.floor(playbackState.item.duration_ms / 1000)); // seconds
      setProgress(playbackState.progress_ms);
      setCurrentTime(Math.floor(playbackState.progress_ms / 1000)); // seconds
      setIsPlaying(playbackState.is_playing);
      setDeviceId(playbackState.device.id);
      setRepeatMode(playbackState.repeat_state);
      setShuffled(playbackState.shuffle_state);
    };
  
    useEffect(() => {
      fetchPlaybackState();
    }, [tokens]); // Only run when tokens change
  
    // Poll for playback state update every 2 seconds
    const pollPlaybackState = useCallback(() => {
      if (tokens) {
        fetchPlaybackState();
      }
    }, [tokens, fetchPlaybackState]);
  
    useEffect(() => {
      const intervalId = setInterval(pollPlaybackState, 1000);
      return () => clearInterval(intervalId); // Cleanup function to clear the interval on unmount
    }, [pollPlaybackState]);
  

  const borderColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  
  // Always use day mode color for transport buttons
  const buttonColor = Colors.light.text; // '#11181C' - black

  // Seeking handler for timeline
  const handleSeek = (time: number) => {
    setProgress(time);
    if (tokens?.access_token) {
        remoteApi.remoteSeek(tokens.access_token, time);
    }
    console.log("Seeking to:", time);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (tokens?.access_token) {
        remoteApi.remotePlayback(tokens?.access_token, isPlaying, deviceId);
    }
    console.log(isPlaying ? "Pause pressed" : "Play pressed");
  };

  const handlePrevious = () => {
    if (tokens?.access_token) {
        remoteApi.remotePrev(tokens.access_token, deviceId);
    }
    console.log("Previous track pressed");
  };

  const handleNext = () => {
    if (tokens?.access_token) {
        remoteApi.remoteNext(tokens.access_token, deviceId);
    }
    console.log("Next track pressed");
  };

  return (
    <View style={styles.container}>
      {/* Music Info Card */}
      <View style={[styles.musicCard, { backgroundColor: cardBackground, borderColor }]}> 
        <Image 
          source={{ uri: songData.album_cover }}
          style={styles.coverArt}
        />
        <View style={styles.infoColumn}>
          <View style={styles.songInfo}>
            <Text style={[styles.songTitle, { color: borderColor }]} numberOfLines={1}>
              {songData.title}
            </Text>
            <Text style={[styles.artistName, { color: borderColor }]} numberOfLines={1}>
              {songData.artist}
            </Text>
          </View>
          <View style={styles.timelineWrapper}>
            {/* Timeline Bar (replaces old progress bar and time display) */}
            <StreamTimeline 
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
            />
          </View>
        </View>
      </View>

      {/* Transport Controls */}
      <View style={styles.transportContainer}>
        <TouchableOpacity 
          style={styles.transportButton}
          onPress={handlePrevious}
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
          onPress={handleNext}
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
    marginBottom: 0,
    marginTop: 0, // Add this line to remove any top margin
    width: '100%', // Ensure full width container
  },
  musicCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    borderRadius: 12,
    marginBottom: -65,
    width: '100%',
    minHeight: 220,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  infoColumn: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 16,
  },
  coverArt: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  songInfo: {
    marginBottom: 8,
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
    gap: 45,
    marginBottom: 115, // Adjusted for better spacing
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
  timelineWrapper: {
    width: '115%',
    maxWidth: 340,
    alignSelf: 'flex-start',
    marginTop: 0,
    marginBottom: 0,
    marginLeft: -15, 
  },
});
