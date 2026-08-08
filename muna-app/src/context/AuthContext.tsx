import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '@/api/api';
import { registerForPushNotificationsAsync } from '@/utils/notifications';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface AuthContextType {
  user: any | null;
  token: string | null;
  login: (userData: any, userToken: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-login on app load
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        const storedToken = await SecureStore.getItemAsync('token');
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Set api header here to ensure it's available for the token call
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Try fetching push token quietly in background
          registerForPushNotificationsAsync().then((fcmToken) => {
            if (fcmToken) {
              api.post('/api/auth/fcm-token', { fcmToken }).catch(console.error);
            }
          });
        }
      } catch (err) {
        console.error('Failed to load user from SecureStore', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    try {
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      await SecureStore.setItemAsync('token', userToken);
      
      // Update axios default header so the fcm-token call works immediately
      api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      
      // Fetch FCM Token and send to backend
      const fcmToken = await registerForPushNotificationsAsync();
      if (fcmToken) {
        await api.post('/api/auth/fcm-token', { fcmToken }).catch(console.error);
      }
    } catch (err) {
      console.error('Failed to save user data or push token', err);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    try {
      // Revoke the server-side token (bumps tokenVersion) before clearing local storage
      try {
        await api.post('/api/auth/logout');
      } catch {
        // Ignore logout API failures — local cleanup still proceeds
      }

      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('token');

      // Force Google to forget the session so it asks for the account again next time
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore errors if the user wasn't signed in via Google
      }
    } catch (err) {
      console.error('Failed to delete user data', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
