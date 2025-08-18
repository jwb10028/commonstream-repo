import React, { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Linking,            // NEW
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { GeneratedPlaylist, SuggestedTrack } from '@/types/Groq';
import type { FindResult, ReferenceResult } from '@/types/Groq'; // UPDATED
import { TrackMatchingResponse } from '@/types/TrackMatching';
import { PlaylistCreationService } from '@/services/PlaylistCreationAPI';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { useThemeColor } from '@/hooks/useThemeColor';

interface QueryModalProps {
  visible: boolean;
  onClose: () => void;
  playlist: GeneratedPlaylist | null;
  loading?: boolean;
  error?: string;
  query?: string;
  trackMatches?: TrackMatchingResponse | null;
  matchingInProgress?: boolean;

  // FIND mode
  findResults?: FindResult[] | null;

  // REFS mode
  referenceResults?: ReferenceResult[] | null; // NEW
}

export function QueryModal({ 
  visible, 
  onClose, 
  playlist, 
  loading = false, 
  error,
  query,
  trackMatches,
  matchingInProgress = false,
  findResults = null,
  referenceResults = null, // NEW
}: QueryModalProps) {
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({}); // per-result toggle for Find
  const { tokens } = useSpotifyAuth();
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  // Derived flags
  const isFindMode = !!findResults && findResults.length > 0 && !playlist;
  const isRefsMode = !!referenceResults && referenceResults.length > 0 && !playlist && !isFindMode; // prioritize find if both ever set
  const headerTitle = loading
    ? 'Generating...'
    : isFindMode
      ? 'Findings'
      : isRefsMode
        ? 'References'
        : 'Recommendations';

  const loadingEmoji = isFindMode ? '🔎' : isRefsMode ? '🎬' : '🎵';
  const loadingCopy = loading
    ? (isFindMode ? 'AI is finding the best answer…' : (isRefsMode ? 'Gathering references…' : 'AI is curating your perfect playlist...'))
    : 'Finding tracks on Spotify...';

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
          [{ text: 'Close', onPress: onClose }]
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
      Alert.alert('Error', 'Failed to create playlist. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor, borderBottomColor: iconColor + '33' }]}>
            <View style={styles.headerLeft}>
              <ThemedText type="title" style={[styles.title, { color: textColor }]}>
                {headerTitle}
              </ThemedText>
              {query && (
                <ThemedText style={[styles.queryText, { color: iconColor }]}>
                  &ldquo;{query}&rdquo;
                </ThemedText>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={iconColor} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={[styles.content, { backgroundColor }]} showsVerticalScrollIndicator={false}>
            {(loading || matchingInProgress) && (
              <View style={[styles.loadingContainer, { backgroundColor }]}>
                <View style={styles.loadingIcon}>
                  <ThemedText style={styles.loadingEmoji}>{loadingEmoji}</ThemedText>
                </View>
                <ThemedText style={[styles.loadingText, { color: iconColor }]}>{loadingCopy}</ThemedText>
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

            {/* --- REFERENCE MODE RENDER --- */}
            {isRefsMode && !loading && (
              <View style={styles.refsContainer}>
                {referenceResults!.map((ref, idx) => {
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.refsCard,
                        {
                          backgroundColor: backgroundColor === '#fff' ? '#F9F9F9' : '#2A2A2A',
                          borderColor: iconColor + '33',
                        },
                      ]}
                    >
                      {/* Top line: title + credit */}
                      <ThemedText type="subtitle" style={[styles.refsTitle, { color: textColor }]}>
                        {ref.work_title}
                      </ThemedText>
                      {!!ref.work_artist_or_credit && (
                        <ThemedText style={[styles.refsCredit, { color: iconColor }]}>
                          {ref.work_artist_or_credit}
                        </ThemedText>
                      )}

                      {/* Badges row */}
                      <View style={styles.refsBadgeRow}>
                        {!!ref.relation && (
                          <View style={[styles.badge, { borderColor: iconColor + '55' }]}>
                            <Ionicons name="git-branch-outline" size={12} color={iconColor} />
                            <ThemedText style={[styles.badgeText, { color: textColor }]}>
                              {ref.relation}
                            </ThemedText>
                          </View>
                        )}
                        {!!ref.work_type && (
                          <View style={[styles.badgeSecondary, { borderColor: iconColor + '33' }]}>
                            <Ionicons name="pricetag-outline" size={12} color={iconColor} />
                            <ThemedText style={[styles.badgeText, { color: textColor }]}>
                              {ref.work_type}
                            </ThemedText>
                          </View>
                        )}
                        {!!ref.year && (
                          <View style={[styles.badgeSecondary, { borderColor: iconColor + '33' }]}>
                            <Ionicons name="calendar-outline" size={12} color={iconColor} />
                            <ThemedText style={[styles.badgeText, { color: textColor }]}>
                              {ref.year}
                            </ThemedText>
                          </View>
                        )}
                        {!!ref.episode && (
                          <View style={[styles.badgeSecondary, { borderColor: iconColor + '33' }]}>
                            <Ionicons name="tv-outline" size={12} color={iconColor} />
                            <ThemedText style={[styles.badgeText, { color: textColor }]}>
                              {ref.episode}
                            </ThemedText>
                          </View>
                        )}
                        {!!ref.timestamp && (
                          <View style={[styles.badgeSecondary, { borderColor: iconColor + '33' }]}>
                            <Ionicons name="time-outline" size={12} color={iconColor} />
                            <ThemedText style={[styles.badgeText, { color: textColor }]}>
                              {ref.timestamp}
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      {/* Note / reasoning */}
                      {!!ref.note && (
                        <ThemedText style={[styles.refsNote, { color: textColor }]}>
                          {ref.note}
                        </ThemedText>
                      )}
                      {!!ref.reasoning && (
                        <View style={styles.refsReasoningRow}>
                          <Ionicons name="bulb-outline" size={14} color={iconColor} />
                          <ThemedText style={[styles.refsReasoning, { color: iconColor }]}>
                            {ref.reasoning}
                          </ThemedText>
                        </View>
                      )}

                      {/* Evidence */}
                      <View style={styles.refsEvidenceRow}>
                        {!!ref.evidence_source && (
                          <View style={[styles.badgeSecondary, { borderColor: iconColor + '33' }]}>
                            <Ionicons name="newspaper-outline" size={12} color={iconColor} />
                            <ThemedText style={[styles.badgeText, { color: textColor }]}>
                              {ref.evidence_source}
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      {!!ref.evidence_url && (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(ref.evidence_url!)}
                          style={[styles.evidenceButton, { borderColor: tintColor, backgroundColor: backgroundColor }]}
                        >
                          <Ionicons name="open-outline" size={16} color={tintColor} />
                          <ThemedText style={[styles.evidenceButtonText, { color: tintColor }]}>
                            Open source
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* --- FIND MODE RENDER --- */}
            {isFindMode && !loading && (
              <View style={styles.findContainer}>
                {findResults!.map((res, idx) => {
                  const isOpen = !!expanded[idx];
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.findCard,
                        {
                          backgroundColor: backgroundColor === '#fff' ? '#F9F9F9' : '#2A2A2A',
                          borderColor: iconColor + '33',
                        },
                      ]}
                    >
                      <ThemedText type="subtitle" style={[styles.findAnswer, { color: textColor }]}>
                        {res.answer}
                      </ThemedText>

                      {res.reasoning ? (
                        <View style={styles.findReasoningRow}>
                          <Ionicons name="bulb" size={14} color={iconColor} />
                          <ThemedText style={[styles.findReasoning, { color: iconColor }]}>
                            {res.reasoning}
                          </ThemedText>
                        </View>
                      ) : null}

                      <TouchableOpacity
                        onPress={() => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        style={styles.contextToggle}
                      >
                        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={iconColor} />
                        <ThemedText style={[styles.contextToggleText, { color: textColor }]}>
                          {isOpen ? 'Hide context' : 'Show context'}
                        </ThemedText>
                      </TouchableOpacity>

                      {isOpen && (
                        <View style={[styles.findContext, { borderColor: iconColor + '33' }]}>
                          <ThemedText style={[styles.findContextText, { color: iconColor }]}>
                            {res.context}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* --- PLAYLIST MODE RENDER --- */}
            {!isFindMode && !isRefsMode && playlist && !loading && (
              <>
                {matchingInProgress && (
                  <View style={styles.matchingProgressContainer}>
                    <ThemedText style={styles.matchingProgressText}>
                      🔍 Finding tracks on Spotify...
                    </ThemedText>
                  </View>
                )}

                <View style={[styles.playlistInfo, { backgroundColor: backgroundColor === '#fff' ? '#F9F9F9' : '#2A2A2A', borderColor: iconColor + '33' }]}>
                  <ThemedText type="subtitle" style={[styles.playlistName, { color: textColor }]}>
                    {playlist.name}
                  </ThemedText>
                  <ThemedText style={[styles.playlistDescription, { color: iconColor }]}>
                    {playlist.description}
                  </ThemedText>
                  <View style={styles.trackCount}>
                    <Ionicons name="musical-notes" size={16} color={iconColor} />
                    <ThemedText style={styles.trackCountText}>
                      {playlist.tracks.length} tracks
                    </ThemedText>
                    {trackMatches && (
                      <>
                        <ThemedText style={styles.trackCountSeparator}>•</ThemedText>
                        <Ionicons name="checkmark-circle" size={16} color={textColor} />
                        <ThemedText style={styles.trackCountText}>
                          {trackMatches.summary.found} matched
                        </ThemedText>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.tracksContainer}>
                  {playlist.tracks.map((track: SuggestedTrack, index: number) => (
                    <View key={index} style={[styles.trackItem, { backgroundColor, borderColor: iconColor + '33' }]}>
                      <View style={[styles.trackNumber, { backgroundColor, borderColor: iconColor + '33' }]}>
                        <ThemedText style={[styles.trackNumberText, { color: textColor }]}>
                          {index + 1}
                        </ThemedText>
                      </View>
                      
                      <View style={styles.trackInfo}>
                        <ThemedText type="defaultSemiBold" style={[styles.trackTitle, { color: textColor }]}>
                          {track.title}
                        </ThemedText>
                        <ThemedText style={[styles.trackArtist, { color: iconColor }]}>
                          by {track.artist}
                        </ThemedText>
                        {track.reasoning && (
                          <View style={styles.reasoningContainer}>
                            <Ionicons name="bulb" size={12} color={iconColor} />
                            <ThemedText style={styles.trackReasoning}>
                              {track.reasoning}
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      <TouchableOpacity style={styles.trackAction}>
                        <Ionicons name="play-circle" size={24} color={iconColor} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer — REFS MODE */}
          {isRefsMode && !loading && (
            <View style={[styles.footer, { backgroundColor, borderTopColor: iconColor + '33' }]}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor, borderColor: iconColor + '66' }]}
                onPress={onClose}
              >
                <Ionicons name="close" size={18} color={iconColor} />
                <ThemedText style={[styles.actionButtonText, { color: textColor }]}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer — FIND MODE */}
          {isFindMode && !loading && (
            <View style={[styles.footer, { backgroundColor, borderTopColor: iconColor + '33' }]}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor, borderColor: iconColor + '66' }]} onPress={onClose}>
                <Ionicons name="close" size={18} color={iconColor} />
                <ThemedText style={[styles.actionButtonText, { color: textColor }]}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer — PLAYLIST MODE */}
          {!isFindMode && !isRefsMode && playlist && !loading && (
            <View style={[styles.footer, { backgroundColor, borderTopColor: iconColor + '33' }]}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor, borderColor: iconColor + '66' }]} onPress={onClose}>
                <Ionicons name="close" size={18} color={iconColor} />
                <ThemedText style={[styles.actionButtonText, { color: textColor }]}>Close</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  styles.primaryButton,
                  { backgroundColor: textColor, borderColor: textColor },
                  (isCreatingPlaylist || matchingInProgress || !trackMatches) && [styles.disabledButton, { backgroundColor: iconColor, borderColor: iconColor }]
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    marginBottom: 4,
  },
  queryText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Loading Styles
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingEmoji: {
    fontSize: 48,
  },
  loadingText: {
    fontSize: 16,
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
    marginBottom: 4,
  },
  errorText: {
    lineHeight: 18,
  },

  // --- REFS styles ---
  refsContainer: {
    gap: 12,
  },
  refsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  refsTitle: {
    marginBottom: 4,
  },
  refsCredit: {
    fontSize: 13,
    marginBottom: 8,
  },
  refsBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    opacity: 0.9,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  refsNote: {
    marginBottom: 8,
    lineHeight: 18,
  },
  refsReasoningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  refsReasoning: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 16,
    flex: 1,
  },
  refsEvidenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  evidenceButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  evidenceButtonText: {
    fontWeight: '700',
    fontSize: 12,
  },

  // --- FIND styles ---
  findContainer: {
    gap: 12,
  },
  findCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  findAnswer: {
    marginBottom: 8,
  },
  findReasoningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 10,
  },
  findReasoning: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    flex: 1,
  },
  contextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  contextToggleText: {
    fontWeight: '600',
    fontSize: 13,
  },
  findContext: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 6,
  },
  findContextText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Playlist Info Styles
  playlistInfo: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  playlistName: {
    marginBottom: 8,
  },
  playlistDescription: {
    lineHeight: 20,
    marginBottom: 12,
  },
  trackCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackCountText: {
    fontWeight: '500',
  },
  trackCountSeparator: {
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
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
  },
  trackNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackNumberText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    marginBottom: 2,
    lineHeight: 18,
  },
  trackArtist: {
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
    gap: 12,
    minHeight: 100,
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
    gap: 6,
  },
  primaryButton: {
    // dynamic
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButtonText: {
    color: 'white',
  },
  disabledButton: {
    // dynamic
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

export default QueryModal;
