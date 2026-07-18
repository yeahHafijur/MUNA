import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
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
    const { colors, isDark } = useTheme();

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
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View className="pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color={colors.icon} />
                </TouchableOpacity>
                <Text style={{ color: colors.primaryText }} className="text-[18px] font-black">Chats</Text>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : sessions.length === 0 ? (
                <View className="flex-1 items-center justify-center p-4">
                    <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: isDark ? colors.elevated : '#f1f5f9' }}>
                        <MessageCircle size={32} color={colors.iconMuted} />
                    </View>
                    <Text style={{ color: colors.primaryText }} className="text-[18px] font-black mb-2">No active chats</Text>
                    <Text style={{ color: colors.secondaryText }} className="text-[13px] font-medium text-center px-6">
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
                                    className="rounded-2xl p-4 border shadow-sm flex-row items-center gap-4"
                                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                                >
                                    <View className="w-12 h-12 rounded-full items-center justify-center border" style={{ backgroundColor: isDark ? 'rgba(217,119,6,0.15)' : '#fef3c7', borderColor: isDark ? 'rgba(217,119,6,0.3)' : '#fde68a' }}>
                                        <Text className="text-[20px]">👤</Text>
                                    </View>
                                    
                                    <View className="flex-1">
                                        <View className="flex-row justify-between items-center mb-1">
                                            <Text className={`text-[15px] ${isUnread ? 'font-black' : 'font-bold'}`} style={{ color: colors.primaryText }} numberOfLines={1}>
                                                {name}
                                            </Text>
                                            <Text className={`text-[11px] font-bold`} style={{ color: isUnread ? colors.primary : colors.tertiaryText }}>
                                                {formatTime(session.updatedAt)}
                                            </Text>
                                        </View>
                                        
                                        <View className="flex-row items-center justify-between">
                                            <Text 
                                                className={`text-[13px] ${isUnread ? 'font-bold' : 'font-medium'} flex-1 mr-4`}
                                                style={{ color: isUnread ? colors.primaryText : colors.secondaryText }}
                                                numberOfLines={1}
                                            >
                                                {lastMessage}
                                            </Text>
                                            
                                            {isUnread && (
                                                <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary }}>
                                                    <Text className="text-[10px] font-black" style={{ color: colors.invertedText }}>
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
