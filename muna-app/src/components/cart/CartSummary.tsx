import React from 'react';
import { View, Text } from 'react-native';
import { Receipt } from 'lucide-react-native';

interface CartSummaryProps {
    cartTotal: number;
    deliveryFee: number | null;
}

const CartSummary: React.FC<CartSummaryProps> = ({ cartTotal, deliveryFee }) => {
    const finalTotal = cartTotal + (deliveryFee || 0);

    return (
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-4">
            <View className="flex-row items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Receipt size={18} color="#0f172a" />
                <Text className="text-[16px] font-black text-slate-900">Bill Details</Text>
            </View>

            <View className="gap-3">
                <View className="flex-row justify-between items-center">
                    <Text className="text-[13px] font-semibold text-slate-500">Item Total</Text>
                    <Text className="text-[14px] font-bold text-slate-800">₹{cartTotal}</Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <Text className="text-[13px] font-semibold text-slate-500">Delivery Fee</Text>
                    {deliveryFee !== null ? (
                        <Text className="text-[14px] font-bold text-emerald-600">₹{deliveryFee}</Text>
                    ) : (
                        <Text className="text-[12px] font-bold text-amber-500 italic">Select location</Text>
                    )}
                </View>

                <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-[13px] font-semibold text-slate-500">Payment Method</Text>
                    <View className="bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                        <Text className="text-[11px] font-black text-amber-700">CASH ON DELIVERY</Text>
                    </View>
                </View>

                {/* Extra padding before total */}
                <View className="h-2" />

                <View className="flex-row justify-between items-center pt-3 border-t border-slate-100 border-dashed">
                    <Text className="text-[16px] font-black text-slate-900">To Pay</Text>
                    <Text className="text-[18px] font-black text-slate-900">₹{finalTotal}</Text>
                </View>
            </View>
        </View>
    );
};

export default CartSummary;
