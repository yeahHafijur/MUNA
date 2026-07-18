import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StatusBar, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Phone, Mail, Lock, Shield, CheckCircle2, MapPin, Plus, Trash2, Home, Briefcase, Map, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, login } = useAuth();
    const queryClient = useQueryClient();
    
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Location Modal State
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [newAddressType, setNewAddressType] = useState('Home');
    const [newAddressText, setNewAddressText] = useState('');
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    // Fetch Saved Locations
    const { data: savedLocations = [], isLoading: isLoadingLocations } = useQuery({
        queryKey: ['saved-locations'],
        queryFn: async () => {
            const res = await api.get('/api/user/locations');
            return res.data;
        }
    });

    // Delete Location Mutation
    const deleteLocationMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/user/locations/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-locations'] });
        },
        onError: (err: any) => {
            Alert.alert("Error", err.response?.data?.message || "Failed to delete address");
        }
    });

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }

        if (phone && phone.replace(/\D/g, '').length < 10) {
            Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number.");
            return;
        }
        
        setIsSaving(true);
        try {
            const res = await api.put('/api/user/profile', { name, email, phone });
            
            // Update auth context
            if (res.data && res.data.user) {
                const token = await SecureStore.getItemAsync('token');
                if (token) {
                    await login(res.data.user, token);
                }
            }
            
            Alert.alert("Success", "Profile information updated successfully!");
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Once you delete your account, there is no going back. Please be certain.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive', 
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await api.delete('/api/user/account');
                            // Clear auth
                            await SecureStore.deleteItemAsync('token');
                            await SecureStore.deleteItemAsync('user');
                            router.replace('/login');
                        } catch (error: any) {
                            Alert.alert("Error", error.response?.data?.message || "Failed to delete account");
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSaveNewAddress = async () => {
        if (!newAddressText.trim()) {
            Alert.alert("Required", "Please enter the full address details.");
            return;
        }

        setIsGettingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied. We need your GPS to accurately deliver your orders.');
                setIsGettingLocation(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });

            // Save to backend
            await api.post('/api/user/locations', {
                name: newAddressType,
                address: newAddressText,
                lat: location.coords.latitude,
                lng: location.coords.longitude
            });

            queryClient.invalidateQueries({ queryKey: ['saved-locations'] });
            setIsAddressModalVisible(false);
            setNewAddressText('');
            setNewAddressType('Home');
            Alert.alert("Success", "Address saved successfully!");
        } catch (error: any) {
            Alert.alert("Error", "Could not get your location or save the address. Please ensure GPS is enabled.");
            console.error("Location Error:", error);
        } finally {
            setIsGettingLocation(false);
        }
    };

    const getAddressIcon = (type: string) => {
        if (type.toLowerCase() === 'home') return <Home size={18} color="#0ea5e9" />;
        if (type.toLowerCase() === 'office') return <Briefcase size={18} color="#8b5cf6" />;
        return <MapPin size={18} color="#f59e0b" />;
    };

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View className="bg-white pt-16 px-5 pb-4 shadow-sm relative z-10 border-b border-slate-100">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity 
                            onPress={() => router.back()} 
                            className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100"
                        >
                            <ArrowLeft size={20} color="#0f172a" />
                        </TouchableOpacity>
                        <Text className="text-[20px] font-black text-slate-900 tracking-tight">Account Settings</Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false} bounces={true}>
                
                {/* Personal Information */}
                <View className="mb-8">
                    <Text className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Personal Details</Text>
                    
                    <View className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
                        <View className="mb-5">
                            <Text className="text-[12px] font-bold text-slate-500 mb-2 ml-1">Full Name</Text>
                            <View className="bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 flex-row items-center gap-3">
                                <User size={18} color="#64748b" />
                                <TextInput 
                                    className="flex-1 text-[15px] font-bold text-slate-900 h-full"
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#cbd5e1"
                                />
                            </View>
                        </View>

                        <View className="mb-5">
                            <Text className="text-[12px] font-bold text-slate-500 mb-2 ml-1">Phone Number</Text>
                            <View className="bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 flex-row items-center gap-3">
                                <Phone size={18} color="#64748b" />
                                <TextInput 
                                    className="flex-1 text-[15px] font-bold text-slate-900 h-full"
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Enter your phone number"
                                    placeholderTextColor="#cbd5e1"
                                    keyboardType="phone-pad"
                                />
                                {user?.phone ? (
                                    <Shield size={16} color="#10b981" />
                                ) : null}
                            </View>
                            <Text className="text-[11px] font-semibold text-slate-400 mt-2 ml-1">
                                We will use this number to contact you during delivery.
                            </Text>
                        </View>

                        <View className="mb-6">
                            <Text className="text-[12px] font-bold text-slate-500 mb-2 ml-1">Email Address</Text>
                            <View className="bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 flex-row items-center gap-3">
                                <Mail size={18} color="#64748b" />
                                <TextInput 
                                    className="flex-1 text-[15px] font-bold text-slate-900 h-full"
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#cbd5e1"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            onPress={handleSaveProfile}
                            disabled={isSaving}
                            className={`h-14 rounded-2xl flex-row items-center justify-center shadow-sm gap-2 ${isSaving ? 'bg-slate-700' : 'bg-slate-900'}`}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <CheckCircle2 size={18} color="#fff" />
                                    <Text className="text-white font-black text-[15px]">Save Profile</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Saved Locations */}
                <View className="mb-8">
                    <View className="flex-row items-center justify-between mb-3 px-1">
                        <Text className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Saved Addresses</Text>
                    </View>
                    
                    <View className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
                        {isLoadingLocations ? (
                            <View className="py-8 items-center justify-center">
                                <ActivityIndicator size="small" color="#fbbf24" />
                            </View>
                        ) : savedLocations.length === 0 ? (
                            <View className="py-6 items-center justify-center">
                                <Map size={32} color="#cbd5e1" />
                                <Text className="text-[14px] font-bold text-slate-500 mt-3 mb-1">No saved addresses</Text>
                                <Text className="text-[12px] font-medium text-slate-400">Add an address for faster checkout</Text>
                            </View>
                        ) : (
                            savedLocations.map((loc: any, idx: number) => (
                                <View key={loc._id} className={`flex-row items-start justify-between py-4 ${idx !== savedLocations.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    <View className="flex-row items-start gap-3 flex-1 pr-4">
                                        <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                                            {getAddressIcon(loc.name)}
                                        </View>
                                        <View className="flex-1 mt-0.5">
                                            <Text className="text-[15px] font-black text-slate-900 mb-1">{loc.name}</Text>
                                            <Text className="text-[13px] font-medium text-slate-500 leading-relaxed">{loc.address}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        onPress={() => deleteLocationMutation.mutate(loc._id)}
                                        disabled={deleteLocationMutation.isPending}
                                        className="w-10 h-10 items-center justify-center bg-rose-50 rounded-full border border-rose-100"
                                    >
                                        {deleteLocationMutation.isPending ? (
                                            <ActivityIndicator size="small" color="#e11d48" />
                                        ) : (
                                            <Trash2 size={16} color="#e11d48" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}

                        <TouchableOpacity 
                            onPress={() => setIsAddressModalVisible(true)}
                            className="mt-2 h-14 rounded-2xl flex-row items-center justify-center bg-amber-50 border border-amber-200 border-dashed gap-2"
                        >
                            <Plus size={20} color="#d97706" />
                            <Text className="text-amber-700 font-black text-[15px]">Add New Address</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Danger Zone */}
                <View className="mb-12">
                    <Text className="text-[13px] font-black text-rose-300 uppercase tracking-widest ml-1 mb-3">Danger Zone</Text>
                    
                    <View className="bg-white rounded-3xl shadow-sm border border-rose-100 p-5">
                        <Text className="text-[13px] font-bold text-slate-600 mb-4 leading-relaxed">
                            Deleting your account is permanent and will remove all your data, orders, and saved addresses.
                        </Text>
                        <TouchableOpacity 
                            onPress={handleDeleteAccount}
                            disabled={isDeleting}
                            className={`border h-14 rounded-2xl flex-row items-center justify-center gap-2 ${isDeleting ? 'bg-rose-100 border-rose-200' : 'bg-rose-50 border-rose-100'}`}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color="#e11d48" />
                            ) : (
                                <>
                                    <Lock size={18} color="#e11d48" />
                                    <Text className="text-rose-600 font-black text-[15px]">Delete Account permanently</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Add Address Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isAddressModalVisible}
                onRequestClose={() => !isGettingLocation && setIsAddressModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 h-[80%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-[22px] font-black text-slate-900">New Address</Text>
                            <TouchableOpacity 
                                onPress={() => setIsAddressModalVisible(false)}
                                disabled={isGettingLocation}
                                className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center"
                            >
                                <Text className="font-bold text-slate-600">✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex-row items-start gap-3 mb-6">
                            <AlertTriangle size={20} color="#d97706" className="mt-0.5" />
                            <View className="flex-1">
                                <Text className="text-[14px] font-black text-amber-900 mb-1">Important Note</Text>
                                <Text className="text-[13px] font-medium text-amber-800 leading-relaxed">
                                    We will securely capture your <Text className="font-bold">current GPS location</Text> when you save this address. Please ensure you are physically at this address right now, so our delivery partners can find you easily.
                                </Text>
                            </View>
                        </View>

                        <Text className="text-[13px] font-bold text-slate-500 mb-2 ml-1">Save as</Text>
                        <View className="flex-row gap-3 mb-6">
                            {['Home', 'Office', 'Other'].map(type => (
                                <TouchableOpacity 
                                    key={type}
                                    onPress={() => setNewAddressType(type)}
                                    className={`flex-1 py-3 rounded-xl items-center border ${newAddressType === type ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                                >
                                    <Text className={`font-bold text-[14px] ${newAddressType === type ? 'text-white' : 'text-slate-600'}`}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text className="text-[13px] font-bold text-slate-500 mb-2 ml-1">Full Address details</Text>
                        <TextInput
                            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[15px] font-medium text-slate-900 h-32 mb-6"
                            placeholder="House No, Building Name, Landmark, Area..."
                            placeholderTextColor="#94a3b8"
                            multiline
                            textAlignVertical="top"
                            value={newAddressText}
                            onChangeText={setNewAddressText}
                        />

                        <TouchableOpacity 
                            onPress={handleSaveNewAddress}
                            disabled={isGettingLocation}
                            className={`h-14 rounded-2xl flex-row items-center justify-center shadow-sm gap-2 mt-auto ${isGettingLocation ? 'bg-slate-700' : 'bg-amber-500'}`}
                        >
                            {isGettingLocation ? (
                                <>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text className="text-white font-black text-[15px]">Fetching Location & Saving...</Text>
                                </>
                            ) : (
                                <>
                                    <MapPin size={18} color="#78350f" />
                                    <Text className="text-amber-950 font-black text-[15px]">Save & Pin My GPS Location</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
