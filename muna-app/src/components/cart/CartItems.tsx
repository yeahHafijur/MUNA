import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';

interface CartItemsProps {
    cartItems: any[];
    updateQuantity: (id: string, qty: number) => void;
    removeFromCart: (id: string) => void;
}

const CartItems: React.FC<CartItemsProps> = ({ cartItems, updateQuantity, removeFromCart }) => {
    return (
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-4">
            <Text className="text-[16px] font-black text-slate-900 mb-4">Order Summary</Text>
            
            <View className="gap-5">
                {cartItems.map((item, index) => (
                    <View key={item.productId} className={`flex-row items-center gap-3 ${index !== cartItems.length - 1 ? 'border-b border-slate-50 pb-5' : ''}`}>
                        <View className="flex-1 pr-2">
                            <Text className="text-[14px] font-bold text-slate-800 leading-tight mb-1" numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text className="text-[14px] font-black text-slate-900">₹{item.price}</Text>
                        </View>

                        <View className="flex-row items-center bg-emerald-50 rounded-xl border border-emerald-100/50 p-1 shadow-sm h-10">
                            {item.quantity === 1 ? (
                                <TouchableOpacity 
                                    onPress={() => removeFromCart(item.productId)}
                                    className="w-8 h-full items-center justify-center bg-white rounded-lg shadow-sm"
                                >
                                    <Trash2 size={14} color="#ef4444" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity 
                                    onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                                    className="w-8 h-full items-center justify-center bg-white rounded-lg shadow-sm"
                                >
                                    <Minus size={14} color="#059669" />
                                </TouchableOpacity>
                            )}
                            
                            <Text className="w-8 text-center text-[14px] font-black text-emerald-800">
                                {item.quantity}
                            </Text>
                            
                            <TouchableOpacity 
                                onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-8 h-full items-center justify-center bg-emerald-600 rounded-lg shadow-sm"
                            >
                                <Plus size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default CartItems;
