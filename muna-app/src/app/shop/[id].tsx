import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search as SearchIcon, MapPin, Clock, Star } from 'lucide-react-native';
import { useCart } from '@/context/CartContext';
import api from '@/api/api';
import ProductCard from '@/components/ProductCard';
import { getImageUrl } from '@/utils/format';

export default function ShopDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { addToCart, overrideAndReplaceCart, cartItems, getTotal, updateQuantity } = useCart();

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const totalCartItems = cartItems.reduce((s, i) => s + i.quantity, 0);
    const cartTotal = getTotal();

    const { data: shop, isLoading: shopLoading } = useQuery({
        queryKey: ['shop', id],
        queryFn: async () => {
            const res = await api.get(`/api/shops/${id}`);
            return res.data;
        },
    });

    const { data: productsData = [], isLoading: productsLoading } = useQuery({
        queryKey: ['products', id],
        queryFn: async () => {
            const res = await api.get(`/api/products/${id}`);
            return res.data;
        },
    });
    const products = Array.isArray(productsData) ? productsData : [];

    const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories', id],
        queryFn: async () => {
            const res = await api.get(`/api/categories/${id}`);
            return res.data;
        },
    });
    const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];

    const loading = shopLoading || productsLoading || categoriesLoading;

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
            const pCatName = typeof p.category === 'object' ? (p.category?.name || 'General') : (p.category || 'General');
            if (selectedCategory && selectedCategory !== 'All' && pCatName !== selectedCategory) return false;
            if (searchQuery) {
                return p.name.toLowerCase().includes(searchQuery.toLowerCase());
            }
            return true;
        });
    }, [products, selectedCategory, searchQuery]);

    const handleAddToCart = (product: any, shopId: string) => {
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
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#fbbf24" />
            </View>
        );
    }

    if (!shop) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text>Shop not found.</Text>
            </View>
        );
    }

    const shopImageUrl = getImageUrl(shop.image);

    return (
        <View className="flex-1 bg-white">
            <ScrollView className="flex-1" stickyHeaderIndices={[1]}>
                
                {/* 1. Hero Image Section (Scrolls away, hidden in category view) */}
                <View>
                    {(selectedCategory === null && !searchQuery) && (
                        <>
                            <View className="absolute top-10 left-4 z-50">
                                <TouchableOpacity 
                                    onPress={() => router.back()}
                                    className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-sm"
                                >
                                    <ArrowLeft size={20} color="#0f172a" />
                                </TouchableOpacity>
                            </View>
                            <View className="w-full aspect-[4/3] bg-slate-100 relative">
                                {shopImageUrl ? (
                                    <Image source={{ uri: shopImageUrl }} className="w-full h-full" contentFit="cover" />
                                ) : (
                                    <View className="flex-1 items-center justify-center bg-amber-50">
                                        <Text className="text-6xl">🏪</Text>
                                    </View>
                                )}
                                <View className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
                                
                                <View className="absolute bottom-4 left-4 right-4">
                                    <Text className="text-2xl font-black text-white mb-1" numberOfLines={1}>{shop.name}</Text>
                                    <View className="flex-row items-center gap-4">
                                        <View className="flex-row items-center gap-1 bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
                                            <Star size={12} color="#fbbf24" fill="#fbbf24" />
                                            <Text className="text-white text-xs font-bold">{shop.rating || '4.5'}</Text>
                                        </View>
                                        <View className="flex-row items-center gap-1 bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
                                            <Clock size={12} color="#fff" />
                                            <Text className="text-white text-xs font-bold">15 min</Text>
                                        </View>
                                        <View className="flex-row items-center gap-1 bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
                                            <MapPin size={12} color="#fff" />
                                            <Text className="text-white text-xs font-bold">{shop.distance ? shop.distance.toFixed(1) + 'km' : 'Nearby'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </>
                    )}
                </View>

                {/* 2. Sticky Header & Search Bar */}
                <View className="bg-white shadow-sm z-40 border-b border-slate-100">
                    
                    {/* Small Header (Only visible when Hero is hidden) */}
                    {(selectedCategory !== null || !!searchQuery) && (
                        <View className="pt-[52px] pb-2 px-4 flex-row items-center gap-3">
                            <TouchableOpacity 
                                onPress={() => { setSelectedCategory(null); setSearchQuery(''); }}
                                className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
                            >
                                <ArrowLeft size={20} color="#0f172a" />
                            </TouchableOpacity>
                            <Text className="flex-1 text-[18px] font-black text-slate-900 tracking-tight" numberOfLines={1}>{shop.name}</Text>
                        </View>
                    )}

                    <View className="px-4 py-3">
                        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 gap-2">
                            <SearchIcon size={16} color="#94a3b8" />
                            <TextInput
                                className="flex-1 text-[13px] font-medium text-slate-900 h-full"
                                placeholder={`Search in ${shop.name}...`}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
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
                                className="px-4 py-1.5 rounded-full border bg-white border-slate-200"
                            >
                                <Text className="text-[13px] font-bold text-slate-600">
                                    ← Categories
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setSelectedCategory('All')}
                                className={`px-4 py-1.5 rounded-full border ${selectedCategory === 'All' ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                            >
                                <Text className={`text-[13px] font-bold ${selectedCategory === 'All' ? 'text-white' : 'text-slate-600'}`}>
                                    📦 All ({products.length})
                                </Text>
                            </TouchableOpacity>
                            {categories.map((cat: any) => {
                                const count = products.filter(p => {
                                    const pCatName = typeof p.category === 'object' ? (p.category?.name || 'General') : (p.category || 'General');
                                    return pCatName === cat;
                                }).length;
                                return (
                                    <TouchableOpacity 
                                        key={cat}
                                        onPress={() => setSelectedCategory(cat)}
                                        className={`px-4 py-1.5 rounded-full border ${selectedCategory === cat ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                                    >
                                        <Text className={`text-[13px] font-bold ${selectedCategory === cat ? 'text-white' : 'text-slate-600'}`}>
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
                                <Text className="text-[17px] font-black text-slate-900 tracking-tight">Browse by Category</Text>
                                <Text className="text-[12px] font-bold text-slate-500">{categories.length + 1} categories</Text>
                            </View>
                            
                            <View className="flex-row flex-wrap justify-between gap-y-4">
                                {/* All Items Card */}
                                <TouchableOpacity 
                                    onPress={() => setSelectedCategory('All')}
                                    className="w-[48%] aspect-[4/3] rounded-[20px] bg-slate-900 overflow-hidden relative justify-center items-center p-4 shadow-sm"
                                >
                                    <Text className="text-white font-black text-lg text-center tracking-tight leading-tight">All Items</Text>
                                    <Text className="text-slate-400 font-bold text-xs mt-1">{products.length} items</Text>
                                </TouchableOpacity>

                                {/* Category Cards */}
                                {categories.map((cat: any) => {
                                    const count = products.filter(p => {
                                        const pCatName = typeof p.category === 'object' ? (p.category?.name || 'General') : (p.category || 'General');
                                        return pCatName === cat;
                                    }).length;
                                    
                                    const catObj = categoriesList.find((c: any) => c.name === cat);
                                    const customImg = catObj ? catObj.image : null;

                                    return (
                                        <TouchableOpacity 
                                            key={cat}
                                            onPress={() => setSelectedCategory(cat)}
                                            className="w-[48%] aspect-[4/3] rounded-[20px] bg-slate-50 border border-slate-100 overflow-hidden relative justify-center items-center shadow-sm p-3"
                                        >
                                            {customImg ? (
                                                <>
                                                    <Image source={{ uri: customImg }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} contentFit="cover" />
                                                    <View className="absolute inset-0 bg-black/40" />
                                                    <Text className="text-white font-black text-[15px] text-center z-10 px-1 leading-tight tracking-tight" numberOfLines={2}>{cat}</Text>
                                                    <Text className="text-slate-200 font-bold text-xs mt-1 z-10">{count} items</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Text className="text-3xl mb-1.5 opacity-80">🏷</Text>
                                                    <Text className="text-slate-900 font-black text-[14px] text-center leading-tight tracking-tight" numberOfLines={2}>{cat}</Text>
                                                    <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-wider mt-1">{count} items</Text>
                                                </>
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
                                <Text className="text-slate-900 font-black text-lg">No products found</Text>
                                <Text className="text-slate-500 font-medium text-sm mt-1">Try a different category or search term</Text>
                            </View>
                        ) : (
                            <View className="flex-row flex-wrap justify-between gap-y-4">
                                {filteredProducts.map(prod => (
                                    <View key={prod._id} className="w-[48%] mb-4">
                                        <ProductCard 
                                            product={prod}
                                            onClick={() => router.push(`/product/${id}/${prod._id}` as any)}
                                            onAddClick={() => handleAddToCart(prod, id as string)}
                                            quantity={cartItems.find(item => item.productId === prod._id)?.quantity || 0}
                                            onIncrement={() => {
                                                const q = cartItems.find(item => item.productId === prod._id)?.quantity || 0;
                                                updateQuantity(prod._id, q + 1);
                                            }}
                                            onDecrement={() => {
                                                const q = cartItems.find(item => item.productId === prod._id)?.quantity || 0;
                                                updateQuantity(prod._id, q - 1);
                                            }}
                                        />
                                    </View>
                                ))}
                            </View>
                        )
                    )}
                </View>
                
                <View className="h-24" />
            </ScrollView>

            {/* View Cart Floating Bar */}
            {totalCartItems > 0 && (
                <View className="absolute bottom-4 left-4 right-4 bg-emerald-600 rounded-2xl p-4 flex-row items-center justify-between shadow-lg">
                    <View>
                        <Text className="text-white font-black text-[15px]">{totalCartItems} item{totalCartItems > 1 ? 's' : ''}</Text>
                        <Text className="text-emerald-100 font-bold text-[12px]">₹{cartTotal}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/cart' as any)} className="bg-white px-4 py-2 rounded-xl">
                        <Text className="text-emerald-700 font-black text-[13px]">View Cart</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
