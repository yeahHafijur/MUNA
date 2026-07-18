import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Clock, MapPinOff } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import api from '@/api/api';
import { getImageUrl } from '@/utils/format';
import { haversine } from '@/utils/homeUtils';

export default function AllStoresScreen() {
    const router = useRouter();
    const { category, lat, lng } = useLocalSearchParams();
    const { colors, isDark } = useTheme();

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
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View className="pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color={colors.icon} />
                </TouchableOpacity>
                <View>
                    <Text style={{ color: colors.primaryText }} className="text-[18px] font-black leading-tight">
                        {category ? `${category} Stores` : 'All Stores'}
                    </Text>
                    <Text style={{ color: colors.tertiaryText }} className="text-[11px] font-bold mt-0.5">{filteredShops.length} stores available</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View className="flex-1 items-center justify-center pt-20">
                        <ActivityIndicator size="large" color={colors.accent} />
                    </View>
                ) : filteredShops.length === 0 ? (
                    <View className="items-center px-5 py-12 rounded-[32px] border shadow-sm mt-4" style={{ backgroundColor: colors.surface, borderColor: isDark ? 'rgba(217, 119, 6, 0.2)' : 'rgba(254, 243, 199, 0.5)' }}>
                        <View className="w-20 h-20 rounded-full items-center justify-center mb-5 border" style={{ backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#fffbeb', borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#fef3c7' }}>
                            <MapPinOff size={32} color="#b45309" strokeWidth={1.5} />
                        </View>
                        <Text style={{ color: colors.primaryText }} className="text-[20px] font-black text-center mb-2 tracking-tight">
                            No {category ? category : ''} stores found
                        </Text>
                        <Text style={{ color: colors.secondaryText }} className="text-[13px] font-semibold text-center leading-relaxed mb-8 px-4">
                            We don't have any stores for this category in your area yet. Help us grow by referring a local vendor!
                        </Text>
                        
                        <TouchableOpacity 
                            onPress={() => router.push('/vendor-request')}
                            className="w-full py-4 rounded-2xl flex-row items-center justify-center shadow-sm active:opacity-80 gap-2"
                            style={{ backgroundColor: colors.primaryText }}
                        >
                            <Text style={{ color: colors.invertedText }} className="font-black text-[15px]">Refer a Vendor</Text>
                            <Text className="text-amber-400 text-lg leading-none mt-[-2px]">{'→'}</Text>
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
                                    className={`flex-col rounded-2xl border shadow-sm overflow-hidden ${!shop.isOpen ? 'opacity-60' : ''}`}
                                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                                >
                                    <View className="w-full aspect-[21/9] relative" style={{ backgroundColor: isDark ? colors.elevated : '#f1f5f9' }}>
                                        {imageUrl ? (
                                            <Image 
                                                source={{ uri: imageUrl }} 
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                                transition={200}
                                                cachePolicy="memory-disk"
                                            />
                                        ) : (
                                            <View className="w-full h-full items-center justify-center" style={{ backgroundColor: isDark ? colors.elevated : '#fffbeb' }}>
                                                <Text className="text-4xl">🏪</Text>
                                            </View>
                                        )}
                                        {!shop.isOpen && (
                                            <View className="absolute inset-0 items-center justify-center z-10" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)' }}>
                                                <View className="px-3 py-1 rounded-full shadow-md" style={{ backgroundColor: colors.danger }}>
                                                    <Text className="text-white text-[10px] font-black uppercase">CLOSED</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    <View className="p-4">
                                        <View className="flex-row items-start justify-between gap-2">
                                            <View className="flex-1 pr-2">
                                                <Text style={{ color: colors.primaryText }} className="text-[16px] font-extrabold" numberOfLines={1}>
                                                    {shop.name}
                                                </Text>
                                                <Text style={{ color: colors.secondaryText }} className="text-[12px] font-semibold mt-1">
                                                    {typeof shop.category === 'object' ? (shop.category?.name || 'Grocery') : (shop.category || 'Grocery')}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center gap-1 px-2 py-1 rounded-lg border" style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', borderColor: isDark ? 'rgba(16,185,129,0.2)' : '#d1fae5' }}>
                                                <Star size={12} color={isDark ? '#34d399' : "#047857"} fill={isDark ? '#34d399' : "#047857"} />
                                                <Text className="text-[12px] font-black" style={{ color: colors.success }}>{shop.rating || '4.5'}</Text>
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
