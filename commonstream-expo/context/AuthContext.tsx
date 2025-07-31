import React, { createContext, useContext } from 'react';

const AuthContext = createContext({
  isAuthenticated: true,
  isLoading: false,
});

export function useAuth() {
  return useContext(AuthContext);
}


interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ isAuthenticated: true, isLoading: false }}>
      {children}
    </AuthContext.Provider>
  );
}