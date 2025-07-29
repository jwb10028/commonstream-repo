import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Colors } from "@/constants/Colors";
import StreamTimeline from "@/app/(widgets)/ui/stream-timeline";
import StreamTransport from "@/app/(widgets)/ui/stream-transport";
import { remoteApi } from "@/services/RemoteAPI";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";

export default function PlayerScreen() {
  const { tokens } = useSpotifyAuth();

  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"track" | "context" | "off">("off");
  const [volume, setVolume] = useState(50); // New property for volume
  const [shuffled, setShuffled] = useState(false); // Shuffle state

  // Theme colors with explicit dark mode constants
  const backgroundColor = useThemeColor(
    { light: Colors.light.background, dark: Colors.dark.background },
    "background"
  );
  const textColor = useThemeColor(
    { light: Colors.light.text, dark: Colors.dark.text },
    "text"
  );
  const iconColor = useThemeColor(
    { light: Colors.light.icon, dark: Colors.dark.icon },
    "icon"
  );
  const tintColor = useThemeColor(
    { light: Colors.light.tint, dark: Colors.dark.tint },
    "tint"
  );

  // Song data
  const [itemData, setItemData] = useState({
    title: "loading...",
    artist: "loading...",
    album: "loading...",
    album_year: "loading...",
    album_cover: "loading...",
  });
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [deviceId, setDeviceId] = useState("Empty Id");

  const fetchPlaybackState = async () => {
    if (!tokens) {
      // Handle case where tokens are not available
      return;
    }

    const playbackState = await remoteApi.getPlaybackState(tokens.access_token);
    console.log("Playback state response:", playbackState); // Log the full response
    setItemData({
      title: playbackState.item.name,
      artist: playbackState.item.artists[0].name,
      album: playbackState.item.album.name,
      album_year: playbackState.item.album.release_date,
      album_cover: playbackState.item.album.images[0].url,
    });
    setDuration(playbackState.item.duration_ms);
    setProgress(playbackState.progress_ms);
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

  // Transport Handlers for remoteAPI
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

  const handleVolumeChange = (volume: number) => {
    setVolume(volume);
    console.log("Volume set to:", volume);
  };

  const handleShuffle = () => {
    const newShuffle = !shuffled;
    setShuffled(newShuffle);
    if (tokens?.access_token) {
      remoteApi.remoteShuffle(tokens.access_token, newShuffle);
    }
    console.log("Shuffle mode toggled:", newShuffle);
  };

  const handleRepeat = () => {
    const modes: ("track" | "context" | "off")[] = ["track", "context", "off"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
    if (tokens?.access_token) {
        remoteApi.remoteRepeatMode(tokens.access_token, nextMode);
    }
    console.log("Repeat mode:", nextMode);
  };

  const handleSeek = (time: number) => {
    setProgress(time);
    if (tokens?.access_token) {
        remoteApi.remoteSeek(tokens.access_token, time);
    }
    console.log("Seeking to:", time);
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
            source={{ uri: itemData.album_cover }}
            style={[styles.coverArt, { borderColor: iconColor + "20" }]}
            resizeMode="cover"
          />
        </View>

        {/* Track Information */}
        <View style={styles.trackInfo}>
          <ThemedText
            style={[styles.trackTitle, { color: textColor }]}
            numberOfLines={2}
          >
            {itemData.title}
          </ThemedText>
          <ThemedText
            style={[styles.artistName, { color: iconColor }]}
            numberOfLines={1}
          >
            {itemData.artist}
          </ThemedText>
          <ThemedText
            style={[styles.albumInfo, { color: iconColor }]}
            numberOfLines={1}
          >
            {itemData.album} • {itemData.album_year}
          </ThemedText>
        </View>

        {/* Timeline */}
        <View style={styles.timelineWrapper}>
          <StreamTimeline
            currentTime={Math.round(progress / 1000)}
            duration={Math.round(duration/1000)}
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
            isShuffled={shuffled}
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
    padding: 20, // Updated to include all sides
  },
  header: {
    paddingTop: 20,
    paddingBottom: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  coverContainer: {
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  coverArt: {
    width: 200,
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
  },
  trackInfo: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
    height:120
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  artistName: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 4,
    opacity: 0.8,
  },
  albumInfo: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
  },
  timelineWrapper: {
    width: "100%",
    marginBottom: 30,
  },
  transportWrapper: {
    width: "100%",
    alignItems: "center",
  },
});
