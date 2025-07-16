import {
  PlaylistCreationRequest,
  PlaylistCreationResult,
  PlaylistCreationOptions,
  SpotifyPlaylistRequest,
  SpotifyPlaylistResponse,
  AddTracksRequest,
  AddTracksResponse,
  PlaylistCreationError,
  PLAYLIST_CREATION_CONFIG,
} from '@/types/PlaylistCreation';
import { SPOTIFY_CONFIG } from '@/constants/Spotify';
import { TrackMatchingResponse, TrackMatch } from '@/types/TrackMatching';

export class PlaylistCreationService {
  /**
   * Creates a Spotify playlist from AI-generated suggestions and track matches
   */
  public static async createPlaylist(
    request: PlaylistCreationRequest
  ): Promise<PlaylistCreationResult> {
    try {
      console.log('🎵 Starting playlist creation process...');
      
      const { playlist, trackMatches, accessToken, options } = request;
      const config = { ...PLAYLIST_CREATION_CONFIG.DEFAULT_OPTIONS, ...options };

      // Validate inputs
      this.validateRequest(request);

      // Filter tracks based on confidence and options
      const tracksToAdd = this.filterTracks(trackMatches, config);
      
      if (tracksToAdd.length === 0) {
        throw new PlaylistCreationError(
          'No tracks meet the confidence criteria',
          PLAYLIST_CREATION_CONFIG.ERROR_CODES.NO_TRACKS_TO_ADD
        );
      }

      console.log(`🎯 Creating playlist with ${tracksToAdd.length} tracks...`);

      // Step 1: Create empty playlist
      const spotifyPlaylist = await this.createEmptyPlaylist(
        playlist,
        accessToken,
        config
      );

      console.log(`✅ Created playlist: ${spotifyPlaylist.name} (${spotifyPlaylist.id})`);

      // Step 2: Add tracks to playlist
      const additionResult = await this.addTracksToPlaylist(
        spotifyPlaylist.id,
        tracksToAdd,
        accessToken
      );

      // Step 3: Compile results
      const result = this.compileResults(
        spotifyPlaylist,
        additionResult,
        trackMatches,
        tracksToAdd
      );

      console.log(`🎉 Playlist creation completed! Added ${result.summary.tracksAdded} tracks`);
      return result;

    } catch (error: unknown) {
      console.error('❌ Playlist creation failed:', error);
      
      if (error instanceof PlaylistCreationError) {
        return {
          success: false,
          addedTracks: [],
          skippedTracks: [],
          summary: {
            totalSuggested: request.trackMatches.summary.total,
            tracksAdded: 0,
            tracksSkipped: request.trackMatches.summary.total,
            averageConfidence: 0,
          },
          error: error.message,
          errorCode: error.code,
        };
      }

      return {
        success: false,
        addedTracks: [],
        skippedTracks: [],
        summary: {
          totalSuggested: request.trackMatches.summary.total,
          tracksAdded: 0,
          tracksSkipped: request.trackMatches.summary.total,
          averageConfidence: 0,
        },
        error: 'An unexpected error occurred during playlist creation',
        errorCode: 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * Validates the playlist creation request
   */
  private static validateRequest(request: PlaylistCreationRequest): void {
    if (!request.accessToken) {
      throw new PlaylistCreationError(
        'Spotify access token is required',
        PLAYLIST_CREATION_CONFIG.ERROR_CODES.INVALID_ACCESS_TOKEN
      );
    }

    // Validate access token format
    const token = request.accessToken.trim();
    if (token.length < 10 || token === 'undefined' || token === 'null') {
      throw new PlaylistCreationError(
        'Invalid Spotify access token format',
        PLAYLIST_CREATION_CONFIG.ERROR_CODES.INVALID_ACCESS_TOKEN
      );
    }

    if (!request.playlist?.name) {
      throw new PlaylistCreationError(
        'Playlist name is required',
        PLAYLIST_CREATION_CONFIG.ERROR_CODES.PLAYLIST_CREATION_FAILED
      );
    }

    // Validate playlist name
    const playlistName = request.playlist.name.trim();
    if (playlistName.length === 0) {
      throw new PlaylistCreationError(
        'Playlist name cannot be empty',
        PLAYLIST_CREATION_CONFIG.ERROR_CODES.PLAYLIST_CREATION_FAILED
      );
    }

    if (!request.trackMatches?.matches?.length) {
      throw new PlaylistCreationError(
        'No track matches provided',
        PLAYLIST_CREATION_CONFIG.ERROR_CODES.NO_TRACKS_TO_ADD
      );
    }

    console.log('✅ Request validation passed');
    console.log(`📊 Token: ${token.substring(0, 10)}...`);
    console.log(`📋 Playlist: "${playlistName}"`);
    console.log(`🎵 Tracks: ${request.trackMatches.matches.length} matches`);
  }

  /**
   * Filters tracks based on confidence scores and options
   */
  private static filterTracks(trackMatches: TrackMatchingResponse, config: PlaylistCreationOptions) {
    return trackMatches.matches
      .filter((match: TrackMatch) => {
        // Must have a Spotify track
        if (!match.spotifyTrack) return false;
        
        // Check confidence threshold
        if (config.onlyHighConfidence && match.confidence < (config.minConfidenceScore || 70)) {
          return false;
        }
        
        // Check minimum confidence
        if (match.confidence < (config.minConfidenceScore || 0)) {
          return false;
        }

        return true;
      })
      .slice(0, config.maxTracks || 50) // Limit number of tracks
      .map((match: TrackMatch) => ({
        spotifyTrack: match.spotifyTrack!,
        confidence: match.confidence,
        originalSuggestion: `${match.suggested.artist} - ${match.suggested.title}`,
      }));
  }

  /**
   * Gets the current user's Spotify profile
   */
  private static async getCurrentUser(accessToken: string): Promise<{ id: string }> {
    console.log('👤 Fetching current user profile...');
    
    const response = await fetch(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Failed to get user profile:', errorData);
      throw new PlaylistCreationError(
        `Failed to get user profile: ${response.status}`,
        PLAYLIST_CREATION_CONFIG.ERROR_CODES.PLAYLIST_CREATION_FAILED,
        response.status
      );
    }

    const userData = await response.json();
    console.log('✅ Got user profile:', userData.id);
    return userData;
  }

  /**
   * Creates an empty playlist on Spotify
   */
  private static async createEmptyPlaylist(
    playlist: any,
    accessToken: string,
    config: PlaylistCreationOptions
  ): Promise<SpotifyPlaylistResponse> {
    // First, get the current user to ensure we have proper access
    const user = await this.getCurrentUser(accessToken);
    
    // Validate and sanitize playlist name
    let playlistName = playlist.name || 'AI Generated Playlist';
    playlistName = playlistName.trim();
    
    // Remove any potentially problematic characters
    playlistName = playlistName.replace(/[^\w\s\-_.,!?()']/g, '');
    
    if (playlistName.length === 0) {
      playlistName = 'AI Generated Playlist';
    }
    playlistName = playlistName.slice(0, 50); // Keep it short

    // Minimal request - only required fields
    const playlistData = {
      name: playlistName,
      public: false
    };

    console.log('📝 Creating playlist with minimal data:', JSON.stringify(playlistData, null, 2));
    console.log('👤 For user:', user.id);

    // Use the /me/playlists endpoint instead of /users/{user_id}/playlists
    const response = await fetch(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playlistData),
    });

    console.log('📊 Playlist creation response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Spotify playlist creation error:', errorData);
      
      // Try to parse the error for more details
      let errorMessage = `Failed to create playlist: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error && errorJson.error.message) {
          errorMessage = `Spotify Error: ${errorJson.error.message}`;
        }
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError);
      }
      
      throw new PlaylistCreationError(
        errorMessage,
        PLAYLIST_CREATION_CONFIG.ERROR_CODES.PLAYLIST_CREATION_FAILED,
        response.status
      );
    }

    const playlistResponse = await response.json();
    console.log('✅ Playlist created successfully:', playlistResponse.name, playlistResponse.id);
    return playlistResponse;
  }

  /**
   * Adds tracks to the created playlist
   */
  private static async addTracksToPlaylist(
    playlistId: string,
    tracks: any[],
    accessToken: string
  ): Promise<{ addedTracks: any[]; skippedTracks: any[] }> {
    const addedTracks: any[] = [];
    const skippedTracks: any[] = [];

    // Spotify allows max 100 tracks per request
    const batchSize = PLAYLIST_CREATION_CONFIG.SPOTIFY_LIMITS.MAX_TRACKS_PER_REQUEST;
    
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      const trackUris = batch.map(track => track.spotifyTrack.uri);

      try {
        const addTracksData: AddTracksRequest = {
          uris: trackUris,
          position: i, // Add to specific position to maintain order
        };

        const response = await fetch(
          `${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/playlists/${playlistId}/tracks`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(addTracksData),
          }
        );

        if (response.ok) {
          addedTracks.push(...batch);
          console.log(`✅ Added batch ${Math.floor(i / batchSize) + 1}: ${batch.length} tracks`);
        } else {
          console.error(`❌ Failed to add batch ${Math.floor(i / batchSize) + 1}:`, response.status);
          skippedTracks.push(...batch.map(track => ({
            originalSuggestion: track.originalSuggestion,
            reason: `API Error: ${response.status}`,
          })));
        }

        // Add small delay between requests to avoid rate limiting
        if (i + batchSize < tracks.length) {
          await this.delay(200);
        }

      } catch (error) {
        console.error(`❌ Error adding batch ${Math.floor(i / batchSize) + 1}:`, error);
        skippedTracks.push(...batch.map(track => ({
          originalSuggestion: track.originalSuggestion,
          reason: 'Network error during track addition',
        })));
      }
    }

    return { addedTracks, skippedTracks };
  }

  /**
   * Compiles the final result object
   */
  private static compileResults(
    spotifyPlaylist: SpotifyPlaylistResponse,
    additionResult: { addedTracks: any[]; skippedTracks: any[] },
    originalMatches: TrackMatchingResponse,
    filteredTracks: any[]
  ): PlaylistCreationResult {
    const { addedTracks, skippedTracks } = additionResult;
    
    // Calculate tracks that were filtered out due to confidence
    const tracksFilteredOut = originalMatches.matches.length - filteredTracks.length;
    const additionalSkippedTracks = Array.from({ length: tracksFilteredOut }, (_, i) => ({
      originalSuggestion: `Track ${i + 1}`,
      reason: 'Did not meet confidence threshold',
    }));

    const allSkippedTracks = [...skippedTracks, ...additionalSkippedTracks];

    // Calculate average confidence
    const averageConfidence = addedTracks.length > 0
      ? addedTracks.reduce((sum, track) => sum + track.confidence, 0) / addedTracks.length
      : 0;

    return {
      success: true,
      spotifyPlaylist,
      addedTracks: addedTracks.map(track => ({
        track: track.spotifyTrack,
        confidence: track.confidence,
        originalSuggestion: track.originalSuggestion,
      })),
      skippedTracks: allSkippedTracks,
      summary: {
        totalSuggested: originalMatches.summary.total,
        tracksAdded: addedTracks.length,
        tracksSkipped: allSkippedTracks.length,
        averageConfidence: Math.round(averageConfidence),
      },
    };
  }

  /**
   * Utility method to add delays between requests
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Quick validation method to check if service can create playlists
   */
  public static async validateAccess(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Access validation failed:', error);
      return false;
    }
  }
}
