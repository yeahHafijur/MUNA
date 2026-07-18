import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StatusBar, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Package, Heart, Settings, Store, LogOut, ChevronRight, User as UserIcon, Edit2, MapPin, HeadphonesIcon, CreditCard } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Constants from 'expo-constants';

interface MenuRowProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    isDanger?: boolean;
    isLast?: boolean;
}

const MenuRow: React.FC<MenuRowProps> = ({ icon, title, subtitle, onPress, isDanger, isLast }) => {
    const { colors, isDark } = useTheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className={`flex-row items-center justify-between py-4 px-5 border-b`}
            style={{ backgroundColor: colors.surface, borderBottomColor: isLast ? 'transparent' : colors.border }}
        >
            <View className="flex-row items-center gap-4 flex-1">
                <View 
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: isDanger ? colors.dangerMuted : (isDark ? colors.elevated : '#f8fafc') }}
                >
                    {icon}
                </View>
                <View className="flex-1">
                    <Text className={`text-[15px] font-semibold`} style={{ color: isDanger ? colors.danger : colors.primaryText }}>{title}</Text>
                    {subtitle && <Text className="text-[13px] font-medium mt-0.5" style={{ color: colors.secondaryText }}>{subtitle}</Text>}
                </View>
            </View>
            {!isDanger && <ChevronRight size={18} color={colors.iconMuted} />}
        </TouchableOpacity>
    );
};

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const { colors, isDark } = useTheme();
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
            <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.background }}>
                <View className="w-24 h-24 rounded-full items-center justify-center mb-6 shadow-sm border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <UserIcon size={40} color={colors.iconMuted} />
                </View>
                <Text className="text-[20px] font-bold mb-2 text-center" style={{ color: colors.primaryText }}>Your Profile</Text>
                <Text className="text-[14px] font-medium mb-8 text-center leading-relaxed" style={{ color: colors.secondaryText }}>
                    Login or create an account to view your orders, manage saved addresses, and access your wishlist.
                </Text>
                <TouchableOpacity 
                    onPress={() => router.push('/login')}
                    className="w-full py-4 rounded-xl shadow-sm items-center"
                    style={{ backgroundColor: colors.accent }}
                >
                    <Text className="font-bold text-[15px]" style={{ color: colors.accentText }}>Login / Signup</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={true}>
                
                {/* Professional Header Area */}
                <View className="pt-16 pb-8 px-5 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-[22px] font-bold tracking-tight" style={{ color: colors.primaryText }}>Profile</Text>
                        <TouchableOpacity onPress={() => router.push('/settings')} className="w-9 h-9 rounded-full items-center justify-center border" style={{ backgroundColor: isDark ? colors.elevated : '#f8fafc', borderColor: colors.border }}>
                            <Edit2 size={16} color={colors.icon} />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center">
                        <View className="w-16 h-16 rounded-full items-center justify-center mr-4 border overflow-hidden" style={{ backgroundColor: isDark ? colors.elevated : '#f1f5f9', borderColor: colors.border }}>
                            <UserIcon size={30} color={colors.iconMuted} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[18px] font-bold leading-tight mb-1" numberOfLines={1} style={{ color: colors.primaryText }}>
                                {user.name || 'MUNA User'}
                            </Text>
                            <Text className="text-[13px] font-medium" style={{ color: colors.secondaryText }}>
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
                            className="flex-1 p-4 rounded-2xl border flex-row items-center gap-3"
                            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                        >
                            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: isDark ? colors.elevated : '#f8fafc' }}>
                                <Package size={20} color={colors.icon} />
                            </View>
                            <View>
                                <Text className="text-[14px] font-bold" style={{ color: colors.primaryText }}>Orders</Text>
                                <Text className="text-[11px] font-medium mt-0.5" style={{ color: colors.secondaryText }}>Track & Reorder</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => router.push('/wishlist')}
                            className="flex-1 p-4 rounded-2xl border flex-row items-center gap-3"
                            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                        >
                            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: isDark ? colors.elevated : '#f8fafc' }}>
                                <Heart size={20} color={colors.icon} />
                            </View>
                            <View>
                                <Text className="text-[14px] font-bold" style={{ color: colors.primaryText }}>Wishlist</Text>
                                <Text className="text-[11px] font-medium mt-0.5" style={{ color: colors.secondaryText }}>Saved Items</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Vendor Dashboard Banner (If Vendor) */}
                    {user?.role === 'vendor' && (
                        <TouchableOpacity 
                            onPress={() => router.push('/vendor')}
                            className="p-4 rounded-2xl items-center justify-between flex-row mb-6 shadow-sm"
                            style={{ backgroundColor: colors.accent }}
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                    <Store size={20} color={colors.accentText} />
                                </View>
                                <View>
                                    <Text className="text-[15px] font-bold" style={{ color: colors.accentText }}>Vendor Dashboard</Text>
                                    <Text className="text-[12px] font-medium opacity-80" style={{ color: colors.accentText }}>Manage your business</Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color={colors.accentText} />
                        </TouchableOpacity>
                    )}

                    {/* General Settings */}
                    <Text className="text-[13px] font-bold mb-2 ml-1" style={{ color: colors.tertiaryText }}>ACCOUNT</Text>
                    <View className="rounded-2xl border mb-6 overflow-hidden" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                        <MenuRow 
                            icon={<Settings size={20} color={colors.icon} />}
                            title="Account Settings"
                            subtitle="Personal Details, Password"
                            onPress={() => router.push('/settings')}
                            isLast={true}
                        />
                    </View>

                    {/* Support & Extras */}
                    <Text className="text-[13px] font-bold mb-2 ml-1" style={{ color: colors.tertiaryText }}>SUPPORT & MORE</Text>
                    <View className="rounded-2xl border mb-6 overflow-hidden" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                        {user?.role !== 'vendor' && (
                            <MenuRow 
                                icon={<Store size={20} color={colors.icon} />}
                                title="Become a Seller"
                                subtitle="Grow your business with MUNA"
                                onPress={() => router.push('/vendor-request')}
                            />
                        )}
                        <MenuRow 
                            icon={<HeadphonesIcon size={20} color={colors.icon} />}
                            title="Help & Support"
                            subtitle="Contact customer service"
                            onPress={() => Linking.openURL('mailto:ofassam@gmail.com')}
                        />
                        <MenuRow 
                            icon={<LogOut size={20} color={colors.danger} />}
                            title="Log Out"
                            isDanger={true}
                            isLast={true}
                            onPress={handleLogout}
                        />
                    </View>

                    {/* Footer / Version */}
                    <View className="items-center mb-10 pt-4">
                        <Text className="text-[14px] font-black tracking-widest mb-1" style={{ color: isDark ? '#334155' : '#cbd5e1' }}>M U N A</Text>
                        <Text className="text-[11px] font-semibold" style={{ color: isDark ? '#475569' : '#94a3b8' }}>Proudly made in Assam ❤️</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

