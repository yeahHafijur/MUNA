import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';

import CartItems from '@/components/cart/CartItems';
import CartLocation from '@/components/cart/CartLocation';
import CartSummary from '@/components/cart/CartSummary';

export default function CartScreen() {
    const router = useRouter();
    const { cartItems, cartShopId, getTotal, clearCart, updateQuantity, removeFromCart } = useCart();
    const { user, token } = useAuth();

    const [gpsLocation, setGpsLocation] = useState<any>(null);
    const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const locationReady = gpsLocation && deliveryFee !== null;

    const handleLocationDetermined = async (lat: number, lng: number) => {
        setGpsLocation({ lat, lng });
        try {
            const res = await api.post(`/api/shops/${cartShopId}/calculate-delivery`, { lat, lng });
            setDeliveryFee(res.data.deliveryFee);
            setDistance(res.data.distance);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Could not calculate delivery fee');
            setGpsLocation(null);
        }
    };

    const handleCheckout = async () => {
        if (!user) {
            Alert.alert('Login Required', 'Please login to place an order.', [
                { text: 'Login', onPress: () => router.push('/login') },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }
        if (!locationReady) {
            Alert.alert('Location Required', 'Please provide your location to calculate delivery fee.');
            return;
        }

        setLoading(true);
        try {
            const finalTotal = getTotal() + (deliveryFee || 0);
            
            const orderData = {
                shopId: cartShopId,
                items: cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                })),
                totalAmount: finalTotal,
                deliveryFee,
                deliveryLocation: {
                    type: 'Point',
                    coordinates: [gpsLocation.lng, gpsLocation.lat]
                },
                customerLocationLat: gpsLocation.lat,
                customerLocationLng: gpsLocation.lng,
                distance,
                paymentMethod: 'cash'
            };

            const res = await api.post('/api/orders', orderData);
            
            clearCart();
            Alert.alert('Order Placed!', 'Your order has been placed successfully.', [
                { text: 'View Orders', onPress: () => router.push('/orders') }
            ]);
        } catch (err: any) {
            Alert.alert('Checkout Error', err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <Text className="text-6xl mb-4">🛒</Text>
                <Text className="text-[18px] font-black text-slate-900 mb-2">Your cart is empty</Text>
                <Text className="text-[13px] font-medium text-slate-500 mb-6">Looks like you haven't added anything yet.</Text>
                <TouchableOpacity 
                    onPress={() => router.push('/')}
                    className="bg-amber-400 px-6 py-3 rounded-xl shadow-sm"
                >
                    <Text className="text-amber-950 font-black text-[15px]">Start Shopping</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-[18px] font-black text-slate-900">Checkout</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                <CartItems 
                    cartItems={cartItems} 
                    updateQuantity={updateQuantity} 
                    removeFromCart={removeFromCart} 
                />

                <CartLocation 
                    onLocationDetermined={handleLocationDetermined}
                    locationReady={locationReady}
                />

                <CartSummary 
                    cartTotal={getTotal()}
                    deliveryFee={deliveryFee}
                />
            </ScrollView>

            {/* Bottom Checkout Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 shadow-lg flex-row items-center justify-between pb-8">
                <View>
                    <Text className="text-[12px] font-semibold text-slate-500 mb-0.5">Total to pay</Text>
                    <Text className="text-[20px] font-black text-slate-900 leading-none">
                        ₹{getTotal() + (deliveryFee || 0)}
                    </Text>
                </View>
                <TouchableOpacity 
                    onPress={handleCheckout}
                    disabled={loading || !locationReady}
                    className={`h-12 px-8 rounded-xl flex-row items-center justify-center shadow-sm
                    ${loading || !locationReady ? 'bg-slate-200' : 'bg-emerald-600'}`}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text className={`text-[15px] font-black ${loading || !locationReady ? 'text-slate-400' : 'text-white'}`}>
                            Place Order
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
