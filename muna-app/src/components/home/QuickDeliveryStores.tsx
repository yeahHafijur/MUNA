import React, { memo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

interface QuickDeliveryStoresProps {
  shops: any[];
}

const QuickDeliveryStores: React.FC<QuickDeliveryStoresProps> = ({ shops }) => {
  const router = useRouter();
  // Only shops within 2km that are open
  let quickShops = shops.filter((s) => s.distance < 2 && s.isOpen);
  
  // Fallback: If no shops within 2km (e.g., location off), show up to 5 open shops
  if (quickShops.length === 0) {
    quickShops = shops.filter((s) => s.isOpen).slice(0, 5);
  }

  if (quickShops.length === 0) return null;

  return (
    <View className="px-4 py-5">
      <View className="flex-row items-center gap-2 mb-3.5">
        <Text className="text-[18px]">⚡</Text>
        <View>
          <Text className="text-[15px] font-black text-slate-900 tracking-tight leading-none">
            Quick Delivery
          </Text>
          <Text className="text-[10px] font-bold text-emerald-600 mt-0.5">
            Stores near you • Under 15 mins
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 pb-2">
        {quickShops.slice(0, 10).map((shop) => (
          <Pressable
            key={shop._id}
            onPress={() => router.push(`/shop/${shop._id}`)}
            className="w-[200px]">
            <View className="w-full aspect-[4/3] rounded-2xl overflow-hidden relative bg-slate-100 shadow-sm">
              {shop.image ? (
                <Image source={{ uri: shop.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <View className="w-full h-full items-center justify-center bg-amber-50">
                  <Text className="text-4xl">🏪</Text>
                </View>
              )}

              {/* Delivery badge */}
              <View className="absolute top-2 left-2 flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 shadow-sm">
                <Text className="text-[8px] font-black tracking-wider text-white uppercase">
                  ⚡ 15 MIN
                </Text>
              </View>

              {/* Bottom gradient + shop name on image */}
              <View className="absolute inset-x-0 bottom-0 h-16 bg-black/40" />
              <Text
                className="absolute bottom-2 left-2.5 right-2 text-[13px] font-black text-white leading-tight"
                numberOfLines={1}>
                {shop.name}
              </Text>
            </View>

            <View className="mt-1.5 px-0.5">
              <Text className="text-[10px] font-semibold text-slate-400" numberOfLines={1}>
                {typeof shop.category === 'object' ? (shop.category?.name || 'Grocery') : (shop.category || 'Grocery')}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default memo(QuickDeliveryStores);
