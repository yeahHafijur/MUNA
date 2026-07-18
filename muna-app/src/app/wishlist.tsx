import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import api from '@/api/api';
import ProductCard from '@/components/ProductCard';

export default function WishlistScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { addToCart } = useCart();
    const { colors, isDark } = useTheme();

    const { data: wishlistItems = [], isLoading } = useQuery({
        queryKey: ['wishlist'],
        queryFn: async () => {
            if (!token) return [];
            const res = await api.get('/api/user/wishlist');
            return res.data;
        },
        enabled: !!token
    });

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View className="pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color={colors.icon} />
                </TouchableOpacity>
                <Text style={{ color: colors.primaryText }} className="text-[18px] font-black">Your Wishlist</Text>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : wishlistItems.length === 0 ? (
                <View className="flex-1 items-center justify-center p-4">
                    <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: colors.dangerMuted }}>
                        <Heart size={40} color={colors.danger} />
                    </View>
                    <Text style={{ color: colors.primaryText }} className="text-[18px] font-black mb-2">Wishlist is empty</Text>
                    <Text style={{ color: colors.secondaryText }} className="text-[13px] font-medium text-center px-6">
                        Save items you love here by tapping the heart icon on any product.
                    </Text>
                    <TouchableOpacity 
                        onPress={() => router.push('/')}
                        className="mt-6 px-6 py-3 rounded-xl shadow-sm"
                        style={{ backgroundColor: colors.primaryText }}
                    >
                        <Text style={{ color: colors.invertedText }} className="font-black text-[14px]">Explore Products</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView 
                    className="flex-1 px-4 pt-4" 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    <View className="flex-row flex-wrap justify-between gap-y-4">
                        {wishlistItems.map((item: any) => (
                            <View key={item._id} className="w-[48%] h-[260px]">
                                <ProductCard 
                                    product={item}
                                    onClick={() => {
                                        const shopId = item.shopId?._id || item.shopId;
                                        router.push(`/product/${shopId}/${item._id}`);
                                    }}
                                    onAddClick={() => addToCart(item, item.shopId?._id || item.shopId)}
                                />
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
