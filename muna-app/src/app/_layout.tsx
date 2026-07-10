import '../global.css';
import { Stack, useRouter, useSegments, useRootNavigationState, Redirect } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

const queryClient = new QueryClient();

function AuthHandler() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

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
  
  useVendorAlarm();

  return (
    <>
      {navigationState?.key && <AuthHandler />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <RootLayoutNav />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
