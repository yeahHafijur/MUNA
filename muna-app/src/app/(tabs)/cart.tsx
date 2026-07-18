import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShoppingBag, MessageSquare } from 'lucide-react-native';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import api from '@/api/api';

import CartItems from '@/components/cart/CartItems';
import CartLocation from '@/components/cart/CartLocation';
import CartSummary from '@/components/cart/CartSummary';

export default function CartScreen() {
    const router = useRouter();
    const { cartItems, cartShopId, getTotal, clearCart, updateQuantity, removeFromCart } = useCart();
    const { user, token, login } = useAuth();
    const { colors, isDark } = useTheme();

    const [gpsLocation, setGpsLocation] = useState<any>(null);
    const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [savingPhone, setSavingPhone] = useState(false);

    const locationReady = gpsLocation && deliveryFee !== null;

    const handleLocationDetermined = async (addr: any) => {
        setGpsLocation({ lat: addr.lat, lng: addr.lng, text: addr.address });
        try {
            const res = await api.post(`/api/shops/${cartShopId}/calculate-delivery`, { lat: addr.lat, lng: addr.lng });
            setDeliveryFee(res.data.deliveryFee);
            setDistance(res.data.distance);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Could not calculate delivery fee');
            setGpsLocation(null);
        }
    };

    const handleCheckout = async () => {
        if (loading) return; // Prevent double-tap
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

        // Check for phone number for first-time buyers
        if (!user.phone) {
            setShowPhoneModal(true);
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
                    address: gpsLocation.text || 'GPS Location',
                    lat: gpsLocation.lat,
                    lng: gpsLocation.lng
                },
                customerLocationLat: gpsLocation.lat,
                customerLocationLng: gpsLocation.lng,
                distance,
                instructions: instructions.trim(),
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

    const handleSavePhone = async () => {
        if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
            return;
        }
        setSavingPhone(true);
        try {
            const res = await api.put('/api/users/profile', { 
                name: user.name || 'User', 
                phone: phoneNumber.replace(/\D/g, '') 
            });
            await login(res.data.user, token!);
            setShowPhoneModal(false);
            Alert.alert('Success', 'Phone number saved! You can now place your order.', [
                { text: 'Place Order', onPress: () => handleCheckout() }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Could not save phone number');
        } finally {
            setSavingPhone(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.background }}>
                <View style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5', borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#d1fae5' }} className="w-32 h-32 rounded-full items-center justify-center mb-6 border-8">
                    <ShoppingBag size={48} color="#10b981" strokeWidth={1.5} />
                </View>
                <Text style={{ color: colors.primaryText }} className="text-[22px] font-black mb-2 text-center tracking-tight">Your cart is empty</Text>
                <Text style={{ color: colors.secondaryText }} className="text-[14px] font-semibold mb-8 text-center leading-relaxed max-w-[250px]">
                    Looks like you haven't added anything to your cart yet.
                </Text>
                <TouchableOpacity 
                    onPress={() => router.push('/')}
                    className="w-full bg-emerald-600 px-6 py-4 rounded-2xl shadow-sm flex-row justify-center items-center active:bg-emerald-700"
                >
                    <Text className="text-white font-black text-[15px] uppercase tracking-widest">Start Shopping</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View className="pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3" style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color={colors.icon} />
                </TouchableOpacity>
                <Text style={{ color: colors.primaryText }} className="text-[18px] font-black">Checkout</Text>
            </View>

            <ScrollView 
                className="flex-1 px-4 pt-4" 
                style={{ backgroundColor: colors.background }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <CartItems 
                    cartItems={cartItems} 
                    updateQuantity={updateQuantity} 
                    removeFromCart={removeFromCart} 
                />

                <CartSummary 
                    cartTotal={getTotal()}
                    deliveryFee={deliveryFee}
                />

                <CartLocation 
                    onLocationDetermined={handleLocationDetermined}
                    locationReady={locationReady}
                />

                {/* Instructions Input */}
                <View className="rounded-3xl p-5 mb-5 shadow-sm border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <View className="flex-row items-center gap-2 mb-3">
                        <MessageSquare size={18} color={colors.icon} />
                        <Text style={{ color: colors.primaryText }} className="text-[15px] font-black">Add Instructions</Text>
                    </View>
                    <TextInput
                        className="rounded-xl p-4 text-[14px] font-medium border"
                        style={{ backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }}
                        placeholder="Any special request for the shop? (Optional)"
                        placeholderTextColor={colors.placeholder}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        value={instructions}
                        onChangeText={setInstructions}
                    />
                </View>
            </ScrollView>

            {/* Bottom Checkout Bar */}
            <View className="absolute bottom-0 left-0 right-0 p-4 shadow-lg flex-row items-center justify-between pb-8 border-t" style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}>
                <View>
                    <Text style={{ color: colors.secondaryText }} className="text-[12px] font-semibold mb-0.5">Total to pay</Text>
                    <Text style={{ color: colors.primaryText }} className="text-[20px] font-black leading-none">
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
                            Place Order (COD)
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
            
            {/* Phone Number Modal */}
            <Modal visible={showPhoneModal} transparent animationType="fade">
                <View className="flex-1 items-center justify-center px-4" style={{ backgroundColor: colors.overlayStrong }}>
                    <View className="w-full rounded-3xl p-6 shadow-xl" style={{ backgroundColor: colors.surface }}>
                        <View className="items-center mb-6">
                            <View className="w-16 h-16 bg-amber-50 rounded-full items-center justify-center mb-3">
                                <Text className="text-2xl">📱</Text>
                            </View>
                            <Text style={{ color: colors.primaryText }} className="text-[20px] font-black text-center">Add Phone Number</Text>
                            <Text style={{ color: colors.secondaryText }} className="text-[14px] text-center mt-2 font-medium">
                                We need your phone number to coordinate the delivery for your first order.
                            </Text>
                        </View>
                        
                        <View className="mb-6">
                            <Text style={{ color: colors.tertiaryText }} className="text-[12px] font-bold uppercase tracking-widest mb-2 ml-1">Mobile Number</Text>
                            <TextInput 
                                className="border rounded-xl p-4 text-[16px] font-bold tracking-wider"
                                style={{ backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }}
                                placeholder="10-digit mobile number"
                                placeholderTextColor={colors.placeholder}
                                keyboardType="number-pad"
                                maxLength={10}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                autoFocus
                            />
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity 
                                onPress={() => setShowPhoneModal(false)}
                                disabled={savingPhone}
                                style={{ backgroundColor: colors.elevated }}
                                className="flex-1 py-4 rounded-xl items-center"
                            >
                                <Text style={{ color: colors.primaryText }} className="font-bold text-[15px]">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={handleSavePhone}
                                disabled={savingPhone}
                                className="flex-1 py-4 bg-emerald-600 rounded-xl items-center flex-row justify-center gap-2"
                            >
                                {savingPhone ? <ActivityIndicator size="small" color="white" /> : null}
                                <Text className="text-white font-bold text-[15px]">Save & Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
