import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-4 flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-[18px] font-black text-slate-900">Privacy Policy</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
                <Text className="text-[22px] font-black text-slate-900 mb-6">MUNA Privacy Policy</Text>
                
                <View className="mb-6">
                    <Text className="text-[15px] font-black text-slate-900 mb-2">1. Information We Collect</Text>
                    <Text className="text-[14px] text-slate-600 leading-relaxed">
                        We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-[15px] font-black text-slate-900 mb-2">2. How We Use Information</Text>
                    <Text className="text-[14px] text-slate-600 leading-relaxed">
                        We may use the information we collect about you to: Provide, maintain, and improve our Services, including, for example, to facilitate payments, send receipts, provide products and services you request, develop new features, provide customer support to Users and Vendors, develop safety features, authenticate users, and send product updates and administrative messages.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-[15px] font-black text-slate-900 mb-2">3. Sharing of Information</Text>
                    <Text className="text-[14px] text-slate-600 leading-relaxed">
                        We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows: With Vendors to enable them to provide the Services you request. For example, we share your name, photo, delivery address, and order details with Vendors.
                    </Text>
                </View>

                <View className="h-20" />
            </ScrollView>
        </View>
    );
}
