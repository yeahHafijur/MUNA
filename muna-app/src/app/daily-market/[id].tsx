import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Share, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Clock, Share2, MessageCircle, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';
import { getImageUrl } from '@/utils/format';

const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
};

export default function DailyMarketDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user, token } = useAuth();
    
    const [reporting, setReporting] = useState(false);

    const { data: item, isLoading } = useQuery({
        queryKey: ['market-item', id],
        queryFn: async () => {
            const res = await api.get(`/api/market/${id}`);
            return res.data;
        },
    });

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out "${item.title}" on MUNA Daily Market! https://www.munahut.in/daily-market/${id}`,
            });
        } catch (error) {
            console.error('Error sharing', error);
        }
    };

    const handleContactSeller = async () => {
        if (!user) {
            Alert.alert('Login Required', 'Please login to contact the seller.', [
                { text: 'Login', onPress: () => router.push('/login') },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }

        try {
            // Check if chat session already exists or create new
            const res = await api.post('/api/chat/session', { itemId: id });
            router.push(`/chat/${res.data.sessionId}` as any);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Could not initiate chat');
        }
    };

    const handleReport = () => {
        Alert.alert(
            'Report Ad',
            'Are you sure you want to report this ad as inappropriate or scam?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Report', 
                    style: 'destructive',
                    onPress: async () => {
                        setReporting(true);
                        try {
                            await api.post(`/api/market/${id}/report`);
                            Alert.alert('Thank You', 'This ad has been reported. Our team will review it shortly.');
                        } catch (err) {
                            Alert.alert('Error', 'Failed to report ad.');
                        } finally {
                            setReporting(false);
                        }
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#fbbf24" />
            </View>
        );
    }

    if (!item) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text>Item not found.</Text>
            </View>
        );
    }

    const isOwner = user && user._id === (item.seller?._id || item.seller);
    const imageUrl = getImageUrl(item.images?.[0]);

    return (
        <View className="flex-1 bg-white">
            <ScrollView className="flex-1">
                {/* Header Actions */}
                <View className="absolute top-10 left-4 right-4 z-50 flex-row justify-between items-center">
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-sm"
                    >
                        <ArrowLeft size={20} color="#0f172a" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={handleShare}
                        className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-sm"
                    >
                        <Share2 size={18} color="#0f172a" />
                    </TouchableOpacity>
                </View>

                {/* Image Gallery (Just first image for now) */}
                <View className="w-full aspect-[4/3] bg-slate-100 relative">
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                    ) : (
                        <View className="flex-1 items-center justify-center bg-amber-50">
                            <Text className="text-6xl">📦</Text>
                        </View>
                    )}
                    
                    {item.status !== 'available' && (
                        <View className="absolute inset-0 bg-white/60 items-center justify-center">
                            <View className="bg-slate-900 px-6 py-2 rounded-lg shadow-sm">
                                <Text className="text-white text-lg font-black uppercase tracking-wider">
                                    {item.status}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Details */}
                <View className="px-5 py-6">
                    <Text className="text-3xl font-black text-slate-900 leading-none mb-3">
                        ₹{item.price}
                    </Text>
                    
                    <Text className="text-[20px] font-bold text-slate-800 leading-tight mb-4">
                        {item.title}
                    </Text>

                    <View className="flex-row items-center gap-4 mb-6">
                        <View className="flex-row items-center gap-1.5">
                            <MapPin size={14} color="#64748b" />
                            <Text className="text-[13px] font-bold text-slate-500">
                                {item.address || 'Nearby'}
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                            <Clock size={14} color="#64748b" />
                            <Text className="text-[13px] font-bold text-slate-500">
                                {formatTime(item.createdAt)}
                            </Text>
                        </View>
                    </View>

                    <View className="mt-2 pt-6 border-t border-slate-100">
                        <Text className="text-[16px] font-black text-slate-900 mb-3">Description</Text>
                        <Text className="text-[14px] text-slate-600 leading-relaxed">
                            {item.description}
                        </Text>
                    </View>

                    {/* Seller Info */}
                    <View className="mt-8 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                            <View className="w-12 h-12 bg-amber-100 rounded-full items-center justify-center border border-amber-200">
                                <Text className="text-[20px]">👤</Text>
                            </View>
                            <View>
                                <Text className="text-[14px] font-bold text-slate-900">
                                    {item.seller?.name || 'MUNA User'}
                                </Text>
                                <Text className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                    Joined recently
                                </Text>
                            </View>
                        </View>
                        {!isOwner && (
                            <TouchableOpacity onPress={handleReport} disabled={reporting} className="p-2">
                                <AlertTriangle size={18} color="#94a3b8" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View className="h-24" />
            </ScrollView>

            {/* Bottom Actions */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 shadow-lg pb-8">
                {isOwner ? (
                    <TouchableOpacity 
                        className="h-12 bg-slate-900 rounded-xl flex-row items-center justify-center shadow-sm"
                        onPress={() => router.push(`/daily-market/edit/${item._id}` as any)}
                    >
                        <Text className="text-white font-black text-[15px]">Edit Ad</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        disabled={item.status !== 'available'}
                        onPress={handleContactSeller}
                        className={`h-12 rounded-xl flex-row items-center justify-center shadow-sm
                        ${item.status !== 'available' ? 'bg-slate-200' : 'bg-amber-400'}`}
                    >
                        {item.status !== 'available' ? (
                            <Text className="text-slate-400 font-black text-[15px]">Item Unavailable</Text>
                        ) : (
                            <>
                                <MessageCircle size={18} color="#451a03" className="mr-2" />
                                <Text className="text-amber-950 font-black text-[15px]">Chat with Seller</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
