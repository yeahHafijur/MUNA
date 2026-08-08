import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, Package, CheckCircle2, Truck, XCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';
import { formatDateTime } from '@/utils/format';

const STATUS_LABELS: any = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing',
    out_for_delivery: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled'
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'preparing': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'pending': return <Clock size={16} color="#854d0e" />;
        case 'accepted': return <CheckCircle2 size={16} color="#1e40af" />;
        case 'preparing': return <Package size={16} color="#6b21a8" />;
        case 'out_for_delivery': return <Truck size={16} color="#3730a3" />;
        case 'delivered': return <CheckCircle2 size={16} color="#065f46" />;
        case 'cancelled': return <XCircle size={16} color="#9f1239" />;
        default: return <Clock size={16} color="#1e293b" />;
    }
};



export default function OrdersScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['customer-orders'],
        queryFn: async () => {
            const res = await api.get('/api/orders/customer');
            return res.data?.orders || [];
        },
    });

    const handleCancelOrder = async (orderId: string) => {
        Alert.alert(
            'Cancel Order?',
            'Are you sure you want to cancel this order?',
            [
                { text: 'No', style: 'cancel' },
                { 
                    text: 'Yes, Cancel', 
                    style: 'destructive',
                    onPress: async () => {
                        setCancellingId(orderId);
                        try {
                            await api.put(`/api/orders/${orderId}/cancel`);
                            queryClient.setQueryData(['customer-orders'], (old: any) =>
                                old.map((o: any) => o._id === orderId ? { ...o, status: 'cancelled' } : o)
                            );
                            Alert.alert('Success', 'Order cancelled successfully.');
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to cancel order');
                        } finally {
                            setCancellingId(null);
                        }
                    }
                }
            ]
        );
    };

    const filteredOrders = orders.filter((order: any) => {
        if (activeTab === 'active') {
            return ['pending', 'accepted', 'preparing', 'out_for_delivery'].includes(order.status);
        } else {
            return ['delivered', 'cancelled'].includes(order.status);
        }
    });

    // History Stats Calculation
    const deliveredOrders = orders.filter((o: any) => o.status === 'delivered');
    const cancelledCount = orders.filter((o: any) => o.status === 'cancelled').length;
    const totalSpent = deliveredOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-[18px] font-black text-slate-900">Your Orders</Text>
            </View>

            {/* Tabs */}
            <View className="flex-row items-center px-4 pt-4 pb-2 gap-3">
                <TouchableOpacity 
                    onPress={() => setActiveTab('active')}
                    className={`flex-1 py-2.5 rounded-xl items-center justify-center ${activeTab === 'active' ? 'bg-amber-500' : 'bg-slate-200/60'}`}
                >
                    <Text className={`text-[14px] font-black ${activeTab === 'active' ? 'text-amber-950' : 'text-slate-500'}`}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('history')}
                    className={`flex-1 py-2.5 rounded-xl items-center justify-center ${activeTab === 'history' ? 'bg-amber-500' : 'bg-slate-200/60'}`}
                >
                    <Text className={`text-[14px] font-black ${activeTab === 'history' ? 'text-amber-950' : 'text-slate-500'}`}>History</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#fbbf24" />
                </View>
            ) : filteredOrders.length === 0 ? (
                <View className="flex-1 items-center justify-center p-4">
                    <Text className="text-6xl mb-4">{activeTab === 'active' ? '🛵' : '📦'}</Text>
                    <Text className="text-[18px] font-black text-slate-900 mb-2">
                        {activeTab === 'active' ? 'No active orders' : 'No order history'}
                    </Text>
                    <Text className="text-[13px] font-medium text-slate-500 text-center">
                        {activeTab === 'active' 
                            ? "You don't have any ongoing deliveries right now." 
                            : "Your delivered and cancelled orders will appear here."}
                    </Text>
                </View>
            ) : (
                <ScrollView className="flex-1 px-4 pt-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    
                    {/* Hisab (History Dashboard) */}
                    {activeTab === 'history' && filteredOrders.length > 0 && (
                        <View className="bg-slate-900 rounded-3xl p-5 mb-5 shadow-sm">
                            <Text className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Summary</Text>
                            <Text className="text-[28px] font-black text-white mb-4 tracking-tight">₹{totalSpent}</Text>
                            
                            <View className="flex-row items-center border-t border-slate-800 pt-4 mt-2">
                                <View className="flex-1 flex-row items-center gap-2">
                                    <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center">
                                        <CheckCircle2 size={14} color="#34d399" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-bold text-[14px]">{deliveredOrders.length}</Text>
                                        <Text className="text-slate-400 font-medium text-[11px]">Delivered</Text>
                                    </View>
                                </View>
                                <View className="w-[1px] h-full bg-slate-800 mx-2" />
                                <View className="flex-1 flex-row items-center gap-2">
                                    <View className="w-8 h-8 rounded-full bg-rose-500/20 items-center justify-center">
                                        <XCircle size={14} color="#fb7185" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-bold text-[14px]">{cancelledCount}</Text>
                                        <Text className="text-slate-400 font-medium text-[11px]">Cancelled</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {filteredOrders.map((order: any) => {
                        const isExpanded = expandedOrderId === order._id;
                        const statusColors = getStatusColor(order.status).split(' ');
                        const bgColor = statusColors.find(c => c.startsWith('bg-'));
                        const textColor = statusColors.find(c => c.startsWith('text-'));
                        const borderColor = statusColors.find(c => c.startsWith('border-'));

                        return (
                            <TouchableOpacity 
                                key={order._id}
                                activeOpacity={0.9}
                                onPress={() => setExpandedOrderId(isExpanded ? null : order._id)}
                                className={`bg-white rounded-3xl p-5 mb-4 shadow-sm border border-slate-100 ${isExpanded ? 'border-amber-200 shadow-md' : ''}`}
                            >
                                {/* Order Header */}
                                <View className="flex-row items-start justify-between mb-3">
                                    <View className="flex-1 pr-3">
                                        <Text className="text-[15px] font-black text-slate-900 mb-0.5" numberOfLines={1}>
                                            {order.shopId?.name || 'MUNA Store'}
                                        </Text>
                                        <Text className="text-[11px] font-bold text-slate-400">
                                            {formatDateTime(order.createdAt)}
                                        </Text>
                                    </View>
                                    <View className={`px-2.5 py-1 rounded-lg border ${bgColor} ${borderColor} flex-row items-center gap-1.5 shadow-sm`}>
                                        {getStatusIcon(order.status)}
                                        <Text className={`text-[11px] font-black uppercase ${textColor}`}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </Text>
                                    </View>
                                </View>

                                {/* Order Summary */}
                                <View className="flex-row items-center justify-between mt-2">
                                    <Text className="text-[13px] font-bold text-slate-600">
                                        {order.items?.length || 0} items
                                    </Text>
                                    <Text className="text-[16px] font-black text-slate-900">
                                        ₹{order.totalAmount}
                                    </Text>
                                </View>

                                {/* Instructions */}
                                {order.instructions ? (
                                    <View className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3 flex-row items-start gap-2 shadow-sm">
                                        <Text className="text-[14px] mt-0.5">💬</Text>
                                        <View className="flex-1">
                                            <Text className="text-slate-500 font-black text-[11px] uppercase tracking-wider mb-0.5">Your Instructions</Text>
                                            <Text className="text-slate-800 font-medium text-[13px]">{order.instructions}</Text>
                                        </View>
                                    </View>
                                ) : null}

                                {/* Delivery OTP */}
                                {(order.status === 'pending' || order.status === 'accepted' || order.status === 'preparing' || order.status === 'out_for_delivery') && order.deliveryOtp && (
                                    <View className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex-row items-center justify-between shadow-sm">
                                        <View className="flex-row items-center gap-2">
                                            <Text className="text-[16px]">🔑</Text>
                                            <Text className="text-amber-900 font-bold text-[13px]">Delivery OTP</Text>
                                        </View>
                                        <Text className="text-amber-700 font-black text-[20px] tracking-widest">{order.deliveryOtp}</Text>
                                    </View>
                                )}

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <View className="mt-4 pt-4 border-t border-slate-100 border-dashed">
                                        <Text className="text-[12px] font-black text-slate-400 mb-3 uppercase tracking-wider">Order Items</Text>
                                        <View className="gap-2.5 mb-4">
                                            {order.items?.map((item: any, idx: number) => (
                                                <View key={idx} className="flex-row items-start justify-between gap-3 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                                                    <View className="flex-row items-center gap-3 flex-1">
                                                        {item.productId?.image ? (
                                                            <View className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                                                <Image source={{ uri: item.productId.image }} style={{ width: '100%', height: '100%' }} />
                                                            </View>
                                                        ) : (
                                                            <View className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 items-center justify-center">
                                                                <Text className="text-[16px]">📦</Text>
                                                            </View>
                                                        )}
                                                        <View className="flex-row items-center gap-2 flex-1">
                                                            <View className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center border border-slate-200">
                                                                <Text className="text-[10px] font-black text-slate-600">{item.quantity}x</Text>
                                                            </View>
                                                            <Text className="text-[13px] font-semibold text-slate-700 flex-1" numberOfLines={1}>
                                                                {item.name || 'Product'}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Text className="text-[13px] font-bold text-slate-900 self-center">₹{item.price * item.quantity}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        {/* Cancel Button */}
                                        {order.status === 'pending' && (
                                            <View className="mt-2 pt-4 border-t border-slate-100 border-dashed">
                                                <TouchableOpacity 
                                                    onPress={() => handleCancelOrder(order._id)}
                                                    disabled={cancellingId === order._id}
                                                    className="w-full bg-rose-50 border border-rose-100 py-3 rounded-xl flex-row items-center justify-center shadow-sm"
                                                >
                                                    {cancellingId === order._id ? (
                                                        <ActivityIndicator size="small" color="#ef4444" />
                                                    ) : (
                                                        <Text className="text-rose-600 text-[13px] font-black">Cancel Order</Text>
                                                    )}
                                                </TouchableOpacity>
                                                <Text className="text-[10px] font-semibold text-slate-400 text-center mt-2">
                                                    Orders can only be cancelled before they are accepted by the store.
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}
