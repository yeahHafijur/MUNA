import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { getImageUrl } from '@/utils/format';
import { Product } from '@/types';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors, isDark } = useTheme();
  const currentPrice = product.price || 0;
  const originalPrice = Math.floor(currentPrice * 1.15); // 15% more
  const isOutOfStock = product.inStock === false || product.shopIsOpen === false;

  return (
    <Pressable
      onPress={onClick}
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 8,
        opacity: isOutOfStock ? 0.6 : 1,
        overflow: 'hidden',
      }}
      className="flex-col relative"
    >
      {/* ── IMAGE WRAPPER ── */}
      <View
        style={{ backgroundColor: isDark ? colors.elevated : '#f8fafc' }}
        className="w-full aspect-[4/5] rounded-[12px] mb-2.5 p-2 flex-col relative overflow-hidden items-center justify-center"
      >
        {product.image ? (
          <Image source={{ uri: getImageUrl(product.image) as string }} style={{ width: '100%', height: '100%' }} contentFit="contain" transition={200} cachePolicy="memory-disk" />
        ) : (
          <Text className="text-4xl opacity-50">📦</Text>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <View style={{ backgroundColor: isDark ? 'rgba(11,18,32,0.7)' : 'rgba(255,255,255,0.7)' }} className="absolute inset-0 items-center justify-center z-20">
            <Text className="text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider" style={{ backgroundColor: colors.primaryText === '#FFFFFF' ? '#3f3f46' : '#0f172a' }}>
              {!product.shopIsOpen ? 'Closed' : 'Out'}
            </Text>
          </View>
        )}
      </View>

      {/* ── TITLE ── */}
      <Text style={{ color: colors.primaryText }} className="text-[13px] font-bold leading-tight mb-0.5 tracking-tight min-h-[36px]" numberOfLines={2}>
        {product.name}
      </Text>

      {/* ── SUBTITLE (Weight/Unit) ── */}
      <View className="mb-2 min-h-[16px] justify-center">
        {product.quantity ? (
            <Text style={{ color: colors.tertiaryText }} className="text-[11px] font-semibold" numberOfLines={1}>
                {product.quantity}
            </Text>
        ) : (typeof product.category === 'object' && product.category?.name) ? (
            <Text style={{ color: colors.tertiaryText }} className="text-[11px] font-semibold" numberOfLines={1}>
                {product.category.name}
            </Text>
        ) : null}
      </View>

      {/* ── BOTTOM ROW (Price & Add Button) ── */}
      <View className="mt-auto flex-row items-end justify-between pt-1">
        <View className="flex-col">
          <Text style={{ color: colors.tertiaryText }} className="text-[10px] font-bold line-through leading-none mb-0.5">
            ₹{originalPrice}
          </Text>
          <Text style={{ color: colors.primaryText }} className="text-[14px] font-black leading-none">
            ₹{currentPrice}
          </Text>
        </View>

        <View>
          {quantity > 0 ? (
            <View className="flex-row items-center justify-between bg-emerald-600 rounded-lg h-[30px] w-[68px] px-1 shadow-sm">
              <Pressable onPress={onDecrement} className="w-6 h-full items-center justify-center">
                <Text className="text-white text-[16px] font-bold leading-none">−</Text>
              </Pressable>
              <Text className="text-white text-[12px] font-black">{quantity}</Text>
              <Pressable onPress={onIncrement} className="w-6 h-full items-center justify-center">
                <Text className="text-white text-[16px] font-bold leading-none">+</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={onAddClick}
              disabled={isOutOfStock}
              style={{
                backgroundColor: isOutOfStock ? colors.disabled : (isDark ? 'rgba(52,211,153,0.15)' : '#ecfdf5'),
                borderColor: isOutOfStock ? 'transparent' : (isDark ? 'rgba(52,211,153,0.3)' : '#a7f3d0'),
                borderWidth: isOutOfStock ? 0 : 1,
              }}
              className="h-[30px] px-4 rounded-lg flex-row items-center justify-center"
            >
              <Text
                style={{ color: isOutOfStock ? colors.disabledText : '#10b981' }}
                className="font-black text-[11px]"
              >
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
