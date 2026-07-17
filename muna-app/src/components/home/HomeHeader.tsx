import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ChevronDown, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';

interface HomeHeaderProps {
  userLocation: { lat: number; lng: number; label?: string } | null;
  onPressLocation?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ userLocation, onPressLocation }) => {
  const router = useRouter();
  const { user } = useAuth();

  const { data: unreadData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const res = await api.get('/api/notifications/unread-count');
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 30000 // Poll every 30 seconds
  });

  const unreadCount = unreadData?.count || 0;

  return (
    <View className="shrink-0 bg-amber-400 pt-[60px] px-4 pb-4 z-50 shadow-md relative overflow-hidden rounded-b-[20px]">
      {/* Decorative Delivery Element */}
      <View className="absolute right-[-10px] top-4 opacity-[0.15]">
        <Text className="text-[90px]" style={{ transform: [{ rotate: '12deg' }] }}>
          🛵
        </Text>
      </View>

      <View className="flex-row items-center justify-between relative z-10 w-full max-w-7xl mx-auto">
        {/* Left: Logo & Location */}
        <Pressable onPress={onPressLocation} className="flex-row items-center gap-3 flex-1 min-w-0 pr-4 active:opacity-70">
          {/* MUNA Logo */}
          <View className="w-11 h-11 bg-white rounded-[12px] shadow-sm flex items-center justify-center p-1 shrink-0">
            <Image
              source={require('../../../assets/images/icon.png')}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
            />
          </View>

          <View className="flex-col flex-1 min-w-0">
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <Text className="text-[11px] font-black tracking-widest text-amber-950 uppercase">
                Delivery in 15 mins
              </Text>
              <Text className="text-[14px]">🛵⚡</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-[16px] font-black text-slate-900" numberOfLines={1}>
                {userLocation?.label || 'Select Location'}
              </Text>
              <ChevronDown size={16} color="#0f172a" strokeWidth={3} />
            </View>
          </View>
        </Pressable>

        {/* Right: Notifications */}
        <Pressable 
            onPress={() => router.push('/notifications' as any)}
            className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center relative shadow-sm"
        >
            <Bell size={22} color="#451a03" strokeWidth={2.5} />
            {unreadCount > 0 && (
                <View className="absolute top-0 right-0 bg-red-500 min-w-[20px] h-[20px] rounded-full flex items-center justify-center border-2 border-amber-400 px-1">
                    <Text className="text-white text-[9px] font-black">{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
            )}
        </Pressable>
      </View>
    </View>
  );
};

export default memo(HomeHeader);
