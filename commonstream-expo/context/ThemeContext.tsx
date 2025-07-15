import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from '@/hooks/useColorScheme';

type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colorScheme: 'light' | 'dark';
  themePreference: ColorScheme;
  setThemePreference: (theme: ColorScheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ColorScheme>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load stored theme preference on app start
  useEffect(() => {
    loadStoredTheme();
  }, []);

  const loadStoredTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('theme_preference');
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        setThemePreferenceState(storedTheme as ColorScheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemePreference = async (theme: ColorScheme) => {
    try {
      setThemePreferenceState(theme);
      await AsyncStorage.setItem('theme_preference', theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = themePreference === 'dark' ? 'light' : 'dark';
    setThemePreference(newTheme);
  };

  // Determine the actual color scheme to use
  const colorScheme: 'light' | 'dark' = themePreference === 'system' 
    ? (systemColorScheme ?? 'light')
    : themePreference;

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{
      colorScheme,
      themePreference,
      setThemePreference,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
