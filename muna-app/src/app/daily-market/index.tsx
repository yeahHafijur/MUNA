import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Hammer, Sparkles } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

export default function DailyMarketListScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />
            
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-3 shadow-sm">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()} className="p-1">
                        <ArrowLeft size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-black text-slate-900">Daily Market</Text>
                </View>
            </View>

            {/* Coming Soon Content */}
            <View className="flex-1 items-center justify-center px-6">
                <View className="w-24 h-24 bg-amber-100 rounded-full items-center justify-center mb-6 border border-amber-200">
                    <Hammer size={40} color="#b45309" strokeWidth={1.5} />
                    <View className="absolute -top-2 -right-2 bg-amber-400 p-1.5 rounded-full border-2 border-white">
                        <Sparkles size={16} color="#451a03" />
                    </View>
                </View>

                <Text className="text-[28px] font-black text-slate-900 text-center mb-3 tracking-tight leading-tight">
                    Working on a Masterpiece!
                </Text>
                
                <Text className="text-[15px] font-medium text-slate-500 text-center leading-relaxed mb-8 px-2">
                    We are completely revamping the Daily Market to bring you a fully professional, fast, and feature-rich experience. It will be live in our very next update!
                </Text>

                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="bg-slate-900 px-8 py-4 rounded-2xl flex-row items-center justify-center active:opacity-80 shadow-sm w-full max-w-[250px]"
                >
                    <Text className="text-white font-black text-[15px]">Go Back Home</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
