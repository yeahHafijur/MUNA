import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Clock, MapPinOff } from 'lucide-react-native';
import api from '@/api/api';
import { getImageUrl } from '@/utils/format';
import { haversine } from '@/utils/homeUtils';

export default function AllStoresScreen() {
    const router = useRouter();
    const { category, lat, lng } = useLocalSearchParams();

    const { data: shops = [], isLoading } = useQuery({
        queryKey: ['shops'],
        queryFn: async () => {
            const res = await api.get('/api/shops');
            return res.data;
        },
    });

    const filteredShops = React.useMemo(() => {
        return shops.filter((shop: any) => {
            // Distance Filter (Max 25km)
            if (lat && lng && shop.location?.coordinates) {
                const shopLat = shop.location.coordinates[1];
                const shopLng = shop.location.coordinates[0];
                const dist = haversine(Number(lat), Number(lng), shopLat, shopLng);
                if (dist > 25) return false;
            }

            // Category Filter
            if (!category) return true;
            const shopCat = typeof shop.category === 'object' ? shop.category?.name : shop.category;
            return shopCat === category;
        });
    }, [shops, category, lat, lng]);

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View>
                    <Text className="text-[18px] font-black text-slate-900 leading-tight">
                        {category ? `${category} Stores` : 'All Stores'}
                    </Text>
                    <Text className="text-[11px] font-bold text-slate-400 mt-0.5">{filteredShops.length} stores available</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View className="flex-1 items-center justify-center pt-20">
                        <ActivityIndicator size="large" color="#fbbf24" />
                    </View>
                ) : filteredShops.length === 0 ? (
                    <View className="items-center px-5 py-12 bg-white rounded-[32px] border border-amber-100/50 shadow-sm mt-4">
                        <View className="w-20 h-20 bg-amber-50 rounded-full items-center justify-center mb-5 border border-amber-100">
                            <MapPinOff size={32} color="#b45309" strokeWidth={1.5} />
                        </View>
                        <Text className="text-[20px] font-black text-slate-900 text-center mb-2 tracking-tight">
                            No {category ? category : ''} stores found
                        </Text>
                        <Text className="text-[13px] font-semibold text-slate-500 text-center leading-relaxed mb-8 px-4">
                            We don't have any stores for this category in your area yet. Help us grow by referring a local vendor!
                        </Text>
                        
                        <TouchableOpacity 
                            onPress={() => router.push('/vendor-request')}
                            className="bg-slate-900 w-full py-4 rounded-2xl flex-row items-center justify-center shadow-sm active:bg-slate-800 gap-2"
                        >
                            <Text className="text-white font-black text-[15px]">Refer a Vendor</Text>
                            <Text className="text-amber-400 text-lg leading-none mt-[-2px]">→</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="gap-3 pb-10">
                        {filteredShops.map((shop: any) => {
                            const imageUrl = getImageUrl(shop.image);

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
                                                transition={200}
                                                cachePolicy="memory-disk"
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
