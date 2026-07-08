import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Clock } from 'lucide-react-native';
import api from '@/api/api';

export default function AllStoresScreen() {
    const router = useRouter();

    const { data: shops = [], isLoading } = useQuery({
        queryKey: ['shops'],
        queryFn: async () => {
            const res = await api.get('/api/shops');
            return res.data;
        },
    });

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View>
                    <Text className="text-[18px] font-black text-slate-900 leading-tight">All Stores</Text>
                    <Text className="text-[11px] font-bold text-slate-400 mt-0.5">{shops.length} stores available</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View className="flex-1 items-center justify-center pt-20">
                        <ActivityIndicator size="large" color="#fbbf24" />
                    </View>
                ) : (
                    <View className="gap-3 pb-10">
                        {shops.map((shop: any) => {
                            const imageUrl = shop.image 
                              ? (shop.image.startsWith('http') ? shop.image : `https://www.munahut.in${shop.image}`)
                              : null;

                            return (
                                <TouchableOpacity
                                    key={shop._id}
                                    activeOpacity={0.9}
                                    onPress={() => router.push(`/shop/${shop._id}`)}
                                    className={`flex-col rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden ${!shop.isOpen ? 'opacity-60' : ''}`}
                                >
                                    <View className="w-full aspect-[21/9] bg-slate-100 relative">
                                        {imageUrl ? (
                                            <Image 
                                                source={{ uri: imageUrl }} 
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <View className="w-full h-full items-center justify-center bg-amber-50">
                                                <Text className="text-4xl">🏪</Text>
                                            </View>
                                        )}
                                        {!shop.isOpen && (
                                            <View className="absolute inset-0 bg-white/70 items-center justify-center z-10">
                                                <View className="bg-slate-900 px-3 py-1 rounded-full shadow-md">
                                                    <Text className="text-white text-[10px] font-black uppercase">CLOSED</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    <View className="p-4">
                                        <View className="flex-row items-start justify-between gap-2">
                                            <View className="flex-1 pr-2">
                                                <Text className="text-[16px] font-extrabold text-slate-900" numberOfLines={1}>
                                                    {shop.name}
                                                </Text>
                                                <Text className="text-[12px] font-semibold text-slate-500 mt-1">
                                                    {typeof shop.category === 'object' ? (shop.category?.name || 'Grocery') : (shop.category || 'Grocery')}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                                <Star size={12} color="#047857" fill="#047857" />
                                                <Text className="text-[12px] font-black text-emerald-700">{shop.rating || '4.5'}</Text>
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
