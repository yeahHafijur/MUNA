import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { getCategoryIcon } from '@/utils/homeUtils';

interface AllCategoriesModalProps {
  showAllCategories: boolean;
  setShowAllCategories: (show: boolean) => void;
  categoryList: any[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

export default function AllCategoriesModal({
  showAllCategories,
  setShowAllCategories,
  categoryList,
  activeCategory,
  setActiveCategory,
}: AllCategoriesModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAllCategories}
      onRequestClose={() => setShowAllCategories(false)}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl pt-2 px-4 pb-10 max-h-[85%]">
          {/* Drag Indicator */}
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </View>
          
          <View className="flex-row items-center justify-between mb-6 px-2">
            <Text className="text-[20px] font-black text-slate-900">All Categories</Text>
            <TouchableOpacity onPress={() => setShowAllCategories(false)} className="bg-slate-100 px-3 py-1.5 rounded-full">
              <Text className="text-slate-600 font-bold text-xs">Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View className="flex-row flex-wrap justify-between gap-y-6">
              {categoryList.map((catObj) => {
                const catName = catObj.name;
                const isActive = activeCategory === catName;
                const { emoji, bg } = getCategoryIcon(catName);

                return (
                  <TouchableOpacity
                    key={catName}
                    onPress={() => {
                      setActiveCategory(catName);
                      setShowAllCategories(false);
                    }}
                    className="w-[30%] items-center gap-2"
                    activeOpacity={0.7}
                  >
                    <View
                      className="w-20 h-20 rounded-[20px] flex items-center justify-center overflow-hidden"
                      style={
                        isActive
                          ? { borderWidth: 2, borderColor: '#0f172a', backgroundColor: '#f8fafc' }
                          : { backgroundColor: bg }
                      }>
                      {catObj.image ? (
                        <Image source={{ uri: catObj.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      ) : (
                        <Text className="text-[40px]">{emoji}</Text>
                      )}
                    </View>
                    <Text
                      className={`text-[12px] text-center leading-tight px-1 ${
                        isActive ? 'font-black text-slate-900' : 'font-bold text-slate-600'
                      }`}>
                      {catName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
