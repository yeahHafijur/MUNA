import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Clock3, MapPin, Star, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface StoreListingProps {
  sortedShops: any[];
  loading: boolean;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  limit?: number;
  showViewAll?: boolean;
}

const StoreListing: React.FC<StoreListingProps> = ({
  sortedShops,
  loading,
  activeCategory,
  setActiveCategory,
  limit,
  showViewAll,
}) => {
  const router = useRouter();
  const displayShops = limit ? sortedShops.slice(0, limit) : sortedShops;

  return (
    <View className="px-4 pt-2 pb-6 md:mx-4" id="store-listing">
      {/* ── Section Header ── */}
      <View className="flex-row items-center justify-between mb-5 px-1">
        <View className="flex-col">
          <View className="flex-row items-center gap-2.5">
            <View className="w-1.5 h-6 bg-amber-400 rounded-full" />
            <Text className="text-[18px] font-black text-slate-900 tracking-tight leading-none">
              {activeCategory !== 'All' ? `${activeCategory} Stores` : 'Nearby Shops'}
            </Text>
          </View>
          <Text className="text-[11px] font-bold text-slate-400 mt-1.5 pl-4">
            {sortedShops.length} {sortedShops.length === 1 ? 'store' : 'stores'} available near you
          </Text>
        </View>
        {activeCategory !== 'All' && (
          <Pressable
            className="bg-amber-100/70 px-3 py-1.5 rounded-full flex-row items-center"
            onPress={() => setActiveCategory('All')}>
            <X size={10} color="#b45309" strokeWidth={3} />
            <Text className="text-[11px] font-black text-amber-700 ml-1">Clear</Text>
          </Pressable>
        )}
      </View>

      <View className="gap-3.5">
        {loading ? (
          /* Skeleton loaders */
          [1, 2, 3, 4].map((i) => (
            <View
              key={i}
              className="rounded-[22px] overflow-hidden bg-white border border-slate-100 shadow-sm opacity-50">
              <View className="w-full h-36 bg-slate-200" />
              <View className="p-4 gap-2.5">
                <View className="h-4 bg-slate-200 w-3/4 rounded-full" />
                <View className="h-3 bg-slate-100 w-1/2 rounded-full" />
                <View className="h-3 bg-slate-100 w-1/3 rounded-full" />
              </View>
            </View>
          ))
        ) : sortedShops.length === 0 ? (
          <View className="items-center py-16 bg-white rounded-[24px] border border-slate-100 border-dashed mx-1 shadow-sm">
            <Text className="text-5xl mb-3">🔍</Text>
            <Text className="text-[14px] font-black text-slate-400">No stores found</Text>
            <Text className="text-[11px] font-semibold text-slate-300 mt-1">Try a different category</Text>
          </View>
        ) : (
          displayShops.map((shop) => {
            const distVal = shop.distance !== Infinity ? shop.distance : null;
            const isFast = distVal !== null && distVal < 2;
            const distText =
              distVal !== null
                ? distVal < 1
                  ? `${(distVal * 1000).toFixed(0)}m`
                  : `${distVal.toFixed(1)} km`
                : null;
            const deliveryTime = isFast ? '15 min' : '25-30 min';

            return (
              <Pressable
                key={shop._id}
                onPress={() => router.push(`/shop/${shop._id}`)}
                className={`flex-col rounded-[22px] bg-white border border-slate-100/80 overflow-hidden shadow-sm ${
                  !shop.isOpen ? 'opacity-60' : ''
                }`}>
                {/* Shop Image - Full Width */}
                <View className="w-full aspect-[21/9] sm:aspect-[3/1] relative overflow-hidden bg-slate-100">
                  {shop.image ? (
                    <Image
                      source={{ uri: shop.image }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={300}
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center bg-amber-50">
                      <Text className="text-4xl">🏪</Text>
                    </View>
                  )}

                  {/* Closed overlay */}
                  {!shop.isOpen && (
                    <View className="absolute inset-0 bg-white/70 items-center justify-center z-10">
                      <Text className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-wider uppercase shadow-lg">
                        CLOSED
                      </Text>
                    </View>
                  )}
                </View>

                {/* Shop Info - Below Image */}
                <View className="p-4 relative">
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <Text
                        className="text-[16px] font-extrabold text-slate-900 leading-tight"
                        numberOfLines={1}>
                        {shop.name}
                      </Text>
                      <Text className="text-[12px] font-semibold text-slate-500 mt-1" numberOfLines={1}>
                        {typeof shop.category === 'object' ? (shop.category?.name || 'Grocery') : (shop.category || 'Kirana & Grocery')}
                      </Text>
                    </View>
                    <View className="flex-col items-end shrink-0">
                      <View className="flex-row items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100/50">
                        <Star size={10} color="#047857" fill="#047857" />
                        <Text className="text-[12px] font-black text-emerald-700">
                          {shop.rating || '4.5'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom row: Distance + Delivery */}
                  <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-slate-100/80">
                    <View className="flex-row items-center gap-1.5">
                      <Clock3 size={12} color="#64748b" />
                      <Text className="text-[11px] font-bold text-slate-500">{deliveryTime}</Text>
                    </View>
                    {distText && (
                      <View className="flex-row items-center gap-1.5">
                        <MapPin size={12} color="#64748b" />
                        <Text className="text-[11px] font-bold text-slate-500">{distText}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      {/* View All Button */}
      {showViewAll && limit && sortedShops.length > limit && (
        <View className="mt-6 items-center">
          <Pressable
            onPress={() => router.push('/all-stores')}
            className="flex-row items-center justify-center gap-2 px-7 py-3.5 bg-slate-900 rounded-2xl active:opacity-80 shadow-sm"
          >
            <Text className="text-white font-black text-[13px]">
              View all {sortedShops.length} stores
            </Text>
            <Text className="text-white text-lg leading-none mt-[-2px]">→</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default memo(StoreListing);
