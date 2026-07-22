import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, X } from 'lucide-react-native';
import api from '@/api/api';

export default function PostAdScreen() {
    const router = useRouter();
    
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5, // compress
        });

        if (!result.canceled && result.assets[0].uri) {
            setImages([...images, result.assets[0].uri]);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handlePostAd = async () => {
        if (!title.trim() || !price.trim() || !description.trim()) {
            Alert.alert('Missing Fields', 'Please fill in all required fields (Title, Price, Description).');
            return;
        }

        setLoading(true);
        try {
            // For multipart/form-data upload
            const formData = new FormData();
            formData.append('title', title);
            formData.append('price', price);
            formData.append('description', description);
            if (address) formData.append('address', address);
            
            // Append images
            images.forEach((uri, index) => {
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;
                formData.append('images', { uri, name: filename, type } as any);
            });

            await api.post('/api/market', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Alert.alert('Success', 'Your ad has been posted successfully!', [
                { text: 'OK', onPress: () => router.replace('/daily-market' as any) }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to post ad');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-100 pt-12 px-4 pb-4 shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()} className="p-1">
                        <ArrowLeft size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-black text-slate-900">Post an Ad</Text>
                </View>
                <TouchableOpacity onPress={handlePostAd} disabled={loading} className="px-2 py-1">
                    {loading ? (
                        <ActivityIndicator size="small" color="#d97706" />
                    ) : (
                        <Text className="text-[15px] font-black text-amber-600">Post</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
                <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
                    <Text className="text-[15px] font-black text-slate-900 mb-5">Ad Details</Text>
                    
                    <View className="gap-4">
                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Title *</Text>
                            <TextInput 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-[15px] font-medium text-slate-900"
                                placeholder="What are you selling?"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>
                        
                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Price (₹) *</Text>
                            <TextInput 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-[15px] font-medium text-slate-900"
                                placeholder="e.g. 1500"
                                keyboardType="numeric"
                                value={price}
                                onChangeText={setPrice}
                            />
                        </View>

                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Description *</Text>
                            <TextInput 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] font-medium text-slate-900"
                                placeholder="Describe your item, condition, reason for selling..."
                                multiline
                                numberOfLines={4}
                                style={{ height: 100, textAlignVertical: 'top' }}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        <View>
                            <Text className="text-[12px] font-bold text-slate-500 mb-1.5 ml-1">Location (Optional)</Text>
                            <TextInput 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-[15px] font-medium text-slate-900"
                                placeholder="e.g. Near XYZ hospital"
                                value={address}
                                onChangeText={setAddress}
                            />
                        </View>
                    </View>
                </View>

                <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-8">
                    <Text className="text-[15px] font-black text-slate-900 mb-4">Photos</Text>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        {images.map((uri, index) => (
                            <View key={index} className="w-24 h-24 rounded-xl overflow-hidden mr-3 relative">
                                <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                                <TouchableOpacity 
                                    onPress={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-white/80 rounded-full w-6 h-6 items-center justify-center"
                                >
                                    <X size={14} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        
                        {images.length < 4 && (
                            <TouchableOpacity 
                                onPress={pickImage}
                                className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl items-center justify-center mr-3"
                            >
                                <Camera size={24} color="#94a3b8" className="mb-1" />
                                <Text className="text-[10px] font-bold text-slate-400">Add Photo</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                    <Text className="text-[10px] font-medium text-slate-400 mt-3 ml-1">
                        Upload up to 4 photos. First photo will be the cover.
                    </Text>
                </View>
                
                <View className="h-10" />
            </ScrollView>
        </View>
    );
}
