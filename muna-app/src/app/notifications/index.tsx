// @ts-nocheck
// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Package, MessageSquare, Megaphone, Info, CheckCheck } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import api from '@/api/api';

export default function NotificationsScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { colors, isDark } = useTheme();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/api/notifications');
            return res.data;
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/api/notifications/${id}/read`);
        },
        onMutate: async (id) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ['notifications'] });
            const previous = queryClient.getQueryData(['notifications']);
            
            queryClient.setQueryData(['notifications'], (old: any) => 
                old?.map((n: any) => n._id === id ? { ...n, isRead: true } : n)
            );
            
            return { previous };
        },
        onError: (err, newTodo, context: any) => {
            queryClient.setQueryData(['notifications'], context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            await api.put('/api/notifications/read-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
        }
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <Package size={20} color="#0ea5e9" />;
            case 'chat': return <MessageSquare size={20} color="#10b981" />;
            case 'promo': return <Megaphone size={20} color="#f59e0b" />;
            case 'system': return <Info size={20} color="#64748b" />;
            default: return <Bell size={20} color="#8b5cf6" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'order': return isDark ? 'rgba(14,165,233,0.15)' : '#e0f2fe';
            case 'chat': return isDark ? 'rgba(16,185,129,0.15)' : '#d1fae5';
            case 'promo': return isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7';
            case 'system': return isDark ? 'rgba(100,116,139,0.15)' : '#f1f5f9';
            default: return isDark ? 'rgba(139,92,246,0.15)' : '#f3e8ff';
        }
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return "just now";
    };

    const handlePress = (notification: any) => {
        console.log("Notification Clicked:", notification);
        
        if (!notification.isRead) {
            markAsReadMutation.mutate(notification._id);
        }
        
        let targetUrl = notification.actionUrl;
        
        // Smart fallbacks if actionUrl is missing
        if (!targetUrl) {
            if (notification.type === 'order') targetUrl = '/orders';
            else if (notification.type === 'chat') targetUrl = '/(tabs)/chat';
        }
        
        // Normalize deprecated URLs from the database
        if (targetUrl === '/profile/orders') {
            targetUrl = '/orders';
        }

        if (targetUrl) {
            router.push(targetUrl as any);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            onPress={() => handlePress(item)}
            className={`flex-row p-4 border-b`}
            style={{ backgroundColor: !item.isRead ? (isDark ? 'rgba(245,158,11,0.05)' : 'rgba(254,243,199,0.5)') : colors.background, borderBottomColor: colors.border }}
        >
            <View className={`w-12 h-12 rounded-full items-center justify-center mr-4`} style={{ backgroundColor: getBgColor(item.type) }}>
                {getIcon(item.type)}
            </View>
            <View className="flex-1">
                <View className="flex-row items-start justify-between mb-1">
                    <Text className={`flex-1 text-[15px] mr-2 ${!item.isRead ? 'font-black' : 'font-bold'}`} style={{ color: !item.isRead ? colors.primaryText : colors.secondaryText }}>
                        {item.title}
                    </Text>
                    <Text className="text-[11px] font-medium mt-0.5" style={{ color: colors.tertiaryText }}>
                        {timeAgo(item.createdAt)}
                    </Text>
                </View>
                <Text className={`text-[13px] leading-5 ${!item.isRead ? 'font-medium' : ''}`} style={{ color: !item.isRead ? colors.secondaryText : colors.tertiaryText }}>
                    {item.message}
                </Text>
            </View>
            {!item.isRead && (
                <View className="w-2.5 h-2.5 rounded-full ml-3 mt-2" style={{ backgroundColor: colors.danger }} />
            )}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View className="pt-[52px] pb-4 px-4 flex-row items-center justify-between border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full items-center justify-center border"
                        style={{ backgroundColor: isDark ? colors.elevated : '#f8fafc', borderColor: colors.border }}
                    >
                        <ArrowLeft size={20} color={colors.icon} />
                    </TouchableOpacity>
                    <Text style={{ color: colors.primaryText }} className="text-[20px] font-black tracking-tight">Notifications</Text>
                </View>
                
                {notifications.some((n: any) => !n.isRead) && (
                    <TouchableOpacity 
                        onPress={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border"
                        style={{ backgroundColor: isDark ? colors.elevated : '#f8fafc', borderColor: colors.border }}
                    >
                        <CheckCheck size={14} color={colors.icon} />
                        <Text style={{ color: colors.secondaryText }} className="text-[12px] font-bold">Read All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: isDark ? colors.elevated : '#f8fafc' }}>
                        <Bell size={40} color={colors.iconMuted} />
                    </View>
                    <Text style={{ color: colors.primaryText }} className="text-xl font-black mb-2">All Caught Up!</Text>
                    <Text style={{ color: colors.secondaryText }} className="text-center font-medium">
                        You don't have any new notifications at the moment.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}
        </View>
    );
}
