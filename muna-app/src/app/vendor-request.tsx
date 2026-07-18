import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Store, UploadCloud } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import api from '@/api/api';

export default function VendorRequestScreen() {
    const router = useRouter();
    const [shopName, setShopName] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const { colors, isDark } = useTheme();

    const handleSubmit = async () => {
        if (!shopName.trim() || !name.trim() || !phone.trim() || !address.trim()) {
            Alert.alert("Missing Fields", "Please fill in all the details.");
            return;
        }

        if (phone.trim().length < 10) {
            Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number.");
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/vendor-requests', {
                shopName: shopName.trim(),
                name: name.trim(),
                phone: phone.trim(),
                address: address.trim()
            });
            Alert.alert(
                "Request Submitted!", 
                "Our team will contact you shortly regarding your shop setup.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to submit request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View className="pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color={colors.icon} />
                </TouchableOpacity>
                <Text style={{ color: colors.primaryText }} className="text-[18px] font-black">Become a Vendor</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View className="rounded-3xl p-6 border mb-6 items-center" style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', borderColor: isDark ? 'rgba(16,185,129,0.2)' : '#d1fae5' }}>
                    <View className="w-16 h-16 rounded-full items-center justify-center mb-3" style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#d1fae5' }}>
                        <Store size={32} color="#10b981" />
                    </View>
                    <Text className="text-[18px] font-black mb-2" style={{ color: colors.success }}>Sell on MUNA</Text>
                    <Text className="text-[13px] font-medium text-center leading-relaxed" style={{ color: isDark ? '#6ee7b7' : '#047857' }}>
                        Reach thousands of customers in your area. Quick setup, lowest commission, and fast payouts.
                    </Text>
                </View>

                <View className="rounded-3xl p-5 shadow-sm border mb-8" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <Text style={{ color: colors.primaryText }} className="text-[15px] font-black mb-5">Shop Details</Text>
                    
                    <View className="gap-4">
                        <View>
                            <Text style={{ color: colors.secondaryText }} className="text-[12px] font-bold mb-1.5 ml-1">Shop Name</Text>
                            <TextInput 
                                className="border rounded-xl px-4 h-12 text-[15px] font-medium"
                                style={{ backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }}
                                placeholder="E.g. Sharma Kirana Store"
                                placeholderTextColor={colors.placeholder}
                                value={shopName}
                                onChangeText={setShopName}
                            />
                        </View>
                        
                        <View>
                            <Text style={{ color: colors.secondaryText }} className="text-[12px] font-bold mb-1.5 ml-1">Owner Name</Text>
                            <TextInput 
                                className="border rounded-xl px-4 h-12 text-[15px] font-medium"
                                style={{ backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }}
                                placeholder="Your full name"
                                placeholderTextColor={colors.placeholder}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View>
                            <Text style={{ color: colors.secondaryText }} className="text-[12px] font-bold mb-1.5 ml-1">Phone Number</Text>
                            <TextInput 
                                className="border rounded-xl px-4 h-12 text-[15px] font-medium"
                                style={{ backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }}
                                placeholder="10-digit mobile number"
                                placeholderTextColor={colors.placeholder}
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>

                        <View>
                            <Text style={{ color: colors.secondaryText }} className="text-[12px] font-bold mb-1.5 ml-1">Shop Address</Text>
                            <TextInput 
                                className="border rounded-xl px-4 py-3 text-[15px] font-medium"
                                style={{ backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText, height: 80, textAlignVertical: 'top' }}
                                placeholder="Complete shop address"
                                placeholderTextColor={colors.placeholder}
                                multiline
                                numberOfLines={3}
                                value={address}
                                onChangeText={setAddress}
                            />
                        </View>

                        <TouchableOpacity className="border-2 border-dashed rounded-xl p-6 items-center justify-center mt-2 opacity-50" style={{ backgroundColor: colors.inputBackground, borderColor: colors.border }}>
                            <UploadCloud size={24} color={colors.iconMuted} className="mb-2" />
                            <Text style={{ color: colors.secondaryText }} className="text-[13px] font-bold mb-1">Upload Shop Photo (Coming soon)</Text>
                            <Text style={{ color: colors.tertiaryText }} className="text-[11px] font-medium">Optional but recommended</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={handleSubmit}
                            disabled={loading}
                            className={`h-14 rounded-xl flex-row items-center justify-center shadow-sm mt-4 ${loading ? 'bg-emerald-400' : 'bg-emerald-600'}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text className="text-white font-black text-[15px]">Submit Request</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View className="h-10" />
            </ScrollView>
        </View>
    );
}
