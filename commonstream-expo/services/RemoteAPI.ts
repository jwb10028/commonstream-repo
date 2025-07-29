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

  // play/pause current device - PUT
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

  // start playback - PUT
  async remoteStartPlayback(accessToken: string, uri: string, deviceId?: string): Promise<boolean> {
    const isTrack = uri.startsWith('spotify:track:');
    const body: any = isTrack
      ? { uris: [uri] }
      : { context_uri: uri };
  
    if (deviceId) {
      body.device_id = deviceId;
    }
  
    const response = await fetch(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me/player/play`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to start playback: ${response.status} ${errorData}`);
    }
    return true;
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

  // manage devices - GET
  async getAvailableDevices(accessToken: string): Promise<any> {
    if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length < 10) {
      throw new Error('A valid Spotify access token is required');
    }
    const response = await fetch(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me/player/devices`, {
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

  // playback transfer - PUT
  async remoteDeviceTransfer(accessToken: string, deviceId: string, play?: boolean): Promise<any> {
    if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length < 10) {
      throw new Error('A valid Spotify access token is required');
    }
    if (!deviceId || typeof deviceId !== 'string') {
      throw new Error('A valid device ID is required');
    }
    const body: any = {
      device_ids: [deviceId],
    };
    if (typeof play === 'boolean') {
      body.play = play;
    }
    const response = await fetch(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me/player`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to transfer playback: ${response.status} ${errorData}`);
    }
    // Spotify returns empty response on success
    return true;
  }

  // set repeat mode
  async remoteRepeatMode(accessToken: string, state: string, deviceId?: string): Promise<boolean> {
    const url = new URL(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me/player/repeat`);
    url.searchParams.append("state", state);
    if (deviceId) {
      url.searchParams.append("device_id", deviceId);
    }
  
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to set repeat mode: ${response.status} ${errorData}`);
    }
  
    // Spotify returns empty response on success
    return true;
  }

  // set shuffle
  async remoteShuffle(accessToken: string, state: boolean, deviceId?: string): Promise<boolean> {
    const url = new URL(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me/player/shuffle`);
    url.searchParams.append("state", state ? "true" : "false");
    if (deviceId) {
      url.searchParams.append("device_id", deviceId);
    }
  
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to set shuffle: ${response.status} ${errorData}`);
    }
  
    // Spotify returns empty response on success
    return true;
  }

  // seek item position
  async remoteSeek(accessToken: string, position_ms: number, deviceId?: string): Promise<boolean> {
    const url = new URL(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me/player/seek`);
    url.searchParams.append("position_ms", position_ms.toString());
    if (deviceId) {
      url.searchParams.append("device_id", deviceId);
    }
  
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to seek position: ${response.status} ${errorData}`);
    }
  
    // Spotify returns empty response on success
    return true;
  }
}

export const remoteApi = new RemoteApiService();