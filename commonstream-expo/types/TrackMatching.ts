import { SuggestedTrack } from '@/types/Groq';

// Spotify API Response Types
export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  uri: string;
  images: {
    url: string;
    height: number;
    width: number;
  }[];
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  popularity: number;
  preview_url: string | null;
  explicit: boolean;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifySearchResponse {
  tracks: {
    href: string;
    items: SpotifyTrack[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
}

// Track Matching Types
export interface TrackMatch {
  suggested: SuggestedTrack;
  spotifyTrack: SpotifyTrack | null;
  confidence: number; // 0-100 score
  status: 'found' | 'not_found' | 'multiple_matches' | 'low_confidence';
  alternatives?: SpotifyTrack[];
  searchQuery: string;
  reasoning?: string;
}

export interface TrackMatchingRequest {
  suggestedTracks: SuggestedTrack[];
  accessToken: string;
  options?: {
    maxResults?: number;
    minConfidence?: number;
    includeAlternatives?: boolean;
  };
}

export interface TrackMatchingResponse {
  success: boolean;
  matches: TrackMatch[];
  summary: {
    total: number;
    found: number;
    notFound: number;
    lowConfidence: number;
  };
  error?: string;
  errorCode?: string;
}

// Matching Configuration
export interface MatchingOptions {
  maxResults: number;
  minConfidence: number;
  includeAlternatives: boolean;
  fuzzySearch: boolean;
  timeout: number;
}

export const DEFAULT_MATCHING_OPTIONS: MatchingOptions = {
  maxResults: 5,
  minConfidence: 70,
  includeAlternatives: true,
  fuzzySearch: true,
  timeout: 10000, // 10 seconds
};

// Search Strategy Types
export type SearchStrategy = 'exact' | 'fuzzy' | 'partial' | 'artist_only' | 'title_only';

export interface SearchAttempt {
  strategy: SearchStrategy;
  query: string;
  results: SpotifyTrack[];
  confidence: number;
}

// Error Types
export class TrackMatchingError extends Error {
  constructor(
    message: string,
    public code?: string,
    public trackIndex?: number
  ) {
    super(message);
    this.name = 'TrackMatchingError';
  }
}

// Utility Types
export interface MatchingMetrics {
  averageConfidence: number;
  matchRate: number;
  totalProcessingTime: number;
  apiCallsUsed: number;
}

export interface MatchingStats {
  byConfidence: {
    high: number; // 80-100
    medium: number; // 60-79
    low: number; // 40-59
    veryLow: number; // 0-39
  };
  byStatus: {
    found: number;
    notFound: number;
    multipleMatches: number;
    lowConfidence: number;
  };
}