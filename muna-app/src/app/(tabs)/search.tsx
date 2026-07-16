import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, ArrowLeft, Store, Clock } from 'lucide-react-native';
import { useCart } from '@/context/CartContext';
import api from '@/api/api';
import ProductCard from '@/components/ProductCard';

const MemoizedSearchProductItem = React.memo(({ prod, quantity, shopId, updateQuantity, removeFromCart, handleAddToCart, router }: any) => {
    return (
        <View className="w-[48%]">
            <ProductCard
                product={prod}
                quantity={quantity}
                onIncrement={() => updateQuantity(prod._id, quantity + 1)}
                onDecrement={() => {
                    if (quantity === 1) {
                        removeFromCart(prod._id);
                    } else {
                        updateQuantity(prod._id, quantity - 1);
                    }
                }}
                onClick={() => {
                    if (shopId) {
                        router.push(`/product/${shopId}/${prod._id}` as any);
                    }
                }}
                onAddClick={() => {
                    if (shopId) {
                        handleAddToCart(prod, shopId);
                    }
                }}
            />
        </View>
    );
});

export default function SearchScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { cartItems, addToCart, overrideAndReplaceCart, updateQuantity, removeFromCart } = useCart();
    const inputRef = useRef<TextInput>(null);

    const [query, setQuery] = useState(params.q ? String(params.q) : '');
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 400);
        return () => clearTimeout(timer);
    }, [query]);

    // Update query if passed from route params
    useEffect(() => {
        if (params.q) setQuery(String(params.q));
    }, [params.q]);

    const { data: searchResults, isLoading } = useQuery({
        queryKey: ['search', debouncedQuery],
        queryFn: async ({ signal }) => {
            if (!debouncedQuery.trim()) return { products: [], shops: [] };
            const res = await api.get(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, { signal });
            return res.data;
        },
        enabled: debouncedQuery.trim().length > 0
    });

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

    const renderHeader = () => (
        <View className="px-4 pt-4">
            {!debouncedQuery ? (
                <View className="pt-2">
                    {/* Trending Searches */}
                    <View className="mb-6">
                        <Text className="text-[14px] font-black text-slate-900 mb-3 px-1">Trending Searches</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {['Milk & Bread', 'Fresh Vegetables', 'Maggi', 'Cold Drinks', 'Chicken', 'Eggs', 'Snacks'].map((item, idx) => (
                                <TouchableOpacity 
                                    key={idx}
                                    onPress={() => setQuery(item)}
                                    className="bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm"
                                >
                                    <Text className="text-[13px] font-bold text-slate-700">{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Popular Categories */}
                    <View>
                        <Text className="text-[14px] font-black text-slate-900 mb-3 px-1">Explore Categories</Text>
                        <View className="flex-row flex-wrap justify-between gap-y-3">
                            {[
                                { icon: '🥦', name: 'Vegetables' },
                                { icon: '🍎', name: 'Fruits' },
                                { icon: '🍗', name: 'Meat & Fish' },
                                { icon: '🥛', name: 'Dairy' },
                                { icon: '🍫', name: 'Sweets' },
                                { icon: '🧼', name: 'Cleaning' },
                            ].map((cat, idx) => (
                                <TouchableOpacity 
                                    key={idx}
                                    onPress={() => setQuery(cat.name)}
                                    className="w-[31%] bg-white border border-slate-100 rounded-2xl p-3 items-center shadow-sm"
                                >
                                    <Text className="text-3xl mb-2">{cat.icon}</Text>
                                    <Text className="text-[11px] font-bold text-slate-700 text-center">{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View className="items-center justify-center pt-10 opacity-40">
                        <Text className="text-4xl mb-2">🛒</Text>
                        <Text className="text-[12px] font-bold text-slate-500 text-center">
                            Type to find products & stores
                        </Text>
                    </View>
                </View>
            ) : isLoading ? (
                <View className="items-center justify-center pt-12">
                    <ActivityIndicator size="large" color="#fbbf24" />
                </View>
            ) : (
                <View className="gap-6 mb-4">
                    {/* SHOPS SECTION */}
                    {searchResults?.shops?.length > 0 && (
                        <View>
                            <Text className="text-[15px] font-black text-slate-900 mb-3">Stores</Text>
                            <View className="gap-3">
                                {searchResults.shops.map((shop: any) => (
                                    <TouchableOpacity
                                        key={shop._id}
                                        onPress={() => router.push(`/shop/${shop._id}`)}
                                        className="bg-white p-3 rounded-xl border border-slate-100 flex-row items-center shadow-sm"
                                    >
                                        <View className="w-12 h-12 bg-amber-50 rounded-lg items-center justify-center mr-3">
                                            <Store size={24} color="#d97706" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[15px] font-bold text-slate-900">{shop.name}</Text>
                                            <Text className="text-[12px] text-slate-500">{shop.category || 'Grocery'}</Text>
                                        </View>
                                        <View className="bg-slate-50 px-2 py-1 rounded flex-row items-center">
                                            <Clock size={12} color="#64748b" />
                                            <Text className="text-[10px] font-bold text-slate-600 ml-1">15 min</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* PRODUCTS SECTION TITLE */}
                    {searchResults?.products?.length > 0 && (
                        <Text className="text-[15px] font-black text-slate-900">Products</Text>
                    )}
                </View>
            )}
        </View>
    );

    const renderEmpty = () => {
        if (debouncedQuery && !isLoading && searchResults?.products?.length === 0 && searchResults?.shops?.length === 0) {
            return (
                <View className="items-center justify-center pt-16">
                    <Text className="text-5xl mb-3">🔍</Text>
                    <Text className="text-[15px] font-black text-slate-600">No results found</Text>
                    <Text className="text-[13px] font-medium text-slate-400 text-center mt-1">
                        Try checking for typos or using more general terms
                    </Text>
                </View>
            );
        }
        return null;
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header / Search Bar */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-3 shadow-sm flex-row items-center gap-3 z-10">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 flex-row items-center gap-2">
                    <SearchIcon size={18} color="#94a3b8" />
                    <TextInput
                        ref={inputRef}
                        className="flex-1 text-[15px] font-medium text-slate-900 h-full"
                        placeholder="Search for groceries, veggies..."
                        placeholderTextColor="#94a3b8"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')} className="p-1">
                            <Text className="text-slate-400 font-bold text-xs">✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Main Content */}
            <FlatList 
                className="flex-1 bg-slate-50"
                keyboardShouldPersistTaps="handled"
                data={(!debouncedQuery || isLoading) ? [] : (searchResults?.products || [])}
                keyExtractor={(item) => item._id.toString()}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                renderItem={({ item: prod }) => {
                    const cartItem = cartItems.find((item: any) => item.productId === prod._id);
                    const quantity = cartItem ? cartItem.quantity : 0;
                    const shopId = prod.shopId?._id || prod.shopId;
                    return (
                        <MemoizedSearchProductItem
                            key={prod._id}
                            prod={prod}
                            quantity={quantity}
                            shopId={shopId}
                            updateQuantity={updateQuantity}
                            removeFromCart={removeFromCart}
                            handleAddToCart={handleAddToCart}
                            router={router}
                        />
                    );
                }}
            />
        </View>
    );
}
