import React, { memo } from 'react';
import { Pressable, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { getCategoryIcon } from '@/utils/homeUtils';

interface ShopByCategoryProps {
  categoryList: any[];
  showAllCategories: boolean;
  setShowAllCategories: (show: boolean) => void;
  // Kept for backward compatibility with HomeScreen
  activeCategory?: string;
  setActiveCategory?: (cat: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const ShopByCategory: React.FC<ShopByCategoryProps> = ({
  categoryList,
  setShowAllCategories,
  userLocation,
}) => {
  const router = useRouter();

  return (
    <View className="bg-white px-4 py-6 border-y border-slate-100 mb-2 shadow-sm md:rounded-2xl md:mx-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-[15px] font-black text-slate-900">Shop by Category</Text>
        <Pressable onPress={() => setShowAllCategories(true)}>
          <Text className="text-[12px] font-bold text-amber-500">View All</Text>
        </Pressable>
      </View>

      <View className="flex-row flex-wrap items-start justify-start gap-y-5 gap-x-[4%] pt-2 pb-1">
        {categoryList.slice(0, 8).map((catObj) => {
          const catName = catObj.name;
          const { emoji, bg } = getCategoryIcon(catName);

          return (
            <TouchableOpacity
              key={catName}
              onPress={() => {
                const locParams = userLocation ? `&lat=${userLocation.lat}&lng=${userLocation.lng}` : '';
                if (catName === 'All') {
                  router.push(`/all-stores?${locParams.replace('&', '')}`);
                } else {
                  router.push(`/all-stores?category=${encodeURIComponent(catName)}${locParams}`);
                }
              }}
              className="flex-col items-center gap-2 w-[22%]"
              activeOpacity={0.7}
            >
              <View
                className="w-16 h-16 rounded-[18px] flex items-center justify-center overflow-hidden shadow-sm relative"
                style={{ backgroundColor: bg }}>
                {catObj.image ? (
                  <Image source={{ uri: catObj.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <Text className="text-[28px]">{emoji}</Text>
                )}
              </View>
              <Text
                numberOfLines={2}
                className="text-[11px] text-center leading-tight font-bold text-slate-600">
                {catName === 'All' ? 'All' : catName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default memo(ShopByCategory);
