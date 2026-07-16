import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react-native';
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

export default function ChatDetailScreen() {
    const { sessionId } = useLocalSearchParams();
    const router = useRouter();
    const { user, token } = useAuth();
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
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#fbbf24" />
            </View>
        );
    }

    if (!session) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text>Chat not found.</Text>
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
            <View className="flex-1 bg-slate-50">
                {/* Header */}
                <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-3 shadow-sm flex-row items-center gap-3 z-10">
                    <TouchableOpacity onPress={() => router.back()} className="p-1">
                        <ArrowLeft size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center border border-amber-200">
                            <Text className="text-[16px]">👤</Text>
                        </View>
                        <View>
                            <Text className="text-[16px] font-black text-slate-900">{otherName}</Text>
                            {session.item && (
                                <Text className="text-[11px] font-bold text-slate-500">
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
                        <View className="bg-slate-200/50 px-3 py-1 rounded-full">
                            <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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
                                    ? 'bg-emerald-600 rounded-tr-sm shadow-sm' 
                                    : 'bg-white border border-slate-100 rounded-tl-sm shadow-sm'
                                }`}>
                                    <Text className={`text-[14px] leading-relaxed ${isMe ? 'text-white' : 'text-slate-800'}`}>
                                        {msg.content}
                                    </Text>
                                    <Text className={`text-[10px] font-bold mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                                        {formatTime(msg.createdAt)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Input Area */}
                <View className="bg-white border-t border-slate-100 p-4 pb-8 flex-row items-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <View className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl min-h-[48px] max-h-[120px] px-4 py-3 justify-center">
                        <TextInput 
                            className="text-[15px] text-slate-900"
                            placeholder="Type a message..."
                            placeholderTextColor="#94a3b8"
                            multiline
                            value={newMessage}
                            onChangeText={setNewMessage}
                            style={{ maxHeight: 100 }}
                        />
                    </View>
                    <TouchableOpacity 
                        onPress={handleSend}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className={`w-12 h-12 rounded-full items-center justify-center shadow-sm
                        ${!newMessage.trim() ? 'bg-slate-200' : 'bg-amber-400'}`}
                    >
                        {sendMessageMutation.isPending ? (
                            <ActivityIndicator size="small" color="#451a03" />
                        ) : (
                            <Send size={20} color={!newMessage.trim() ? '#94a3b8' : '#451a03'} style={{ marginLeft: 2 }} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
