import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import HomeModal from './(widgets)/modals/home_modal';
import { QueryModal } from './(widgets)/modals/query_modal';
import Glow from './(widgets)/ui/glow';
import Transport from './(widgets)/ui/home-transport';
import KeyboardToolbar from './(widgets)/ui/keyboard-toolbar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { GroqService } from '@/services/GroqAPI';
import { GeneratedPlaylist } from '@/types/Groq';
import { TrackMatchingService } from '@/services/TrackMatchingAPI';
import { TrackMatchingResponse } from '@/types/TrackMatching';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';

export default function HomeScreen() {
  const [queryText, setQueryText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Query Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [playlist, setPlaylist] = useState<GeneratedPlaylist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track Matching States
  const [trackMatches, setTrackMatches] = useState<TrackMatchingResponse | null>(null);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  
  // Spotify Auth
  const { tokens, isAuthenticated, user, isLoading, error: authError } = useSpotifyAuth();
  
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'tabIconDefault');
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', 
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const handleVoiceActivation = () => {
    console.log('Voice activation button pressed');
  };

  const handleLoopbackListening = () => {
    console.log('Loopback listening button pressed');
  };

  const handleAddMedia = () => {
    console.log('Add media button pressed');
  };

  const handleQuerySubmit = async () => {
    if (!queryText.trim()) {
      Alert.alert('Error', 'Please enter a playlist request');
      return;
    }

    // Store the query for display in modal
    const currentQuery = queryText.trim();
    
    // Clear input and dismiss keyboard immediately for better UX
    setQueryText('');
    Keyboard.dismiss();
    
    // Reset modal state and show it
    setLoading(true);
    setMatchingInProgress(false);
    setError(null);
    setPlaylist(null);
    setTrackMatches(null);
    setModalVisible(true);

    try {
      console.log('🎵 Starting playlist generation with query:', currentQuery);
      
      // Step 1: Generate playlist with Groq
      const response = await GroqService.generatePlaylist({
        prompt: currentQuery,
        preferences: {
          maxTracks: 30,
          explicit: true,
          energy: 'medium'
        }
      });

      if (response.success && response.data) {
        console.log('✅ Groq playlist generated successfully:', response.data.name);
        setPlaylist(response.data);
        setLoading(false);

        // Step 2: Start track matching with Spotify
        if (tokens?.access_token) {
          setMatchingInProgress(true);
          console.log('🔍 Starting track matching on Spotify...');

          try {
            const matchingResponse = await TrackMatchingService.matchTracks({
              suggestedTracks: response.data.tracks,
              accessToken: tokens.access_token,
              options: {
                maxResults: 5,
                minConfidence: 60,
                includeAlternatives: true,
              }
            });

            if (matchingResponse.success) {
              console.log('✅ Track matching completed:', matchingResponse.summary);
              setTrackMatches(matchingResponse);
            } else {
              console.warn('⚠️ Track matching failed:', matchingResponse.error);
              // Still show the playlist, just without matches
              setError(`Playlist generated, but track matching failed: ${matchingResponse.error}`);
            }
          } catch (matchingErr: unknown) {
            console.error('❌ Track matching error:', matchingErr);
            setError('Playlist generated, but failed to find tracks on Spotify');
          }
        } else {
          console.warn('⚠️ No Spotify access token available for track matching');
          setError('Playlist generated, but please login to Spotify to find actual tracks');
        }
      } else {
        setError(response.error || 'Failed to generate playlist');
        console.error('❌ Playlist generation failed:', response.error);
      }
    } catch (err: unknown) {
      const errorMessage = 'Failed to generate playlist. Please try again.';
      setError(errorMessage);
      console.error('❌ Playlist generation error:', err);
    } finally {
      setLoading(false);
      setMatchingInProgress(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setPlaylist(null);
    setTrackMatches(null);
    setError(null);
    setMatchingInProgress(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.mainContent, { backgroundColor: '#fff' }]}>
        <Glow />
        <View style={styles.content}>
          {/* Audio Transport Controls */}
          <View style={styles.transportWrapper}>
            <Transport />
          </View>
          
          {/* LLM-style Query Box */}
          <View style={[styles.queryContainer, { borderColor, backgroundColor }]}>
            <TextInput
              style={[styles.queryInput, { color: borderColor }]}
              placeholder="Ask me anything..."
              placeholderTextColor={placeholderColor}
              value={queryText}
              onChangeText={setQueryText}
              onSubmitEditing={handleQuerySubmit}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleQuerySubmit}
            >
              <Ionicons name="paper-plane" size={20} color={borderColor} />
            </TouchableOpacity>
          </View>
          
          {/* Circular Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.circularButton, { backgroundColor: backgroundColor }]}
              onPress={handleVoiceActivation}
            >
              <Ionicons name="mic" size={24} color={borderColor} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.circularButton, { backgroundColor: backgroundColor }]}
              onPress={handleLoopbackListening}
            >
              <Ionicons name="repeat" size={24} color={borderColor} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.circularButton, { backgroundColor: backgroundColor }]}
              onPress={handleAddMedia}
            >
              <Ionicons name="add-circle" size={24} color={borderColor} />
            </TouchableOpacity>
          </View>
        </View>
        
        <HomeModal 
          visible={true} 
          onClose={() => {}} 
        />
        
        <QueryModal
          visible={modalVisible}
          onClose={handleCloseModal}
          playlist={playlist}
          loading={loading}
          error={error || undefined}
          query={queryText}
          trackMatches={trackMatches}
          matchingInProgress={matchingInProgress}
        />
      </View>
      
      {/* Keyboard Toolbar - positioned to slide up with keyboard */}
      <KeyboardToolbar 
        visible={isKeyboardVisible}
        onDone={() => setQueryText('')}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 330, // Increased from 300 to make query box 10% wider
    width: '100%',
    zIndex: 1, // Ensure content appears above the glow
  },
  welcomeText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 30,
  },
  transportWrapper: {
    marginTop: -120, // Increased from -80 to move further up towards top border
    width: '100%', // Ensure full width to match query box
  },
  queryContainer: {
    width: '100%',
    marginTop: 60, // Add top margin to push query box down
    marginBottom: 20,
    borderRadius: 12,
    padding: 15,
    minHeight: 64, // Reduced from 80 to make it 20% shorter
    flexDirection: 'row',
    alignItems: 'flex-end',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8, // For Android shadow
  },
  queryInput: {
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 40, // Reduced from 50 to match the shorter container
    flex: 1,
    marginRight: 10,
  },
  submitButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  circularButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
