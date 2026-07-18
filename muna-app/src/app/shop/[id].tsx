// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search as SearchIcon, MapPin, Clock, Star, ShoppingCart, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
    withSpring,
    withSequence,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import api from '@/api/api';
import ProductCard from '@/components/ProductCard';
import { getImageUrl } from '@/utils/format';

const MemoizedShopProductItem = React.memo(({ prod, quantity, shopId, updateQuantity, handleAddToCart, router }: any) => {
    return (
        <View className="w-[48%] mb-4">
            <ProductCard 
                product={prod}
                onClick={() => router.push(`/product/${shopId}/${prod._id}` as any)}
                onAddClick={() => handleAddToCart(prod, shopId)}
                quantity={quantity}
                onIncrement={() => updateQuantity(prod._id, quantity + 1)}
                onDecrement={() => updateQuantity(prod._id, quantity - 1)}
            />
        </View>
    );
});

const SkeletonBlock = ({ className, style, isDark }: any) => {
    const opacity = useSharedValue(0.4);
    useEffect(() => {
        opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return <Animated.View className={`${className}`} style={[{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }, style, animatedStyle]} />;
};

const ShopSkeleton = () => {
    const { colors, isDark } = useTheme();
    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <SkeletonBlock isDark={isDark} className="w-full aspect-[4/3]" />
            <View className="px-4 py-6">
                <View className="flex-row items-center justify-between mb-4">
                    <SkeletonBlock isDark={isDark} className="w-40 h-6 rounded-md" />
                    <SkeletonBlock isDark={isDark} className="w-16 h-4 rounded-md" />
                </View>
                <View className="flex-row flex-wrap justify-between gap-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <SkeletonBlock isDark={isDark} key={i} className="w-[48%] aspect-[4/3] rounded-[20px]" />
                    ))}
                </View>
            </View>
        </View>
    );
};

export default function ShopDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { addToCart, overrideAndReplaceCart, cartItems, getTotal, updateQuantity } = useCart();

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const totalCartItems = cartItems.reduce((s, i) => s + i.quantity, 0);
    const cartTotal = getTotal();

    const { data: shop, isLoading: shopLoading } = useQuery({
        queryKey: ['shop', id],
        queryFn: async ({ signal }) => {
            const res = await api.get(`/api/shops/${id}`, { signal });
            return res.data;
        },
    });

    const { data: productsData = [], isLoading: productsLoading } = useQuery({
        queryKey: ['products', id],
        queryFn: async ({ signal }) => {
            const res = await api.get(`/api/products/${id}`, { signal });
            return res.data;
        },
    });
    const products = Array.isArray(productsData) ? productsData : [];

    const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories', id],
        queryFn: async ({ signal }) => {
            const res = await api.get(`/api/categories/${id}`, { signal });
            return res.data;
        },
    });
    const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];

    const loading = shopLoading || productsLoading || categoriesLoading;

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { 'All': products.length };
        products.forEach(p => {
            const pCatName = typeof p.category === 'object' ? (p.category?.name || 'General') : (p.category || 'General');
            counts[pCatName] = (counts[pCatName] || 0) + 1;
        });
        return counts;
    }, [products]);

    const categories = useMemo(() => {
        const prodCatNames = new Set(products.map(p => {
            if (!p.category) return 'General';
            return typeof p.category === 'object' ? (p.category.name || 'General') : p.category;
        }));
        categoriesList.forEach(c => prodCatNames.add(c.name));
        return Array.from(prodCatNames).sort();
    }, [products, categoriesList]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (!p) return false;
            const pCatName = typeof p.category === 'object' ? (p.category?.name || 'General') : String(p.category || 'General');
            if (selectedCategory && selectedCategory !== 'All' && pCatName !== selectedCategory) return false;
            if (searchQuery) {
                const searchLower = String(searchQuery).toLowerCase();
                const nameLower = String(p.name || '').toLowerCase();
                return nameLower.includes(searchLower);
            }
            return true;
        });
    }, [products, selectedCategory, searchQuery]);

    const handleAddToCart = React.useCallback((product: any, shopId: string) => {
        const result = addToCart(product, shopId);
        if (!result.success && result.error === 'DIFFERENT_SHOP_ERROR') {
            Alert.alert(
                'Replace cart item?',
                'Your cart contains items from another shop. Do you want to discard the selection and add items from this shop?',
                [
                    { text: 'No', style: 'cancel' },
                    { text: 'Replace', onPress: () => overrideAndReplaceCart(product, shopId) }
                ]
            );
        }
    }, [addToCart, overrideAndReplaceCart]);

    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const headerAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [100, 150], [0, 1], Extrapolation.CLAMP);
        return { opacity, pointerEvents: opacity === 0 ? 'none' : 'auto' };
    });

    const heroAnimatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(scrollY.value, [-100, 0], [1.5, 1], {
            extrapolateLeft: Extrapolation.EXTEND,
            extrapolateRight: Extrapolation.CLAMP,
        });
        const translateY = interpolate(scrollY.value, [0, 200], [0, 100], Extrapolation.CLAMP);
        return { transform: [{ scale }, { translateY }] };
    });

    const cartScale = useSharedValue(1);
    useEffect(() => {
        if (totalCartItems > 0) {
            cartScale.value = withSequence(
                withSpring(1.15, { damping: 5, stiffness: 300 }),
                withSpring(1, { damping: 5, stiffness: 300 })
            );
        }
    }, [totalCartItems]);
    const cartAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cartScale.value }]
    }));

    if (loading) {
        return <ShopSkeleton />;
    }

    if (!shop) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
                <Text style={{ color: colors.primaryText }}>Shop not found.</Text>
            </View>
        );
    }

    const shopImageUrl = getImageUrl(shop.image);

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <Animated.ScrollView 
                className="flex-1" 
                stickyHeaderIndices={[1]}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
            >
                
                {/* 1. Hero Image Section */}
                <View className="overflow-hidden">
                    {(selectedCategory === null && !searchQuery) && (
                        <>
                            <View className="absolute top-12 left-4 z-50">
                                <TouchableOpacity 
                                    onPress={() => router.back()}
                                    className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
                                >
                                    <ArrowLeft size={20} color="#ffffff" />
                                </TouchableOpacity>
                            </View>
                            <Animated.View className="w-full aspect-[4/3] bg-slate-100 relative" style={heroAnimatedStyle}>
                                {shopImageUrl ? (
                                    <Image source={{ uri: shopImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                                ) : (
                                    <View className="flex-1 items-center justify-center bg-amber-50">
                                        <Text className="text-6xl">🏪</Text>
                                    </View>
                                )}
                                <LinearGradient colors={['transparent', 'rgba(15, 23, 42, 0.95)']} className="absolute inset-x-0 bottom-0 h-40" />
                                
                                <View className="absolute bottom-4 left-4 right-4">
                                    <Text className="text-3xl font-black text-white mb-2" numberOfLines={1}>{shop.name}</Text>
                                    <View className="flex-row items-center gap-3">
                                        <View className="flex-row items-center gap-1 bg-black/40 px-2 py-1 rounded-full">
                                            <Star size={12} color="#fbbf24" fill="#fbbf24" />
                                            <Text className="text-white text-[11px] font-bold">{shop.rating || '4.5'}</Text>
                                        </View>
                                        <View className="flex-row items-center gap-1 bg-black/40 px-2 py-1 rounded-full">
                                            <Clock size={12} color="#fff" />
                                            <Text className="text-white text-[11px] font-bold">15 min</Text>
                                        </View>
                                        <View className="flex-row items-center gap-1 bg-black/40 px-2 py-1 rounded-full">
                                            <MapPin size={12} color="#fff" />
                                            <Text className="text-white text-[11px] font-bold">{shop.distance ? shop.distance.toFixed(1) + 'km' : 'Nearby'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>
                        </>
                    )}
                </View>

                {/* 2. Sticky Header & Search Bar */}
                <View 
                  className="shadow-sm z-40 border-b relative"
                  style={{ backgroundColor: colors.surface, borderBottomColor: colors.border, elevation: 40, zIndex: 40 }}
                >
                    {/* Animated Solid Header (Always mounted to prevent reanimated crashes) */}
                    <Animated.View 
                        style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface, zIndex: 10, borderBottomColor: colors.border }, (selectedCategory === null && !searchQuery) ? headerAnimatedStyle : { opacity: 1, pointerEvents: 'auto' }]} 
                        className="pt-12 pb-2 px-4 flex-row items-center gap-3 shadow-sm border-b"
                    >
                        <TouchableOpacity 
                            onPress={() => {
                                if (selectedCategory !== null || !!searchQuery) {
                                    setSelectedCategory(null);
                                    setSearchQuery('');
                                } else {
                                    router.back();
                                }
                            }}
                            className="w-10 h-10 rounded-full items-center justify-center border"
                            style={{ backgroundColor: isDark ? colors.elevated : '#f1f5f9', borderColor: colors.border }}
                        >
                            <ArrowLeft size={20} color={colors.icon} />
                        </TouchableOpacity>
                        <Text style={{ color: colors.primaryText }} className="flex-1 text-[18px] font-black tracking-tight" numberOfLines={1}>{shop.name}</Text>
                    </Animated.View>

                    <View className="px-4 py-3 pt-[64px]" style={{ zIndex: 5 }}>
                        <View className="flex-row items-center rounded-[16px] px-4 h-12 gap-3 border shadow-sm" style={{ backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }}>
                            <SearchIcon size={18} color={colors.iconMuted} />
                            <TextInput
                                className="flex-1 text-[14px] font-bold h-full"
                                style={{ color: colors.inputText }}
                                placeholder={`Search in ${shop.name}...`}
                                placeholderTextColor={colors.placeholder}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1 rounded-full border" style={{ backgroundColor: isDark ? colors.elevated : '#e2e8f0', borderColor: colors.border }}>
                                    <X size={14} color={colors.icon} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    
                    {(selectedCategory !== null || !!searchQuery) && (
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 12 }}
                        >
                            <TouchableOpacity 
                                onPress={() => { setSelectedCategory(null); setSearchQuery(''); }}
                                className="px-4 py-1.5 rounded-full border"
                                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                            >
                                <Text className="text-[13px] font-bold" style={{ color: colors.secondaryText }}>
                                    ← Categories
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setSelectedCategory('All')}
                                className={`px-4 py-1.5 rounded-full border`}
                                style={{
                                    backgroundColor: selectedCategory === 'All' ? (isDark ? colors.elevated : colors.primaryText) : colors.surface,
                                    borderColor: selectedCategory === 'All' ? 'transparent' : colors.border
                                }}
                            >
                                <Text className={`text-[13px] font-bold`} style={{ color: selectedCategory === 'All' ? colors.invertedText : colors.secondaryText }}>
                                    📦 All ({products.length})
                                </Text>
                            </TouchableOpacity>
                            {categories.map((cat: any) => {
                                const count = categoryCounts[cat] || 0;
                                const isSelected = selectedCategory === cat;
                                return (
                                    <TouchableOpacity 
                                        key={cat}
                                        onPress={() => setSelectedCategory(cat)}
                                        className={`px-4 py-1.5 rounded-full border`}
                                        style={{
                                            backgroundColor: isSelected ? (isDark ? colors.elevated : colors.primaryText) : colors.surface,
                                            borderColor: isSelected ? 'transparent' : colors.border
                                        }}
                                    >
                                        <Text className={`text-[13px] font-bold`} style={{ color: isSelected ? colors.invertedText : colors.secondaryText }}>
                                            {cat} ({count})
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>

                {/* 4. Main Content (Categories Grid OR Products Grid) */}
                <View className="px-4 py-6">
                    {(selectedCategory === null && !searchQuery) ? (
                        <View>
                            <View className="flex-row items-center justify-between mb-4 px-1">
                                <Text style={{ color: colors.primaryText }} className="text-[17px] font-black tracking-tight">Browse by Category</Text>
                                <Text style={{ color: colors.tertiaryText }} className="text-[12px] font-bold">{categories.length + 1} categories</Text>
                            </View>
                            
                            <View className="flex-row flex-wrap justify-between gap-y-4">
                                {/* All Items Card */}
                                <TouchableOpacity 
                                    onPress={() => setSelectedCategory('All')}
                                    className="w-[48%] aspect-[4/3] rounded-[20px] overflow-hidden relative shadow-sm"
                                >
                                    <LinearGradient colors={['#1e293b', '#0f172a']} className="absolute inset-0" />
                                    <View className="flex-1 justify-center items-center p-4 z-10">
                                        <Text className="text-3xl mb-2">📦</Text>
                                        <Text className="text-white font-black text-[16px] text-center tracking-tight leading-tight">All Items</Text>
                                        <Text className="text-slate-400 font-bold text-xs mt-1">{products.length} items</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Category Cards */}
                                {categories.map((cat: any) => {
                                    const count = categoryCounts[cat] || 0;
                                    
                                    const catObj = categoriesList.find((c: any) => c.name === cat);
                                    const customImg = catObj && catObj.image ? getImageUrl(catObj.image) : null;

                                    return (
                                        <TouchableOpacity 
                                            key={cat}
                                            onPress={() => setSelectedCategory(cat)}
                                            className="w-[48%] aspect-[4/3] rounded-[20px] border overflow-hidden relative shadow-sm"
                                            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                                        >
                                            {customImg ? (
                                                <>
                                                    <Image source={{ uri: customImg }} style={StyleSheet.absoluteFill} contentFit="cover" />
                                                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} className="absolute inset-0" />
                                                    <View className="absolute inset-0 p-3 justify-end items-start">
                                                        <Text className="text-white font-black text-[15px] leading-tight tracking-tight" numberOfLines={2}>{cat}</Text>
                                                        <Text className="text-slate-300 font-bold text-xs mt-1">{count} items</Text>
                                                    </View>
                                                </>
                                            ) : (
                                                <View className="flex-1 justify-center items-center p-3">
                                                    <Text className="text-3xl mb-1.5 opacity-80">🏷</Text>
                                                    <Text style={{ color: colors.primaryText }} className="font-black text-[14px] text-center leading-tight tracking-tight" numberOfLines={2}>{cat}</Text>
                                                    <Text style={{ color: colors.tertiaryText }} className="font-bold text-[10px] uppercase tracking-wider mt-1">{count} items</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    ) : (
                        filteredProducts.length === 0 ? (
                            <View className="items-center justify-center py-12">
                                <Text className="text-5xl mb-3">🔍</Text>
                                <Text style={{ color: colors.primaryText }} className="font-black text-lg">No products found</Text>
                                <Text style={{ color: colors.secondaryText }} className="font-medium text-sm mt-1">Try a different category or search term</Text>
                            </View>
                        ) : (
                            <View className="flex-row flex-wrap justify-between gap-y-4">
                                {filteredProducts.map(prod => (
                                    <MemoizedShopProductItem
                                        key={prod._id}
                                        prod={prod}
                                        shopId={id}
                                        quantity={cartItems.find(item => item.productId === prod._id)?.quantity || 0}
                                        updateQuantity={updateQuantity}
                                        handleAddToCart={handleAddToCart}
                                        router={router}
                                    />
                                ))}
                            </View>
                        )
                    )}
                </View>
                
                <View className="h-28" />
            </Animated.ScrollView>

            {/* View Cart Floating FAB */}
            {totalCartItems > 0 && (
                <Animated.View 
                    style={cartAnimatedStyle}
                    className="absolute bottom-[24px] right-[24px] z-50"
                >
                    <TouchableOpacity 
                        onPress={() => router.push('/cart' as any)}
                        className="bg-amber-500 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-amber-900/30"
                        style={{ elevation: 10 }}
                    >
                        <ShoppingCart size={24} color="#0f172a" />
                        <View className="absolute top-0 right-0 bg-red-600 w-6 h-6 rounded-full items-center justify-center border-2 border-white">
                            <Text className="text-white text-[10px] font-black">{totalCartItems}</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}
