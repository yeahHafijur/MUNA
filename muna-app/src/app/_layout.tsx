import '../global.css';
import { Stack, useRouter, useSegments, useRootNavigationState, Redirect } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set up background notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('new-orders-v2', {
    name: 'New Orders',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'ringtone.wav',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#fbbf24',
  });
}

import { CartProvider } from '@/context/CartContext';
import { useVendorAlarm } from '@/hooks/useVendorAlarm';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min before data becomes stale
      gcTime: 1000 * 60 * 30,        // 30 min garbage collection cache
      retry: 2,
      refetchOnWindowFocus: false,   // Not needed for mobile
    },
  },
});

import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding until auth check is complete
SplashScreen.preventAutoHideAsync();

function AuthHandler() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) return null;

  const inAuthGroup = segments[0] === 'login';

  if (!user && !inAuthGroup) {
    return <Redirect href="/login" />;
  } else if (user && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return null;
}

function RootLayoutNav() {
  const navigationState = useRootNavigationState();
  const router = useRouter();
  
  useVendorAlarm();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.route) {
        // @ts-ignore - Expo router types
        router.push(data.route);
      }
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <>
      {navigationState?.key && <AuthHandler />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

import { ErrorBoundary } from '@/components/ErrorBoundary';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  enabled: !__DEV__,
});

function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <RootLayoutNav />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
