
export interface TidalTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  timestamp?: number;
}

export interface TidalUser {
  userId: string;
  username: string;
  email?: string;
  fullName?: string;
  countryCode?: string;
  subscriptionType?: string;
  picture?: string; // URL to profile image
}

export interface TidalAuthState {
  isAuthenticated: boolean;
  tokens: TidalTokens | null;
  user: TidalUser | null;
  isLoading: boolean;
  error: string | null;
}

export interface TidalAuthContextType extends TidalAuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setAuthData: (tokens: TidalTokens, user: TidalUser) => Promise<void>;
}
