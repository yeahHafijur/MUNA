import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ChevronDown } from 'lucide-react-native';

interface HomeHeaderProps {
  userLocation: { lat: number; lng: number; label?: string } | null;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ userLocation }) => {
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
        <Pressable className="flex-row items-center gap-3 flex-1 min-w-0 pr-4">
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
                {userLocation?.label || 'Bhalukmari, Assam'}
              </Text>
              <ChevronDown size={16} color="#0f172a" strokeWidth={3} />
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export default memo(HomeHeader);
