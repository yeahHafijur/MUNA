import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, ActivityIndicator, Dimensions, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Share2, Minus, Plus, Clock, ShoppingCart, Store, ChevronRight, Shield, Truck, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
    withSpring,
    withSequence,
    withTiming,
    withRepeat,
    FadeIn,
    FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/api/api';
import ProductCard from '@/components/ProductCard';
import { getImageUrl } from '@/utils/format';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 360;

export default function ProductDetailScreen() {
    const { shopId, productId } = useLocalSearchParams();
    const router = useRouter();
    const { cartItems, addToCart, updateQuantity } = useCart();
    const { token } = useAuth();
    const insets = useSafeAreaInsets();

    const [liked, setLiked] = useState(false);
    const cartItem = cartItems.find(i => i.productId === productId);
    const totalCartItems = cartItems.reduce((s, i) => s + i.quantity, 0);

    const scrollY = useSharedValue(0);
    const likeScale = useSharedValue(1);
    const cartBounce = useSharedValue(1);

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Animated header opacity on scroll
    const headerBgStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [IMAGE_HEIGHT - 140, IMAGE_HEIGHT - 80], [0, 1], Extrapolation.CLAMP);
        return { opacity };
    });

    // Parallax image
    const imageAnimStyle = useAnimatedStyle(() => {
        const translateY = interpolate(scrollY.value, [-100, 0, IMAGE_HEIGHT], [-50, 0, IMAGE_HEIGHT * 0.4], Extrapolation.CLAMP);
        const scale = interpolate(scrollY.value, [-200, 0], [1.5, 1], { extrapolateRight: Extrapolation.CLAMP, extrapolateLeft: Extrapolation.EXTEND });
        return { transform: [{ translateY }, { scale }] };
    });

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

    // Cart bounce animation
    useEffect(() => {
        if (totalCartItems > 0) {
            cartBounce.value = withSequence(
                withSpring(1.2, { damping: 5, stiffness: 300 }),
                withSpring(1, { damping: 5, stiffness: 300 })
            );
        }
    }, [totalCartItems]);

    const cartAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cartBounce.value }]
    }));

    const toggleLike = async () => {
        const newLiked = !liked;
        setLiked(newLiked);

        // Heart bounce
        likeScale.value = withSequence(
            withSpring(1.4, { damping: 4, stiffness: 400 }),
            withSpring(1, { damping: 6, stiffness: 300 })
        );

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

    const likeAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: likeScale.value }]
    }));

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
        return <ProductSkeleton />;
    }

    if (!product) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text className="text-5xl mb-3">📦</Text>
                <Text className="text-slate-900 font-black text-lg">Product not found</Text>
                <Text className="text-slate-500 font-medium text-sm mt-1">It may have been removed</Text>
            </View>
        );
    }

    const currentPrice = product.price || 0;
    const originalPrice = Math.floor(currentPrice * 1.15);
    const discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    const isOutOfStock = product.inStock === false || (shop && shop.isOpen === false);
    const imageUrl = getImageUrl(product.image);

    const similarProducts = Array.isArray(allShopProducts)
        ? allShopProducts.filter(p => p._id !== product._id).slice(0, 8)
        : [];

    return (
        <View className="flex-1 bg-[#F8FAFB]">
            <StatusBar style="light" />

            {/* ── FLOATING HEADER ── */}
            <View className="absolute top-0 left-0 right-0 z-50" style={{ paddingTop: insets.top }}>
                {/* Solid background that appears on scroll */}
                <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }, headerBgStyle]} />

                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
                    >
                        <ArrowLeft size={20} color="#fff" />
                    </TouchableOpacity>

                    <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                            onPress={handleShare}
                            className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
                        >
                            <Share2 size={18} color="#fff" />
                        </TouchableOpacity>
                        <Animated.View style={likeAnimStyle}>
                            <TouchableOpacity
                                onPress={toggleLike}
                                className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
                            >
                                <Heart size={18} color={liked ? "#ef4444" : "#fff"} fill={liked ? "#ef4444" : "transparent"} />
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>
            </View>

            <Animated.ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                bounces={true}
            >
                {/* ── HERO IMAGE ── */}
                <View className="overflow-hidden bg-white border-b border-slate-200" style={{ height: IMAGE_HEIGHT }}>
                    <Animated.View style={[{ width: '100%', height: '100%', padding: 40, paddingTop: 80 }, imageAnimStyle]}>
                        {imageUrl ? (
                            <Image
                                source={{ uri: imageUrl }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="contain"
                                transition={300}
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <View className="flex-1 items-center justify-center bg-slate-100">
                                <Text className="text-7xl opacity-30">📦</Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* Gradient overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.05)', 'rgba(248,250,251,1)']}
                        locations={[0.4, 0.75, 1]}
                        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 }}
                    />

                    {/* Discount badge */}
                    {!isOutOfStock && (
                        <View className="absolute top-14 right-0 bg-blue-600 px-3 py-1.5 rounded-l-lg shadow-sm" style={{ elevation: 4 }}>
                            <Text className="text-white text-[11px] font-black tracking-wider">{discountPercent}% OFF</Text>
                        </View>
                    )}

                    {/* Out of stock overlay */}
                    {isOutOfStock && (
                        <View className="absolute inset-0 bg-white/60 items-center justify-center">
                            <View className="bg-slate-900 px-5 py-2 rounded-xl shadow-lg">
                                <Text className="text-white text-sm font-black uppercase tracking-wider">
                                    {shop && !shop.isOpen ? 'Shop Closed' : 'Out of Stock'}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── MAIN CONTENT CARD ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(100)} className="bg-white rounded-t-[28px] -mt-6 pt-6 px-5 pb-4 shadow-sm border-t border-slate-100/50">
                    {/* Product Name */}
                    <Text className="text-[22px] font-black text-slate-900 leading-tight tracking-tight mb-1.5">
                        {product.name}
                    </Text>

                    {/* Unit/Weight */}
                    <Text className="text-[13px] font-semibold text-slate-400 mb-4">
                        {product.quantity || '1 unit'}
                    </Text>

                    {/* Price + Add to Cart Row */}
                    <View className="flex-row items-end justify-between mb-5">
                        <View>
                            <View className="flex-row items-end gap-2">
                                <Text className="text-[28px] font-black text-slate-900 leading-none">₹{currentPrice}</Text>
                                <Text className="text-[15px] font-bold text-slate-400 line-through leading-none pb-1">₹{originalPrice}</Text>
                            </View>
                            <Text className="text-[11px] font-bold text-emerald-600 mt-1">You save ₹{originalPrice - currentPrice}</Text>
                        </View>

                        <View>
                            {cartItem && cartItem.quantity > 0 ? (
                                <View className="flex-row items-center justify-between bg-emerald-600 rounded-2xl h-[46px] w-[120px] px-2 shadow-md" style={{ elevation: 4 }}>
                                    <TouchableOpacity
                                        onPress={() => updateQuantity(product._id, cartItem.quantity - 1)}
                                        className="w-9 h-full items-center justify-center"
                                    >
                                        <Minus size={16} color="#fff" strokeWidth={3} />
                                    </TouchableOpacity>
                                    <Text className="text-white text-[16px] font-black">{cartItem.quantity}</Text>
                                    <TouchableOpacity
                                        onPress={() => updateQuantity(product._id, cartItem.quantity + 1)}
                                        className="w-9 h-full items-center justify-center"
                                    >
                                        <Plus size={16} color="#fff" strokeWidth={3} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    disabled={isOutOfStock}
                                    onPress={() => addToCart(product, shopId as string)}
                                    className={`h-[46px] w-[120px] rounded-2xl flex-row items-center justify-center shadow-md
                                    ${isOutOfStock ? 'bg-slate-200' : 'bg-emerald-600'}`}
                                    style={{ elevation: 4 }}
                                >
                                    <Plus size={16} color={isOutOfStock ? '#94a3b8' : '#fff'} strokeWidth={3} />
                                    <Text className={`text-[15px] font-black ml-1 ${isOutOfStock ? 'text-slate-400' : 'text-white'}`}>
                                        ADD
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Delivery Info Chips */}
                    <View className="flex-row gap-2 mb-5">
                        <View className="flex-row items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                            <Clock size={14} color="#d97706" />
                            <Text className="text-amber-700 text-[12px] font-bold">15 min delivery</Text>
                        </View>
                        <View className="flex-row items-center gap-1.5 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                            <Shield size={14} color="#2563eb" />
                            <Text className="text-blue-700 text-[12px] font-bold">Quality</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* ── PRODUCT DETAILS SECTION ── */}
                <View className="bg-white mt-2 px-5 py-5">
                    <Text className="text-[16px] font-black text-slate-900 mb-3 tracking-tight">Product Details</Text>
                    <Text className="text-[14px] text-slate-600 leading-[22px]">
                        {product.description || 'Premium quality product sourced from trusted suppliers. Delivered fresh to your door in 15 minutes with our quick delivery promise.'}
                    </Text>

                    {/* Info grid */}
                    <View className="flex-row mt-4 pt-4 border-t border-slate-100">
                        <View className="flex-1 items-center py-2">
                            <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</Text>
                            <Text className="text-[13px] font-bold text-slate-700">
                                {typeof product.category === 'object' ? product.category?.name : product.category || 'General'}
                            </Text>
                        </View>
                        <View className="w-[1px] bg-slate-100" />
                        <View className="flex-1 items-center py-2">
                            <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit</Text>
                            <Text className="text-[13px] font-bold text-slate-700">{product.quantity || '1 unit'}</Text>
                        </View>
                        <View className="w-[1px] bg-slate-100" />
                        <View className="flex-1 items-center py-2">
                            <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</Text>
                            <Text className={`text-[13px] font-bold ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                                {isOutOfStock ? 'Unavailable' : 'In Stock'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── SHOP CARD ── */}
                {shop && (
                    <TouchableOpacity
                        onPress={() => router.push(`/shop/${shopId}` as any)}
                        className="bg-white mt-2 mx-0 px-5 py-4 flex-row items-center"
                        activeOpacity={0.7}
                    >
                        <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mr-3 overflow-hidden">
                            {shop.image ? (
                                <Image source={{ uri: getImageUrl(shop.image) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                            ) : (
                                <Store size={22} color="#64748b" />
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-[15px] font-black text-slate-900 tracking-tight">{shop.name}</Text>
                            <View className="flex-row items-center gap-2 mt-0.5">
                                <View className={`w-1.5 h-1.5 rounded-full ${shop.isOpen !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <Text className="text-[12px] font-semibold text-slate-500">
                                    {shop.isOpen !== false ? 'Open now' : 'Closed'}
                                </Text>
                                {shop.rating && (
                                    <>
                                        <Text className="text-slate-300">•</Text>
                                        <View className="flex-row items-center gap-0.5">
                                            <Star size={11} color="#fbbf24" fill="#fbbf24" />
                                            <Text className="text-[12px] font-bold text-slate-600">{shop.rating}</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                        <View className="bg-slate-100 w-8 h-8 rounded-full items-center justify-center">
                            <ChevronRight size={16} color="#64748b" />
                        </View>
                    </TouchableOpacity>
                )}

                {/* ── MORE FROM THIS STORE ── */}
                {similarProducts.length > 0 && (
                    <View className="mt-2 bg-white pt-5 pb-6">
                        <View className="px-5 mb-4 flex-row items-center justify-between">
                            <View>
                                <Text className="text-[16px] font-black text-slate-900 tracking-tight">More from this store</Text>
                                <Text className="text-[12px] font-medium text-slate-400 mt-0.5">{similarProducts.length} similar products</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push(`/shop/${shopId}` as any)}
                                className="bg-slate-100 px-3 py-1.5 rounded-full"
                            >
                                <Text className="text-[12px] font-bold text-slate-700">View All</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                        >
                            {similarProducts.map(p => (
                                <View key={p._id} className="w-[150px] mb-2">
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
                    </View>
                )}

                <View className="h-28" />
            </Animated.ScrollView>

            {/* ── FLOATING CART BUTTON ── */}
            {totalCartItems > 0 && (
                <Animated.View
                    style={cartAnimStyle}
                    className="absolute bottom-6 right-5 z-50"
                >
                    <TouchableOpacity
                        onPress={() => router.push('/cart' as any)}
                        className="bg-amber-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
                        style={{ elevation: 10 }}
                    >
                        <ShoppingCart size={22} color="#0f172a" />
                        <View className="absolute -top-1 -right-1 bg-red-600 w-5 h-5 rounded-full items-center justify-center border-2 border-white">
                            <Text className="text-white text-[9px] font-black">{totalCartItems}</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}

/* ── SKELETON LOADER ── */
const SkeletonBlock = ({ className, style }: any) => {
    const opacity = useSharedValue(0.4);
    useEffect(() => {
        opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return <Animated.View className={`bg-slate-200 ${className}`} style={[style, animatedStyle]} />;
};

function ProductSkeleton() {
    return (
        <View className="flex-1 bg-white">
            <SkeletonBlock className="w-full" style={{ height: IMAGE_HEIGHT }} />
            <View className="px-5 pt-6">
                <SkeletonBlock className="w-3/4 h-6 rounded-lg mb-2" />
                <SkeletonBlock className="w-1/3 h-4 rounded-lg mb-5" />
                <View className="flex-row justify-between items-end mb-5">
                    <SkeletonBlock className="w-24 h-8 rounded-lg" />
                    <SkeletonBlock className="w-28 h-11 rounded-2xl" />
                </View>
                <View className="flex-row gap-2 mb-5">
                    <SkeletonBlock className="w-28 h-9 rounded-xl" />
                    <SkeletonBlock className="w-28 h-9 rounded-xl" />
                    <SkeletonBlock className="w-20 h-9 rounded-xl" />
                </View>
                <SkeletonBlock className="w-full h-px mb-5" />
                <SkeletonBlock className="w-1/2 h-5 rounded-lg mb-3" />
                <SkeletonBlock className="w-full h-4 rounded-lg mb-2" />
                <SkeletonBlock className="w-4/5 h-4 rounded-lg" />
            </View>
        </View>
    );
}
