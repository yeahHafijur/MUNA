import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Package, Heart, Settings, Store, LogOut, ChevronRight, User as UserIcon, Edit2 } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

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
        className={`flex-row items-center justify-between p-4 bg-white ${!isLast ? 'border-b border-slate-100' : ''}`}
    >
        <View className="flex-row items-center gap-4 flex-1">
            <View className={`w-10 h-10 rounded-xl items-center justify-center ${isDanger ? 'bg-rose-50' : 'bg-slate-50'}`}>
                {icon}
            </View>
            <View className="flex-1">
                <Text className={`text-[15px] font-bold ${isDanger ? 'text-rose-600' : 'text-slate-900'}`}>{title}</Text>
                {subtitle && <Text className="text-[12px] font-medium text-slate-500 mt-0.5">{subtitle}</Text>}
            </View>
        </View>
        {!isDanger && <ChevronRight size={16} color="#cbd5e1" />}
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
            <View className="flex-1 items-center justify-center bg-white">
                <Text className="text-[16px] font-bold text-slate-800 mb-4">Please login to view your profile</Text>
                <TouchableOpacity 
                    onPress={() => router.push('/login')}
                    className="bg-amber-400 px-6 py-3 rounded-xl shadow-sm"
                >
                    <Text className="text-amber-950 font-black text-[15px]">Login / Signup</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white pt-12 px-5 pb-6 border-b border-slate-100 shadow-sm">
                <View className="flex-row items-center justify-between">
                    <Text className="text-[24px] font-black text-slate-900">Profile</Text>
                    <TouchableOpacity onPress={() => router.push('/settings')} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-200">
                        <Edit2 size={16} color="#64748b" />
                    </TouchableOpacity>
                </View>

                {/* User Info */}
                <View className="flex-row items-center mt-6">
                    <View className="w-16 h-16 bg-amber-100 rounded-full items-center justify-center mr-4 border-2 border-white shadow-sm">
                        <UserIcon size={32} color="#d97706" />
                    </View>
                    <View>
                        <Text className="text-[20px] font-black text-slate-900 leading-tight">
                            {user.name || 'MUNA User'}
                        </Text>
                        <Text className="text-[14px] font-bold text-slate-500 mt-1">
                            {user.phone || user.email || '+91 ••••• •••••'}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 pt-4 px-4" showsVerticalScrollIndicator={false}>
                {/* Orders & Wishlist Quick Actions */}
                <View className="flex-row gap-3 mb-4">
                    <TouchableOpacity 
                        onPress={() => router.push('/orders')}
                        className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center justify-center"
                    >
                        <Package size={24} color="#0284c7" className="mb-2" />
                        <Text className="text-[13px] font-bold text-slate-700">Orders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => router.push('/wishlist')}
                        className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center justify-center"
                    >
                        <Heart size={24} color="#ef4444" className="mb-2" />
                        <Text className="text-[13px] font-bold text-slate-700">Wishlist</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Menu */}
                <View className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
                    <MenuRow 
                        icon={<Settings size={20} color="#475569" />}
                        title="Account Settings"
                        subtitle="Addresses, Password, Privacy"
                        onPress={() => router.push('/settings')}
                    />
                    
                    <MenuRow 
                        icon={<Store size={20} color="#10b981" />}
                        title="Become a Vendor"
                        subtitle="Sell your products on MUNA"
                        onPress={() => router.push('/vendor-request')}
                    />
                    
                    <MenuRow 
                        icon={<LogOut size={20} color="#ef4444" />}
                        title="Logout"
                        isDanger={true}
                        isLast={true}
                        onPress={handleLogout}
                    />
                </View>

                <View className="items-center mb-8">
                    <Text className="text-[12px] font-bold text-slate-400">MUNA App v1.0.0</Text>
                    <Text className="text-[10px] text-slate-300 mt-1">Made with ♥ in Assam</Text>
                </View>
                
                <View className="h-20" />
            </ScrollView>
        </View>
    );
}
