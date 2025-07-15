export interface SpotifyTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  followers: {
    total: number;
  };
  country: string;
  product: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  tokens: SpotifyTokens | null;
  user: SpotifyUser | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setAuthData: (tokens: SpotifyTokens, user: SpotifyUser) => Promise<void>;
}