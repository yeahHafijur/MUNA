import React, { memo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import ProductCard from '../ProductCard';

interface BestsellersProps {
  featuredProducts: any[];
}

const Bestsellers: React.FC<BestsellersProps> = ({ featuredProducts }) => {
  const router = useRouter();
  if (!featuredProducts || featuredProducts.length === 0) return null;

  return (
    <View className="bg-white px-4 py-6 border-b border-slate-100 mb-2 shadow-sm md:rounded-2xl md:mx-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-[15px] font-black text-slate-900">Bestsellers</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 pb-2">
        {featuredProducts.slice(0, 8).map((prod) => (
          <View key={prod._id} className="w-[140px] sm:w-[160px]">
            <ProductCard
              product={prod}
              discount="15%"
              deliveryTime="10 MINS"
              onClick={() => {
                const shopId = prod.shopId?._id || prod.shopId || prod.shop;
                if (shopId) {
                  router.push(`/product/${shopId}/${prod._id}`);
                }
              }}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default memo(Bestsellers);
