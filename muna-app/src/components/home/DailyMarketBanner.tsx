import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const DailyMarketBanner: React.FC = () => {
  const router = useRouter();
  return (
    <View className="px-4 py-2 mb-2 md:mx-4">
      <Pressable
        onPress={() => router.push('/daily-market')}
        className="w-full max-w-2xl mx-auto bg-amber-400 rounded-[14px] p-4 flex-row items-center justify-between shadow-sm overflow-hidden relative">
        <View className="absolute right-[-10px] top-[-10px] opacity-[0.2]">
          <Text className="text-[60px]" style={{ transform: [{ rotate: '12deg' }] }}>
            🛒
          </Text>
        </View>
        <View className="relative z-10">
          <Text className="text-[16px] font-black text-amber-950 tracking-tight mb-0.5">
            Daily Market
          </Text>
          <Text className="text-[12px] font-bold text-amber-900/80">
            Buy & Sell used items locally
          </Text>
        </View>
        <View className="relative z-10 bg-white/40 rounded-full p-2">
          <ChevronRight size={16} color="#451a03" strokeWidth={3} />
        </View>
      </Pressable>
    </View>
  );
};

export default memo(DailyMarketBanner);
