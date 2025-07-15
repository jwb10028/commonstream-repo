import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/context/ThemeContext';

function AppContent() {
  const { colorScheme } = useTheme();
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen 
          name="(screens)/settings" 
          options={{ 
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "",
            headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
          }} 
        />
        <Stack.Screen 
          name="(screens)/profile" 
          options={{ 
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "",
            headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
          }} 
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <CustomThemeProvider>
        <AppContent />
      </CustomThemeProvider>
    </AuthProvider>
  );
}
