import React, { memo } from 'react';
import { Text, View } from 'react-native';

const HowItWorks = () => {
  return (
    <View className="px-4 py-8 mb-4">
      <View className="items-center mb-6">
        <Text className="text-[18px] font-black text-slate-900 tracking-tight">How MUNA Works</Text>
        <Text className="text-[12px] font-bold text-slate-500 mt-1">From our store to your door in minutes</Text>
      </View>
      
      <View className="flex-row items-center justify-between max-w-sm mx-auto relative px-2">
        {/* Connecting Line */}
        <View className="absolute top-8 left-10 right-10 h-0.5 bg-slate-100 -z-10">
          <View className="h-full bg-amber-400 w-full opacity-50" />
        </View>
        
        {/* Step 1 */}
        <View className="flex-col items-center gap-2 flex-1">
          <View className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-50 flex items-center justify-center">
            <Text className="text-[28px]">📱</Text>
          </View>
          <View className="items-center mt-1">
            <Text className="text-[12px] font-black text-slate-800 leading-tight">You Order</Text>
            <Text className="text-[10px] font-bold text-slate-400">Via MUNA app</Text>
          </View>
        </View>
        
        {/* Step 2 */}
        <View className="flex-col items-center gap-2 flex-1">
          <View className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-50 flex items-center justify-center">
            <Text className="text-[28px]">📦</Text>
          </View>
          <View className="items-center mt-1">
            <Text className="text-[12px] font-black text-slate-800 leading-tight">We Pack</Text>
            <Text className="text-[10px] font-bold text-slate-400">Fresh & careful</Text>
          </View>
        </View>
        
        {/* Step 3 */}
        <View className="flex-col items-center gap-2 flex-1">
          <View className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-50 flex items-center justify-center">
            <Text className="text-[28px]">🛵</Text>
          </View>
          <View className="items-center mt-1">
            <Text className="text-[12px] font-black text-slate-800 leading-tight">Delivery</Text>
            <Text className="text-[10px] font-bold text-slate-400">At your doorstep</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default memo(HowItWorks);
