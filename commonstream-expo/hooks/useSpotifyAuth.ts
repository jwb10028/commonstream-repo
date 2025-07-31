import { useEffect, useState } from 'react';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { SPOTIFY_CONFIG } from '@/constants/Spotify';
import { SpotifyTokens, SpotifyUser } from '@/types/Spotify';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: SPOTIFY_CONFIG.ENDPOINTS.AUTH,
  tokenEndpoint: SPOTIFY_CONFIG.ENDPOINTS.TOKEN,
};

export function useSpotifyAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);

  const redirectUri = process.env.EXPO_PUBLIC_APP_ENV === 'development' ? makeRedirectUri({ scheme: 'exp' })
                                                                        : makeRedirectUri({ scheme: 'exp' });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: SPOTIFY_CONFIG.CLIENT_ID,
      scopes: SPOTIFY_CONFIG.SCOPES.split(' '),
      usePKCE: true, // Enable PKCE for mobile apps
      redirectUri,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      if (request && request.codeVerifier) {
        exchangeCodeForToken(code, request.codeVerifier);
      } else {
        setError('PKCE code verifier not found');
      }
    } else if (response?.type === 'error') {
      setError(response.error?.message || 'Authentication failed');
      setIsLoading(false);
    }
  }, [response, request]);

  const exchangeCodeForToken = async (code: string, codeVerifier: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const params: Record<string, string> = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
        code_verifier: codeVerifier, // PKCE code verifier instead of client secret
      };

      const body = Object.keys(params)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
        .join('&');

      const response = await fetch(SPOTIFY_CONFIG.ENDPOINTS.TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Failed to exchange code for token: ${response.status} - ${responseText}`);
      }

      let tokenData: SpotifyTokens = await response.json();
      // Add timestamp for expiration tracking
      tokenData = { ...tokenData, timestamp: Date.now() };
      // Fetch user data
      await fetchUserData(tokenData.access_token, tokenData);
    } catch (err) {
      console.error('Token exchange error:', err);
      setError(err instanceof Error ? err.message : 'Token exchange failed');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (overrideTokens?: SpotifyTokens) => {
    const currentTokens = overrideTokens || tokens;
    if (!currentTokens?.refresh_token) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        grant_type: 'refresh_token',
        refresh_token: currentTokens.refresh_token,
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
      };
      const body = Object.keys(params)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key as keyof typeof params]))
        .join('&');

      const response = await fetch(SPOTIFY_CONFIG.ENDPOINTS.TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const newTokenData: SpotifyTokens = await response.json();
      const updatedTokens = { ...currentTokens, ...newTokenData, timestamp: Date.now() };
      setTokens(updatedTokens);
      await SecureStore.setItemAsync('spotify_tokens', JSON.stringify(updatedTokens));
    } catch (err) {
      setError('Failed to refresh token');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async (accessToken: string, tokens: SpotifyTokens) => {
    try {
      const response = await fetch(`${SPOTIFY_CONFIG.ENDPOINTS.API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData: SpotifyUser = await response.json();
      setTokens(tokens);
      setUser(userData);
      await SecureStore.setItemAsync('spotify_tokens', JSON.stringify(tokens));
      await SecureStore.setItemAsync('spotify_user', JSON.stringify(userData));
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    }
  };

  const login = async () => {
    setIsLoading(true);
    setError(null);
    promptAsync();
  };

  const logout = async () => {
    setTokens(null);
    setUser(null);
    setError(null);
    await SecureStore.deleteItemAsync('spotify_tokens');
    await SecureStore.deleteItemAsync('spotify_user');
  };

  // Load tokens/user from SecureStore on mount and refresh if needed
  useEffect(() => {
    const loadStored = async () => {
      const storedTokens = await SecureStore.getItemAsync('spotify_tokens');
      const storedUser = await SecureStore.getItemAsync('spotify_user');
      let parsedTokens: SpotifyTokens | null = null;
      if (storedTokens) {
        parsedTokens = JSON.parse(storedTokens);
        setTokens(parsedTokens);
      }
      if (storedUser) setUser(JSON.parse(storedUser));

      // Check if token is expired or about to expire (refresh 1 min before expiry)
      if (parsedTokens && parsedTokens.expires_in && parsedTokens.timestamp) {
        const expiresAt = parsedTokens.timestamp + parsedTokens.expires_in * 1000;
        if (Date.now() > expiresAt - 60000) {
          await refreshToken(parsedTokens);
        }
      }
    };
    loadStored();
  }, []);

  return {
    tokens,
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!tokens && !!user,
  };
}