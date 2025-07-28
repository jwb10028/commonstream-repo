import { SPOTIFY_CONFIG } from '@/constants/Spotify';
import { SpotifyTokens } from '@/types/Spotify';



class RemoteApiService {
  /**
   * Gets the current Spotify playback state for the user
   * @param accessToken Spotify OAuth access token
   */
  async getPlaybackState(accessToken: string): Promise<any> {
    if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length < 10) {
      throw new Error('A valid Spotify access token is required');
    }
    const response = await fetch(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me/player`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to get playback state: ${response.status} ${errorData}`);
    }
    return response.json();
  }
}

export const remoteApi = new RemoteApiService();