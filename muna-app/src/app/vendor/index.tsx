import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Menu as MenuIcon, Archive, Settings, Bell, User, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { Image } from 'expo-image';
import api from '@/api/api';
import { getImageUrl } from '@/utils/format';

// Reusing NavigationRow pattern
const NavigationRow = ({ icon, title, subtitle, badge = 0, onPress, isLast = false, iconBgClass = "bg-slate-100" }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`flex-row items-center justify-between p-4 bg-white ${!isLast ? 'border-b border-slate-50' : ''}`}
    >
        <View className="flex-row items-center gap-4 flex-1">
            <View className={`w-12 h-12 rounded-2xl items-center justify-center ${iconBgClass}`}>
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-[15px] font-black text-slate-900 tracking-tight">{title}</Text>
                {subtitle && <Text className="text-[12px] font-semibold text-slate-400 mt-0.5">{subtitle}</Text>}
            </View>
        </View>
        <View className="flex-row items-center gap-3">
            {badge > 0 && (
                <View className="bg-rose-500 px-2 py-1 rounded-md">
                    <Text className="text-white text-[10px] font-black">{badge} NEW</Text>
                </View>
            )}
            <ChevronRight size={20} color="#cbd5e1" />
        </View>
    </TouchableOpacity>
);

export default function VendorHub() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Delivery Rules Form
    const [minOrder, setMinOrder] = useState('');
    const [minimumCharge, setMinimumCharge] = useState('');
    const [chargePerKm, setChargePerKm] = useState('');
    const [maxDeliveryRange, setMaxDeliveryRange] = useState('');

    const { data: shop, isLoading: isShopLoading } = useQuery({
        queryKey: ['my-shop'],
        queryFn: async () => {
            const res = await api.get('/api/shops/my-shop');
            return res.data._id ? res.data : null;
        }
    });

    const { data: stats = { liveOrders: 0, todayRevenue: 0, totalProducts: 0 } } = useQuery({
        queryKey: ['vendor-hub-stats'],
        queryFn: async () => {
            const res = await api.get('/api/orders/vendor?limit=100');
            const orders = res.data.orders || [];

            const today = new Date().toDateString();
            const liveOrders = orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status));
            const todayRevenue = orders
                .filter((o: any) => o.status === 'delivered' && new Date(o.createdAt).toDateString() === today)
                .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

            let productCount = 0;
            if (shop?._id) {
                try {
                    const prodRes = await api.get(`/api/products/${shop._id}`);
                    productCount = Array.isArray(prodRes.data) ? prodRes.data.length : 0;
                } catch (e) {
                    console.log('Error fetching products for stats', e);
                }
            }

            return { liveOrders: liveOrders.length, todayRevenue, totalProducts: productCount };
        },
        enabled: !!shop,
        refetchInterval: 15000
    });

    const handleOpenDeliveryModal = () => {
        if (shop) {
            setMinOrder(shop.deliverySettings?.minOrderAmount?.toString() || '0');
            setMinimumCharge(shop.deliverySettings?.minimumCharge?.toString() || '0');
            setChargePerKm(shop.deliverySettings?.chargePerKm?.toString() || '0');
            setMaxDeliveryRange(shop.deliverySettings?.maxRange?.toString() || '5');
        }
        setIsDeliveryModalOpen(true);
    };

    const handleSaveDeliveryRules = async () => {
        if (!shop) return;
        setIsSaving(true);
        try {
            const body = {
                deliverySettings: {
                    minOrderAmount: Number(minOrder),
                    minimumCharge: Number(minimumCharge),
                    chargePerKm: Number(chargePerKm),
                    maxRange: Number(maxDeliveryRange)
                }
            };
            const res = await api.put(`/api/shops/${shop._id}`, body);
            queryClient.setQueryData(['my-shop'], res.data);
            Alert.alert("Success", "Delivery rules updated!");
            setIsDeliveryModalOpen(false);
        } catch (error) {
            Alert.alert("Error", "Failed to update rules.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleShopStatus = async () => {
        if (!shop) return;
        try {
            const res = await api.put(`/api/shops/${shop._id}`, { isOpen: !shop.isOpen });
            queryClient.setQueryData(['my-shop'], res.data);
        } catch (error) {
            Alert.alert("Error", "Could not update shop status");
        }
    };

    if (isShopLoading || !shop) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#fbbf24" />
                <Text className="text-sm font-black tracking-widest uppercase text-slate-400 mt-4">Loading Store...</Text>
            </View>
        );
    }

    const imageUrl = getImageUrl(shop.image);

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white pt-12 px-4 pb-4 border-b border-slate-100 shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.push('/')} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center active:scale-95">
                        <ArrowLeft size={20} color="#334155" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-extrabold text-slate-900 tracking-tight">Merchant Hub</Text>
                </View>
                
                <TouchableOpacity 
                    onPress={handleToggleShopStatus}
                    className={`flex-row items-center gap-2 px-3 py-1.5 rounded-lg border ${shop.isOpen ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-200'}`}
                >
                    <View className={`w-2 h-2 rounded-full ${shop.isOpen ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${shop.isOpen ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {shop.isOpen ? 'Open' : 'Closed'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Shop Profile Card */}
                <View className="bg-white p-5 border-b border-slate-100 mb-4">
                    <View className="flex-row items-center gap-4">
                        <View className="w-16 h-16 rounded-full bg-amber-100 border-2 border-slate-100 items-center justify-center overflow-hidden">
                            {imageUrl ? (
                                <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                            ) : (
                                <Text className="text-2xl">🏪</Text>
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-[18px] font-extrabold text-slate-900 tracking-tight mb-0.5">{shop.name}</Text>
                            <Text className="text-[12px] font-medium text-slate-500 mb-2">{shop.address || 'Vendor Store'}</Text>
                            <View className="bg-amber-50 px-2 py-0.5 rounded border border-amber-100 self-start">
                                <Text className="text-[10px] font-black text-amber-700 uppercase tracking-wider">⭐ {shop.rating || 'New Shop'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Metrics */}
                <View className="flex-row gap-3 px-4 mb-4">
                    <View className="flex-1 bg-white p-4 rounded-3xl border border-slate-100 items-center">
                        <Text className="text-[28px] font-black text-slate-800 mb-1">{stats.liveOrders}</Text>
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Orders</Text>
                    </View>
                    <View className="flex-1 bg-white p-4 rounded-3xl border border-slate-100 items-center">
                        <Text className="text-[28px] font-black text-emerald-500 mb-1">₹{stats.todayRevenue}</Text>
                        <Text className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Today's Sales</Text>
                    </View>
                </View>

                {/* Menus */}
                <View className="px-4 gap-4 pb-10">
                    <View className="bg-white rounded-[24px] border border-slate-100 overflow-hidden">
                        <NavigationRow 
                            icon={<Package size={24} color="#2563eb" />} iconBgClass="bg-blue-50"
                            title="Manage Orders" subtitle="Accept, dispatch & verify" badge={stats.liveOrders}
                            onPress={() => router.push('/vendor/orders')}
                        />
                        <NavigationRow 
                            icon={<MenuIcon size={24} color="#9333ea" />} iconBgClass="bg-purple-50"
                            title="Catalog & Menu" subtitle={`${stats.totalProducts} Items in your store`}
                            onPress={() => router.push('/vendor/menu')}
                        />
                        <NavigationRow 
                            icon={<Archive size={24} color="#d97706" />} iconBgClass="bg-amber-50"
                            title="Master Godown" subtitle="Import bulk items instantly"
                            onPress={() => router.push('/vendor/godown')}
                        />
                        <NavigationRow 
                            icon={<Settings size={24} color="#334155" />} iconBgClass="bg-slate-50"
                            title="Delivery Rules" subtitle={`Max ${shop.deliverySettings?.maxRange || 5}km • Min ₹${shop.deliverySettings?.minOrderAmount || 0}`}
                            onPress={handleOpenDeliveryModal}
                        />
                        <NavigationRow 
                            icon={<Bell size={24} color="#f43f5e" />} iconBgClass="bg-rose-50"
                            title="Notifications" subtitle="New order alerts"
                            onPress={() => Alert.alert("Notifications", "Push notifications are active!")} isLast
                        />
                    </View>

                    <View className="bg-white rounded-[24px] border border-slate-100 overflow-hidden">
                        <NavigationRow 
                            icon={<User size={24} color="#059669" />} iconBgClass="bg-emerald-50"
                            title="My Profile" subtitle="Customer account settings"
                            onPress={() => router.push('/profile')} isLast
                        />
                    </View>

                    <TouchableOpacity 
                        onPress={() => { logout(); router.replace('/'); }}
                        className="bg-white rounded-[24px] border border-slate-100 p-4 items-center justify-center active:bg-slate-50"
                    >
                        <Text className="text-[15px] font-bold text-rose-600">Sign Out</Text>
                    </TouchableOpacity>

                    <Text className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">MUNA Merchant App v2.0</Text>
                </View>
            </ScrollView>

            {/* Delivery Rules Modal */}
            <Modal
                visible={isDeliveryModalOpen}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsDeliveryModalOpen(false)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-end bg-slate-900/40"
                >
                    <View className="bg-white rounded-t-[32px] p-6 pb-10 max-h-[85%]">
                        <View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                        <View className="flex-row items-center justify-between mb-8">
                            <Text className="text-[20px] font-extrabold text-slate-900">Delivery Rules</Text>
                            <TouchableOpacity onPress={() => setIsDeliveryModalOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center">
                                <Text className="text-slate-500 font-bold">✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                            <View className="space-y-4">
                                <View>
                                    <Text className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Minimum Order (₹)</Text>
                                    <TextInput
                                        keyboardType="numeric"
                                        value={minOrder}
                                        onChangeText={setMinOrder}
                                        className="bg-slate-50 p-4 rounded-2xl text-[16px] font-bold text-slate-900 border border-slate-100 focus:border-amber-400"
                                    />
                                </View>
                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <Text className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Base Charge (₹)</Text>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={minimumCharge}
                                            onChangeText={setMinimumCharge}
                                            className="bg-slate-50 p-4 rounded-2xl text-[16px] font-bold text-slate-900 border border-slate-100 focus:border-amber-400"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Charge/KM (₹)</Text>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={chargePerKm}
                                            onChangeText={setChargePerKm}
                                            className="bg-slate-50 p-4 rounded-2xl text-[16px] font-bold text-slate-900 border border-slate-100 focus:border-amber-400"
                                        />
                                    </View>
                                </View>
                                <View>
                                    <Text className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Max Range (KM)</Text>
                                    <TextInput
                                        keyboardType="numeric"
                                        value={maxDeliveryRange}
                                        onChangeText={setMaxDeliveryRange}
                                        className="bg-slate-50 p-4 rounded-2xl text-[16px] font-bold text-slate-900 border border-slate-100 focus:border-amber-400"
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity 
                            onPress={handleSaveDeliveryRules}
                            disabled={isSaving}
                            className={`bg-amber-400 p-4 rounded-2xl items-center ${isSaving ? 'opacity-70' : ''}`}
                        >
                            <Text className="text-[16px] font-black text-amber-950">{isSaving ? 'Saving...' : 'Save Rules'}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
