import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Clock } from 'lucide-react-native';
import { getImageUrl } from '@/utils/format';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  onAddClick?: (e: any) => void;
  quantity?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  onClick,
  onAddClick,
  quantity = 0,
  onIncrement,
  onDecrement,
}) => {
  const currentPrice = product.price || 0;
  const originalPrice = Math.floor(currentPrice * 1.15); // 15% more
  const isOutOfStock = product.inStock === false || product.shopIsOpen === false;

  return (
    <Pressable
      onPress={onClick}
      className={`bg-white rounded-[12px] p-2 shadow-sm border border-slate-100 flex-col relative overflow-hidden ${
        isOutOfStock ? 'opacity-60' : ''
      }`}>
      {/* ── IMAGE WRAPPER ── */}
      <View className="w-full aspect-square rounded-[8px] bg-slate-50 mb-2 p-1 flex-col relative overflow-hidden items-center justify-center">
        {product.image ? (
          <Image source={{ uri: getImageUrl(product.image) as string }} style={{ width: '100%', height: '100%' }} contentFit="contain" transition={200} cachePolicy="memory-disk" />
        ) : (
          <Text className="text-4xl opacity-50">📦</Text>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <View className="absolute inset-0 bg-white/70 items-center justify-center z-20">
            <Text className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
              {!product.shopIsOpen ? 'Closed' : 'Out'}
            </Text>
          </View>
        )}
      </View>

      {/* ── TITLE ── */}
      <Text className="text-[12px] font-bold text-slate-800 leading-[16px] mb-0.5 tracking-tight h-[32px]" numberOfLines={2}>
        {product.name}
      </Text>

      {/* ── SUBTITLE (Weight/Unit) ── */}
      <View className="mb-1.5 h-[14px] justify-center">
        {product.quantity ? (
            <Text className="text-[10px] font-bold text-slate-400 tracking-tight" numberOfLines={1}>
                {product.quantity}
            </Text>
        ) : (typeof product.category === 'object' && product.category?.name) ? (
            <Text className="text-[10px] font-bold text-slate-400 tracking-tight" numberOfLines={1}>
                {product.category.name}
            </Text>
        ) : null}
      </View>

      {/* ── BOTTOM ROW (Price & Add Button) ── */}
      <View className="mt-auto flex-row items-end justify-between pt-1">
        <View className="flex-col pb-0.5">
          <Text className="text-[9px] font-bold text-slate-400 line-through leading-none mb-0.5">
            ₹{originalPrice}
          </Text>
          <Text className="text-[13px] font-black text-slate-900 leading-none">
            ₹{currentPrice}
          </Text>
        </View>

        <View>
          {quantity > 0 ? (
            <View className="flex-row items-center justify-between bg-emerald-600 rounded-[6px] h-[26px] w-[64px] px-1 shadow-sm">
              <Pressable onPress={onDecrement} className="w-6 h-full items-center justify-center">
                <Text className="text-white text-[14px] font-bold leading-none">−</Text>
              </Pressable>
              <Text className="text-white text-[11px] font-black">{quantity}</Text>
              <Pressable onPress={onIncrement} className="w-6 h-full items-center justify-center">
                <Text className="text-white text-[14px] font-bold leading-none">+</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={onAddClick}
              disabled={isOutOfStock}
              className={`h-[26px] px-3.5 rounded-[6px] flex-row items-center justify-center shadow-sm ${
                isOutOfStock
                  ? 'bg-slate-100'
                  : 'bg-emerald-50 border border-emerald-200'
              }`}>
              <Text
                className={`font-black text-[10px] tracking-wider ${
                  isOutOfStock ? 'text-slate-400' : 'text-emerald-700'
                }`}>
                ADD
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
