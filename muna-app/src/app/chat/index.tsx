import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';

const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    let h = d.getHours();
    let m: string | number = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    m = m < 10 ? '0' + m : m;
    return `${h}:${m} ${ampm}`;
};

export default function ChatListScreen() {
    const router = useRouter();
    const { user, token } = useAuth();

    const { data: sessions = [], isLoading } = useQuery({
        queryKey: ['chat-sessions'],
        queryFn: async () => {
            if (!token) return [];
            const res = await api.get('/api/chat/sessions');
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!token
    });

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-[18px] font-black text-slate-900">Chats</Text>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#fbbf24" />
                </View>
            ) : sessions.length === 0 ? (
                <View className="flex-1 items-center justify-center p-4">
                    <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                        <MessageCircle size={32} color="#94a3b8" />
                    </View>
                    <Text className="text-[18px] font-black text-slate-900 mb-2">No active chats</Text>
                    <Text className="text-[13px] font-medium text-slate-500 text-center px-6">
                        When you contact sellers on Daily Market, your chats will appear here.
                    </Text>
                </View>
            ) : (
                <ScrollView 
                    className="flex-1 px-4 pt-4" 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    <View className="gap-3">
                        {sessions.map((session: any) => {
                            // Identify the other participant
                            const otherParticipant = session.participants?.find((p: any) => p._id !== user?._id);
                            const name = otherParticipant?.name || 'MUNA User';
                            const lastMessage = session.lastMessage?.content || 'Started a conversation';
                            const isUnread = session.unreadCount && session.unreadCount[user?._id as string] > 0;

                            return (
                                <TouchableOpacity 
                                    key={session._id}
                                    activeOpacity={0.8}
                                    onPress={() => router.push(`/chat/${session._id}` as any)}
                                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-row items-center gap-4"
                                >
                                    <View className="w-12 h-12 bg-amber-100 rounded-full items-center justify-center border border-amber-200">
                                        <Text className="text-[20px]">👤</Text>
                                    </View>
                                    
                                    <View className="flex-1">
                                        <View className="flex-row justify-between items-center mb-1">
                                            <Text className={`text-[15px] ${isUnread ? 'font-black' : 'font-bold'} text-slate-900`} numberOfLines={1}>
                                                {name}
                                            </Text>
                                            <Text className={`text-[11px] font-bold ${isUnread ? 'text-amber-600' : 'text-slate-400'}`}>
                                                {formatTime(session.updatedAt)}
                                            </Text>
                                        </View>
                                        
                                        <View className="flex-row items-center justify-between">
                                            <Text 
                                                className={`text-[13px] ${isUnread ? 'font-bold text-slate-700' : 'font-medium text-slate-500'} flex-1 mr-4`}
                                                numberOfLines={1}
                                            >
                                                {lastMessage}
                                            </Text>
                                            
                                            {isUnread && (
                                                <View className="bg-amber-500 w-5 h-5 rounded-full items-center justify-center">
                                                    <Text className="text-[10px] font-black text-white">
                                                        {session.unreadCount[user?._id as string]}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
