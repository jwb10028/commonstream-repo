export const SPOTIFY_CONFIG = {
  CLIENT_ID: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '',
  SCOPES: [
    'user-read-private',
    'user-read-email',
    'user-library-read',
    'user-top-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'streaming'
  ].join(' '),
  ENDPOINTS: {
    AUTH: 'https://accounts.spotify.com/authorize',
    TOKEN: 'https://accounts.spotify.com/api/token',
    API_BASE: 'https://api.spotify.com/v1'
  }
};