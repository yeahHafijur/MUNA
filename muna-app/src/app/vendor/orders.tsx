import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Linking, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Phone, Clock, MapPin } from 'lucide-react-native';
import api from '@/api/api';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing',
    out_for_delivery: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled'
};

export default function VendorOrders() {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [activeView, setActiveView] = useState<'live' | 'history'>('live');
    const [liveTab, setLiveTab] = useState<'pending' | 'preparing' | 'transit'>('pending');
    
    // History Tab
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Modal state
    const [confirmAction, setConfirmAction] = useState<{orderId: string, newStatus: string} | null>(null);
    const [deliveryOtp, setDeliveryOtp] = useState('');
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    const prevLiveRef = useRef(0);

    const { data: orders = [], isLoading: isLiveLoading } = useQuery({
        queryKey: ['vendor-live-orders'],
        queryFn: async () => {
            const res = await api.get('/api/orders/vendor?limit=100');
            const all = res.data.orders || res.data || [];
            if (!Array.isArray(all)) return [];
            
            const live = all.filter((o: any) => !['delivered', 'cancelled'].includes(o.status));
            if (live.length > prevLiveRef.current) {
                // Could play sound here in RN using expo-av if configured
            }
            prevLiveRef.current = live.length;
            return all;
        },
        refetchInterval: 12000
    });

    const { data: historyOrders = [], isLoading: isHistoryLoading } = useQuery({
        queryKey: ['vendor-history-orders', selectedDate],
        queryFn: async () => {
            const res = await api.get(`/api/orders/vendor?date=${selectedDate}&limit=200`);
            return res.data.orders || [];
        },
        enabled: activeView === 'history'
    });

    const requestConfirm = (orderId: string, newStatus: string) => {
        setDeliveryOtp('');
        setConfirmAction({ orderId, newStatus });
    };

    const handleConfirm = async () => {
        if (!confirmAction) return;
        const { orderId, newStatus } = confirmAction;

        if (newStatus === 'delivered' && deliveryOtp.length !== 4) {
            Alert.alert("Error", "Enter full 4-digit PIN!");
            return;
        }

        setConfirmAction(null);
        setUpdatingStatusId(orderId);

        // Optimistic update
        if (newStatus !== 'delivered') {
            queryClient.setQueryData(['vendor-live-orders'], (prev: any) => {
                if (!prev) return [];
                return prev.map((order: any) => order._id === orderId ? { ...order, status: newStatus } : order);
            });
        }

        try {
            const body: any = { status: newStatus };
            if (newStatus === 'delivered') body.deliveryOtp = deliveryOtp;

            await api.put(`/api/orders/${orderId}/status`, body);
            queryClient.invalidateQueries({ queryKey: ['vendor-live-orders'] });
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Network error");
            queryClient.invalidateQueries({ queryKey: ['vendor-live-orders'] });
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleWhatsAppShare = (order: any) => {
        const itemsList = order.items.map((i: any) => `${i.quantity}x ${i.name} (₹${i.price * i.quantity})`).join('\n');
        let mapsLink = "Not available";
        if (order.deliveryLocation?.lat && order.deliveryLocation?.lng) {
            mapsLink = `https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`;
        }
        let textToEncode = `*🚨 NEW DELIVERY ORDER 🚨*\n\n` +
            `*Order ID:* #${order._id.slice(-5).toUpperCase()}\n` +
            `*Customer:* ${order.customerId?.name || 'Guest'}\n` +
            `*Phone:* ${order.customerId?.phone || 'N/A'}\n\n` +
            `*Address:* ${order.deliveryLocation?.address || 'N/A'}\n` +
            `*📍 Map:* ${mapsLink}\n\n` +
            `*📦 Items:*\n${itemsList}\n\n`;
        if (order.instructions && order.instructions.trim() !== '') {
            textToEncode += `*📝 Instructions:*\n${order.instructions.trim()}\n\n`;
        }
        textToEncode += `*Total:* ₹${order.totalAmount}`;
        
        Linking.openURL(`whatsapp://send?text=${encodeURIComponent(textToEncode)}`).catch(() => {
            Alert.alert("WhatsApp not found", "Make sure WhatsApp is installed on your device.");
        });
    };

    const openMap = (lat: number, lng: number) => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    };

    const liveOrders = orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status));
    const pendingOrders = liveOrders.filter((o: any) => o.status === 'pending');
    const acceptedOrders = liveOrders.filter((o: any) => ['accepted', 'preparing'].includes(o.status));
    const transitOrders = liveOrders.filter((o: any) => o.status === 'out_for_delivery');

    const renderOrderCard = (order: any) => (
        <View key={order._id} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-4 flex-col mb-4">
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-[12px] font-black text-slate-400 uppercase tracking-widest">#{order._id.slice(-5).toUpperCase()}</Text>
                <Text className="text-[16px] font-black text-slate-900">₹{order.totalAmount}</Text>
            </View>

            <View className="flex-col mb-3">
                <Text className="text-[15px] font-black text-slate-900">{order.customerId?.name || 'Guest'}</Text>
                <Text className="text-[12px] font-semibold text-slate-500">{order.customerId?.phone || 'N/A'}</Text>
            </View>

            <View className="bg-slate-50 rounded-xl p-3 border border-slate-100/50 mb-3">
                {order.items.map((i: any) => (
                    <View key={i._id} className="flex-row items-center py-1 flex-1">
                        <Text className="font-black text-slate-400 mr-2">{i.quantity}×</Text>
                        <Text className="text-[12px] font-semibold text-slate-600 flex-1">{i.name}</Text>
                    </View>
                ))}
            </View>

            {order.instructions && order.instructions.trim() !== '' && (
                <View className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-3 mb-3">
                    <Text className="text-[10px] font-black uppercase text-amber-700/80 tracking-wider mb-1">📝 Instructions</Text>
                    <Text className="text-xs font-semibold text-amber-900">{order.instructions}</Text>
                </View>
            )}

            {order.deliveryLocation?.address && (
                <TouchableOpacity 
                    className="mb-3"
                    onPress={() => {
                        if (order.deliveryLocation?.lat && order.deliveryLocation?.lng) {
                            openMap(order.deliveryLocation.lat, order.deliveryLocation.lng);
                        }
                    }}
                >
                    <Text className={`text-[11px] font-semibold ${order.deliveryLocation?.lat ? 'text-blue-600' : 'text-slate-500'}`}>
                        📍 {order.deliveryLocation.address}
                    </Text>
                </TouchableOpacity>
            )}

            <View className="pt-3 border-t border-slate-50 flex-row gap-2">
                {updatingStatusId === order._id ? (
                    <View className="flex-1 py-3 items-center justify-center bg-slate-50 rounded-xl flex-row gap-2">
                        <ActivityIndicator size="small" color="#94a3b8" />
                        <Text className="text-xs font-bold text-slate-400">Updating...</Text>
                    </View>
                ) : (
                    <>
                        {order.status === 'pending' && (
                            <>
                                <TouchableOpacity className="flex-1 bg-emerald-50 py-3 rounded-xl items-center" onPress={() => requestConfirm(order._id, 'accepted')}>
                                    <Text className="text-[12px] font-black uppercase tracking-wider text-emerald-600">Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity className="flex-1 bg-rose-50 py-3 rounded-xl items-center" onPress={() => requestConfirm(order._id, 'cancelled')}>
                                    <Text className="text-[12px] font-black uppercase tracking-wider text-rose-600">Reject</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {order.status === 'accepted' && (
                            <>
                                <TouchableOpacity className="flex-1 bg-violet-500 py-3 rounded-xl items-center shadow-sm" onPress={() => requestConfirm(order._id, 'preparing')}>
                                    <Text className="text-[12px] font-black uppercase tracking-wider text-white">Start Preparing</Text>
                                </TouchableOpacity>
                                <TouchableOpacity className="flex-1 bg-[#25D366] py-3 rounded-xl items-center" onPress={() => handleWhatsAppShare(order)}>
                                    <Text className="text-[12px] font-black uppercase tracking-wider text-white">WhatsApp</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {order.status === 'preparing' && (
                            <>
                                <TouchableOpacity className="flex-1 bg-amber-400 py-3 rounded-xl items-center shadow-sm" onPress={() => requestConfirm(order._id, 'out_for_delivery')}>
                                    <Text className="text-[12px] font-black uppercase tracking-wider text-amber-950">Dispatch</Text>
                                </TouchableOpacity>
                                <TouchableOpacity className="flex-1 bg-[#25D366] py-3 rounded-xl items-center" onPress={() => handleWhatsAppShare(order)}>
                                    <Text className="text-[12px] font-black uppercase tracking-wider text-white">WhatsApp</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {order.status === 'out_for_delivery' && (
                            <TouchableOpacity className="flex-1 bg-emerald-500 py-3.5 rounded-xl items-center shadow-md" onPress={() => requestConfirm(order._id, 'delivered')}>
                                <Text className="text-[13px] font-black uppercase tracking-widest text-white">Verify & Deliver</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
        </View>
    );

    const historyTotal = historyOrders.length;
    const historyPending = historyOrders.filter((o: any) => o.status === 'pending').length;
    const historyActive = historyOrders.filter((o: any) => ['accepted', 'preparing', 'out_for_delivery'].includes(o.status)).length;
    const historyDone = historyOrders.filter((o: any) => o.status === 'delivered').length;

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            {/* Header */}
            <View className="bg-white pt-12 pb-3 shadow-sm border-b border-slate-100 z-10">
                <View className="px-4 flex-row items-center gap-3 mb-4">
                    <TouchableOpacity onPress={() => router.push('/vendor')} className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center">
                        <ArrowLeft size={20} color="#334155" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-extrabold text-slate-900 tracking-tight">Manage Orders</Text>
                </View>

                {/* Segmented Control */}
                <View className="px-4">
                    <View className="flex-row bg-slate-100/80 p-1.5 rounded-[16px]">
                        <TouchableOpacity
                            className={`flex-1 py-2 rounded-[12px] flex-row items-center justify-center gap-2 ${activeView === 'live' ? 'bg-white shadow-sm' : ''}`}
                            onPress={() => setActiveView('live')}
                        >
                            <Text className={`text-[13px] font-black ${activeView === 'live' ? 'text-slate-900' : 'text-slate-500'}`}>Live</Text>
                            {liveOrders.length > 0 && (
                                <View className="bg-rose-500 px-1.5 py-0.5 rounded-md">
                                    <Text className="text-white text-[10px] font-black">{liveOrders.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 py-2 rounded-[12px] items-center justify-center ${activeView === 'history' ? 'bg-white shadow-sm' : ''}`}
                            onPress={() => setActiveView('history')}
                        >
                            <Text className={`text-[13px] font-black ${activeView === 'history' ? 'text-slate-900' : 'text-slate-500'}`}>History</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* LIVE VIEW */}
            {activeView === 'live' && (
                <View className="flex-1">
                    {/* Inner Tabs */}
                    <View className="px-4 py-3">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => setLiveTab('pending')}
                                className={`px-5 py-2.5 rounded-[14px] flex-row items-center gap-2 border ${liveTab === 'pending' ? 'bg-orange-500 border-orange-500' : 'bg-white border-slate-200'}`}
                            >
                                <Text className={`text-[13px] font-black ${liveTab === 'pending' ? 'text-white' : 'text-slate-600'}`}>New</Text>
                                {pendingOrders.length > 0 && (
                                    <View className={`px-2 py-0.5 rounded-md ${liveTab === 'pending' ? 'bg-white' : 'bg-orange-100'}`}>
                                        <Text className={`text-[10px] font-bold ${liveTab === 'pending' ? 'text-orange-600' : 'text-orange-800'}`}>{pendingOrders.length}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setLiveTab('preparing')}
                                className={`px-5 py-2.5 rounded-[14px] flex-row items-center gap-2 border ${liveTab === 'preparing' ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200'}`}
                            >
                                <Text className={`text-[13px] font-black ${liveTab === 'preparing' ? 'text-white' : 'text-slate-600'}`}>Preparing</Text>
                                {acceptedOrders.length > 0 && (
                                    <View className={`px-2 py-0.5 rounded-md ${liveTab === 'preparing' ? 'bg-white' : 'bg-blue-100'}`}>
                                        <Text className={`text-[10px] font-bold ${liveTab === 'preparing' ? 'text-blue-600' : 'text-blue-800'}`}>{acceptedOrders.length}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setLiveTab('transit')}
                                className={`px-5 py-2.5 rounded-[14px] flex-row items-center gap-2 border ${liveTab === 'transit' ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'}`}
                            >
                                <Text className={`text-[13px] font-black ${liveTab === 'transit' ? 'text-white' : 'text-slate-600'}`}>In Transit</Text>
                                {transitOrders.length > 0 && (
                                    <View className={`px-2 py-0.5 rounded-md ${liveTab === 'transit' ? 'bg-white' : 'bg-emerald-100'}`}>
                                        <Text className={`text-[10px] font-bold ${liveTab === 'transit' ? 'text-emerald-600' : 'text-emerald-800'}`}>{transitOrders.length}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                        {liveTab === 'pending' && pendingOrders.length === 0 && (
                            <View className="items-center justify-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm mb-8">
                                <Text className="text-5xl opacity-40 mb-3">🛎️</Text>
                                <Text className="text-[15px] font-black text-slate-900">No new orders</Text>
                            </View>
                        )}
                        {liveTab === 'pending' && pendingOrders.map(renderOrderCard)}

                        {liveTab === 'preparing' && acceptedOrders.length === 0 && (
                            <View className="items-center justify-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm mb-8">
                                <Text className="text-5xl opacity-40 mb-3">👨‍🍳</Text>
                                <Text className="text-[15px] font-black text-slate-900">Nothing is preparing</Text>
                            </View>
                        )}
                        {liveTab === 'preparing' && acceptedOrders.map(renderOrderCard)}

                        {liveTab === 'transit' && transitOrders.length === 0 && (
                            <View className="items-center justify-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm mb-8">
                                <Text className="text-5xl opacity-40 mb-3">🚚</Text>
                                <Text className="text-[15px] font-black text-slate-900">No orders in transit</Text>
                            </View>
                        )}
                        {liveTab === 'transit' && transitOrders.map(renderOrderCard)}
                        
                        <View className="h-10" />
                    </ScrollView>
                </View>
            )}

            {/* HISTORY VIEW */}
            {activeView === 'history' && (
                <View className="flex-1 px-4 pt-4">
                    <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4 flex-col">
                        <View className="flex-row items-center gap-2 mb-2 text-slate-700">
                            <Calendar size={16} color="#334155" />
                            <Text className="text-sm font-bold">Filter by Date (YYYY-MM-DD):</Text>
                        </View>
                        {/* Note: In RN, a standard text input is used since date picker requires native modules, simplified for now */}
                        <TextInput 
                            value={selectedDate}
                            onChangeText={setSelectedDate}
                            placeholder="YYYY-MM-DD"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[15px] font-semibold text-slate-800"
                        />
                    </View>

                    <View className="flex-row gap-2 mb-4">
                        <View className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 items-center">
                            <Text className="text-xl font-black text-slate-800">{historyTotal}</Text>
                            <Text className="text-[10px] font-bold text-slate-400 uppercase">Total</Text>
                        </View>
                        <View className="flex-1 bg-yellow-50 p-3 rounded-2xl shadow-sm border border-yellow-100 items-center">
                            <Text className="text-xl font-black text-yellow-700">{historyPending}</Text>
                            <Text className="text-[10px] font-bold text-yellow-600/70 uppercase">Pending</Text>
                        </View>
                        <View className="flex-1 bg-blue-50 p-3 rounded-2xl shadow-sm border border-blue-100 items-center">
                            <Text className="text-xl font-black text-blue-700">{historyActive}</Text>
                            <Text className="text-[10px] font-bold text-blue-600/70 uppercase">Active</Text>
                        </View>
                        <View className="flex-1 bg-emerald-50 p-3 rounded-2xl shadow-sm border border-emerald-100 items-center">
                            <Text className="text-xl font-black text-emerald-700">{historyDone}</Text>
                            <Text className="text-[10px] font-bold text-emerald-600/70 uppercase">Done</Text>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {isHistoryLoading ? (
                            <View className="py-10 items-center"><ActivityIndicator size="large" color="#cbd5e1" /></View>
                        ) : historyOrders.length === 0 ? (
                            <View className="items-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <Text className="text-4xl mb-2">📭</Text>
                                <Text className="text-slate-500 font-bold text-sm">No orders found.</Text>
                            </View>
                        ) : (
                            historyOrders.map((order: any) => (
                                <View key={order._id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3 flex-col relative overflow-hidden">
                                    <View className="flex-row justify-between items-start mb-3 pl-2">
                                        <View>
                                            <Text className="text-xs font-black text-slate-400 mb-0.5">ORDER #{order._id.slice(-6).toUpperCase()}</Text>
                                            <Text className="font-bold text-slate-800 text-[15px]">{order.customerId?.name || 'Guest'}</Text>
                                        </View>
                                        <View className="px-2.5 py-1 rounded-md border bg-slate-100 border-slate-200">
                                            <Text className="text-[10px] font-black uppercase text-slate-700">{STATUS_LABELS[order.status] || order.status}</Text>
                                        </View>
                                    </View>
                                    <View className="pl-2 flex-row justify-between items-end">
                                        <View className="flex-col gap-1">
                                            <Text className="text-slate-600 font-semibold text-[13px]">📞 {order.customerId?.phone || 'No Phone'}</Text>
                                            <Text className="text-slate-500 font-medium text-[13px]">⏱️ {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Amount</Text>
                                            <Text className="font-black text-slate-900 text-lg">₹{order.totalAmount}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                        <View className="h-10" />
                    </ScrollView>
                </View>
            )}

            {/* CONFIRMATION MODAL */}
            <Modal
                visible={!!confirmAction}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setConfirmAction(null)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-center items-center bg-slate-900/40 px-4"
                >
                    <View className="bg-white rounded-[32px] p-6 max-w-sm w-full items-center shadow-2xl">
                        {confirmAction?.newStatus === 'delivered' && (
                            <View className="w-full mb-6 mt-4">
                                <Text className="text-[12px] font-black text-center text-amber-600 uppercase tracking-widest mb-3">Ask Customer for PIN</Text>
                                <TextInput
                                    keyboardType="numeric"
                                    maxLength={4}
                                    placeholder="••••"
                                    value={deliveryOtp}
                                    onChangeText={(val) => setDeliveryOtp(val.replace(/\D/g, ''))}
                                    className="w-full text-center text-4xl font-black text-slate-800 bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 focus:border-amber-400 tracking-[0.4em]"
                                />
                            </View>
                        )}
                        {!confirmAction || confirmAction.newStatus !== 'delivered' && (
                            <View className="items-center mb-6 mt-4">
                                <Text className="text-xl font-black text-slate-900 mb-2">Are you sure?</Text>
                                <Text className="text-[13px] font-semibold text-slate-500 text-center px-4">Update the status of this order.</Text>
                            </View>
                        )}

                        <View className="flex-row gap-3 w-full">
                            <TouchableOpacity onPress={() => setConfirmAction(null)} className="flex-1 py-3.5 bg-slate-100 rounded-2xl items-center">
                                <Text className="text-slate-600 text-[13px] font-black">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirm} className="flex-1 py-3.5 bg-emerald-500 rounded-2xl items-center shadow-sm">
                                <Text className="text-white text-[13px] font-black">
                                    {confirmAction?.newStatus === 'delivered' ? 'Verify' : 'Confirm'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
