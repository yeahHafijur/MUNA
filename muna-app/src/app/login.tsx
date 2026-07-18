import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors, isDark } = useTheme();
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
    <SafeAreaView className="flex-1 justify-center items-center p-4" style={{ backgroundColor: colors.background }}>
      <View className="w-full max-w-[400px] rounded-2xl border shadow-sm p-8 sm:p-10" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 mb-5 rounded-2xl overflow-hidden border items-center justify-center shadow-sm p-1" style={{ backgroundColor: isDark ? colors.elevated : '#ffffff', borderColor: colors.border }}>
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
            />
          </View>
          <Text style={{ color: colors.primaryText }} className="text-2xl font-bold tracking-tight mb-2">Welcome to MUNA</Text>
          <Text style={{ color: colors.secondaryText }} className="text-sm font-medium">Sign in to your account to continue</Text>
        </View>

        {/* Error State */}
        {error ? (
          <View className="border rounded-lg p-3 mb-6 flex-row items-center" style={{ backgroundColor: colors.dangerMuted, borderColor: isDark ? 'rgba(248,113,113,0.3)' : '#fecaca' }}>
            <Text style={{ color: colors.danger }} className="text-sm font-medium ml-2">{error}</Text>
          </View>
        ) : null}

        {/* Login Button */}
        <View className="space-y-4">
          <TouchableOpacity 
            onPress={onGoogleButtonPress}
            disabled={loading}
            className={`w-full h-12 flex-row justify-center items-center border rounded-lg ${loading ? 'opacity-70' : ''}`}
            style={{ backgroundColor: isDark ? colors.elevated : '#ffffff', borderColor: colors.border }}
          >
            {loading && !error ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={{ color: colors.primaryText }} className="font-semibold ml-2">Continue with Google</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-8 pt-4 border-t" style={{ borderTopColor: colors.border }}>
          <Text style={{ color: colors.tertiaryText }} className="text-[11px] font-medium text-center uppercase tracking-wider">
            By continuing, you agree to our{'\n'}Terms of Service & Privacy Policy
          </Text>
        </View>
        
      </View>

      <Text style={{ color: colors.tertiaryText }} className="absolute bottom-6 text-[10px] font-bold uppercase tracking-widest">
        MUNA Platform
      </Text>
    </SafeAreaView>
  );
}
