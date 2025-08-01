import { useState, useEffect, useCallback } from 'react';
import { makeRedirectUri, useAuthRequest, CodeChallengeMethod } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import {
  TIDAL_API_BASE_URL,
  TIDAL_CLIENT_ID,
  TIDAL_REDIRECT_URI,
  TIDAL_SCOPES,
  TIDAL_TOKEN_URL,
} from '@/constants/Tidal';
import { TidalTokens, TidalUser } from '@/types/Tidal';

WebBrowser.maybeCompleteAuthSession();

const SECURESTORE_TOKENS_KEY = 'tidal_tokens';
const SECURESTORE_USER_KEY = 'tidal_user';

export function useTidalAuth() {
  const [tokens, setTokens] = useState<TidalTokens | null>(null);
  const [user, setUser] = useState<TidalUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tokens and user from SecureStore on mount
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const storedTokens = await SecureStore.getItemAsync(SECURESTORE_TOKENS_KEY);
        const storedUser = await SecureStore.getItemAsync(SECURESTORE_USER_KEY);
        if (storedTokens) setTokens(JSON.parse(storedTokens));
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (e) {
        setError('Failed to load Tidal auth data');
        console.debug('TidalAuth: Failed to load from SecureStore', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Helper: Save tokens/user to SecureStore
  const saveAuthData = useCallback(async (tokens: TidalTokens, user: TidalUser) => {
    setTokens(tokens);
    setUser(user);
    await SecureStore.setItemAsync(SECURESTORE_TOKENS_KEY, JSON.stringify(tokens));
    await SecureStore.setItemAsync(SECURESTORE_USER_KEY, JSON.stringify(user));
  }, []);


  // AuthSession config for Tidal
  const discovery = {
    authorizationEndpoint: 'https://login.tidal.com/authorize',
    tokenEndpoint: TIDAL_TOKEN_URL,
  };

  const redirectUri = TIDAL_REDIRECT_URI || makeRedirectUri({ scheme: 'exp' });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: TIDAL_CLIENT_ID || '',
      scopes: TIDAL_SCOPES,
      usePKCE: true,
      redirectUri,
      codeChallengeMethod: CodeChallengeMethod.S256,
    },
    discovery
  );

  // Login (OAuth2 PKCE)
  const login = async () => {
    setIsLoading(true);
    setError(null);
    promptAsync();
  };

  // Handle AuthSession response
  useEffect(() => {
    const handleAuthResponse = async () => {
      if (response?.type === 'success') {
        const { code } = response.params;
        if (request && request.codeVerifier) {
          await exchangeCodeForToken(code, request.codeVerifier);
        } else {
          setError('PKCE code verifier not found');
        }
      } else if (response?.type === 'error') {
        setError(response.error?.message || 'Tidal authentication failed');
        setIsLoading(false);
      }
    };
    handleAuthResponse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, request]);

  // Exchange code for token
  const exchangeCodeForToken = async (code: string, codeVerifier: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string> = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: TIDAL_CLIENT_ID || '',
        code_verifier: codeVerifier,
      };
      const body = Object.keys(params)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
        .join('&');
      const tokenRes = await fetch(TIDAL_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!tokenRes.ok) {
        const responseText = await tokenRes.text();
        throw new Error(`Failed to exchange code for token: ${tokenRes.status} - ${responseText}`);
      }
      let tokenData: TidalTokens = await tokenRes.json();
      tokenData = { ...tokenData, timestamp: Date.now() };
      await fetchUserData(tokenData.access_token, tokenData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tidal token exchange failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user info
  const fetchUserData = async (accessToken: string, tokens: TidalTokens) => {
    try {
      const userRes = await fetch(`${TIDAL_API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userRes.ok) {
        throw new Error('Failed to fetch Tidal user data');
      }
      const userData: TidalUser = await userRes.json();
      setTokens(tokens);
      setUser(userData);
      await SecureStore.setItemAsync(SECURESTORE_TOKENS_KEY, JSON.stringify(tokens));
      await SecureStore.setItemAsync(SECURESTORE_USER_KEY, JSON.stringify(userData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Tidal user data');
    }
  };

  // Logout
  const logout = useCallback(async () => {
    setTokens(null);
    setUser(null);
    await SecureStore.deleteItemAsync(SECURESTORE_TOKENS_KEY);
    await SecureStore.deleteItemAsync(SECURESTORE_USER_KEY);
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    if (!tokens?.refresh_token) return;
    setIsLoading(true);
    setError(null);
    try {
      if (!TIDAL_CLIENT_ID) throw new Error('Tidal client ID not set');
      const refreshTokenStr = tokens.refresh_token || '';
      const res = await fetch(TIDAL_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshTokenStr)}&client_id=${encodeURIComponent(TIDAL_CLIENT_ID || '')}`,
      });
      const data = await res.json();
      if (!data.access_token) throw new Error('No access token received');
      const newTokens: TidalTokens = {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token || tokens.refresh_token,
        scope: data.scope,
        timestamp: Date.now(),
      };
      setTokens(newTokens);
      await SecureStore.setItemAsync(SECURESTORE_TOKENS_KEY, JSON.stringify(newTokens));
    } catch (e: any) {
      setError(e.message || 'Failed to refresh Tidal token');
    } finally {
      setIsLoading(false);
    }
  }, [tokens]);

  // Set auth data (manual override)
  const setAuthData = useCallback(async (tokens: TidalTokens, user: TidalUser) => {
    await saveAuthData(tokens, user);
  }, [saveAuthData]);

  return {
    isAuthenticated: !!tokens && !!user,
    tokens,
    user,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    setAuthData,
  };
}
