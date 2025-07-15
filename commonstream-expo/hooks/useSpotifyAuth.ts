import { useEffect, useState } from 'react';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { SPOTIFY_CONFIG } from '@/constants/Spotify';
import { SpotifyTokens, SpotifyUser } from '@/types/Spotify';
import { useAuth } from '@/context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: SPOTIFY_CONFIG.ENDPOINTS.AUTH,
  tokenEndpoint: SPOTIFY_CONFIG.ENDPOINTS.TOKEN,
};

export function useSpotifyAuth() {
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuthData } = useAuth();

  const redirectUri = makeRedirectUri({ scheme: 'exp' });
  console.log('Redirect URI:', redirectUri); // Add this line to see what URI is being generated

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

      console.log('Request body:', body);

      const response = await fetch(SPOTIFY_CONFIG.ENDPOINTS.TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      console.log('Token response status:', response.status);
      const responseText = await response.text();
      console.log('Token response body:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to exchange code for token: ${response.status} - ${responseText}`);
      }

      const tokenData: SpotifyTokens = JSON.parse(responseText);
      setTokens(tokenData);
      
      // Fetch user data
      await fetchUserData(tokenData.access_token, tokenData);
      
    } catch (err) {
      console.error('Token exchange error:', err);
      setError(err instanceof Error ? err.message : 'Token exchange failed');
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
      setUser(userData);
      
      // Update the auth context with both tokens and user data
      await setAuthData(tokens, userData);
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

  const logout = () => {
    setTokens(null);
    setUser(null);
    setError(null);
  };

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