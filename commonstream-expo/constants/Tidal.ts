
// Tidal Web API constants
export const TIDAL_API_BASE_URL = 'https://api.tidal.com/v1';
export const TIDAL_AUTH_BASE_URL = 'https://auth.tidal.com/v1/oauth2';
export const TIDAL_CLIENT_ID = process.env.EXPO_PUBLIC_TIDAL_CLIENT_ID;
export const TIDAL_CLIENT_SECRET = process.env.EXPO_PUBLIC_TIDAL_CLIENT_SECRET;
export const TIDAL_REDIRECT_URI = process.env.EXPO_PUBLIC_TIDAL_REDIRECT_URI; // Replace with your redirect URI
export const TIDAL_SCOPES = [
  'r_usr', // Read user data
  'w_usr', // Write user data
  'r_stream', // Stream playback
  'w_stream', // Control playback
  'r_playlist', // Read playlists
  'w_playlist', // Write playlists
  'r_subscription', // Read subscription info
];

export const TIDAL_AUTHORIZE_URL = `${TIDAL_AUTH_BASE_URL}/authorize`;
export const TIDAL_TOKEN_URL = `${TIDAL_AUTH_BASE_URL}/token`;
