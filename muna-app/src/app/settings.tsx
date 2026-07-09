import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Phone, Mail, Lock, Shield, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const handleSave = () => {
        Alert.alert("Success", "Profile information updated successfully!");
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Account',
            'Once you delete your account, there is no going back. Please be certain.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive', 
                    onPress: () => {
                        // Handle deletion
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View className="bg-white pt-16 px-5 pb-4 shadow-sm relative z-10">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity 
                            onPress={() => router.back()} 
                            className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center"
                        >
                            <ArrowLeft size={20} color="#0f172a" />
                        </TouchableOpacity>
                        <Text className="text-[22px] font-black text-slate-900 tracking-tight">Settings</Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false} bounces={true}>
                
                {/* Personal Information */}
                <View className="mb-6">
                    <Text className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-3">Personal Information</Text>
                    
                    <View className="bg-white rounded-[24px] shadow-sm border border-slate-50 p-5">
                        <View className="mb-5">
                            <Text className="text-[12px] font-bold text-slate-500 mb-2 ml-1">Full Name</Text>
                            <View className="bg-slate-50 border border-slate-100 rounded-2xl px-4 h-14 flex-row items-center gap-3">
                                <User size={18} color="#64748b" />
                                <TextInput 
                                    className="flex-1 text-[15px] font-bold text-slate-900 h-full"
                                    defaultValue={user?.name || ''}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#cbd5e1"
                                />
                            </View>
                        </View>

                        <View className="mb-5">
                            <Text className="text-[12px] font-bold text-slate-500 mb-2 ml-1">Phone Number</Text>
                            <View className="bg-slate-50 border border-slate-100 rounded-2xl px-4 h-14 flex-row items-center gap-3 opacity-60">
                                <Phone size={18} color="#64748b" />
                                <TextInput 
                                    className="flex-1 text-[15px] font-bold text-slate-900 h-full"
                                    defaultValue={user?.phone || ''}
                                    editable={false}
                                />
                                <Shield size={16} color="#10b981" />
                            </View>
                            <Text className="text-[11px] font-semibold text-slate-400 mt-2 ml-1">
                                Verified phone numbers cannot be changed.
                            </Text>
                        </View>

                        <View className="mb-6">
                            <Text className="text-[12px] font-bold text-slate-500 mb-2 ml-1">Email Address</Text>
                            <View className="bg-slate-50 border border-slate-100 rounded-2xl px-4 h-14 flex-row items-center gap-3">
                                <Mail size={18} color="#64748b" />
                                <TextInput 
                                    className="flex-1 text-[15px] font-bold text-slate-900 h-full"
                                    defaultValue={user?.email || ''}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#cbd5e1"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            onPress={handleSave}
                            className="bg-slate-900 h-14 rounded-2xl flex-row items-center justify-center shadow-sm gap-2"
                        >
                            <CheckCircle2 size={18} color="#fff" />
                            <Text className="text-white font-black text-[15px]">Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Danger Zone */}
                <View className="mb-10">
                    <Text className="text-[13px] font-black text-rose-300 uppercase tracking-widest ml-2 mb-3">Danger Zone</Text>
                    
                    <View className="bg-white rounded-[24px] shadow-sm border border-rose-50 p-5">
                        <Text className="text-[14px] font-bold text-slate-600 mb-4 leading-relaxed">
                            Deleting your account is permanent and will remove all your data, orders, and saved addresses.
                        </Text>
                        <TouchableOpacity 
                            onPress={handleDelete}
                            className="bg-rose-50 border border-rose-100 h-14 rounded-2xl flex-row items-center justify-center gap-2"
                        >
                            <Lock size={18} color="#e11d48" />
                            <Text className="text-rose-600 font-black text-[15px]">Delete Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}
