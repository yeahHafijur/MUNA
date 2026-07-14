import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/api/api';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId;

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

export default function LoginScreen() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleGoogleBackendAuth = async (idToken: string) => {
    if (!idToken) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/api/auth/google-login', {
        credential: idToken,
      });

      const data = res.data;
      if (data.token) {
        await login({
          _id: data._id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          profilePic: data.profilePic
        }, data.token);
        
        router.replace('/(tabs)');
      } else {
        throw new Error('No token received from backend');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleButtonPress = async () => {
    if (loading) return; // Prevent double-tap
    setLoading(true);
    setError('');
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      const idToken = response.data?.idToken || (response as any).idToken;
      
      if (idToken) {
        await handleGoogleBackendAuth(idToken);
      } else {
        if (response.type === 'cancelled' || (response as any).code === 'CANCELLED') {
          setLoading(false);
          return;
        }
        throw new Error('No ID token received from Google');
      }
    } catch (error: any) {
      setError(error.message || 'Google Login failed or was canceled');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center p-4">
      <View className="w-full max-w-[400px] bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10">
        
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 mb-5 rounded-2xl overflow-hidden border border-gray-100 items-center justify-center bg-white shadow-sm p-1">
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
            />
          </View>
          <Text className="text-2xl font-bold tracking-tight mb-2 text-gray-900">Welcome to MUNA</Text>
          <Text className="text-sm font-medium text-gray-500">Sign in to your account to continue</Text>
        </View>

        {/* Error State */}
        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex-row items-center">
            <Text className="text-red-600 text-sm font-medium ml-2">{error}</Text>
          </View>
        ) : null}

        {/* Login Button */}
        <View className="space-y-4">
          <TouchableOpacity 
            onPress={onGoogleButtonPress}
            disabled={loading}
            className={`w-full h-12 flex-row justify-center items-center border border-gray-300 rounded-lg bg-white ${loading ? 'opacity-70' : ''}`}
          >
            {loading && !error ? (
              <ActivityIndicator color="#2563eb" />
            ) : (
              <Text className="text-gray-700 font-semibold ml-2">Continue with Google</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-8 pt-4 border-t border-gray-100">
          <Text className="text-[11px] font-medium text-gray-400 text-center uppercase tracking-wider">
            By continuing, you agree to our{'\n'}Terms of Service & Privacy Policy
          </Text>
        </View>
        
      </View>

      <Text className="absolute bottom-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        MUNA Platform
      </Text>
    </SafeAreaView>
  );
}
