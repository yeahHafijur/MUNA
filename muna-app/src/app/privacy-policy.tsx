import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export default function PrivacyPolicyScreen() {
    const router = useRouter();
    const { colors } = useTheme();

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View className="pt-12 px-4 pb-4 flex-row items-center gap-3 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color={colors.icon} />
                </TouchableOpacity>
                <Text style={{ color: colors.primaryText }} className="text-[18px] font-black">Privacy Policy</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
                <Text style={{ color: colors.primaryText }} className="text-[22px] font-black mb-6">MUNA Privacy Policy</Text>
                
                <View className="mb-6">
                    <Text style={{ color: colors.primaryText }} className="text-[15px] font-black mb-2">1. Information We Collect</Text>
                    <Text style={{ color: colors.secondaryText }} className="text-[14px] leading-relaxed">
                        We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text style={{ color: colors.primaryText }} className="text-[15px] font-black mb-2">2. How We Use Information</Text>
                    <Text style={{ color: colors.secondaryText }} className="text-[14px] leading-relaxed">
                        We may use the information we collect about you to: Provide, maintain, and improve our Services, including, for example, to facilitate payments, send receipts, provide products and services you request, develop new features, provide customer support to Users and Vendors, develop safety features, authenticate users, and send product updates and administrative messages.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text style={{ color: colors.primaryText }} className="text-[15px] font-black mb-2">3. Sharing of Information</Text>
                    <Text style={{ color: colors.secondaryText }} className="text-[14px] leading-relaxed">
                        We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows: With Vendors to enable them to provide the Services you request. For example, we share your name, photo, delivery address, and order details with Vendors.
                    </Text>
                </View>

                <View className="h-20" />
            </ScrollView>
        </View>
    );
}
