import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Hammer, Sparkles } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/context/ThemeContext';

export default function DailyMarketListScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <StatusBar style={isDark ? "light" : "dark"} />
            
            {/* Header */}
            <View className="pt-12 px-4 pb-3 shadow-sm border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()} className="p-1">
                        <ArrowLeft size={24} color={colors.icon} />
                    </TouchableOpacity>
                    <Text style={{ color: colors.primaryText }} className="text-[18px] font-black">Daily Market</Text>
                </View>
            </View>

            {/* Coming Soon Content */}
            <View className="flex-1 items-center justify-center px-6">
                <View className="w-24 h-24 rounded-full items-center justify-center mb-6 border" style={{ backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#fef3c7', borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#fde68a' }}>
                    <Hammer size={40} color="#d97706" strokeWidth={1.5} />
                    <View className="absolute -top-2 -right-2 bg-amber-500 p-1.5 rounded-full border-2" style={{ borderColor: colors.background }}>
                        <Sparkles size={16} color="#fff" />
                    </View>
                </View>

                <Text style={{ color: colors.primaryText }} className="text-[28px] font-black text-center mb-3 tracking-tight leading-tight">
                    Working on a Masterpiece!
                </Text>
                
                <Text style={{ color: colors.secondaryText }} className="text-[15px] font-medium text-center leading-relaxed mb-8 px-2">
                    We are completely revamping the Daily Market to bring you a fully professional, fast, and feature-rich experience. It will be live in our very next update!
                </Text>

                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="px-8 py-4 rounded-2xl flex-row items-center justify-center active:opacity-80 shadow-sm w-full max-w-[250px]"
                    style={{ backgroundColor: colors.primaryText }}
                >
                    <Text style={{ color: colors.invertedText }} className="font-black text-[15px]">Go Back Home</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
