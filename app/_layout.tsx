import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '../src/components/useColorScheme';
import { ErrorProvider, useError } from '../src/components/ErrorBottomSheet';
import { setGlobalErrorHandler } from '../src/config/api';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorProvider>
        <RootLayoutNav />
      </ErrorProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const { showError } = useError();

  // Global error handler'ı ayarla
  useEffect(() => {
    setGlobalErrorHandler(showError);
  }, [showError]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await AsyncStorage.getItem('@user_session');
        const hasSession = !!session;
        const inAuthGroup = segments[0] === 'login';

        // 1. Kullanıcı giriş yapmamışsa ve login sayfasında değilse -> Login'e at
        if (!hasSession && !inAuthGroup) {
          router.replace('/login');
        } 
        // 2. Kullanıcı giriş yapmışsa ve login sayfasındaysa -> Ana Sayfa'ya at
        else if (hasSession && inAuthGroup) {
          router.replace('/(tabs)');
        }
      } catch (e) {
        console.error("Auth check error", e);
      } finally {
        setIsReady(true);
      }
    };

    // Fontlar yüklendikten sonra kontrolü yap
    if (isReady || segments.length >= 0) {
      checkAuth();
    }
  }, [segments, isReady]); // Segments değiştiğinde (yönlendirme tetiklendiğinde) tekrar çalışır

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}