import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StatusBar, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Package, Heart, Settings, Store, LogOut, ChevronRight, User as UserIcon, Edit2, MapPin, HeadphonesIcon, CreditCard } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import Constants from 'expo-constants';

interface MenuRowProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    isDanger?: boolean;
    isLast?: boolean;
}

const MenuRow: React.FC<MenuRowProps> = ({ icon, title, subtitle, onPress, isDanger, isLast }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`flex-row items-center justify-between py-4 px-5 bg-white ${!isLast ? 'border-b border-slate-100' : ''}`}
    >
        <View className="flex-row items-center gap-4 flex-1">
            <View className={`w-10 h-10 rounded-full items-center justify-center ${isDanger ? 'bg-rose-50' : 'bg-slate-50'}`}>
                {icon}
            </View>
            <View className="flex-1">
                <Text className={`text-[15px] font-semibold ${isDanger ? 'text-rose-600' : 'text-slate-900'}`}>{title}</Text>
                {subtitle && <Text className="text-[13px] font-medium text-slate-500 mt-0.5">{subtitle}</Text>}
            </View>
        </View>
        {!isDanger && <ChevronRight size={18} color="#cbd5e1" />}
    </TouchableOpacity>
);

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Logout', 
                    style: 'destructive', 
                    onPress: () => {
                        logout();
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    if (!user) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50 px-6">
                <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-6 shadow-sm border border-slate-100">
                    <UserIcon size={40} color="#94a3b8" />
                </View>
                <Text className="text-[20px] font-bold text-slate-900 mb-2 text-center">Your Profile</Text>
                <Text className="text-[14px] font-medium text-slate-500 mb-8 text-center leading-relaxed">
                    Login or create an account to view your orders, manage saved addresses, and access your wishlist.
                </Text>
                <TouchableOpacity 
                    onPress={() => router.push('/login')}
                    className="w-full bg-slate-900 py-4 rounded-xl shadow-sm items-center"
                >
                    <Text className="text-white font-bold text-[15px]">Login / Signup</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar barStyle="dark-content" />
            
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={true}>
                
                {/* Professional Header Area */}
                <View className="bg-white pt-16 pb-8 px-5 border-b border-slate-200">
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-[22px] font-bold text-slate-900 tracking-tight">Profile</Text>
                        <TouchableOpacity onPress={() => router.push('/settings')} className="w-9 h-9 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                            <Edit2 size={16} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center">
                        <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mr-4 border border-slate-200 overflow-hidden">
                            <UserIcon size={30} color="#94a3b8" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[18px] font-bold text-slate-900 leading-tight mb-1" numberOfLines={1}>
                                {user.name || 'MUNA User'}
                            </Text>
                            <Text className="text-[13px] font-medium text-slate-500">
                                {user.phone || user.email || '+91 ••••• •••••'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="px-5 mt-5">
                    {/* Action Cards: Orders & Wishlist */}
                    <View className="flex-row justify-between gap-3 mb-6">
                        <TouchableOpacity 
                            onPress={() => router.push('/orders')}
                            className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center gap-3"
                        >
                            <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                                <Package size={20} color="#475569" />
                            </View>
                            <View>
                                <Text className="text-[14px] font-bold text-slate-900">Orders</Text>
                                <Text className="text-[11px] font-medium text-slate-500 mt-0.5">Track & Reorder</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => router.push('/wishlist')}
                            className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center gap-3"
                        >
                            <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                                <Heart size={20} color="#475569" />
                            </View>
                            <View>
                                <Text className="text-[14px] font-bold text-slate-900">Wishlist</Text>
                                <Text className="text-[11px] font-medium text-slate-500 mt-0.5">Saved Items</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Vendor Dashboard Banner (If Vendor) */}
                    {user?.role === 'vendor' && (
                        <TouchableOpacity 
                            onPress={() => router.push('/vendor')}
                            className="bg-slate-900 p-4 rounded-2xl items-center justify-between flex-row mb-6 shadow-sm"
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
                                    <Store size={20} color="#ffffff" />
                                </View>
                                <View>
                                    <Text className="text-[15px] font-bold text-white">Vendor Dashboard</Text>
                                    <Text className="text-[12px] font-medium text-slate-300">Manage your business</Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    )}

                    {/* General Settings */}
                    <Text className="text-[13px] font-bold text-slate-500 mb-2 ml-1">ACCOUNT</Text>
                    <View className="bg-white rounded-2xl border border-slate-100 mb-6 overflow-hidden">
                        <MenuRow 
                            icon={<Settings size={20} color="#475569" />}
                            title="Account Settings"
                            subtitle="Personal Details, Password"
                            onPress={() => router.push('/settings')}
                            isLast={true}
                        />
                    </View>

                    {/* Support & Extras */}
                    <Text className="text-[13px] font-bold text-slate-500 mb-2 ml-1">SUPPORT & MORE</Text>
                    <View className="bg-white rounded-2xl border border-slate-100 mb-6 overflow-hidden">
                        {user?.role !== 'vendor' && (
                            <MenuRow 
                                icon={<Store size={20} color="#475569" />}
                                title="Become a Seller"
                                subtitle="Grow your business with MUNA"
                                onPress={() => router.push('/vendor-request')}
                            />
                        )}
                        <MenuRow 
                            icon={<HeadphonesIcon size={20} color="#475569" />}
                            title="Help & Support"
                            subtitle="Contact customer service"
                            onPress={() => Linking.openURL('mailto:ofassam@gmail.com')}
                        />
                        <MenuRow 
                            icon={<LogOut size={20} color="#ef4444" />}
                            title="Log Out"
                            isDanger={true}
                            isLast={true}
                            onPress={handleLogout}
                        />
                    </View>

                    {/* Footer / Version */}
                    <View className="items-center mb-10 pt-4">
                        <Text className="text-[14px] font-black text-slate-300 tracking-widest mb-1">M U N A</Text>
                        <Text className="text-[11px] font-semibold text-slate-400">Proudly made in Assam ❤️</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

