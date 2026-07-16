import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Platform, Alert, Linking, ActivityIndicator, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Phone, Clock, MapPin } from 'lucide-react-native';
import api from '@/api/api';
import { useVendorOrders } from '@/hooks/useVendorOrders';
import VendorOrderCard from '@/components/vendor/VendorOrderCard';
import VendorConfirmationModal from '@/components/vendor/VendorConfirmationModal';
import { formatDate, formatTime } from '@/utils/format';

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
    const [selectedDateObj, setSelectedDateObj] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const selectedDate = selectedDateObj.toISOString().split('T')[0];
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

    // Modal state
    const [confirmAction, setConfirmAction] = useState<{orderId: string, newStatus: string} | null>(null);
    const [deliveryOtp, setDeliveryOtp] = useState('');
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    const prevLiveRef = useRef(0);

    const { data: orders = [], isLoading: isLiveLoading } = useVendorOrders();

    const { data: historyOrders = [], isLoading: isHistoryLoading } = useQuery({
        queryKey: ['vendor-history-orders', selectedDate],
        queryFn: async ({ signal }) => {
            const res = await api.get(`/api/orders/vendor?date=${selectedDate}&limit=200`, { signal });
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
            queryClient.setQueryData(['vendor-orders'], (prev: any) => {
                if (!prev) return [];
                return prev.map((order: any) => order._id === orderId ? { ...order, status: newStatus } : order);
            });
        }

        try {
            const body: any = { status: newStatus };
            if (newStatus === 'delivered') body.deliveryOtp = deliveryOtp;

            await api.put(`/api/orders/${orderId}/status`, body);
            queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Network error");
            queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const liveOrders = orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status));
    const pendingOrders = liveOrders.filter((o: any) => o.status === 'pending');
    const acceptedOrders = liveOrders.filter((o: any) => ['accepted', 'preparing'].includes(o.status));
    const transitOrders = liveOrders.filter((o: any) => o.status === 'out_for_delivery');

    const historyTotal = historyOrders.length;
    const historyPending = historyOrders.filter((o: any) => o.status === 'pending').length;
    const historyActive = historyOrders.filter((o: any) => ['accepted', 'preparing', 'out_for_delivery'].includes(o.status)).length;
    const historyDone = historyOrders.filter((o: any) => o.status === 'delivered').length;

    const renderHistoryOrder = ({ item: order }: { item: any }) => {
        const isExpanded = expandedHistoryId === order._id;
        return (
            <TouchableOpacity 
                onPress={() => setExpandedHistoryId(isExpanded ? null : order._id)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4 flex-col relative overflow-hidden"
            >
                <View className="flex-row justify-between items-start mb-3">
                    <View>
                        <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">ORDER #{order._id?.slice(-6).toUpperCase()}</Text>
                        <Text className="font-bold text-slate-900 text-[15px]">{order.customerId?.name || 'Guest'}</Text>
                    </View>
                    <View className="px-2.5 py-1 rounded-md border" style={{
                        backgroundColor: order.status === 'delivered' ? '#f0fdf4' : order.status === 'cancelled' ? '#fef2f2' : '#f8fafc',
                        borderColor: order.status === 'delivered' ? '#dcfce7' : order.status === 'cancelled' ? '#fee2e2' : '#e2e8f0'
                    }}>
                        <Text className="text-[10px] font-bold uppercase tracking-wider" style={{
                            color: order.status === 'delivered' ? '#15803d' : order.status === 'cancelled' ? '#b91c1c' : '#475569'
                        }}>
                            {STATUS_LABELS[order.status] || order.status}
                        </Text>
                    </View>
                </View>
                <View className="flex-row justify-between items-end">
                    <View className="flex-col gap-1">
                        <Text className="text-slate-600 font-medium text-[13px]">📞 {order.customerId?.phone || 'No Phone'}</Text>
                        <Text className="text-slate-500 font-medium text-[13px]">⏱️ {order.createdAt ? formatTime(order.createdAt) : '--:--'}</Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Amount</Text>
                        <Text className="font-bold text-slate-900 text-lg">₹{order.totalAmount}</Text>
                    </View>
                </View>

                {/* EXPANDABLE DETAILS */}
                {isExpanded && (
                    <View className="mt-4 pt-4 border-t border-slate-100">
                        <Text className="text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-2">Order Items</Text>
                        <View className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
                            {order.items?.map((i: any, index: number) => (
                                <View key={index} className="flex-row items-center py-1 flex-1">
                                    <Text className="font-bold text-slate-500 mr-2">{i.quantity}×</Text>
                                    <Text className="text-[13px] font-medium text-slate-700 flex-1">{i.name}</Text>
                                    <Text className="text-[13px] font-bold text-slate-900">₹{i.price * i.quantity}</Text>
                                </View>
                            ))}
                        </View>

                        {order.deliveryLocation?.address && (
                            <View className="mb-2">
                                <Text className="text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1">Delivery Address</Text>
                                <Text className="text-[13px] font-medium text-slate-700">📍 {order.deliveryLocation.address}</Text>
                            </View>
                        )}
                        
                        {order.instructions && order.instructions.trim() !== '' && (
                            <View className="mt-3">
                                <Text className="text-[11px] font-bold uppercase text-amber-600 tracking-widest mb-1">Instructions</Text>
                                <Text className="text-[13px] font-medium text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100">{order.instructions}</Text>
                            </View>
                        )}
                    </View>
                )}
                
                {!isExpanded && (
                    <View className="mt-3 pt-3 border-t border-slate-50 items-center">
                        <Text className="text-[11px] font-semibold text-slate-400">Tap to view details</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white pt-12 pb-4 shadow-sm border-b border-slate-200 z-10">
                <View className="px-5 flex-row items-center gap-3 mb-4">
                    <TouchableOpacity onPress={() => router.push('/vendor')} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 items-center justify-center">
                        <ArrowLeft size={18} color="#475569" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-bold text-slate-900 tracking-tight">Manage Orders</Text>
                </View>

                {/* Segmented Control */}
                <View className="px-5">
                    <View className="flex-row bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                        <TouchableOpacity
                            style={activeView === 'live' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: '#e2e8f099' } : undefined}
                            className="flex-1 py-2 rounded-lg flex-row items-center justify-center gap-2"
                            onPress={() => setActiveView('live')}
                        >
                            <Text className="text-[13px] font-bold" style={{ color: activeView === 'live' ? '#0f172a' : '#64748b' }}>Live</Text>
                            {liveOrders.length > 0 && (
                                <View className="bg-rose-500 px-1.5 py-0.5 rounded-md">
                                    <Text className="text-white text-[10px] font-bold">{liveOrders.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={activeView === 'history' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: '#e2e8f099' } : undefined}
                            className="flex-1 py-2 rounded-lg items-center justify-center"
                            onPress={() => setActiveView('history')}
                        >
                            <Text className="text-[13px] font-bold" style={{ color: activeView === 'history' ? '#0f172a' : '#64748b' }}>History</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* LIVE VIEW */}
            {activeView === 'live' && (
                <View className="flex-1">
                    {/* Inner Tabs */}
                    <View className="px-5 py-4">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => setLiveTab('pending')}
                                style={liveTab === 'pending' ? { backgroundColor: '#f97316', borderColor: '#f97316' } : { backgroundColor: 'white', borderColor: '#e2e8f0' }}
                                className="px-5 py-2.5 rounded-xl flex-row items-center gap-2 border shadow-sm"
                            >
                                <Text className="text-[13px] font-bold" style={{ color: liveTab === 'pending' ? 'white' : '#475569' }}>New</Text>
                                {pendingOrders.length > 0 && (
                                    <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: liveTab === 'pending' ? 'white' : '#ffedd5' }}>
                                        <Text className="text-[11px] font-bold" style={{ color: liveTab === 'pending' ? '#ea580c' : '#9a3412' }}>{pendingOrders.length}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setLiveTab('preparing')}
                                style={liveTab === 'preparing' ? { backgroundColor: '#3b82f6', borderColor: '#3b82f6' } : { backgroundColor: 'white', borderColor: '#e2e8f0' }}
                                className="px-5 py-2.5 rounded-xl flex-row items-center gap-2 border shadow-sm"
                            >
                                <Text className="text-[13px] font-bold" style={{ color: liveTab === 'preparing' ? 'white' : '#475569' }}>Preparing</Text>
                                {acceptedOrders.length > 0 && (
                                    <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: liveTab === 'preparing' ? 'white' : '#dbeafe' }}>
                                        <Text className="text-[11px] font-bold" style={{ color: liveTab === 'preparing' ? '#2563eb' : '#1e40af' }}>{acceptedOrders.length}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setLiveTab('transit')}
                                style={liveTab === 'transit' ? { backgroundColor: '#10b981', borderColor: '#10b981' } : { backgroundColor: 'white', borderColor: '#e2e8f0' }}
                                className="px-5 py-2.5 rounded-xl flex-row items-center gap-2 border shadow-sm"
                            >
                                <Text className="text-[13px] font-bold" style={{ color: liveTab === 'transit' ? 'white' : '#475569' }}>In Transit</Text>
                                {transitOrders.length > 0 && (
                                    <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: liveTab === 'transit' ? 'white' : '#d1fae5' }}>
                                        <Text className="text-[11px] font-bold" style={{ color: liveTab === 'transit' ? '#059669' : '#065f46' }}>{transitOrders.length}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                        {liveTab === 'pending' && pendingOrders.length === 0 && (
                            <View className="items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm mb-8">
                                <Text className="text-5xl opacity-40 mb-3">🛎️</Text>
                                <Text className="text-[15px] font-bold text-slate-900">No new orders</Text>
                            </View>
                        )}
                        {liveTab === 'pending' && pendingOrders.map((order: any) => (
                            <VendorOrderCard key={order._id} order={order} updatingStatusId={updatingStatusId} requestConfirm={requestConfirm} />
                        ))}

                        {liveTab === 'preparing' && acceptedOrders.length === 0 && (
                            <View className="items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm mb-8">
                                <Text className="text-5xl opacity-40 mb-3">👨‍🍳</Text>
                                <Text className="text-[15px] font-bold text-slate-900">Nothing is preparing</Text>
                            </View>
                        )}
                        {liveTab === 'preparing' && acceptedOrders.map((order: any) => (
                            <VendorOrderCard key={order._id} order={order} updatingStatusId={updatingStatusId} requestConfirm={requestConfirm} />
                        ))}

                        {liveTab === 'transit' && transitOrders.length === 0 && (
                            <View className="items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm mb-8">
                                <Text className="text-5xl opacity-40 mb-3">🚚</Text>
                                <Text className="text-[15px] font-bold text-slate-900">No orders in transit</Text>
                            </View>
                        )}
                        {liveTab === 'transit' && transitOrders.map((order: any) => (
                            <VendorOrderCard key={order._id} order={order} updatingStatusId={updatingStatusId} requestConfirm={requestConfirm} />
                        ))}
                        
                        <View className="h-10" />
                    </ScrollView>
                </View>
            )}

            {/* HISTORY VIEW */}
            {activeView === 'history' && (
                <View className="flex-1 px-5 pt-4">
                    <FlatList
                        data={isHistoryLoading ? [] : historyOrders}
                        keyExtractor={(item) => item._id}
                        showsVerticalScrollIndicator={false}
                        renderItem={renderHistoryOrder}
                        ListHeaderComponent={
                            <View>
                                <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-5 flex-col">
                                    <View className="flex-row items-center gap-2 mb-3 text-slate-700">
                                        <Calendar size={16} color="#475569" />
                                        <Text className="text-sm font-semibold">Filter by Date:</Text>
                                    </View>
                                    
                                    <TouchableOpacity 
                                        onPress={() => setShowDatePicker(true)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex-row justify-between items-center"
                                    >
                                        <Text className="text-[15px] font-semibold text-slate-900">
                                            {formatDate(selectedDateObj)}
                                        </Text>
                                        <Text className="text-slate-500 font-bold">Change</Text>
                                    </TouchableOpacity>

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={selectedDateObj}
                                            mode="date"
                                            display="default"
                                            onChange={(event, date) => {
                                                setShowDatePicker(false);
                                                if (date) setSelectedDateObj(date);
                                            }}
                                        />
                                    )}
                                </View>

                                <View className="flex-row gap-3 mb-5">
                                    <View className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-200 items-center">
                                        <Text className="text-xl font-bold text-slate-900">{historyTotal}</Text>
                                        <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Total</Text>
                                    </View>
                                    <View className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-200 items-center">
                                        <Text className="text-xl font-bold text-amber-600">{historyPending}</Text>
                                        <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Pending</Text>
                                    </View>
                                    <View className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-200 items-center">
                                        <Text className="text-xl font-bold text-blue-600">{historyActive}</Text>
                                        <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Active</Text>
                                    </View>
                                    <View className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-200 items-center">
                                        <Text className="text-xl font-bold text-emerald-600">{historyDone}</Text>
                                        <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Done</Text>
                                    </View>
                                </View>
                            </View>
                        }
                        ListEmptyComponent={
                            isHistoryLoading ? (
                                <View className="py-10 items-center"><ActivityIndicator size="large" color="#94a3b8" /></View>
                            ) : (
                                <View className="items-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                    <Text className="text-4xl mb-2">📭</Text>
                                    <Text className="text-slate-500 font-bold text-sm">No orders found.</Text>
                                </View>
                            )
                        }
                        ListFooterComponent={<View className="h-10" />}
                    />
                </View>
            )}

            {/* CONFIRMATION MODAL */}
            <VendorConfirmationModal 
                confirmAction={confirmAction}
                deliveryOtp={deliveryOtp}
                setDeliveryOtp={setDeliveryOtp}
                handleConfirm={handleConfirm}
                onClose={() => setConfirmAction(null)}
            />
        </View>
    );
}
