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

  // manage devices - GET
  async getAvailableDevices(accessToken: string): Promise<any> {
    // TODO
  }

  async remotePlayback(accessToken: string, isPlaying: boolean, deviceId?: string): Promise<any> {
    const endpoint = isPlaying ? '/me/player/pause' : '/me/player/play';
    const response = await fetch(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_id: deviceId }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to toggle playback: ${errorData}`);
    }

    return response.json();
  }

  // skip to next - POST
  async remoteNext(accessToken: string, deviceId?: string): Promise<any> {
    const response = await fetch(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me/player/next`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_id: deviceId }),
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to skip next: ${response.status} ${errorData}`);
    }
    return response.json();
  }

  // skip to prev - POST
  async remotePrev(accessToken: string, deviceId?: string): Promise<any> {
    const response = await fetch(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me/player/previous`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_id: deviceId }),
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to skip prev: ${response.status} ${errorData}`);
    }
    return response.json();
  }




  // =================================
  // UTILITY FUNCS
  // =================================


}

export const remoteApi = new RemoteApiService();