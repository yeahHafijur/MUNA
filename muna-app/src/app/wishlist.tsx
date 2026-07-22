import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import api from '@/api/api';
import ProductCard from '@/components/ProductCard';

export default function WishlistScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { addToCart } = useCart();

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
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-[18px] font-black text-slate-900">Your Wishlist</Text>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#fbbf24" />
                </View>
            ) : wishlistItems.length === 0 ? (
                <View className="flex-1 items-center justify-center p-4">
                    <View className="w-20 h-20 bg-rose-50 rounded-full items-center justify-center mb-4">
                        <Heart size={40} color="#ef4444" />
                    </View>
                    <Text className="text-[18px] font-black text-slate-900 mb-2">Wishlist is empty</Text>
                    <Text className="text-[13px] font-medium text-slate-500 text-center px-6">
                        Save items you love here by tapping the heart icon on any product.
                    </Text>
                    <TouchableOpacity 
                        onPress={() => router.push('/')}
                        className="mt-6 bg-slate-900 px-6 py-3 rounded-xl shadow-sm"
                    >
                        <Text className="text-white font-black text-[14px]">Explore Products</Text>
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
