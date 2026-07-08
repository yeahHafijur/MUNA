import React, { memo } from 'react';
import { Pressable, ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { getCategoryIcon } from '@/utils/homeUtils';

interface ShopByCategoryProps {
  categoryList: any[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  showAllCategories: boolean;
  setShowAllCategories: (show: boolean) => void;
}

const ShopByCategory: React.FC<ShopByCategoryProps> = ({
  categoryList,
  activeCategory,
  setActiveCategory,
  setShowAllCategories,
}) => {
  return (
    <View className="bg-white px-4 py-6 border-y border-slate-100 mb-2 shadow-sm md:rounded-2xl md:mx-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-[15px] font-black text-slate-900">Shop by Category</Text>
        <Pressable onPress={() => setShowAllCategories(true)}>
          <Text className="text-[12px] font-bold text-amber-500">View All</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-4 pb-2">
        {categoryList.map((catObj) => {
          const catName = catObj.name;
          const isActive = activeCategory === catName;
          const { emoji, bg } = getCategoryIcon(catName);

          return (
            <TouchableOpacity
              key={catName}
              onPress={() => setActiveCategory(catName)}
              className="flex-col items-center gap-2 w-[72px]"
              activeOpacity={0.7}
            >
              <View
                className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center overflow-hidden"
                style={
                  isActive
                    ? { borderWidth: 2, borderColor: '#0f172a', backgroundColor: '#f8fafc' }
                    : { backgroundColor: bg }
                }>
                {catObj.image ? (
                  <Image source={{ uri: catObj.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <Text className="text-[32px]">{emoji}</Text>
                )}
              </View>
              <Text
                className={`text-[11px] text-center leading-tight px-1 ${
                  isActive ? 'font-black text-slate-900' : 'font-bold text-slate-600'
                }`}>
                {catName === 'All' ? 'All' : catName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default memo(ShopByCategory);
