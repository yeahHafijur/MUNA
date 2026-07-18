// @ts-nocheck
import React, { memo, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ChevronDown, Bell, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import api from '@/api/api';

interface HomeHeaderProps {
  userLocation: { lat: number; lng: number; label?: string } | null;
  onPressLocation?: () => void;
}

const getWeatherData = (code: number, isDay: number, temp: number) => {
  let icon = '☀️';
  let bg: string;

  if (isDay === 0) {
    icon = '🌙';
    bg = 'https://images.unsplash.com/photo-1507400492013-162706c8b05e?q=80&w=800&auto=format&fit=crop';
    if (code >= 51 && code <= 67) { icon = '🌧️'; bg = 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=800&auto=format&fit=crop'; }
    if (code >= 95) { icon = '⛈️'; bg = 'https://images.unsplash.com/photo-1605727216801-e27ce1d0ce49?q=80&w=800&auto=format&fit=crop'; }
  } else {
    bg = 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=800&auto=format&fit=crop';
    if (code === 2 || code === 3) { icon = '☁️'; bg = 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=800&auto=format&fit=crop'; }
    if (code >= 51 && code <= 67) { icon = '🌧️'; bg = 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=800&auto=format&fit=crop'; }
    if (code >= 95) { icon = '⛈️'; bg = 'https://images.unsplash.com/photo-1605727216801-e27ce1d0ce49?q=80&w=800&auto=format&fit=crop'; }
  }

  return { icon, bg, temp: Math.round(temp) };
};

const getDefaultBg = () => {
  const h = new Date().getHours();
  if (h >= 6 && h < 17) return 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=800&auto=format&fit=crop';
  if (h >= 17 && h < 20) return 'https://images.unsplash.com/photo-1472141521881-95d0e87e2e39?q=80&w=800&auto=format&fit=crop';
  return 'https://images.unsplash.com/photo-1507400492013-162706c8b05e?q=80&w=800&auto=format&fit=crop';
};

const HomeHeader: React.FC<HomeHeaderProps> = ({ userLocation, onPressLocation }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [bgImage, setBgImage] = useState(getDefaultBg());
  const [weatherInfo, setWeatherInfo] = useState<{ icon: string; temp: number } | null>(null);

  const { data: unreadData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => (await api.get('/api/notifications/unread-count')).data,
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Sync app icon badge with unread count
  useEffect(() => {
    if (unreadData?.count !== undefined) {
      Notifications.setBadgeCountAsync(unreadData.count);
    }
  }, [unreadData?.count]);

  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${userLocation.lat}&longitude=${userLocation.lng}&current_weather=true`)
        .then(r => r.json())
        .then(data => {
          if (data?.current_weather) {
            const { weathercode, is_day, temperature } = data.current_weather;
            const result = getWeatherData(weathercode, is_day, temperature);
            setBgImage(result.bg);
            setWeatherInfo({ icon: result.icon, temp: result.temp });
          }
        })
        .catch(() => {});
    }
  }, [userLocation]);

  const unreadCount = unreadData?.count || 0;

  return (
    <View className="shrink-0 z-50 relative overflow-hidden rounded-b-[24px]" style={{ backgroundColor: '#f59e0b' }}>
      {/* Weather Background Image */}
      <Image
        source={{ uri: bgImage }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={500}
      />

      {/* Amber tint overlay to blend image with MUNA brand */}
      <LinearGradient
        colors={['rgba(245,158,11,0.82)', 'rgba(245,158,11,0.60)', 'rgba(245,158,11,0.88)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View className="pt-4 px-4 pb-5 w-full max-w-7xl mx-auto relative z-10">
        {/* Top Row: Logo + Weather + Bell */}
        <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-amber-900/15">
          <View className="flex-row items-center gap-2.5">
            <View className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center overflow-hidden shadow-sm" style={{ elevation: 2 }}>
              <Image
                source={require('../../../assets/images/icon.png')}
                style={{ width: 34, height: 34 }}
                contentFit="contain"
              />
            </View>
            <View>
              <Text className="text-[15px] font-black text-amber-950 tracking-tight">MUNA</Text>
              <Text className="text-[9px] font-bold text-amber-800/70 uppercase tracking-widest">Delivery in minutes</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {weatherInfo && (
              <View className="flex-row items-center gap-1 bg-amber-950/15 px-2.5 py-1.5 rounded-full">
                <Text className="text-[12px]">{weatherInfo.icon}</Text>
                <Text className="text-[10px] font-black text-amber-950">{weatherInfo.temp}°C</Text>
              </View>
            )}
            <Pressable
              onPress={() => router.push('/notifications' as any)}
              className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center relative"
            >
              <Bell size={20} color="#451a03" strokeWidth={2.5} />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-amber-400 px-0.5">
                  <Text className="text-white text-[8px] font-black">{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Middle Row: Location (Clean, text-only style to avoid boxy clutter) */}
        <Pressable
          onPress={onPressLocation}
          className="flex-row items-center gap-2 mt-1 mb-4"
        >
          <View className="w-8 h-8 bg-amber-900/10 rounded-full items-center justify-center">
            <MapPin size={16} color="#78350f" strokeWidth={2.5} />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-[10px] font-bold text-amber-900/70 uppercase tracking-widest mb-0.5">Deliver to</Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-[15px] font-black text-amber-950" numberOfLines={1}>
                {userLocation?.label || 'Select your location'}
              </Text>
              <ChevronDown size={16} color="#78350f" strokeWidth={3} />
            </View>
          </View>
        </Pressable>

        {/* Bottom Row: Daily Market Highlight */}
        <Pressable 
           onPress={() => router.push('/daily-market')}
           className="bg-white/90 rounded-[20px] p-3 flex-row items-center justify-between shadow-sm"
           style={{ elevation: 2 }}
        >
           <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-amber-400 rounded-full items-center justify-center">
                <Text className="text-[18px]">🏪</Text>
              </View>
              <View>
                 <Text className="text-[14px] font-black text-amber-950 tracking-tight">MUNA Daily Market</Text>
                 <Text className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mt-0.5">Buy & sell used items</Text>
              </View>
           </View>
           <View className="bg-amber-100 px-3.5 py-1.5 rounded-full border border-amber-200">
              <Text className="text-[10px] font-black text-amber-900 tracking-widest">OPEN</Text>
           </View>
        </Pressable>
      </View>
    </View>
  );
};

export default memo(HomeHeader);


