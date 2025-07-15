import { SPOTIFY_CONFIG } from '@/constants/Spotify';
import { SpotifyTokens } from '@/types/Spotify';

class SpotifyApiService {
  private baseUrl = SPOTIFY_CONFIG.ENDPOINTS.API_BASE;

  async makeRequest(endpoint: string, accessToken: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify API request failed: ${response.status}`);
    }

    return response.json();
  }

  async getCurrentUser(accessToken: string) {
    return this.makeRequest('/me', accessToken);
  }

  async getUserPlaylists(accessToken: string, limit = 20, offset = 0) {
    return this.makeRequest(`/me/playlists?limit=${limit}&offset=${offset}`, accessToken);
  }

  async getUserTopTracks(accessToken: string, timeRange = 'medium_term', limit = 20) {
    return this.makeRequest(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`, accessToken);
  }

  async getUserTopArtists(accessToken: string, timeRange = 'medium_term', limit = 20) {
    return this.makeRequest(`/me/top/artists?time_range=${timeRange}&limit=${limit}`, accessToken);
  }

  async getPlaybackState(accessToken: string) {
    return this.makeRequest('/me/player', accessToken);
  }
}

export const spotifyApi = new SpotifyApiService();