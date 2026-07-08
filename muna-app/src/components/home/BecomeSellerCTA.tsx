import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const BecomeSellerCTA = () => {
  const router = useRouter();

  return (
    <View className="px-4 py-3 mb-4 md:mx-4">
      <Pressable
        onPress={() => router.push('/vendor-request')}
        className="w-full max-w-2xl mx-auto bg-amber-400 rounded-[20px] p-5 flex-row items-center gap-4 shadow-sm active:opacity-90 overflow-hidden relative">
        <View className="absolute right-[-20px] bottom-[-20px] opacity-10" style={{ transform: [{ rotate: '-15deg' }] }}>
          <Text className="text-[100px]">🏪</Text>
        </View>
        <View className="w-14 h-14 rounded-2xl bg-white/30 flex items-center justify-center shadow-inner shrink-0">
          <Text className="text-[28px]">🚀</Text>
        </View>
        <View className="relative z-10 flex-1">
          <Text className="text-[16px] font-black text-amber-950 tracking-tight leading-tight mb-0.5">
            Become a Seller
          </Text>
          <Text className="text-[12px] font-bold text-amber-900/70">
            Start selling on MUNA — reach thousands of local customers!
          </Text>
        </View>
        <View className="relative z-10 bg-white/30 rounded-full p-2.5 shrink-0">
          <ChevronRight size={20} color="#451a03" strokeWidth={3} />
        </View>
      </Pressable>
    </View>
  );
};

export default memo(BecomeSellerCTA);
