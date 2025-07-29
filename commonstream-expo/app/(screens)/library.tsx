import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { spotifyApi } from '@/services/SpotifyAPI';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { remoteApi } from "@/services/RemoteAPI";

export default function LibraryScreen() {
  const [artists, setArtists] = React.useState<any[]>([]);
  const [loadingArtists, setLoadingArtists] = React.useState(false);
  const [artistsError, setArtistsError] = React.useState<string | null>(null);
  const [tracks, setTracks] = React.useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = React.useState(false);
  const [tracksError, setTracksError] = React.useState<string | null>(null);
  const { tokens } = useSpotifyAuth();
  const [selectedTab, setSelectedTab] = React.useState('playlists');
  const [playlists, setPlaylists] = React.useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);
  const [playlistError, setPlaylistError] = React.useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = React.useState<any | null>(null);
  const [loadingSelectedPlaylist, setLoadingSelectedPlaylist] = React.useState(false);
  const [selectedPlaylistError, setSelectedPlaylistError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchPlaylists = async () => {
      if (selectedTab === 'playlists' && tokens?.access_token) {
        setLoadingPlaylists(true);
        setPlaylistError(null);
        try {
          const data = await spotifyApi.getUserPlaylists(tokens.access_token, 20, 0);
          //console.log('Playlists Response:', data);
          setPlaylists(data.items || []);
        } catch (err: any) {
          setPlaylistError(err.message || 'Failed to fetch playlists');
        } finally {
          setLoadingPlaylists(false);
        }
      }
    };
    const fetchArtists = async () => {
      if (selectedTab === 'artists' && tokens?.access_token) {
        setLoadingArtists(true);
        setArtistsError(null);
        try {
          const data = await spotifyApi.getUserTopArtists(tokens.access_token, 'medium_term', 20);
          setArtists(data.items || []);
        } catch (err: any) {
          setArtistsError(err.message || 'Failed to fetch artists');
        } finally {
          setLoadingArtists(false);
        }
      }
    };
    const fetchTracks = async () => {
      if (selectedTab === 'tracks' && tokens?.access_token) {
        setLoadingTracks(true);
        setTracksError(null);
        try {
          const data = await spotifyApi.getUserTopTracks(tokens.access_token, 'medium_term', 20);
          setTracks(data.items || []);
        } catch (err: any) {
          setTracksError(err.message || 'Failed to fetch tracks');
        } finally {
          setLoadingTracks(false);
        }
      }
    };
    fetchPlaylists();
    fetchArtists();
    fetchTracks();
  }, [selectedTab, tokens]);
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  // For border and tab colors, use Colors constants for both modes
  // Only shift icon/text color on selection, no borders or background
  // Use dark text color for selected tab (black in light mode, off-white in dark mode)
  const tabActiveText = backgroundColor === Colors.light.background ? Colors.light.text : Colors.dark.text;

  const libraryTabs = [
    { id: 'playlists', name: 'Playlists', icon: 'list' as const },
    { id: 'artists', name: 'Artists', icon: 'mic' as const },
    { id: 'tracks', name: 'Favorites', icon: 'musical-notes' as const },
    { id: 'recently-played', name: 'Recents', icon: 'time' as const },
  ];

  // Dummy content for each tab
  const tabContent: Record<string, React.ReactNode> = {
    playlists: (
      <View style={{ width: '100%', alignItems: 'center', marginTop: 50, minHeight: 600 }}>
        {selectedPlaylist ? (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: backgroundColor + 'ee', zIndex: 10, justifyContent: 'flex-start', alignItems: 'center', padding: 0, width: '100%' }}>
            {loadingSelectedPlaylist ? (
              <ThemedText style={{ color: textColor, fontSize: 18 }}>Loading playlist...</ThemedText>
            ) : selectedPlaylistError ? (
              <ThemedText style={{ color: 'red', fontSize: 16 }}>{selectedPlaylistError}</ThemedText>
            ) : (
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                {/* Playlist cover */}
                {selectedPlaylist.images && selectedPlaylist.images[0]?.url ? (
                  <Image source={{ uri: selectedPlaylist.images[0].url }} style={{ width: 100, height: 100, borderRadius: 12, marginRight: 18 }} resizeMode="cover" />
                ) : (
                  <Ionicons name="musical-notes" size={64} color={iconColor} style={{ marginRight: 18 }} />
                )}
                {/* Playlist info */}
                <View style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <ThemedText
                    style={{ color: textColor, fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {selectedPlaylist.name}
                  </ThemedText>
                  <ThemedText style={{ color: iconColor, fontSize: 16, marginBottom: 6 }}>{selectedPlaylist.owner?.display_name || 'Spotify User'}</ThemedText>
                  <ThemedText style={{ color: iconColor, fontSize: 14 }}>Tracks: {selectedPlaylist.tracks?.total || 0}</ThemedText>
                </View>
                <TouchableOpacity onPress={() => setSelectedPlaylist(null)} style={{ marginLeft: 12, alignSelf: 'flex-start' }}>
                  <Ionicons name="close" size={28} color={iconColor} />
                </TouchableOpacity>
              </View>
            )}
            {/* Playlist tracks list */}
            <ScrollView style={{ alignSelf: 'stretch', width: '100%', maxHeight: 450, paddingHorizontal: 0 }} contentContainerStyle={{ paddingBottom: 24 }}>
              {selectedPlaylist.tracks.items.map((item: any, idx: number) => (
                <TouchableOpacity
                  key={item.track?.id || idx}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 }}
                  onPress={async () => {
                    if (!tokens?.access_token || !item.track?.uri) return;
                    try {
                      await remoteApi.remoteStartPlayback(tokens.access_token, item.track.uri);
                      // Optionally show feedback to user here
                    } catch (err) {
                      // Optionally handle error here
                      console.error('Playback error:', err);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  {item.track?.album?.images && item.track.album.images[0]?.url ? (
                    <Image source={{ uri: item.track.album.images[0].url }} style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: '#eee', marginRight: 10 }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="musical-notes" size={24} color={iconColor} style={{ marginRight: 10 }} />
                  )}
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ color: textColor, fontSize: 15, fontWeight: '600' }}>{item.track?.name}</ThemedText>
                    <ThemedText style={{ color: iconColor, fontSize: 13 }}>{item.track?.artists?.map((a: any) => a.name).join(', ') || 'Artist'}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : loadingPlaylists ? (
          <ThemedText style={{ color: textColor, fontSize: 16 }}>Loading playlists...</ThemedText>
        ) : playlistError ? (
          <ThemedText style={{ color: 'red', fontSize: 16 }}>{playlistError}</ThemedText>
        ) : playlists.length === 0 ? (
          <ThemedText style={{ color: textColor, fontSize: 16 }}>No playlists found.</ThemedText>
        ) : (
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 24 }}>
            {playlists.map((pl) => (
              <TouchableOpacity
                key={pl.id}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}
                onPress={async () => {
                  if (!tokens?.access_token) return;
                  setLoadingSelectedPlaylist(true);
                  setSelectedPlaylistError(null);
                  try {
                    const playlistData = await spotifyApi.getPlaylist(tokens.access_token, pl.id);
                    //console.log('Playlist Data: ', playlistData)
                    setSelectedPlaylist(playlistData);
                  } catch (err: any) {
                    setSelectedPlaylistError(err.message || 'Failed to fetch playlist');
                  } finally {
                    setLoadingSelectedPlaylist(false);
                  }
                }}
                activeOpacity={0.85}
              >
                {pl.images && pl.images[0]?.url ? (
                  <View style={{ marginRight: 14 }}>
                    <Image
                      source={{ uri: pl.images[0].url }}
                      style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#eee' }}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <Ionicons name="musical-notes" size={32} color={iconColor} style={{ marginRight: 14 }} />
                )}
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ color: textColor, fontSize: 16, fontWeight: '600' }}>{pl.name}</ThemedText>
                  <ThemedText style={{ color: iconColor, fontSize: 13 }}>{pl.owner?.display_name || 'Spotify User'}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={iconColor} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    ),
    artists: (
      <View style={{ width: '100%', alignItems: 'center', marginTop: 50, minHeight: 600 }}>
        {loadingArtists ? (
          <ThemedText style={{ color: textColor, fontSize: 16 }}>Loading artists...</ThemedText>
        ) : artistsError ? (
          <ThemedText style={{ color: 'red', fontSize: 16 }}>{artistsError}</ThemedText>
        ) : artists.length === 0 ? (
          <ThemedText style={{ color: textColor, fontSize: 16 }}>No top artists found.</ThemedText>
        ) : (
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 24 }}>
            {artists.map((artist) => (
              <View key={artist.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}>
                {artist.images && artist.images[0]?.url ? (
                  <View style={{ marginRight: 14 }}>
                    <Image
                      source={{ uri: artist.images[0].url }}
                      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' }}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <Ionicons name="person" size={32} color={iconColor} style={{ marginRight: 14 }} />
                )}
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ color: textColor, fontSize: 16, fontWeight: '600' }}>{artist.name}</ThemedText>
                  <ThemedText style={{ color: iconColor, fontSize: 13 }}>{artist.genres?.join(', ') || 'Artist'}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={iconColor} />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    ),
    tracks: (
      <View style={{ width: '100%', alignItems: 'center', marginTop: 50, minHeight: 600 }}>
        {loadingTracks ? (
          <ThemedText style={{ color: textColor, fontSize: 16 }}>Loading tracks...</ThemedText>
        ) : tracksError ? (
          <ThemedText style={{ color: 'red', fontSize: 16 }}>{tracksError}</ThemedText>
        ) : tracks.length === 0 ? (
          <ThemedText style={{ color: textColor, fontSize: 16 }}>No top tracks found.</ThemedText>
        ) : (
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 24 }}>
            {tracks.map((track) => (
              <TouchableOpacity
                key={track.id}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}
                onPress={async () => {
                  if (!tokens?.access_token || !track.uri) return;
                  try {
                    await remoteApi.remoteStartPlayback(tokens.access_token, track.uri);
                    // Optionally show feedback to user here
                  } catch (err) {
                    // Optionally handle error here
                    console.error('Playback error:', err);
                  }
                }}
                activeOpacity={0.85}
              >
                {track.album?.images && track.album.images[0]?.url ? (
                  <View style={{ marginRight: 14 }}>
                    <Image
                      source={{ uri: track.album.images[0].url }}
                      style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#eee' }}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <Ionicons name="musical-notes" size={32} color={iconColor} style={{ marginRight: 14 }} />
                )}
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ color: textColor, fontSize: 16, fontWeight: '600' }}>{track.name}</ThemedText>
                  <ThemedText style={{ color: iconColor, fontSize: 13 }}>{track.artists?.map((a: any) => a.name).join(', ') || 'Track'}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    ),
    'recently-played': <ThemedText style={{ color: textColor, fontSize: 18, marginTop: 40 }}>Your listening history will appear here.</ThemedText>,
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.title, { color: textColor }]}> 
          Library
        </ThemedText>
      </View>

      <View style={styles.tabContentContainer}>
        {tabContent[selectedTab]}
      </View>

      <View style={[styles.footerTabs, { backgroundColor }]}> 
        {libraryTabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => setSelectedTab(tab.id)}
            activeOpacity={0.8}
          >
            <Ionicons name={tab.icon} size={24} color={selectedTab === tab.id ? tabActiveText : iconColor} />
            <ThemedText style={[styles.tabLabel, { color: selectedTab === tab.id ? tabActiveText : iconColor }]}> 
              {tab.name}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  tabContentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  footerTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    // backgroundColor will be set inline
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
    flexDirection: 'column',
  },
  tabLabel: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
});