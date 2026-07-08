import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Phone, Mail, Lock } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
    const router = useRouter();
    const { user } = useAuth();

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-[18px] font-black text-slate-900">Account Settings</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
                
                <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
                    <Text className="text-[15px] font-black text-slate-900 mb-4">Personal Information</Text>

                    <View className="mb-4">
                        <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Full Name</Text>
                        <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 flex-row items-center gap-3">
                            <User size={18} color="#94a3b8" />
                            <TextInput 
                                className="flex-1 text-[15px] font-medium text-slate-900 h-full"
                                defaultValue={user?.name || ''}
                                placeholder="Enter your name"
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Phone Number</Text>
                        <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 flex-row items-center gap-3 opacity-70">
                            <Phone size={18} color="#94a3b8" />
                            <TextInput 
                                className="flex-1 text-[15px] font-medium text-slate-900 h-full"
                                defaultValue={user?.phone || ''}
                                editable={false}
                            />
                        </View>
                        <Text className="text-[10px] text-slate-400 mt-1 ml-1">Phone number cannot be changed.</Text>
                    </View>

                    <View className="mb-4">
                        <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Email Address</Text>
                        <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 flex-row items-center gap-3">
                            <Mail size={18} color="#94a3b8" />
                            <TextInput 
                                className="flex-1 text-[15px] font-medium text-slate-900 h-full"
                                defaultValue={user?.email || ''}
                                placeholder="Enter your email"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <TouchableOpacity className="bg-slate-900 h-12 rounded-xl flex-row items-center justify-center mt-2 shadow-sm">
                        <Text className="text-white font-black text-[15px]">Save Changes</Text>
                    </TouchableOpacity>
                </View>

                <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-10">
                    <Text className="text-[15px] font-black text-rose-600 mb-2">Danger Zone</Text>
                    <Text className="text-[13px] font-medium text-slate-500 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </Text>
                    <TouchableOpacity className="bg-rose-50 border border-rose-200 h-12 rounded-xl flex-row items-center justify-center shadow-sm gap-2">
                        <Lock size={16} color="#e11d48" />
                        <Text className="text-rose-600 font-black text-[14px]">Delete Account</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}
