import React, { memo } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';

interface PromoBannersProps {
  banners?: any[];
}

const PromoBanners: React.FC<PromoBannersProps> = ({ banners }) => {
  return (
    <View className="px-4 pt-5 pb-1">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3.5 pb-2"
        snapToInterval={390}
        decelerationRate="fast">
        {banners && banners.length > 0 ? (
          banners.map((b, idx) => (
            <Pressable
              key={b._id}
              onPress={() => {
                if (b.link) Linking.openURL(b.link);
              }}
              className="w-[88vw] sm:w-[380px] h-[170px] rounded-[22px] overflow-hidden shadow-sm relative">
              <Image source={{ uri: b.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            </Pressable>
          ))
        ) : (
          <>
            {/* Banner 1 */}
            <Pressable className="w-[88vw] sm:w-[380px] h-[170px] rounded-[22px] bg-[#0052FF] p-5 justify-center relative overflow-hidden shadow-sm">
              <View className="absolute top-[-50%] left-[-20%] w-[180px] h-[180px] bg-white rounded-full opacity-10" />
              <View className="relative z-10 w-[70%]">
                <View className="self-start px-2.5 py-1 bg-black/20 rounded-md mb-2">
                  <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                    Weekend Special
                  </Text>
                </View>
                <Text className="text-[24px] font-black text-white leading-tight mb-1">
                  MEGA OFFERS
                </Text>
                <Text className="text-[12px] font-semibold text-blue-100">
                  Up to 50% OFF on Essentials
                </Text>
              </View>
              <View className="absolute -right-2 top-1/2 -translate-y-1/2">
                <Text className="text-[100px]" style={{ transform: [{ rotate: '-10deg' }] }}>
                  🛒
                </Text>
              </View>
            </Pressable>

            {/* Banner 2 */}
            <Pressable className="w-[88vw] sm:w-[380px] h-[170px] rounded-[22px] bg-[#FFF5EB] p-5 justify-center relative overflow-hidden shadow-sm border border-[#F2E4D3]">
              <View className="relative z-10 w-[65%]">
                <View className="self-start px-2.5 py-1 bg-rose-500 rounded-md mb-2">
                  <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                    Fresh Arrival
                  </Text>
                </View>
                <Text className="text-[24px] font-black text-[#3A2C1C] leading-tight mb-1">
                  FARM FRESH
                </Text>
                <Text className="text-[12px] font-bold text-[#8C7A65]">
                  Straight from local farms
                </Text>
              </View>
              <View className="absolute -right-2 top-1/2 -translate-y-1/2">
                <Text className="text-[100px]" style={{ transform: [{ rotate: '10deg' }] }}>
                  🍎
                </Text>
              </View>
            </Pressable>

            {/* Banner 3 */}
            <Pressable className="w-[88vw] sm:w-[380px] h-[170px] rounded-[22px] bg-[#FFDE00] p-5 justify-center relative overflow-hidden shadow-sm border border-[#E6C800]">
              <View className="relative z-10 w-[70%]">
                <View className="self-start px-2.5 py-1 bg-black/10 rounded-md mb-2">
                  <Text className="text-amber-900 text-[10px] font-black uppercase tracking-widest">
                    Quick Delivery
                  </Text>
                </View>
                <Text className="text-[24px] font-black text-slate-900 leading-tight mb-1">
                  MIDNIGHT CRAVINGS?
                </Text>
                <Text className="text-[12px] font-bold text-amber-950/70">
                  We deliver till 2 AM
                </Text>
              </View>
              <View className="absolute -right-3 top-1/2 -translate-y-1/2">
                <Text className="text-[100px]" style={{ transform: [{ rotate: '-5deg' }] }}>
                  🍕
                </Text>
              </View>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* Scroll Indicators */}
      {((banners && banners.length > 1) || (!banners || banners.length === 0)) && (
        <View className="flex-row items-center justify-center gap-1.5 mt-3.5">
          {(banners && banners.length > 0 ? banners : [1, 2, 3]).map((_, i) => (
            <View
              key={i}
              className={`rounded-full ${i === 0 ? 'w-5 h-1.5 bg-slate-800' : 'w-1.5 h-1.5 bg-slate-300'}`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default memo(PromoBanners);
