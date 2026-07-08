import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { MapPin, Navigation } from 'lucide-react-native';

interface CartLocationProps {
    onLocationDetermined: (lat: number, lng: number) => void;
    locationReady: boolean;
}

const CartLocation: React.FC<CartLocationProps> = ({ onLocationDetermined, locationReady }) => {
    const [locating, setLocating] = useState(false);

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
            onLocationDetermined(location.coords.latitude, location.coords.longitude);
        } catch (error) {
            console.error('Location error', error);
            Alert.alert('Location Error', 'Could not fetch location. Please try again.');
        } finally {
            setLocating(false);
        }
    };

    return (
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
                <MapPin size={18} color="#0f172a" />
                <Text className="text-[16px] font-black text-slate-900">Delivery Address</Text>
            </View>

            {locationReady ? (
                <View className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center">
                        <Text className="text-[12px]">✅</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-[13px] font-bold text-emerald-900 leading-tight">Location Confirmed</Text>
                        <Text className="text-[11px] font-semibold text-emerald-700 mt-0.5">Delivery fee calculated</Text>
                    </View>
                </View>
            ) : (
                <View>
                    <Text className="text-[13px] font-medium text-slate-500 mb-4 leading-relaxed">
                        We need your location to confirm delivery availability and calculate fee.
                    </Text>
                    <TouchableOpacity 
                        onPress={handleGetLocation}
                        disabled={locating}
                        className="bg-amber-400 h-12 rounded-xl flex-row items-center justify-center shadow-sm"
                    >
                        {locating ? (
                            <ActivityIndicator size="small" color="#451a03" />
                        ) : (
                            <>
                                <Navigation size={16} color="#451a03" className="mr-2" />
                                <Text className="text-amber-950 font-black text-[14px]">Use Current Location</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default CartLocation;
