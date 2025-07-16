import { SpotifyTrack } from '@/types/TrackMatching';
import { GeneratedPlaylist } from '@/types/Groq';
import { TrackMatchingResponse } from '@/types/TrackMatching';

// Spotify Playlist API Types
export interface SpotifyPlaylistRequest {
  name: string;
  description?: string;
  public?: boolean;
  collaborative?: boolean;
}

export interface SpotifyPlaylistResponse {
  id: string;
  name: string;
  description: string | null;
  public: boolean;
  collaborative: boolean;
  external_urls: {
    spotify: string;
  };
  href: string;
  uri: string;
  snapshot_id: string;
  tracks: {
    href: string;
    total: number;
  };
  owner: {
    id: string;
    display_name: string;
  };
}

export interface AddTracksRequest {
  uris: string[];
  position?: number;
}

export interface AddTracksResponse {
  snapshot_id: string;
}

// Playlist Creation Service Types
export interface PlaylistCreationRequest {
  playlist: GeneratedPlaylist;
  trackMatches: TrackMatchingResponse;
  accessToken: string;
  options?: PlaylistCreationOptions;
}

export interface PlaylistCreationOptions {
  makePublic?: boolean;
  includeDescription?: boolean;
  onlyHighConfidence?: boolean;
  minConfidenceScore?: number;
  maxTracks?: number;
}

export interface PlaylistCreationResult {
  success: boolean;
  spotifyPlaylist?: SpotifyPlaylistResponse;
  addedTracks: {
    track: SpotifyTrack;
    confidence: number;
    originalSuggestion: string;
  }[];
  skippedTracks: {
    originalSuggestion: string;
    reason: string;
  }[];
  summary: {
    totalSuggested: number;
    tracksAdded: number;
    tracksSkipped: number;
    averageConfidence: number;
  };
  error?: string;
  errorCode?: string;
}

// Error Types
export class PlaylistCreationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'PlaylistCreationError';
  }
}

// Constants
export const PLAYLIST_CREATION_CONFIG = {
  DEFAULT_OPTIONS: {
    makePublic: false,
    includeDescription: true,
    onlyHighConfidence: false,
    minConfidenceScore: 50,
    maxTracks: 50,
  },
  SPOTIFY_LIMITS: {
    MAX_TRACKS_PER_REQUEST: 100,
    MAX_PLAYLIST_NAME_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 300,
  },
  ERROR_CODES: {
    INVALID_ACCESS_TOKEN: 'INVALID_ACCESS_TOKEN',
    PLAYLIST_CREATION_FAILED: 'PLAYLIST_CREATION_FAILED',
    TRACK_ADDITION_FAILED: 'TRACK_ADDITION_FAILED',
    NO_TRACKS_TO_ADD: 'NO_TRACKS_TO_ADD',
    SPOTIFY_API_ERROR: 'SPOTIFY_API_ERROR',
    RATE_LIMITED: 'RATE_LIMITED',
  },
} as const;
