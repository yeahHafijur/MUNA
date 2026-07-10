import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { MapPin, Navigation, Home, Briefcase, Map, Plus } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/api';
import { useAuth } from '@/context/AuthContext';

interface Address {
    _id?: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
}

interface CartLocationProps {
    onLocationDetermined: (address: Address) => void;
    locationReady: boolean;
}

const CartLocation: React.FC<CartLocationProps> = ({ onLocationDetermined, locationReady }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [locating, setLocating] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

    // New Address Modal State
    const [showModal, setShowModal] = useState(false);
    const [newGps, setNewGps] = useState<{lat: number, lng: number} | null>(null);
    const [newAddressText, setNewAddressText] = useState('');
    const [newName, setNewName] = useState('Home'); // Home, Office, Other
    const [saving, setSaving] = useState(false);

    // Fetch saved locations
    const { data: savedLocations = [], isLoading } = useQuery({
        queryKey: ['savedLocations'],
        queryFn: async () => {
            if (!user) return [];
            const res = await api.get('/api/user/locations');
            return res.data;
        },
        enabled: !!user
    });

    const handleSelectSaved = (addr: Address) => {
        setSelectedAddressId(addr._id || null);
        onLocationDetermined(addr);
    };

    const handleGetLocation = async () => {
        setLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Allow location access in settings to deliver to your location.');
                setLocating(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setNewGps({ lat: location.coords.latitude, lng: location.coords.longitude });
            setShowModal(true); // Open modal to ask for house number and save
        } catch (error) {
            console.error('Location error', error);
            Alert.alert('Location Error', 'Could not fetch location. Please try again.');
        } finally {
            setLocating(false);
        }
    };

    const handleSaveNewAddress = async (shouldSaveToDb: boolean) => {
        if (!newGps) return;
        if (!newAddressText.trim()) {
            Alert.alert("Missing Info", "Please enter your House No. / Landmark.");
            return;
        }

        setSaving(true);
        const payload = {
            name: shouldSaveToDb ? newName : 'Current Location',
            address: newAddressText,
            lat: newGps.lat,
            lng: newGps.lng
        };

        try {
            if (user && shouldSaveToDb) {
                // Save to backend
                const res = await api.post('/api/user/locations', payload);
                queryClient.invalidateQueries({ queryKey: ['savedLocations'] });
                
                if (res.data && res.data.savedLocations) {
                    const updatedList = res.data.savedLocations;
                    const newlySaved = updatedList[updatedList.length - 1];
                    handleSelectSaved(newlySaved || payload);
                } else {
                    onLocationDetermined(payload);
                }
            } else {
                // Just use without saving
                onLocationDetermined(payload);
            }
            setShowModal(false);
            setNewAddressText('');
        } catch (error: any) {
            console.error("Save Location Error", error?.response?.data || error);
            Alert.alert("Error", "Could not save address. Continuing without saving.");
            onLocationDetermined(payload); // Fallback to just using it
            setShowModal(false);
        } finally {
            setSaving(false);
        }
    };

    const getIcon = (name: string) => {
        if (name.toLowerCase() === 'home') return <Home size={18} color="#0f172a" />;
        if (name.toLowerCase() === 'office') return <Briefcase size={18} color="#0f172a" />;
        return <MapPin size={18} color="#0f172a" />;
    };

    return (
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-4">
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                    <MapPin size={18} color="#0f172a" />
                    <Text className="text-[16px] font-black text-slate-900">Delivery Address</Text>
                </View>
                {locationReady && (
                    <View className="bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                        <Text className="text-[10px] font-bold text-emerald-700 uppercase">Confirmed</Text>
                    </View>
                )}
            </View>

            {isLoading ? (
                <ActivityIndicator size="small" color="#fbbf24" />
            ) : (
                <View>
                    {/* Saved Addresses List */}
                    {savedLocations.length > 0 && (
                        <View className="mb-4">
                            <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3">Saved Addresses</Text>
                            {savedLocations.map((addr: Address) => (
                                <TouchableOpacity 
                                    key={addr._id}
                                    onPress={() => handleSelectSaved(addr)}
                                    className={`flex-row items-center p-4 rounded-2xl mb-2 border ${
                                        selectedAddressId === addr._id 
                                        ? 'bg-amber-50 border-amber-400' 
                                        : 'bg-slate-50 border-slate-100'
                                    }`}
                                >
                                    <View className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm mr-3">
                                        {getIcon(addr.name)}
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-[14px] font-black text-slate-900">{addr.name}</Text>
                                            {selectedAddressId === addr._id && <Text className="text-[14px]">✅</Text>}
                                        </View>
                                        <Text className="text-[12px] font-medium text-slate-500 mt-0.5" numberOfLines={2}>
                                            {addr.address || 'GPS Location'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Add New Address / Current Location Button */}
                    <TouchableOpacity 
                        onPress={handleGetLocation}
                        disabled={locating}
                        className="bg-slate-900 h-14 rounded-2xl flex-row items-center justify-center shadow-sm"
                    >
                        {locating ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Plus size={18} color="#ffffff" className="mr-2" />
                                <Text className="text-white font-black text-[15px]">Add New Address (GPS)</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* New Address Modal */}
            <Modal visible={showModal} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-slate-900/40">
                    <View className="bg-white rounded-t-[32px] p-6 pb-10">
                        <View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                        
                        <View className="flex-row items-center gap-3 mb-6">
                            <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center">
                                <Navigation size={18} color="#10b981" />
                            </View>
                            <View>
                                <Text className="text-[18px] font-black text-slate-900">GPS Location Fetched</Text>
                                <Text className="text-[12px] font-bold text-slate-500">Please provide house/building details</Text>
                            </View>
                        </View>

                        <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Complete Address</Text>
                        <TextInput 
                            value={newAddressText}
                            onChangeText={setNewAddressText}
                            placeholder="House No., Building Name, Landmark"
                            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[15px] font-medium text-slate-900 mb-5"
                            multiline
                            style={{ height: 80, textAlignVertical: 'top' }}
                        />

                        <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Save As</Text>
                        <View className="flex-row gap-3 mb-8">
                            {['Home', 'Office', 'Other'].map(type => (
                                <TouchableOpacity 
                                    key={type}
                                    onPress={() => setNewName(type)}
                                    className={`flex-1 py-3 rounded-xl border items-center ${newName === type ? 'bg-amber-100 border-amber-400' : 'bg-white border-slate-200'}`}
                                >
                                    <Text className={`text-[13px] font-black ${newName === type ? 'text-amber-900' : 'text-slate-600'}`}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="flex-row gap-3 mt-4">
                            <TouchableOpacity 
                                onPress={() => handleSaveNewAddress(false)}
                                disabled={saving || !newAddressText.trim()}
                                className={`flex-1 py-4 bg-slate-100 rounded-2xl items-center ${saving || !newAddressText.trim() ? 'opacity-50' : ''}`}
                            >
                                <Text className="text-slate-600 text-[14px] font-black">Use Once</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => handleSaveNewAddress(true)}
                                disabled={saving || !newAddressText.trim()}
                                className={`flex-1 py-4 bg-amber-400 rounded-2xl items-center ${saving || !newAddressText.trim() ? 'opacity-50' : ''}`}
                            >
                                <Text className="text-amber-950 text-[14px] font-black">{saving ? 'Wait...' : 'Save & Use'}</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowModal(false)}
                            className="mt-4 py-2 items-center"
                        >
                            <Text className="text-slate-400 text-[13px] font-bold">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

export default CartLocation;
