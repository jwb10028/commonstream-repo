import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, AuthContextType, SpotifyTokens, SpotifyUser } from '@/types/Spotify';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    tokens: null,
    user: null,
    isLoading: true,
    error: null,
  });

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedTokens, storedUser] = await Promise.all([
        AsyncStorage.getItem('spotify_tokens'),
        AsyncStorage.getItem('spotify_user'),
      ]);

      if (storedTokens && storedUser) {
        const tokens: SpotifyTokens = JSON.parse(storedTokens);
        const user: SpotifyUser = JSON.parse(storedUser);
        
        setAuthState({
          isAuthenticated: true,
          tokens,
          user,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to load stored authentication' 
      }));
    }
  };

  const saveAuthData = async (tokens: SpotifyTokens, user: SpotifyUser) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('spotify_tokens', JSON.stringify(tokens)),
        AsyncStorage.setItem('spotify_user', JSON.stringify(user)),
      ]);
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  };

  const clearAuthData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('spotify_tokens'),
        AsyncStorage.removeItem('spotify_user'),
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const login = async () => {
    // This will be implemented in the useSpotifyAuth hook
    console.log('Login function called');
  };

  const setAuthData = async (tokens: SpotifyTokens, user: SpotifyUser) => {
    setAuthState({
      isAuthenticated: true,
      tokens,
      user,
      isLoading: false,
      error: null,
    });
    await saveAuthData(tokens, user);
  };

  const logout = async () => {
    setAuthState({
      isAuthenticated: false,
      tokens: null,
      user: null,
      isLoading: false,
      error: null,
    });
    await clearAuthData();
  };

  const refreshToken = async () => {
    // This will be implemented later
    console.log('Refresh token function called');
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
    setAuthData, // Add this to the context
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}