import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';

interface VendorOrderCardProps {
    order: any;
    updatingStatusId: string | null;
    requestConfirm: (orderId: string, newStatus: string) => void;
}

const VendorOrderCard: React.FC<VendorOrderCardProps> = ({ order, updatingStatusId, requestConfirm }) => {
    
    const handleWhatsAppShare = () => {
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

    return (
        <View className="bg-white border border-slate-100 shadow-sm rounded-3xl p-4 flex-col mb-4">
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
                                <TouchableOpacity className="flex-1 bg-[#25D366] py-3 rounded-xl items-center" onPress={handleWhatsAppShare}>
                                    <Text className="text-[12px] font-black uppercase tracking-wider text-white">WhatsApp</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {order.status === 'preparing' && (
                            <>
                                <TouchableOpacity className="flex-1 bg-amber-400 py-3 rounded-xl items-center shadow-sm" onPress={() => requestConfirm(order._id, 'out_for_delivery')}>
                                    <Text className="text-[12px] font-black uppercase tracking-wider text-amber-950">Dispatch</Text>
                                </TouchableOpacity>
                                <TouchableOpacity className="flex-1 bg-[#25D366] py-3 rounded-xl items-center" onPress={handleWhatsAppShare}>
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
};

export default React.memo(VendorOrderCard);
