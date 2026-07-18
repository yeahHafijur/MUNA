import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react-native';
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

export default function ChatDetailScreen() {
    const { sessionId } = useLocalSearchParams();
    const router = useRouter();
    const { user, token } = useAuth();
    const { colors, isDark } = useTheme();
    const queryClient = useQueryClient();
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);
    
    const [newMessage, setNewMessage] = useState('');

    const { data: session, isLoading } = useQuery({
        queryKey: ['chat-session', sessionId],
        queryFn: async () => {
            const res = await api.get(`/api/chat/session/${sessionId}`);
            return res.data;
        },
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await api.post(`/api/chat/message/${sessionId}`, { content });
            return res.data;
        },
        onSuccess: (newMsg) => {
            setNewMessage('');
            queryClient.setQueryData(['chat-session', sessionId], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    messages: [...(oldData.messages || []), newMsg]
                };
            });
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    });

    const handleSend = () => {
        if (!newMessage.trim()) return;
        sendMessageMutation.mutate(newMessage.trim());
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    if (!session) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
                <Text style={{ color: colors.primaryText }}>Chat not found.</Text>
            </View>
        );
    }

    const otherParticipant = session.participants?.find((p: any) => p._id !== user?._id);
    const otherName = otherParticipant?.name || 'MUNA User';
    const messages = session.messages || [];

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View className="flex-1" style={{ backgroundColor: colors.background }}>
                {/* Header */}
                <View className="pt-12 px-4 pb-3 shadow-sm flex-row items-center gap-3 z-10 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
                    <TouchableOpacity onPress={() => router.back()} className="p-1">
                        <ArrowLeft size={24} color={colors.icon} />
                    </TouchableOpacity>
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full items-center justify-center border" style={{ backgroundColor: isDark ? 'rgba(217,119,6,0.15)' : '#fef3c7', borderColor: isDark ? 'rgba(217,119,6,0.3)' : '#fde68a' }}>
                            <Text className="text-[16px]">👤</Text>
                        </View>
                        <View>
                            <Text style={{ color: colors.primaryText }} className="text-[16px] font-black">{otherName}</Text>
                            {session.item && (
                                <Text style={{ color: colors.secondaryText }} className="text-[11px] font-bold">
                                    Re: {session.item.title}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Messages */}
                <ScrollView 
                    ref={scrollViewRef}
                    className="flex-1 px-4" 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 20 }}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    <View className="items-center mb-6">
                        <View className="px-3 py-1 rounded-full" style={{ backgroundColor: isDark ? colors.elevated : 'rgba(226, 232, 240, 0.5)' }}>
                            <Text style={{ color: colors.secondaryText }} className="text-[10px] font-bold uppercase tracking-wider">
                                {(() => {
                                    const d = new Date();
                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    return `${d.getDate()} ${months[d.getMonth()]}`;
                                })()}
                            </Text>
                        </View>
                    </View>

                    {messages.map((msg: any) => {
                        const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;

                        return (
                            <View 
                                key={msg._id} 
                                className={`mb-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <View className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                                    isMe 
                                    ? 'rounded-tr-sm shadow-sm' 
                                    : 'border rounded-tl-sm shadow-sm'
                                }`}
                                style={isMe ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border }}
                                >
                                    <Text className={`text-[14px] leading-relaxed`} style={{ color: isMe ? colors.invertedText : colors.primaryText }}>
                                        {msg.content}
                                    </Text>
                                    <Text className={`text-[10px] font-bold mt-1 text-right`} style={{ color: isMe ? 'rgba(255,255,255,0.7)' : colors.tertiaryText }}>
                                        {formatTime(msg.createdAt)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Input Area */}
                <View className="border-t p-4 pb-8 flex-row items-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}>
                    <View className="flex-1 border rounded-2xl min-h-[48px] max-h-[120px] px-4 py-3 justify-center" style={{ backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }}>
                        <TextInput 
                            className="text-[15px]"
                            style={{ color: colors.inputText, maxHeight: 100 }}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.placeholder}
                            multiline
                            value={newMessage}
                            onChangeText={setNewMessage}
                        />
                    </View>
                    <TouchableOpacity 
                        onPress={handleSend}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className={`w-12 h-12 rounded-full items-center justify-center shadow-sm`}
                        style={{ backgroundColor: !newMessage.trim() ? (isDark ? '#334155' : '#e2e8f0') : colors.accent }}
                    >
                        {sendMessageMutation.isPending ? (
                            <ActivityIndicator size="small" color={!newMessage.trim() ? colors.iconMuted : colors.primaryText} />
                        ) : (
                            <Send size={20} color={!newMessage.trim() ? colors.iconMuted : '#451a03'} style={{ marginLeft: 2 }} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
