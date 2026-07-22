// @ts-nocheck
// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Package, MessageSquare, Megaphone, Info, CheckCheck } from 'lucide-react-native';
import api from '@/api/api';

export default function NotificationsScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();

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
            case 'order': return 'bg-sky-100';
            case 'chat': return 'bg-emerald-100';
            case 'promo': return 'bg-amber-100';
            case 'system': return 'bg-slate-100';
            default: return 'bg-purple-100';
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
            className={`flex-row p-4 border-b border-slate-100 ${!item.isRead ? 'bg-amber-50/30' : 'bg-white'}`}
        >
            <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${getBgColor(item.type)}`}>
                {getIcon(item.type)}
            </View>
            <View className="flex-1">
                <View className="flex-row items-start justify-between mb-1">
                    <Text className={`flex-1 text-[15px] mr-2 ${!item.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                        {item.title}
                    </Text>
                    <Text className="text-[11px] font-medium text-slate-400 mt-0.5">
                        {timeAgo(item.createdAt)}
                    </Text>
                </View>
                <Text className={`text-[13px] leading-5 ${!item.isRead ? 'font-medium text-slate-700' : 'text-slate-500'}`}>
                    {item.message}
                </Text>
            </View>
            {!item.isRead && (
                <View className="w-2.5 h-2.5 bg-red-500 rounded-full ml-3 mt-2" />
            )}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="pt-[52px] pb-4 px-4 flex-row items-center justify-between border-b border-slate-100 bg-white">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100"
                    >
                        <ArrowLeft size={20} color="#0f172a" />
                    </TouchableOpacity>
                    <Text className="text-[20px] font-black text-slate-900 tracking-tight">Notifications</Text>
                </View>
                
                {notifications.some((n: any) => !n.isRead) && (
                    <TouchableOpacity 
                        onPress={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                        className="flex-row items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200"
                    >
                        <CheckCheck size={14} color="#64748b" />
                        <Text className="text-[12px] font-bold text-slate-600">Read All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#f59e0b" />
                </View>
            ) : notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-6">
                        <Bell size={40} color="#cbd5e1" />
                    </View>
                    <Text className="text-xl font-black text-slate-900 mb-2">All Caught Up!</Text>
                    <Text className="text-center text-slate-500 font-medium">
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
