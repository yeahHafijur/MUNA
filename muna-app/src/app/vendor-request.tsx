import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Store, UploadCloud } from 'lucide-react-native';

export default function VendorRequestScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-[18px] font-black text-slate-900">Become a Vendor</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
                <View className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 mb-6 items-center">
                    <View className="w-16 h-16 bg-emerald-100 rounded-full items-center justify-center mb-3">
                        <Store size={32} color="#059669" />
                    </View>
                    <Text className="text-[18px] font-black text-emerald-900 mb-2">Sell on MUNA</Text>
                    <Text className="text-[13px] font-medium text-emerald-700 text-center leading-relaxed">
                        Reach thousands of customers in your area. Quick setup, lowest commission, and fast payouts.
                    </Text>
                </View>

                <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-8">
                    <Text className="text-[15px] font-black text-slate-900 mb-5">Shop Details</Text>
                    
                    <View className="gap-4">
                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Shop Name</Text>
                            <TextInput 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-[15px] font-medium text-slate-900"
                                placeholder="E.g. Sharma Kirana Store"
                            />
                        </View>
                        
                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Owner Name</Text>
                            <TextInput 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-[15px] font-medium text-slate-900"
                                placeholder="Your full name"
                            />
                        </View>

                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Phone Number</Text>
                            <TextInput 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-[15px] font-medium text-slate-900"
                                placeholder="10-digit mobile number"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Shop Address</Text>
                            <TextInput 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] font-medium text-slate-900"
                                placeholder="Complete shop address"
                                multiline
                                numberOfLines={3}
                                style={{ height: 80, textAlignVertical: 'top' }}
                            />
                        </View>

                        <TouchableOpacity className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 items-center justify-center mt-2">
                            <UploadCloud size={24} color="#94a3b8" className="mb-2" />
                            <Text className="text-[13px] font-bold text-slate-600 mb-1">Upload Shop Photo</Text>
                            <Text className="text-[11px] font-medium text-slate-400">Optional but recommended</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="bg-emerald-600 h-14 rounded-xl flex-row items-center justify-center shadow-sm mt-4">
                            <Text className="text-white font-black text-[15px]">Submit Request</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View className="h-10" />
            </ScrollView>
        </View>
    );
}
