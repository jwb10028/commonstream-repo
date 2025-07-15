import {
  TrackMatchingRequest,
  TrackMatchingResponse,
  TrackMatch,
  SpotifySearchResponse,
  SpotifyTrack,
  MatchingOptions,
  DEFAULT_MATCHING_OPTIONS,
  SearchStrategy,
  SearchAttempt,
  TrackMatchingError,
  MatchingMetrics
} from '@/types/TrackMatching';
import { SuggestedTrack } from '@/types/Groq';
import { SPOTIFY_CONFIG } from '@/constants/Spotify';

export class TrackMatchingService {
  private static readonly SPOTIFY_SEARCH_URL = `${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/search`;
  private static readonly TRACK_MATCHING_ERRORS = {
    NO_ACCESS_TOKEN: 'Access token is required for track matching',
    SPOTIFY_API_ERROR: 'Spotify API request failed',
    NO_TRACKS_PROVIDED: 'No tracks provided for matching',
    TIMEOUT: 'Track matching request timed out',
    RATE_LIMIT: 'Spotify API rate limit exceeded'
  };

  /**
   * Main method to match AI-generated tracks with Spotify tracks
   */
  public static async matchTracks(request: TrackMatchingRequest): Promise<TrackMatchingResponse> {
    const startTime = Date.now();
    let apiCallsUsed = 0;

    try {
      const { suggestedTracks, accessToken, options = {} } = request;
      
      // Validate input
      if (!accessToken) {
        throw new TrackMatchingError(this.TRACK_MATCHING_ERRORS.NO_ACCESS_TOKEN, 'INVALID_TOKEN');
      }
      
      if (!suggestedTracks || suggestedTracks.length === 0) {
        throw new TrackMatchingError(this.TRACK_MATCHING_ERRORS.NO_TRACKS_PROVIDED, 'NO_TRACKS');
      }

      const matchingOptions: MatchingOptions = { ...DEFAULT_MATCHING_OPTIONS, ...options };
      const matches: TrackMatch[] = [];

      // Process each track
      for (let i = 0; i < suggestedTracks.length; i++) {
        const suggestedTrack = suggestedTracks[i];
        
        try {
          const match = await this.matchSingleTrack(
            suggestedTrack, 
            accessToken, 
            matchingOptions,
            i
          );
          matches.push(match);
          apiCallsUsed++;
          
          // Add small delay to avoid rate limiting
          if (i < suggestedTracks.length - 1) {
            await this.delay(100);
          }
        } catch (error: unknown) {
          console.error(`Failed to match track ${i}:`, error);
          
          // Create a failed match entry
          matches.push({
            suggested: suggestedTrack,
            spotifyTrack: null,
            confidence: 0,
            status: 'not_found',
            searchQuery: this.buildSearchQuery(suggestedTrack, 'exact'),
            reasoning: error instanceof Error ? error.message : 'Unknown error during matching'
          });
        }
      }

      const summary = this.generateSummary(matches);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        matches,
        summary
      };

    } catch (error: unknown) {
      console.error('Track matching failed:', error);
      
      if (error instanceof TrackMatchingError) {
        return {
          success: false,
          matches: [],
          summary: { total: 0, found: 0, notFound: 0, lowConfidence: 0 },
          error: error.message,
          errorCode: error.code
        };
      }

      return {
        success: false,
        matches: [],
        summary: { total: 0, found: 0, notFound: 0, lowConfidence: 0 },
        error: 'An unexpected error occurred during track matching',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Match a single track using multiple search strategies
   */
  private static async matchSingleTrack(
    suggestedTrack: SuggestedTrack,
    accessToken: string,
    options: MatchingOptions,
    trackIndex: number
  ): Promise<TrackMatch> {
    const searchStrategies: SearchStrategy[] = ['exact', 'fuzzy', 'partial', 'artist_only'];
    let bestMatch: TrackMatch | null = null;
    const alternatives: SpotifyTrack[] = [];

    for (const strategy of searchStrategies) {
      try {
        const searchQuery = this.buildSearchQuery(suggestedTrack, strategy);
        const searchResults = await this.searchSpotify(searchQuery, accessToken, options.maxResults);
        
        if (searchResults.length > 0) {
          const match = this.evaluateMatches(
            suggestedTrack,
            searchResults,
            strategy,
            searchQuery,
            options.minConfidence
          );
          
          // Add to alternatives
          alternatives.push(...searchResults.slice(0, 3));
          
          // Update best match if this is better
          if (!bestMatch || match.confidence > bestMatch.confidence) {
            bestMatch = match;
          }
          
          // If we found a high-confidence match, we can stop searching
          if (match.confidence >= 90) {
            break;
          }
        }
      } catch (error: unknown) {
        console.warn(`Search strategy ${strategy} failed for track ${trackIndex}:`, error);
        continue;
      }
    }

    if (!bestMatch) {
      return {
        suggested: suggestedTrack,
        spotifyTrack: null,
        confidence: 0,
        status: 'not_found',
        searchQuery: this.buildSearchQuery(suggestedTrack, 'exact'),
        reasoning: 'No matches found with any search strategy'
      };
    }

    // Add alternatives if requested
    if (options.includeAlternatives) {
      bestMatch.alternatives = this.removeDuplicates(alternatives)
        .filter(track => track.id !== bestMatch?.spotifyTrack?.id)
        .slice(0, 3);
    }

    return bestMatch;
  }

  /**
   * Build search query based on strategy
   */
  private static buildSearchQuery(track: SuggestedTrack, strategy: SearchStrategy): string {
    const { artist, title } = track;
    
    switch (strategy) {
      case 'exact':
        return `track:"${title}" artist:"${artist}"`;
      case 'fuzzy':
        return `${title} ${artist}`;
      case 'partial':
        return `track:${title.split(' ')[0]} artist:${artist.split(' ')[0]}`;
      case 'artist_only':
        return `artist:"${artist}"`;
      case 'title_only':
        return `track:"${title}"`;
      default:
        return `${title} ${artist}`;
    }
  }

  /**
   * Search Spotify API
   */
  private static async searchSpotify(
    query: string,
    accessToken: string,
    limit: number = 10
  ): Promise<SpotifyTrack[]> {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString()
    });

    const response = await fetch(`${this.SPOTIFY_SEARCH_URL}?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new TrackMatchingError(this.TRACK_MATCHING_ERRORS.RATE_LIMIT, 'RATE_LIMIT');
      }
      throw new TrackMatchingError(
        `${this.TRACK_MATCHING_ERRORS.SPOTIFY_API_ERROR}: ${response.status}`,
        'API_ERROR'
      );
    }

    const data: SpotifySearchResponse = await response.json();
    return data.tracks.items;
  }

  /**
   * Evaluate search results and calculate confidence scores
   */
  private static evaluateMatches(
    suggested: SuggestedTrack,
    spotifyTracks: SpotifyTrack[],
    strategy: SearchStrategy,
    searchQuery: string,
    minConfidence: number
  ): TrackMatch {
    let bestTrack: SpotifyTrack | null = null;
    let bestConfidence = 0;

    for (const track of spotifyTracks) {
      const confidence = this.calculateConfidence(suggested, track, strategy);
      
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestTrack = track;
      }
    }

    const status = this.determineMatchStatus(bestConfidence, minConfidence, spotifyTracks.length);

    return {
      suggested,
      spotifyTrack: bestTrack,
      confidence: bestConfidence,
      status,
      searchQuery,
      reasoning: this.generateMatchReasoning(suggested, bestTrack, bestConfidence, strategy)
    };
  }

  /**
   * Calculate confidence score between suggested and Spotify track
   */
  private static calculateConfidence(
    suggested: SuggestedTrack,
    spotify: SpotifyTrack,
    strategy: SearchStrategy
  ): number {
    let confidence = 0;
    
    // Artist name similarity (40% weight)
    const artistSimilarity = this.calculateStringSimilarity(
      suggested.artist.toLowerCase(),
      spotify.artists[0].name.toLowerCase()
    );
    confidence += artistSimilarity * 0.4;
    
    // Track title similarity (50% weight)
    const titleSimilarity = this.calculateStringSimilarity(
      suggested.title.toLowerCase(),
      spotify.name.toLowerCase()
    );
    confidence += titleSimilarity * 0.5;
    
    // Popularity bonus (10% weight)
    const popularityBonus = Math.min(spotify.popularity / 100, 0.1);
    confidence += popularityBonus * 0.1;
    
    // Strategy-specific adjustments
    if (strategy === 'exact' && confidence > 0.8) {
      confidence += 0.1; // Bonus for exact matches
    }
    
    return Math.min(Math.round(confidence * 100), 100);
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return (maxLen - distance) / maxLen;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(0).map(() => Array(str1.length + 1).fill(0));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,      // deletion
          matrix[j][i - 1] + 1,      // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Determine match status based on confidence
   */
  private static determineMatchStatus(
    confidence: number,
    minConfidence: number,
    resultCount: number
  ): TrackMatch['status'] {
    if (confidence === 0) return 'not_found';
    if (confidence < minConfidence) return 'low_confidence';
    if (resultCount > 1 && confidence < 90) return 'multiple_matches';
    return 'found';
  }

  /**
   * Generate human-readable reasoning for the match
   */
  private static generateMatchReasoning(
    suggested: SuggestedTrack,
    spotify: SpotifyTrack | null,
    confidence: number,
    strategy: SearchStrategy
  ): string {
    if (!spotify) {
      return `No matching track found for "${suggested.title}" by ${suggested.artist}`;
    }
    
    if (confidence >= 90) {
      return `High confidence match found using ${strategy} search`;
    } else if (confidence >= 70) {
      return `Good match found, minor differences in artist/title`;
    } else if (confidence >= 50) {
      return `Possible match found, but low confidence due to name differences`;
    } else {
      return `Low confidence match, may not be the intended track`;
    }
  }

  /**
   * Remove duplicate tracks from results
   */
  private static removeDuplicates(tracks: SpotifyTrack[]): SpotifyTrack[] {
    const seen = new Set<string>();
    return tracks.filter(track => {
      if (seen.has(track.id)) return false;
      seen.add(track.id);
      return true;
    });
  }

  /**
   * Generate summary statistics
   */
  private static generateSummary(matches: TrackMatch[]) {
    const total = matches.length;
    const found = matches.filter(m => m.status === 'found').length;
    const notFound = matches.filter(m => m.status === 'not_found').length;
    const lowConfidence = matches.filter(m => m.status === 'low_confidence').length;

    return { total, found, notFound, lowConfidence };
  }

  /**
   * Utility method to add delays between requests
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Quick test method for connectivity
   */
  public static async testConnection(accessToken: string): Promise<boolean> {
    try {
      const testResults = await this.searchSpotify('test', accessToken, 1);
      return true;
    } catch (error: unknown) {
      console.error('Track matching service test failed:', error);
      return false;
    }
  }
}