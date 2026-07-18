import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StatusBar, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Phone, Mail, Lock, Shield, CheckCircle2, MapPin, Plus, Trash2, Home, Briefcase, Map, AlertTriangle, Moon, Sun, Monitor } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import api from '@/api/api';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, login } = useAuth();
    const { colors, isDark, mode, setMode } = useTheme();
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
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View className="pt-16 px-5 pb-4 shadow-sm relative z-10 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity 
                            onPress={() => router.back()} 
                            className="w-10 h-10 rounded-full items-center justify-center border"
                            style={{ backgroundColor: isDark ? colors.elevated : '#f8fafc', borderColor: colors.border }}
                        >
                            <ArrowLeft size={20} color={colors.icon} />
                        </TouchableOpacity>
                        <Text style={{ color: colors.primaryText }} className="text-[20px] font-black tracking-tight">Account Settings</Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false} bounces={true}>
                
                {/* Personal Information */}
                <View className="mb-8">
                    <Text style={{ color: colors.tertiaryText }} className="text-[13px] font-black uppercase tracking-widest ml-1 mb-3">Personal Details</Text>
                    
                    <View className="rounded-3xl shadow-sm border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                        <View className="mb-5">
                            <Text style={{ color: colors.secondaryText }} className="text-[12px] font-bold mb-2 ml-1">Full Name</Text>
                            <View className="border rounded-2xl px-4 h-14 flex-row items-center gap-3" style={{ backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }}>
                                <User size={18} color={colors.iconMuted} />
                                <TextInput 
                                    className="flex-1 text-[15px] font-bold h-full"
                                    style={{ color: colors.inputText }}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your name"
                                    placeholderTextColor={colors.placeholder}
                                />
                            </View>
                        </View>

                        <View className="mb-5">
                            <Text style={{ color: colors.secondaryText }} className="text-[12px] font-bold mb-2 ml-1">Phone Number</Text>
                            <View className="border rounded-2xl px-4 h-14 flex-row items-center gap-3" style={{ backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }}>
                                <Phone size={18} color={colors.iconMuted} />
                                <TextInput 
                                    className="flex-1 text-[15px] font-bold h-full"
                                    style={{ color: colors.inputText }}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Enter your phone number"
                                    placeholderTextColor={colors.placeholder}
                                    keyboardType="phone-pad"
                                />
                                {user?.phone ? (
                                    <Shield size={16} color={colors.success} />
                                ) : null}
                            </View>
                            <Text style={{ color: colors.tertiaryText }} className="text-[11px] font-semibold mt-2 ml-1">
                                We will use this number to contact you during delivery.
                            </Text>
                        </View>

                        <View className="mb-6">
                            <Text style={{ color: colors.secondaryText }} className="text-[12px] font-bold mb-2 ml-1">Email Address</Text>
                            <View className="border rounded-2xl px-4 h-14 flex-row items-center gap-3" style={{ backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }}>
                                <Mail size={18} color={colors.iconMuted} />
                                <TextInput 
                                    className="flex-1 text-[15px] font-bold h-full"
                                    style={{ color: colors.inputText }}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email"
                                    placeholderTextColor={colors.placeholder}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            onPress={handleSaveProfile}
                            disabled={isSaving}
                            className={`h-14 rounded-2xl flex-row items-center justify-center shadow-sm gap-2`}
                            style={{ backgroundColor: isSaving ? colors.disabled : colors.primaryText }}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color={colors.invertedText} />
                            ) : (
                                <>
                                    <CheckCircle2 size={18} color={colors.invertedText} />
                                    <Text className="font-black text-[15px]" style={{ color: colors.invertedText }}>Save Profile</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Saved Locations */}
                <View className="mb-8">
                    <View className="flex-row items-center justify-between mb-3 px-1">
                        <Text style={{ color: colors.tertiaryText }} className="text-[13px] font-black uppercase tracking-widest">Saved Addresses</Text>
                    </View>
                    
                    <View className="rounded-3xl shadow-sm border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                        {isLoadingLocations ? (
                            <View className="py-8 items-center justify-center">
                                <ActivityIndicator size="small" color={colors.accent} />
                            </View>
                        ) : savedLocations.length === 0 ? (
                            <View className="py-6 items-center justify-center">
                                <Map size={32} color={colors.iconMuted} />
                                <Text style={{ color: colors.secondaryText }} className="text-[14px] font-bold mt-3 mb-1">No saved addresses</Text>
                                <Text style={{ color: colors.tertiaryText }} className="text-[12px] font-medium">Add an address for faster checkout</Text>
                            </View>
                        ) : (
                            savedLocations.map((loc: any, idx: number) => (
                                <View key={loc._id} className={`flex-row items-start justify-between py-4 ${idx !== savedLocations.length - 1 ? 'border-b' : ''}`} style={{ borderBottomColor: colors.border }}>
                                    <View className="flex-row items-start gap-3 flex-1 pr-4">
                                        <View className="w-10 h-10 rounded-full items-center justify-center border" style={{ backgroundColor: isDark ? colors.elevated : '#f8fafc', borderColor: colors.border }}>
                                            {getAddressIcon(loc.name)}
                                        </View>
                                        <View className="flex-1 mt-0.5">
                                            <Text style={{ color: colors.primaryText }} className="text-[15px] font-black mb-1">{loc.name}</Text>
                                            <Text style={{ color: colors.secondaryText }} className="text-[13px] font-medium leading-relaxed">{loc.address}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        onPress={() => deleteLocationMutation.mutate(loc._id)}
                                        disabled={deleteLocationMutation.isPending}
                                        className="w-10 h-10 items-center justify-center rounded-full border"
                                        style={{ backgroundColor: colors.dangerMuted, borderColor: isDark ? 'rgba(248,113,113,0.3)' : '#ffe4e6' }}
                                    >
                                        {deleteLocationMutation.isPending ? (
                                            <ActivityIndicator size="small" color={colors.danger} />
                                        ) : (
                                            <Trash2 size={16} color={colors.danger} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}

                        <TouchableOpacity 
                            onPress={() => setIsAddressModalVisible(true)}
                            className="mt-2 h-14 rounded-2xl flex-row items-center justify-center border border-dashed gap-2"
                            style={{ backgroundColor: colors.accentMuted, borderColor: isDark ? colors.accent : '#fcd34d' }}
                        >
                            <Plus size={20} color={colors.accent} />
                            <Text style={{ color: colors.accentText }} className="font-black text-[15px]">Add New Address</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Theme Preference */}
                <View className="mb-8">
                    <Text style={{ color: colors.tertiaryText }} className="text-[13px] font-black uppercase tracking-widest ml-1 mb-3">Theme</Text>
                    <View className="rounded-3xl shadow-sm border p-4 flex-row justify-between gap-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                        {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => {
                            const isSelected = mode === m;
                            return (
                                <TouchableOpacity
                                    key={m}
                                    onPress={() => setMode(m)}
                                    style={{
                                        backgroundColor: isSelected ? (isDark ? colors.elevated : colors.primaryText) : 'transparent',
                                        borderColor: isSelected ? 'transparent' : colors.border
                                    }}
                                    className={`flex-1 py-3 rounded-2xl items-center border ${isSelected ? 'shadow-sm' : ''}`}
                                >
                                    {m === 'light' && <Sun size={20} color={isSelected ? colors.invertedText : colors.icon} />}
                                    {m === 'dark' && <Moon size={20} color={isSelected ? colors.invertedText : colors.icon} />}
                                    {m === 'system' && <Monitor size={20} color={isSelected ? colors.invertedText : colors.icon} />}
                                    <Text 
                                        className="text-[13px] font-bold mt-2 capitalize" 
                                        style={{ color: isSelected ? colors.invertedText : colors.secondaryText }}
                                    >
                                        {m}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Danger Zone */}
                <View className="mb-12">
                    <Text style={{ color: colors.danger }} className="text-[13px] font-black uppercase tracking-widest ml-1 mb-3">Danger Zone</Text>
                    
                    <View className="rounded-3xl shadow-sm border p-5" style={{ backgroundColor: colors.surface, borderColor: isDark ? 'rgba(248,113,113,0.3)' : '#ffe4e6' }}>
                        <Text style={{ color: colors.secondaryText }} className="text-[13px] font-bold mb-4 leading-relaxed">
                            Deleting your account is permanent and will remove all your data, orders, and saved addresses.
                        </Text>
                        <TouchableOpacity 
                            onPress={handleDeleteAccount}
                            disabled={isDeleting}
                            className={`border h-14 rounded-2xl flex-row items-center justify-center gap-2`}
                            style={{ backgroundColor: colors.dangerMuted, borderColor: isDark ? 'rgba(248,113,113,0.3)' : '#ffe4e6' }}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color={colors.danger} />
                            ) : (
                                <>
                                    <Lock size={18} color={colors.danger} />
                                    <Text style={{ color: colors.danger }} className="font-black text-[15px]">Delete Account permanently</Text>
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
                <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlayStrong }}>
                    <View className="rounded-t-3xl p-6 h-[80%]" style={{ backgroundColor: colors.surface }}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text style={{ color: colors.primaryText }} className="text-[22px] font-black">New Address</Text>
                            <TouchableOpacity 
                                onPress={() => setIsAddressModalVisible(false)}
                                disabled={isGettingLocation}
                                className="w-8 h-8 rounded-full items-center justify-center"
                                style={{ backgroundColor: isDark ? colors.elevated : '#f1f5f9' }}
                            >
                                <Text style={{ color: colors.icon }} className="font-bold">✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="border rounded-2xl p-4 flex-row items-start gap-3 mb-6" style={{ backgroundColor: colors.warningMuted, borderColor: isDark ? 'rgba(251,191,36,0.3)' : '#fde68a' }}>
                            <AlertTriangle size={20} color={colors.warning} className="mt-0.5" />
                            <View className="flex-1">
                                <Text className="text-[14px] font-black mb-1" style={{ color: isDark ? colors.warning : '#78350f' }}>Important Note</Text>
                                <Text className="text-[13px] font-medium leading-relaxed" style={{ color: isDark ? '#fde68a' : '#92400e' }}>
                                    We will securely capture your <Text className="font-bold">current GPS location</Text> when you save this address. Please ensure you are physically at this address right now, so our delivery partners can find you easily.
                                </Text>
                            </View>
                        </View>

                        <Text style={{ color: colors.secondaryText }} className="text-[13px] font-bold mb-2 ml-1">Save as</Text>
                        <View className="flex-row gap-3 mb-6">
                            {['Home', 'Office', 'Other'].map(type => {
                                const isSelected = newAddressType === type;
                                return (
                                <TouchableOpacity 
                                    key={type}
                                    onPress={() => setNewAddressType(type)}
                                    className={`flex-1 py-3 rounded-xl items-center border`}
                                    style={{ 
                                        backgroundColor: isSelected ? (isDark ? colors.elevated : colors.primaryText) : 'transparent',
                                        borderColor: isSelected ? 'transparent' : colors.border
                                    }}
                                >
                                    <Text className="font-bold text-[14px]" style={{ color: isSelected ? colors.invertedText : colors.secondaryText }}>{type}</Text>
                                </TouchableOpacity>
                            )})}
                        </View>

                        <Text style={{ color: colors.secondaryText }} className="text-[13px] font-bold mb-2 ml-1">Full Address details</Text>
                        <TextInput
                            className="border rounded-2xl p-4 text-[15px] font-medium h-32 mb-6"
                            style={{ backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }}
                            placeholder="House No, Building Name, Landmark, Area..."
                            placeholderTextColor={colors.placeholder}
                            multiline
                            textAlignVertical="top"
                            value={newAddressText}
                            onChangeText={setNewAddressText}
                        />

                        <TouchableOpacity 
                            onPress={handleSaveNewAddress}
                            disabled={isGettingLocation}
                            className={`h-14 rounded-2xl flex-row items-center justify-center shadow-sm gap-2 mt-auto`}
                            style={{ backgroundColor: isGettingLocation ? colors.disabled : colors.accent }}
                        >
                            {isGettingLocation ? (
                                <>
                                    <ActivityIndicator size="small" color={colors.invertedText} />
                                    <Text className="font-black text-[15px]" style={{ color: colors.invertedText }}>Fetching Location & Saving...</Text>
                                </>
                            ) : (
                                <>
                                    <MapPin size={18} color={colors.accentText} />
                                    <Text className="font-black text-[15px]" style={{ color: colors.accentText }}>Save & Pin My GPS Location</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
