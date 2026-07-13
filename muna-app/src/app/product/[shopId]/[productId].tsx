import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Share, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Share as ShareIcon, Minus, Plus } from 'lucide-react-native';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/api/api';
import ProductCard from '@/components/ProductCard';
import { getImageUrl } from '@/utils/format';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
    const { shopId, productId } = useLocalSearchParams();
    const router = useRouter();
    const { cartItems, addToCart, updateQuantity } = useCart();
    const { token } = useAuth();

    const [liked, setLiked] = useState(false);
    const cartItem = cartItems.find(i => i.productId === productId);

    useEffect(() => {
        const checkLiked = async () => {
            const savedStr = await AsyncStorage.getItem('muna_likes');
            if (savedStr) {
                const savedLikes = JSON.parse(savedStr);
                if (savedLikes[productId as string]) setLiked(true);
            }
        };
        checkLiked();
    }, [productId]);

    const toggleLike = async () => {
        const newLiked = !liked;
        setLiked(newLiked);

        const savedStr = await AsyncStorage.getItem('muna_likes');
        const savedLikes = savedStr ? JSON.parse(savedStr) : {};
        if (newLiked) savedLikes[productId as string] = true;
        else delete savedLikes[productId as string];
        await AsyncStorage.setItem('muna_likes', JSON.stringify(savedLikes));

        if (token) {
            try {
                if (newLiked) {
                    await api.post(`/api/user/wishlist/${productId}`);
                } else {
                    await api.delete(`/api/user/wishlist/${productId}`);
                }
            } catch (err) {
                console.error('Wishlist sync failed', err);
            }
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this product on MUNA! https://www.munahut.in/shop/${shopId}/product/${productId}`,
            });
        } catch (error) {
            console.error('Error sharing', error);
        }
    };

    const { data: shop, isLoading: shopLoading } = useQuery({
        queryKey: ['shop', shopId],
        queryFn: async () => {
            const res = await api.get(`/api/shops/${shopId}`);
            return res.data;
        },
    });

    const { data: product, isLoading: productLoading } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const res = await api.get(`/api/products/detail/${productId}`);
            return res.data;
        },
    });

    const { data: allShopProducts = [] } = useQuery({
        queryKey: ['products', shopId],
        queryFn: async () => {
            const res = await api.get(`/api/products/${shopId}`);
            return res.data;
        },
    });

    const isLoading = shopLoading || productLoading;

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#fbbf24" />
            </View>
        );
    }

    if (!product) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text>Product not found.</Text>
            </View>
        );
    }

    const currentPrice = product.price || 0;
    const originalPrice = Math.floor(currentPrice * 1.15); // 15% more
    const isOutOfStock = product.inStock === false || (shop && shop.isOpen === false);

    const imageUrl = getImageUrl(product.image);

    const similarProducts = Array.isArray(allShopProducts) 
        ? allShopProducts.filter(p => p._id !== product._id).slice(0, 8)
        : [];

    return (
        <View className="flex-1 bg-white">
            {/* Header Actions */}
            <View className="absolute top-10 left-4 right-4 z-50 flex-row justify-between items-center">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-sm"
                >
                    <ArrowLeft size={20} color="#0f172a" />
                </TouchableOpacity>
                <View className="flex-row gap-2">
                    <TouchableOpacity 
                        onPress={handleShare}
                        className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-sm"
                    >
                        <ShareIcon size={18} color="#0f172a" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={toggleLike}
                        className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-sm"
                    >
                        <Heart size={18} color={liked ? "#ef4444" : "#0f172a"} fill={liked ? "#ef4444" : "transparent"} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1">
                {/* Product Image */}
                <View className="w-full h-80 bg-[#F8F9FA] relative items-center justify-center pt-8">
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="contain" />
                    ) : (
                        <Text className="text-6xl opacity-30">📦</Text>
                    )}
                    {isOutOfStock && (
                        <View className="absolute inset-0 bg-white/50 items-center justify-center">
                            <View className="bg-slate-900 px-4 py-1.5 rounded shadow-sm">
                                <Text className="text-white text-xs font-black uppercase tracking-wider">
                                    {shop && !shop.isOpen ? 'Shop Closed' : 'Out of Stock'}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Product Info */}
                <View className="px-5 py-6">
                    <View className="bg-blue-600 self-start px-2 py-0.5 rounded shadow-sm mb-3">
                        <Text className="text-white text-[10px] font-black tracking-widest">15% OFF</Text>
                    </View>

                    <Text className="text-2xl font-black text-slate-900 leading-tight mb-2">
                        {product.name}
                    </Text>

                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-[13px] font-medium text-slate-500">
                            {product.quantity || '1 unit'}
                        </Text>
                        <View className="bg-amber-50 px-2 py-1 rounded border border-amber-100 flex-row items-center gap-1">
                            <Text className="text-amber-700 text-xs font-bold">15 min delivery</Text>
                            <Text className="text-xs">⚡</Text>
                        </View>
                    </View>

                    <View className="flex-row items-end justify-between py-4 border-t border-slate-100">
                        <View>
                            <Text className="text-slate-400 text-xs font-bold mb-1 uppercase">Price</Text>
                            <View className="flex-row items-end gap-2">
                                <Text className="text-2xl font-black text-slate-900 leading-none">₹{currentPrice}</Text>
                                <Text className="text-sm font-semibold text-slate-400 line-through leading-none pb-0.5">₹{originalPrice}</Text>
                            </View>
                        </View>
                        
                        <View>
                            {cartItem && cartItem.quantity > 0 ? (
                                <View className="flex-row items-center justify-between bg-emerald-700 rounded-xl h-12 w-[110px] px-2 shadow-sm">
                                    <TouchableOpacity 
                                        onPress={() => updateQuantity(product._id, cartItem.quantity - 1)}
                                        className="w-8 h-full items-center justify-center"
                                    >
                                        <Minus size={18} color="#fff" />
                                    </TouchableOpacity>
                                    <Text className="text-white text-[15px] font-bold">{cartItem.quantity}</Text>
                                    <TouchableOpacity 
                                        onPress={() => updateQuantity(product._id, cartItem.quantity + 1)}
                                        className="w-8 h-full items-center justify-center"
                                    >
                                        <Plus size={18} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    disabled={isOutOfStock}
                                    onPress={() => addToCart(product, shopId as string)}
                                    className={`h-12 w-[110px] rounded-xl flex-row items-center justify-center shadow-sm
                                    ${isOutOfStock ? 'bg-slate-100' : 'bg-emerald-600'}`}
                                >
                                    <Text className={`text-[15px] font-bold ${isOutOfStock ? 'text-slate-400' : 'text-white'}`}>
                                        ADD
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View className="mt-4 pt-6 border-t border-slate-100">
                        <Text className="text-[15px] font-black text-slate-900 mb-3">Product Details</Text>
                        <Text className="text-[14px] text-slate-600 leading-relaxed">
                            {product.description || 'Premium quality product delivered fresh to your door in 15 minutes.'}
                        </Text>
                    </View>
                </View>

                {/* More From This Store */}
                <View className="mt-2 bg-white pt-6 pb-8 border-t-8 border-slate-50">
                    <View className="px-5 mb-4 flex-row items-center justify-between">
                        <View>
                            <Text className="text-[16px] font-black text-slate-900">More from this store</Text>
                            {shop && <Text className="text-[12px] font-medium text-slate-500 mt-0.5">{shop.name}</Text>}
                        </View>
                        <TouchableOpacity 
                            onPress={() => router.push(`/shop/${shopId}` as any)}
                            className="bg-slate-100 px-3 py-1.5 rounded-full"
                        >
                            <Text className="text-[12px] font-bold text-slate-700">View All</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {similarProducts.length > 0 ? (
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                        >
                            {similarProducts.map(p => (
                                <View key={p._id} className="w-[140px] mb-2">
                                    <ProductCard 
                                        product={p}
                                        onClick={() => router.push(`/product/${shopId}/${p._id}` as any)}
                                        onAddClick={() => addToCart(p, shopId as string)}
                                        quantity={cartItems.find(item => item.productId === p._id)?.quantity || 0}
                                        onIncrement={() => updateQuantity(p._id, (cartItems.find(item => item.productId === p._id)?.quantity || 0) + 1)}
                                        onDecrement={() => updateQuantity(p._id, (cartItems.find(item => item.productId === p._id)?.quantity || 0) - 1)}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View className="px-5 py-4 bg-slate-50 rounded-xl mx-5 items-center justify-center">
                            <Text className="text-slate-500 font-medium text-[13px]">Explore the full catalog in the store.</Text>
                        </View>
                    )}
                    
                    <View className="px-5 mt-6">
                        <TouchableOpacity 
                            onPress={() => router.push(`/shop/${shopId}` as any)}
                            className="w-full py-3.5 bg-slate-900 rounded-xl flex-row justify-center items-center"
                        >
                            <Text className="text-white font-black text-[14px]">Visit {shop?.name || 'Store'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="h-10" />
            </ScrollView>
        </View>
    );
}
