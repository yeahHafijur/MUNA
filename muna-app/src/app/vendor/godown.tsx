import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, Box } from 'lucide-react-native';
import { Image } from 'expo-image';
import { getImageUrl } from '@/utils/format';
import api from '@/api/api';

export default function GodownBrowser() {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [importingId, setImportingId] = useState<string | null>(null);

    const { data: shop, isLoading: isShopLoading } = useQuery({
        queryKey: ['my-shop'],
        queryFn: async () => {
            const res = await api.get('/api/shops/my-shop');
            return res.data;
        },
        enabled: !!user
    });

    const { data: masterItems = [], isLoading: isItemsLoading } = useQuery({
        queryKey: ['master-products'],
        queryFn: async () => {
            const res = await api.get('/api/master-products');
            return res.data;
        }
    });

    const importMutation = useMutation({
        mutationFn: async (item: any) => {
            if (!shop?._id) throw new Error("No shop found");
            setImportingId(item._id);

            // Step A: Ensure category exists
            let catId = '';
            try {
                const catRes = await api.post('/api/categories', { name: item.category || 'General' });
                catId = catRes.data._id;
            } catch (err: any) {
                if (err.response?.status === 400) {
                    // Category exists, fetch it
                    const allCatsRes = await api.get(`/api/categories/${shop._id}`);
                    const existing = allCatsRes.data.find((c: any) => c.name === (item.category || 'General'));
                    if (existing) catId = existing._id;
                } else {
                    throw err;
                }
            }

            // Step B: Create product
            const prodRes = await api.post('/api/products', {
                name: item.name,
                price: 0,
                categoryId: catId,
                category: item.category || 'General',
                image: item.image,
                stock: 0
            });

            return prodRes.data;
        },
        onSuccess: (data, item) => {
            Alert.alert("Success", `✅ ${item.name} imported! Set its price in your catalog.`);
            queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
        },
        onError: () => {
            Alert.alert("Error", "❌ Failed to import item");
        },
        onSettled: () => {
            setImportingId(null);
        }
    });

    const categories = useMemo(() => {
        return ['All', ...new Set(masterItems.map((item: any) => item.category || 'General'))] as string[];
    }, [masterItems]);

    const filteredItems = useMemo(() => {
        return masterItems.filter((item: any) => {
            const matchCat = activeCategory === 'All' || item.category === activeCategory;
            const matchQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCat && matchQuery;
        });
    }, [masterItems, activeCategory, searchQuery]);

    if (isShopLoading || isItemsLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <Box size={40} color="#fbbf24" className="mb-4" />
                <ActivityIndicator size="large" color="#fbbf24" />
                <Text className="text-amber-600 font-black tracking-[0.2em] text-xs uppercase mt-4">Loading Godown</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            {/* Header */}
            <View className="bg-white pt-12 pb-3 px-4 shadow-sm border-b border-slate-100 flex-row items-center gap-3 z-10">
                <TouchableOpacity onPress={() => router.push('/vendor')} className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center">
                    <ArrowLeft size={20} color="#334155" />
                </TouchableOpacity>
                <Text className="text-[18px] font-extrabold text-slate-900 tracking-tight">Master Godown</Text>
            </View>

            <View className="flex-1">
                <View className="bg-white px-4 py-4 border-b border-slate-100">
                    <Text className="text-[12px] font-semibold text-slate-500 mb-4">Import pre-approved items to your catalog instantly.</Text>

                    {/* Search */}
                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 mb-4">
                        <Search size={18} color="#94a3b8" />
                        <TextInput 
                            className="flex-1 ml-2 text-[14px] font-bold text-slate-800"
                            placeholder="Search Godown items..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Category Chips */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
                        {categories.map((cat) => {
                            const isActive = activeCategory === cat;
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-full border ${isActive ? 'bg-amber-400 border-amber-400 shadow-sm' : 'bg-white border-slate-200'}`}
                                >
                                    <Text className={`text-[12px] font-black ${isActive ? 'text-amber-950' : 'text-slate-600'}`}>{cat}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Grid */}
                <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                    {filteredItems.length === 0 ? (
                        <View className="items-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm mt-4">
                            <Text className="text-4xl mb-2 opacity-50">📦</Text>
                            <Text className="text-slate-900 font-extrabold text-lg mb-1">No items found</Text>
                            <Text className="text-slate-500 font-medium text-sm">We couldn't find anything matching "{searchQuery}"</Text>
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap gap-3">
                            {filteredItems.map((item: any) => {
                                const isImporting = importingId === item._id;
                                return (
                                    <View key={item._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden w-[48%] mb-2">
                                        <View className="h-32 bg-slate-50 p-2 items-center justify-center relative border-b border-slate-50">
                                            {item.image ? (
                                                <Image source={{ uri: getImageUrl(item.image) as string }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                                            ) : (
                                                <Text className="text-4xl opacity-30">📷</Text>
                                            )}
                                            <View className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded-md border border-slate-100">
                                                <Text className="text-[9px] font-black uppercase text-slate-500">{item.category}</Text>
                                            </View>
                                        </View>
                                        
                                        <View className="p-3 flex-col flex-1">
                                            <Text className="text-[13px] font-extrabold text-slate-900 leading-tight mb-3 line-clamp-2" numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                            
                                            <View className="mt-auto">
                                                <TouchableOpacity 
                                                    onPress={() => importMutation.mutate(item)}
                                                    disabled={importingId !== null}
                                                    className={`w-full py-2.5 rounded-xl items-center ${isImporting ? 'bg-amber-100' : importingId !== null ? 'bg-slate-100' : 'bg-amber-50 border border-amber-200'}`}
                                                >
                                                    <Text className={`text-[11px] font-black uppercase tracking-wide ${isImporting ? 'text-amber-600' : importingId !== null ? 'text-slate-400' : 'text-amber-700'}`}>
                                                        {isImporting ? 'Importing...' : 'Import'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                    <View className="h-20" />
                </ScrollView>
            </View>
        </View>
    );
}
