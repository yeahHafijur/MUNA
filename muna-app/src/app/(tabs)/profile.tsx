import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions, Platform, StatusBar, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Package, Heart, Settings, Store, LogOut, ChevronRight, User as UserIcon, Edit2, MapPin, HeadphonesIcon, CreditCard } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

interface MenuRowProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    isDanger?: boolean;
    isLast?: boolean;
    iconBgColor: string;
}

const MenuRow: React.FC<MenuRowProps> = ({ icon, title, subtitle, onPress, isDanger, isLast, iconBgColor }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`flex-row items-center justify-between py-4 mx-4 ${!isLast ? 'border-b border-slate-100' : ''}`}
    >
        <View className="flex-row items-center gap-4 flex-1">
            <View className="w-10 h-10 rounded-xl items-center justify-center shadow-sm" style={{ backgroundColor: iconBgColor }}>
                {icon}
            </View>
            <View className="flex-1">
                <Text className={`text-[16px] font-bold ${isDanger ? 'text-rose-600' : 'text-slate-900'}`}>{title}</Text>
                {subtitle && <Text className="text-[12px] font-medium text-slate-500 mt-0.5">{subtitle}</Text>}
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
            <View className="flex-1 items-center justify-center bg-white px-6">
                <View className="w-24 h-24 bg-amber-50 rounded-full items-center justify-center mb-6">
                    <UserIcon size={40} color="#d97706" />
                </View>
                <Text className="text-[20px] font-black text-slate-900 mb-2 text-center">Your Profile</Text>
                <Text className="text-[14px] font-medium text-slate-500 mb-8 text-center leading-relaxed">
                    Login or create an account to view your orders, manage saved addresses, and access your wishlist.
                </Text>
                <TouchableOpacity 
                    onPress={() => router.push('/login')}
                    className="w-full bg-slate-900 py-4 rounded-xl shadow-sm items-center"
                >
                    <Text className="text-white font-black text-[15px]">Login / Signup</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            <StatusBar barStyle="light-content" />
            
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={false}>
                
                {/* Hero Header Area */}
                <View className="bg-slate-900 pt-16 pb-12 px-5 rounded-b-[40px] shadow-sm relative">
                    <View className="flex-row items-center justify-between mb-8">
                        <Text className="text-[24px] font-black text-white tracking-tight">My Profile</Text>
                        <TouchableOpacity onPress={() => router.push('/settings')} className="w-10 h-10 bg-white/10 rounded-full items-center justify-center backdrop-blur-md">
                            <Edit2 size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center">
                        <View className="w-20 h-20 bg-amber-400 rounded-2xl items-center justify-center mr-5 border-4 border-white shadow-lg overflow-hidden relative">
                            {/* In a real app, use the user's avatar image here */}
                            <UserIcon size={36} color="#451a03" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[22px] font-black text-white leading-tight mb-1" numberOfLines={1}>
                                {user.name || 'MUNA User'}
                            </Text>
                            <View className="bg-white/20 self-start px-3 py-1 rounded-full backdrop-blur-sm">
                                <Text className="text-[12px] font-bold text-slate-100">
                                    {user.phone || user.email || '+91 ••••• •••••'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View className="px-5 -mt-6 z-10">
                    {/* Quick Stats / Action Cards */}
                    {user?.role === 'vendor' && (
                        <TouchableOpacity 
                            onPress={() => router.push('/vendor')}
                            className="bg-emerald-500 p-5 rounded-[24px] shadow-md items-center justify-between flex-row mb-4 border border-emerald-400"
                        >
                            <View className="flex-row items-center gap-4">
                                <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center">
                                    <Store size={28} color="#ffffff" />
                                </View>
                                <View>
                                    <Text className="text-[18px] font-black text-white mb-0.5">Vendor Dashboard</Text>
                                    <Text className="text-[12px] font-bold text-emerald-100 uppercase tracking-widest">Manage your shop</Text>
                                </View>
                            </View>
                            <ChevronRight size={24} color="#ffffff" className="opacity-80" />
                        </TouchableOpacity>
                    )}

                    <View className="flex-row justify-between gap-3 mb-6">
                        <TouchableOpacity 
                            onPress={() => router.push('/orders')}
                            className="flex-1 bg-white p-4 rounded-[20px] shadow-sm items-center justify-center border border-slate-50"
                        >
                            <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mb-3">
                                <Package size={24} color="#3b82f6" />
                            </View>
                            <Text className="text-[14px] font-black text-slate-900">Orders</Text>
                            <Text className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Track & Reorder</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => router.push('/wishlist')}
                            className="flex-1 bg-white p-4 rounded-[20px] shadow-sm items-center justify-center border border-slate-50"
                        >
                            <View className="w-12 h-12 bg-rose-50 rounded-full items-center justify-center mb-3">
                                <Heart size={24} color="#ef4444" />
                            </View>
                            <Text className="text-[14px] font-black text-slate-900">Wishlist</Text>
                            <Text className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Saved Items</Text>
                        </TouchableOpacity>
                    </View>

                    {/* General Menu */}
                    <View className="bg-white rounded-[24px] shadow-sm border border-slate-50 mb-6 py-2 overflow-hidden">
                        <MenuRow 
                            icon={<Settings size={20} color="#fff" />}
                            iconBgColor="#64748b" // slate-500
                            title="Account Settings"
                            subtitle="Personal Details, Password"
                            onPress={() => router.push('/settings')}
                        />
                        <MenuRow 
                            icon={<MapPin size={20} color="#fff" />}
                            iconBgColor="#f59e0b" // amber-500
                            title="Saved Addresses"
                            subtitle="Home, Office, Other"
                            onPress={() => {}} // Placeholder
                        />
                        <MenuRow 
                            icon={<CreditCard size={20} color="#fff" />}
                            iconBgColor="#8b5cf6" // violet-500
                            title="Payment Methods"
                            subtitle="Cards, UPI, Wallets"
                            onPress={() => {}} // Placeholder
                        />
                    </View>

                    {/* Support & Vendor Menu */}
                    <View className="bg-white rounded-[24px] shadow-sm border border-slate-50 mb-6 py-2 overflow-hidden">
                        {user?.role !== 'vendor' && (
                            <MenuRow 
                                icon={<Store size={20} color="#fff" />}
                                iconBgColor="#10b981"
                                title="Become a Seller"
                                subtitle="Grow your business with us"
                                onPress={() => router.push('/vendor-request')}
                            />
                        )}
                        <MenuRow 
                            icon={<HeadphonesIcon size={20} color="#fff" />}
                            iconBgColor="#0ea5e9" // sky-500
                            title="Help & Support"
                            subtitle="ofassam@gmail.com"
                            onPress={() => Linking.openURL('mailto:ofassam@gmail.com')}
                        />
                        <MenuRow 
                            icon={<LogOut size={20} color="#ef4444" />}
                            iconBgColor="#fff1f2" // rose-50
                            title="Log Out"
                            isDanger={true}
                            isLast={true}
                            onPress={handleLogout}
                        />
                    </View>

                    <View className="items-center mb-10 pt-2 opacity-50">
                        <Text className="text-[13px] font-black text-slate-400">MUNA App v{Constants.expoConfig?.version || '1.0.0'}</Text>
                        <Text className="text-[11px] font-bold text-slate-400 mt-1 tracking-widest">MADE IN ASSAM</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
