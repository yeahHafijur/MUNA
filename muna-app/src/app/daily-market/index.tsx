import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, MapPin, Clock } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';
import { getImageUrl } from '@/utils/format';

const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
};

export default function DailyMarketListScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('browse'); // browse, my-items

    const { data: items = [], isLoading, refetch } = useQuery({
        queryKey: ['market-items', activeTab],
        queryFn: async () => {
            const endpoint = activeTab === 'my-items' ? '/api/market/my-items' : '/api/market/all';
            const res = await api.get(endpoint);
            return Array.isArray(res.data) ? res.data : [];
        },
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-3 shadow-sm">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity onPress={() => router.back()} className="p-1">
                            <ArrowLeft size={24} color="#0f172a" />
                        </TouchableOpacity>
                        <Text className="text-[18px] font-black text-slate-900">Daily Market</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => router.push('/daily-market/post' as any)}
                        className="bg-amber-400 px-3 py-1.5 rounded-lg flex-row items-center gap-1 shadow-sm"
                    >
                        <Plus size={16} color="#451a03" />
                        <Text className="text-amber-950 font-bold text-[13px]">Post Ad</Text>
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View className="flex-row gap-4">
                    <TouchableOpacity 
                        onPress={() => setActiveTab('browse')}
                        className={`py-2 border-b-2 ${activeTab === 'browse' ? 'border-amber-400' : 'border-transparent'}`}
                    >
                        <Text className={`font-bold text-[14px] ${activeTab === 'browse' ? 'text-amber-600' : 'text-slate-500'}`}>Browse Items</Text>
                    </TouchableOpacity>
                    {token && (
                        <TouchableOpacity 
                            onPress={() => setActiveTab('my-items')}
                            className={`py-2 border-b-2 ${activeTab === 'my-items' ? 'border-amber-400' : 'border-transparent'}`}
                        >
                            <Text className={`font-bold text-[14px] ${activeTab === 'my-items' ? 'text-amber-600' : 'text-slate-500'}`}>My Ads</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView 
                className="flex-1 px-4 pt-4" 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#fbbf24']} />
                }
            >
                {isLoading ? (
                    <View className="flex-1 items-center justify-center pt-20">
                        <ActivityIndicator size="large" color="#fbbf24" />
                    </View>
                ) : items.length === 0 ? (
                    <View className="items-center justify-center pt-20">
                        <Text className="text-5xl mb-4">🏪</Text>
                        <Text className="text-[16px] font-black text-slate-800 mb-2">
                            {activeTab === 'my-items' ? 'You have no active ads' : 'No items listed yet'}
                        </Text>
                        <Text className="text-[13px] font-medium text-slate-500 text-center px-6">
                            Be the first to list an item in your neighborhood!
                        </Text>
                        {activeTab === 'my-items' && (
                            <TouchableOpacity 
                                onPress={() => router.push('/daily-market/post' as any)}
                                className="mt-6 bg-amber-400 px-6 py-3 rounded-xl shadow-sm"
                            >
                                <Text className="text-amber-950 font-black text-[14px]">Post your first Ad</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View className="flex-row flex-wrap justify-between gap-y-4 pb-10">
                        {items.map((item: any) => {
                            const imageUrl = getImageUrl(item.images?.[0]);

                            return (
                                <TouchableOpacity
                                    key={item._id}
                                    activeOpacity={0.9}
                                    onPress={() => router.push(`/daily-market/${item._id}` as any)}
                                    className="w-[48%] rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden"
                                >
                                    <View className="w-full h-36 bg-slate-100 relative">
                                        {imageUrl ? (
                                            <Image 
                                                source={{ uri: imageUrl }} 
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                                transition={200}
                                                cachePolicy="memory-disk"
                                            />
                                        ) : (
                                            <View className="w-full h-full items-center justify-center bg-slate-100">
                                                <Text className="text-3xl">📦</Text>
                                            </View>
                                        )}
                                        {item.status !== 'available' && (
                                            <View className="absolute inset-0 bg-white/70 items-center justify-center z-10">
                                                <View className="bg-slate-900 px-3 py-1 rounded-full shadow-md">
                                                    <Text className="text-white text-[10px] font-black uppercase">{item.status}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    <View className="p-3">
                                        <Text className="text-[18px] font-black text-slate-900 leading-none mb-1">
                                            ₹{item.price}
                                        </Text>
                                        <Text className="text-[13px] font-bold text-slate-700 mb-2" numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        
                                        <View className="flex-row justify-between items-end border-t border-slate-100 pt-2">
                                            <View className="flex-row items-center gap-1">
                                                <MapPin size={10} color="#94a3b8" />
                                                <Text className="text-[10px] font-bold text-slate-400 max-w-[50px]" numberOfLines={1}>
                                                    {item.address || 'Nearby'}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center gap-1">
                                                <Clock size={10} color="#94a3b8" />
                                                <Text className="text-[10px] font-bold text-slate-400">
                                                    {formatTime(item.createdAt)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
