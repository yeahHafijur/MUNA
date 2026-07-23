import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Store, UploadCloud, Mail, Phone, User, Clock, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import api from '@/api/api';

export default function VendorRequestScreen() {
    const router = useRouter();
    
    // Vendor Details
    const [name, setName] = useState('');
    const [vendorEmail, setVendorEmail] = useState('');
    const [phone, setPhone] = useState('');
    
    // Shop Details
    const [shopName, setShopName] = useState('');
    const [address, setAddress] = useState('');
    const [udyamNumber, setUdyamNumber] = useState('');
    const [openTime, setOpenTime] = useState('09:00');
    const [closeTime, setCloseTime] = useState('21:00');
    
    // Location Data (Background fetch)
    const [shopLat, setShopLat] = useState<number | null>(null);
    const [shopLng, setShopLng] = useState<number | null>(null);

    // Image Data
    const [image, setImage] = useState<string | null>(null);

    // Categories
    const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<{id: string, name: string} | null>(null);

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const initForm = async () => {
            try {
                // Fetch Categories
                const res = await api.get('/api/shop-categories');
                setCategories(res.data || []);

                // Silently fetch GPS location if possible
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    setShopLat(loc.coords.latitude);
                    setShopLng(loc.coords.longitude);
                }
            } catch (err) {
                console.log("Initialization error:", err);
            } finally {
                setPageLoading(false);
            }
        };
        initForm();
    }, []);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim() || !vendorEmail.trim() || !phone.trim()) {
            Alert.alert("Missing Fields", "Please fill in all owner details.");
            return;
        }
        if (!shopName.trim() || !address.trim() || !selectedCategory) {
            Alert.alert("Missing Fields", "Please provide Shop Name, Address, and select a Category.");
            return;
        }
        if (phone.trim().length < 10) {
            Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('vendorEmail', vendorEmail.trim());
            formData.append('phone', phone.trim());
            formData.append('shopName', shopName.trim());
            formData.append('address', address.trim());
            formData.append('shopCategoryId', selectedCategory.id);
            formData.append('shopCategory', selectedCategory.name);
            formData.append('udyamNumber', udyamNumber.trim());
            formData.append('openTime', openTime);
            formData.append('closeTime', closeTime);
            
            if (shopLat !== null && shopLng !== null) {
                formData.append('shopLat', shopLat.toString());
                formData.append('shopLng', shopLng.toString());
            }

            if (image) {
                const filename = image.split('/').pop() || 'photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;
                formData.append('image', { uri: image, name: filename, type } as any);
            }

            await api.post('/api/vendor-requests', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            Alert.alert(
                "Request Submitted!", 
                "Our team will contact you shortly regarding your shop setup.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to submit request.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <View className="flex-1 bg-slate-50 items-center justify-center">
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-4 shadow-sm flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-[18px] font-black text-slate-900">Become a Vendor</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 mb-6 items-center">
                    <View className="w-16 h-16 bg-emerald-100 rounded-full items-center justify-center mb-3">
                        <Store size={32} color="#059669" />
                    </View>
                    <Text className="text-[18px] font-black text-emerald-900 mb-2">Sell on MUNA</Text>
                    <Text className="text-[13px] font-medium text-emerald-700 text-center leading-relaxed">
                        Provide your details below. We'll set up your shop for you!
                    </Text>
                </View>

                {/* Owner Details */}
                <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-5">
                    <Text className="text-[15px] font-black text-slate-900 mb-5">Owner Details</Text>
                    <View className="gap-4">
                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Full Name *</Text>
                            <View className="bg-slate-50 border border-slate-200 rounded-xl flex-row items-center px-4 h-12">
                                <User size={18} color="#94a3b8" className="mr-2" />
                                <TextInput 
                                    className="flex-1 text-[15px] font-medium text-slate-900"
                                    placeholder="Your full name"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>
                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Email Address *</Text>
                            <View className="bg-slate-50 border border-slate-200 rounded-xl flex-row items-center px-4 h-12">
                                <Mail size={18} color="#94a3b8" className="mr-2" />
                                <TextInput 
                                    className="flex-1 text-[15px] font-medium text-slate-900"
                                    placeholder="Google Email (e.g. name@gmail.com)"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={vendorEmail}
                                    onChangeText={setVendorEmail}
                                />
                            </View>
                        </View>
                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Phone Number *</Text>
                            <View className="bg-slate-50 border border-slate-200 rounded-xl flex-row items-center px-4 h-12">
                                <Phone size={18} color="#94a3b8" className="mr-2" />
                                <TextInput 
                                    className="flex-1 text-[15px] font-medium text-slate-900"
                                    placeholder="10-digit mobile number"
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Shop Details */}
                <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-8">
                    <Text className="text-[15px] font-black text-slate-900 mb-5">Shop Details</Text>
                    
                    <View className="gap-4">
                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Shop Name *</Text>
                            <View className="bg-slate-50 border border-slate-200 rounded-xl flex-row items-center px-4 h-12">
                                <Store size={18} color="#94a3b8" className="mr-2" />
                                <TextInput 
                                    className="flex-1 text-[15px] font-medium text-slate-900"
                                    placeholder="E.g. Sharma Kirana Store"
                                    value={shopName}
                                    onChangeText={setShopName}
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Shop Category *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 flex-row">
                                {categories.map(cat => (
                                    <TouchableOpacity 
                                        key={cat._id}
                                        onPress={() => setSelectedCategory({ id: cat._id, name: cat.name })}
                                        className={`px-4 py-2 rounded-full mr-2 border ${
                                            selectedCategory?.id === cat._id 
                                            ? 'bg-amber-100 border-amber-400' 
                                            : 'bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        <Text className={`text-[13px] font-bold ${
                                            selectedCategory?.id === cat._id 
                                            ? 'text-amber-700' 
                                            : 'text-slate-600'
                                        }`}>
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Shop Address *</Text>
                            <View className="bg-slate-50 border border-slate-200 rounded-xl flex-row px-4 py-3">
                                <MapPin size={18} color="#94a3b8" className="mr-2 mt-0.5" />
                                <TextInput 
                                    className="flex-1 text-[15px] font-medium text-slate-900"
                                    placeholder="Complete shop address"
                                    multiline
                                    numberOfLines={3}
                                    style={{ height: 60, textAlignVertical: 'top' }}
                                    value={address}
                                    onChangeText={setAddress}
                                />
                            </View>
                        </View>

                        <View className="flex-row gap-3 mt-1">
                            <View className="flex-1">
                                <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Opening Time</Text>
                                <View className="bg-slate-50 border border-slate-200 rounded-xl flex-row items-center px-4 h-12">
                                    <Clock size={16} color="#94a3b8" className="mr-2" />
                                    <TextInput 
                                        className="flex-1 text-[15px] font-medium text-slate-900"
                                        placeholder="09:00"
                                        value={openTime}
                                        onChangeText={setOpenTime}
                                    />
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Closing Time</Text>
                                <View className="bg-slate-50 border border-slate-200 rounded-xl flex-row items-center px-4 h-12">
                                    <Clock size={16} color="#94a3b8" className="mr-2" />
                                    <TextInput 
                                        className="flex-1 text-[15px] font-medium text-slate-900"
                                        placeholder="21:00"
                                        value={closeTime}
                                        onChangeText={setCloseTime}
                                    />
                                </View>
                            </View>
                        </View>

                        <View className="mt-1">
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Udyam Number (Optional)</Text>
                            <TextInput 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-[15px] font-medium text-slate-900"
                                placeholder="E.g. UDYAM-XX-00-0000000"
                                value={udyamNumber}
                                onChangeText={setUdyamNumber}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View className="mt-1">
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Shop Photo (Optional)</Text>
                            <TouchableOpacity onPress={pickImage} className="bg-slate-50 border-2 border-dashed border-emerald-200 rounded-xl p-6 items-center justify-center overflow-hidden min-h-[140px]">
                                {image ? (
                                    <View className="absolute inset-0">
                                        <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                        <View className="absolute inset-0 bg-black/40 items-center justify-center">
                                            <Text className="text-white font-bold text-[13px]">Change Photo</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <UploadCloud size={24} color="#10b981" className="mb-2" />
                                        <Text className="text-[13px] font-bold text-slate-600 mb-1">Tap to upload a photo</Text>
                                        <Text className="text-[11px] font-medium text-slate-400">Clear photo helps customers find you</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            onPress={handleSubmit}
                            disabled={loading}
                            className={`h-14 rounded-xl flex-row items-center justify-center shadow-sm mt-4 ${loading ? 'bg-emerald-400' : 'bg-emerald-600'}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text className="text-white font-black text-[15px]">Submit Request</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View className="h-10" />
            </ScrollView>
        </View>
    );
}
