import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Clock } from 'lucide-react-native';

interface ProductCardProps {
  product: any;
  onClick?: () => void;
  onAddClick?: (e: any) => void;
  quantity?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  discount?: string;
  deliveryTime?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  onAddClick,
  quantity = 0,
  onIncrement,
  onDecrement,
  discount = '15%',
  deliveryTime = '10 MINS',
}) => {
  const currentPrice = product.price || 0;
  const originalPrice = Math.floor(currentPrice * 1.15); // 15% more
  const isOutOfStock = product.inStock === false || product.shopIsOpen === false;

  return (
    <Pressable
      onPress={onClick}
      className={`bg-white rounded-[16px] p-2 shadow-sm border border-slate-100 flex-col relative overflow-hidden ${
        isOutOfStock ? 'opacity-60' : ''
      }`}>
      {/* ── DISCOUNT BADGE ── */}
      {product.inStock !== false && product.shopIsOpen !== false && discount && (
        <View className="absolute top-0 left-2 bg-[#2563EB] flex-col items-center justify-center pt-1.5 pb-2 px-1.5 z-10 shadow-sm rounded-b-md">
          <Text className="text-white text-[10px] font-black leading-none">{discount}</Text>
          <Text className="text-white text-[7px] font-bold leading-none mt-0.5">OFF</Text>
        </View>
      )}

      {/* ── IMAGE WRAPPER ── */}
      <View className="w-full aspect-[4/5] rounded-xl bg-[#F8F9FA] mb-2 p-3 flex-col relative overflow-hidden items-center justify-center">
        {product.image ? (
          <Image source={{ uri: product.image }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
        ) : (
          <Text className="text-4xl opacity-50">📦</Text>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <View className="absolute inset-0 bg-white/50 items-center justify-center z-20">
            <Text className="bg-slate-800 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-wider">
              {!product.shopIsOpen ? 'Shop Closed' : 'Out of Stock'}
            </Text>
          </View>
        )}
      </View>

      {/* ── TIME BADGE ── */}
      <View className="flex-row items-center gap-1 bg-slate-50 border border-slate-100 w-fit px-1.5 py-0.5 rounded-[4px] mb-1.5 self-start">
        <Clock size={10} color="#475569" strokeWidth={2.5} />
        <Text className="text-[9px] font-black text-slate-700 tracking-tight">{deliveryTime}</Text>
      </View>

      {/* ── TITLE ── */}
      <Text className="text-[13px] font-bold text-slate-900 leading-tight mb-1 tracking-tight min-h-[30px]" numberOfLines={2}>
        {product.name}{' '}
        {product.quantity && (
          <Text className="text-slate-500 text-[12px]">({product.quantity})</Text>
        )}
      </Text>

      {/* ── SUBTITLE (Weight/Unit) ── */}
      <Text className="text-[11px] font-medium text-slate-500 mb-2" numberOfLines={1}>
        {product.shopId?.name
          ? `By ${product.shopId.name}`
          : product.shopName
          ? `By ${product.shopName}`
          : product.category?.name || product.category || '1 unit'}
      </Text>

      {/* ── BOTTOM ROW (Price & Add Button) ── */}
      <View className="mt-1 flex-row items-end justify-between pt-1">
        <View className="flex-col">
          <Text className="text-[14px] font-black text-slate-900 leading-none mb-0.5">
            ₹{currentPrice}
          </Text>
          <Text className="text-[11px] font-semibold text-slate-400 line-through leading-none">
            ₹{originalPrice}
          </Text>
        </View>

        <View>
          {quantity > 0 ? (
            <View className="flex-row items-center justify-between bg-emerald-700 rounded-[8px] h-8 w-[72px] px-1 shadow-sm">
              <Pressable onPress={onDecrement} className="w-7 h-full items-center justify-center">
                <Text className="text-white text-lg font-bold">−</Text>
              </Pressable>
              <Text className="text-white text-[13px] font-bold">{quantity}</Text>
              <Pressable onPress={onIncrement} className="w-7 h-full items-center justify-center">
                <Text className="text-white text-lg font-bold">+</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={onAddClick}
              disabled={isOutOfStock}
              className={`h-8 px-4 rounded-[8px] border flex-row items-center justify-center ${
                isOutOfStock
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-emerald-600 bg-emerald-50/50 shadow-sm'
              }`}>
              <Text
                className={`font-black text-[12px] ${
                  isOutOfStock ? 'text-slate-300' : 'text-emerald-700'
                }`}>
                ADD
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default ProductCard;
