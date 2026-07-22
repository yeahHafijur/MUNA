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
    const [shouldSave, setShouldSave] = useState(false); // Optional saving
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
        } catch (error) {
            console.error('Location error', error);
            Alert.alert('Location Error', 'Could not fetch location. Please try again.');
        } finally {
            setLocating(false);
        }
    };

    const handleSaveNewAddress = async () => {
        if (!newGps) {
            Alert.alert("Location Required", "Please click 'Get Current Location' first.");
            return;
        }
        if (!newAddressText.trim()) {
            Alert.alert("Missing Info", "Please enter your House No. / Landmark.");
            return;
        }

        setSaving(true);
        const payload = {
            name: newName,
            address: newAddressText,
            lat: newGps.lat,
            lng: newGps.lng
        };

        try {
            if (user && shouldSave) {
                // Save to backend
                await api.post('/api/user/locations', payload);
                queryClient.invalidateQueries({ queryKey: ['savedLocations'] });
                // We just proceed with the payload instead of trying to extract the ID, 
                // the cart only needs lat/lng/address
                onLocationDetermined(payload);
            } else {
                // Use without saving
                onLocationDetermined(payload);
            }
            setShowModal(false);
            setNewAddressText('');
            setNewGps(null); // Reset for next time
            setShouldSave(false);
        } catch (error: any) {
            console.error("Save Location Error", error?.response?.data || error);
            Alert.alert("Error", "Could not save address. Continuing without saving.");
            onLocationDetermined(payload); // Fallback to just using it
            setShowModal(false);
            setNewGps(null);
            setShouldSave(false);
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

                    {/* Quick GPS Location Button */}
                    <TouchableOpacity 
                        onPress={async () => {
                            setLocating(true);
                            try {
                                const { status } = await Location.requestForegroundPermissionsAsync();
                                if (status !== 'granted') {
                                    Alert.alert('Permission denied', 'Allow location access in settings to deliver to your location.');
                                    return;
                                }
                                const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                                
                                const addresses = await Location.reverseGeocodeAsync({
                                    latitude: location.coords.latitude,
                                    longitude: location.coords.longitude,
                                });
                                const address = addresses[0];
                                const label = address ? [address.name, address.district || address.city, address.region].filter(Boolean).join(', ') : 'Current GPS Location';
                                
                                onLocationDetermined({
                                    name: 'Current Location',
                                    address: label,
                                    lat: location.coords.latitude,
                                    lng: location.coords.longitude
                                });
                                setSelectedAddressId('current-gps');
                            } catch (error) {
                                Alert.alert('Location Error', 'Could not fetch location. Please try again.');
                            } finally {
                                setLocating(false);
                            }
                        }}
                        disabled={locating}
                        className={`mb-3 h-14 rounded-2xl flex-row items-center justify-center shadow-sm border ${
                            selectedAddressId === 'current-gps' 
                            ? 'bg-amber-50 border-amber-400' 
                            : 'bg-emerald-50 border-emerald-200'
                        }`}
                    >
                        {locating ? (
                            <ActivityIndicator size="small" color="#10b981" />
                        ) : (
                            <>
                                <Navigation size={18} color={selectedAddressId === 'current-gps' ? '#b45309' : '#10b981'} className="mr-2" />
                                <Text className={`font-black text-[15px] ${selectedAddressId === 'current-gps' ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {selectedAddressId === 'current-gps' ? 'Current Location Selected ✅' : '📍 Use My Current Location'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Add New Address Button */}
                    <TouchableOpacity 
                        onPress={() => {
                            setNewGps(null);
                            setNewAddressText('');
                            setShowModal(true);
                        }}
                        className="bg-slate-900 h-14 rounded-2xl flex-row items-center justify-center shadow-sm"
                    >
                        <Plus size={18} color="#ffffff" className="mr-2" />
                        <Text className="text-white font-black text-[15px]">Add New Address</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* New Address Modal */}
            <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
                <View className="flex-1 justify-end bg-slate-900/40">
                    <View className="bg-white rounded-t-[32px] p-6 pb-10">
                        <View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                        
                        <View className="mb-6">
                            <Text className="text-[20px] font-black text-slate-900 mb-1">Add Delivery Address</Text>
                            <Text className="text-[13px] font-medium text-slate-500">We need your location for fast delivery</Text>
                        </View>

                        {/* GPS Fetch Button */}
                        <TouchableOpacity 
                            onPress={handleGetLocation}
                            disabled={locating}
                            className={`flex-row items-center justify-center p-4 rounded-2xl mb-6 border ${
                                newGps ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                            }`}
                        >
                            {locating ? (
                                <ActivityIndicator size="small" color="#10b981" />
                            ) : (
                                <>
                                    <Navigation size={18} color={newGps ? "#10b981" : "#3b82f6"} className="mr-2" />
                                    <Text className={`font-black text-[15px] ${newGps ? 'text-emerald-700' : 'text-blue-600'}`}>
                                        {newGps ? 'Location Fetched Successfully ✅' : '📍 Get Current GPS Location'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Complete Address</Text>
                        <TextInput 
                            value={newAddressText}
                            onChangeText={setNewAddressText}
                            placeholder="House No., Building Name, Landmark"
                            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[15px] font-medium text-slate-900 mb-4"
                            multiline
                            style={{ height: 80, textAlignVertical: 'top' }}
                        />

                        {/* Save Address Option */}
                        <TouchableOpacity 
                            onPress={() => setShouldSave(!shouldSave)}
                            className="flex-row items-center mb-4 pl-1"
                        >
                            <View className={`w-5 h-5 rounded border items-center justify-center mr-3 ${shouldSave ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}>
                                {shouldSave && <Text className="text-white text-[12px]">✓</Text>}
                            </View>
                            <Text className="text-slate-700 text-[14px] font-medium">Save this address for next time</Text>
                        </TouchableOpacity>

                        {shouldSave && (
                            <View>
                                <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Save As</Text>
                                <View className="flex-row gap-3 mb-6">
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
                            </View>
                        )}

                        <TouchableOpacity 
                            onPress={handleSaveNewAddress}
                            disabled={saving || !newAddressText.trim() || !newGps}
                            className="w-full py-4 rounded-2xl items-center shadow-sm"
                            style={{ backgroundColor: (saving || !newAddressText.trim() || !newGps) ? '#e2e8f0' : '#0f172a' }}
                        >
                            <Text 
                                className="text-[15px] font-black"
                                style={{ color: (saving || !newAddressText.trim() || !newGps) ? '#94a3b8' : '#ffffff' }}
                            >
                                {saving ? 'Processing...' : 'Proceed to Checkout'}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => setShowModal(false)}
                            className="mt-4 py-2 items-center"
                        >
                            <Text className="text-slate-400 text-[13px] font-bold">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default CartLocation;
