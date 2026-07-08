import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bell, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';

export default function NotificationsScreen() {
    const router = useRouter();
    const { token } = useAuth();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            if (!token) return [];
            const res = await api.get('/api/notifications');
            return res.data;
        },
        enabled: !!token
    });

    const markAllRead = async () => {
        try {
            await api.put('/api/notifications/mark-all-read');
            // Optimistic update would go here
        } catch (err) {
            console.error('Failed to mark notifications as read', err);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-4 shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()} className="p-1">
                        <ArrowLeft size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-black text-slate-900">Notifications</Text>
                </View>
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={markAllRead} className="px-2 py-1">
                        <Text className="text-[12px] font-bold text-slate-500">Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#fbbf24" />
                </View>
            ) : notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center p-4">
                    <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                        <Bell size={32} color="#94a3b8" />
                    </View>
                    <Text className="text-[18px] font-black text-slate-900 mb-2">No new notifications</Text>
                    <Text className="text-[13px] font-medium text-slate-500 text-center px-6">
                        We'll let you know when there are updates on your orders or new offers.
                    </Text>
                </View>
            ) : (
                <ScrollView 
                    className="flex-1 px-4 pt-4" 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40, gap: 12 }}
                >
                    {notifications.map((notif: any) => (
                        <View 
                            key={notif._id} 
                            className={`bg-white rounded-2xl p-4 border ${notif.read ? 'border-slate-100' : 'border-amber-200'} shadow-sm flex-row items-start gap-4`}
                        >
                            <View className={`w-10 h-10 rounded-full items-center justify-center ${notif.read ? 'bg-slate-50' : 'bg-amber-50'}`}>
                                {notif.type === 'order' ? (
                                    <CheckCircle2 size={20} color={notif.read ? "#64748b" : "#d97706"} />
                                ) : (
                                    <Bell size={20} color={notif.read ? "#64748b" : "#d97706"} />
                                )}
                            </View>
                            <View className="flex-1">
                                <Text className={`text-[14px] font-bold ${notif.read ? 'text-slate-700' : 'text-slate-900'} mb-1`}>
                                    {notif.title}
                                </Text>
                                <Text className="text-[13px] font-medium text-slate-500 leading-relaxed mb-2">
                                    {notif.body}
                                </Text>
                                <Text className="text-[10px] font-bold text-slate-400">
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                            {!notif.read && (
                                <View className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}
