import React, { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { GeneratedPlaylist, SuggestedTrack } from '@/types/Groq';
import { TrackMatchingResponse } from '@/types/TrackMatching';
import { PlaylistCreationService } from '@/services/PlaylistCreationAPI';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';

interface QueryModalProps {
  visible: boolean;
  onClose: () => void;
  playlist: GeneratedPlaylist | null;
  loading?: boolean;
  error?: string;
  query?: string;
  trackMatches?: TrackMatchingResponse | null;
  matchingInProgress?: boolean;
}

export function QueryModal({ 
  visible, 
  onClose, 
  playlist, 
  loading = false, 
  error,
  query,
  trackMatches,
  matchingInProgress = false 
}: QueryModalProps) {
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const { tokens } = useSpotifyAuth();

  const handleCreatePlaylist = async () => {
    if (!playlist || !trackMatches || !tokens?.access_token) {
      Alert.alert(
        'Cannot Create Playlist',
        'Please ensure you are logged into Spotify and tracks have been matched.'
      );
      return;
    }

    setIsCreatingPlaylist(true);
    
    try {
      console.log('🎵 Creating playlist on Spotify...');
      
      const result = await PlaylistCreationService.createPlaylist({
        playlist,
        trackMatches,
        accessToken: tokens.access_token,
        options: {
          makePublic: false,
          includeDescription: true,
          onlyHighConfidence: false,
          minConfidenceScore: 50,
          maxTracks: 50,
        }
      });

      if (result.success && result.spotifyPlaylist) {
        Alert.alert(
          'Playlist Created! 🎉',
          `"${result.spotifyPlaylist.name}" has been added to your Spotify library with ${result.summary.tracksAdded} tracks.`,
          [
            {
              text: 'Close',
              onPress: onClose,
            },
          ]
        );
      } else {
        Alert.alert(
          'Playlist Creation Failed',
          result.error || 'Something went wrong while creating your playlist.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: unknown) {
      console.error('❌ Playlist creation error:', error);
      Alert.alert(
        'Error',
        'Failed to create playlist. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreatingPlaylist(false);
    }
  };
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ThemedText type="title" style={styles.title}>
                {loading ? 'Generating...' : 'Recommendations'}
              </ThemedText>
              {query && (
                <ThemedText style={styles.queryText}>
                  "{query}"
                </ThemedText>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {(loading || matchingInProgress) && (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingIcon}>
                  <ThemedText style={styles.loadingEmoji}>🎵</ThemedText>
                </View>
                <ThemedText style={styles.loadingText}>
                  {loading 
                    ? "AI is curating your perfect playlist..."
                    : "Finding tracks on Spotify..."
                  }
                </ThemedText>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
                <View style={styles.errorTextContainer}>
                  <ThemedText style={styles.errorTitle}>Oops!</ThemedText>
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                </View>
              </View>
            )}

            {playlist && !loading && (
              <>
                {/* Show matching progress if in progress */}
                {matchingInProgress && (
                  <View style={styles.matchingProgressContainer}>
                    <ThemedText style={styles.matchingProgressText}>
                      🔍 Finding tracks on Spotify...
                    </ThemedText>
                  </View>
                )}

                {/* Playlist Info */}
                <View style={styles.playlistInfo}>
                  <ThemedText type="subtitle" style={styles.playlistName}>
                    {playlist.name}
                  </ThemedText>
                  <ThemedText style={styles.playlistDescription}>
                    {playlist.description}
                  </ThemedText>
                  <View style={styles.trackCount}>
                    <Ionicons name="musical-notes" size={16} color="#666" />
                    <ThemedText style={styles.trackCountText}>
                      {playlist.tracks.length} tracks
                    </ThemedText>
                    {trackMatches && (
                      <>
                        <ThemedText style={styles.trackCountSeparator}>•</ThemedText>
                        <Ionicons name="checkmark-circle" size={16} color="#333" />
                        <ThemedText style={styles.trackCountText}>
                          {trackMatches.summary.found} matched
                        </ThemedText>
                      </>
                    )}
                  </View>
                </View>

                {/* Tracks List */}
                <View style={styles.tracksContainer}>
                  {playlist.tracks.map((track: SuggestedTrack, index: number) => (
                    <View key={index} style={styles.trackItem}>
                      <View style={styles.trackNumber}>
                        <ThemedText style={styles.trackNumberText}>
                          {index + 1}
                        </ThemedText>
                      </View>
                      
                      <View style={styles.trackInfo}>
                        <ThemedText type="defaultSemiBold" style={styles.trackTitle}>
                          {track.title}
                        </ThemedText>
                        <ThemedText style={styles.trackArtist}>
                          by {track.artist}
                        </ThemedText>
                        {track.reasoning && (
                          <View style={styles.reasoningContainer}>
                            <Ionicons name="bulb" size={12} color="#666" />
                            <ThemedText style={styles.trackReasoning}>
                              {track.reasoning}
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      <TouchableOpacity style={styles.trackAction}>
                        <Ionicons name="play-circle" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer Actions */}
          {playlist && !loading && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.actionButton} onPress={onClose}>
                <Ionicons name="close" size={18} color="#666" />
                <ThemedText style={styles.actionButtonText}>Close</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  styles.primaryButton,
                  (isCreatingPlaylist || matchingInProgress || !trackMatches) && styles.disabledButton
                ]}
                onPress={handleCreatePlaylist}
                disabled={isCreatingPlaylist || matchingInProgress || !trackMatches}
              >
                {isCreatingPlaylist ? (
                  <>
                    <Ionicons name="hourglass" size={18} color="white" />
                    <ThemedText style={[styles.actionButtonText, styles.primaryButtonText]}>
                      Creating...
                    </ThemedText>
                  </>
                ) : matchingInProgress ? (
                  <>
                    <Ionicons name="search" size={18} color="white" />
                    <ThemedText style={[styles.actionButtonText, styles.primaryButtonText]}>
                      Finding Tracks...
                    </ThemedText>
                  </>
                ) : !trackMatches ? (
                  <>
                    <Ionicons name="add" size={18} color="white" />
                    <ThemedText style={[styles.actionButtonText, styles.primaryButtonText]}>
                      Waiting...
                    </ThemedText>
                  </>
                ) : (
                  <>
                    <Ionicons name="add" size={18} color="white" />
                    <ThemedText style={[styles.actionButtonText, styles.primaryButtonText]}>
                      Create Playlist
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: height * 0.85,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: 'white',
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    marginBottom: 4,
    color: 'black',
  },
  queryText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  
  // Loading Styles
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'white',
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingEmoji: {
    fontSize: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },

  // Error Styles
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  errorTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  errorTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  errorText: {
    color: '#666',
    lineHeight: 18,
  },

  // Playlist Info Styles
  playlistInfo: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  playlistName: {
    marginBottom: 8,
    color: '#000',
  },
  playlistDescription: {
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  trackCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackCountText: {
    color: '#333',
    fontWeight: '500',
  },
  trackCountSeparator: {
    color: '#999',
    marginHorizontal: 4,
    fontSize: 12,
  },

  // Tracks Styles
  tracksContainer: {
    gap: 12,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  trackNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackNumberText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    marginBottom: 2,
    lineHeight: 18,
    color: '#000',
  },
  trackArtist: {
    color: '#666',
    marginBottom: 6,
    fontSize: 14,
  },
  reasoningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  trackReasoning: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 16,
    flex: 1,
  },
  trackAction: {
    padding: 4,
  },

  // Footer Styles
  footer: {
    flexDirection: 'row',
    padding: 32,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
    minHeight: 100,
    backgroundColor: 'white',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    gap: 6,
    backgroundColor: 'white',
  },
  primaryButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  primaryButtonText: {
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#CCC',
    borderColor: '#CCC',
  },

  // Matching Progress Styles
  matchingProgressContainer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  matchingProgressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});