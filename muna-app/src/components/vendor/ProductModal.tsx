import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { Image } from 'expo-image';
import { getImageUrl } from '@/utils/format';
import { ImageIcon } from 'lucide-react-native';

interface ProductModalProps {
    prodModal: any;
    setProdModal: (val: any) => void;
    prodName: string;
    setProdName: (val: string) => void;
    prodQuantity: string;
    setProdQuantity: (val: string) => void;
    prodPrice: string;
    setProdPrice: (val: string) => void;
    prodCatId: string;
    setProdCatId: (val: string) => void;
    categories: any[];
    pickProdImage: () => void;
    prodImage: any;
    prodInStock: boolean;
    setProdInStock: (val: boolean) => void;
    saveProd: () => void;
    prodSaving: boolean;
}

export default function ProductModal({
    prodModal, setProdModal, prodName, setProdName, prodQuantity, setProdQuantity,
    prodPrice, setProdPrice, prodCatId, setProdCatId, categories, pickProdImage,
    prodImage, prodInStock, setProdInStock, saveProd, prodSaving
}: ProductModalProps) {
    return (
        <Modal visible={!!prodModal} transparent animationType="slide" onRequestClose={() => setProdModal(null)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-slate-900/40">
                <View className="bg-white rounded-t-[32px] p-6 pb-10 h-[90%]">
                    <View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-black text-slate-900">{prodModal && prodModal !== 'add' ? 'Edit Item' : 'Add Item'}</Text>
                        <TouchableOpacity onPress={() => setProdModal(null)} className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center">
                            <Text className="text-slate-500 font-bold">✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Item Name</Text>
                        <TextInput 
                            value={prodName} 
                            onChangeText={setProdName} 
                            placeholder="E.g., Fresh Apples" 
                            className="bg-slate-50 p-4 rounded-2xl text-[15px] font-bold text-slate-900 mb-4 border border-slate-100 focus:border-amber-400" 
                        />
                        
                        <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Quantity/Unit</Text>
                        <TextInput 
                            value={prodQuantity} 
                            onChangeText={setProdQuantity} 
                            placeholder="E.g., 1 Kg" 
                            className="bg-slate-50 p-4 rounded-2xl text-[15px] font-bold text-slate-900 mb-4 border border-slate-100 focus:border-amber-400" 
                        />
                        
                        <View className="flex-row gap-3 mb-4">
                            <View className="flex-1">
                                <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Price (₹)</Text>
                                <TextInput 
                                    value={prodPrice} 
                                    onChangeText={setProdPrice} 
                                    keyboardType="numeric" 
                                    placeholder="0" 
                                    className="bg-slate-50 p-4 rounded-2xl text-[15px] font-bold text-slate-900 border border-slate-100 focus:border-amber-400" 
                                />
                            </View>
                            <View className="flex-[1.5]">
                                <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row bg-slate-50 border border-slate-100 rounded-2xl p-1" contentContainerStyle={{alignItems: 'center'}}>
                                    {categories.map((c: any) => (
                                        <TouchableOpacity 
                                            key={c._id} 
                                            onPress={() => setProdCatId(c._id)}
                                            className={`px-3 py-2 rounded-xl mr-1 ${prodCatId === c._id ? 'bg-amber-400' : 'bg-transparent'}`}
                                        >
                                            <Text className={`text-[12px] font-bold ${prodCatId === c._id ? 'text-amber-950' : 'text-slate-500'}`}>{c.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Main Photo</Text>
                        <TouchableOpacity onPress={pickProdImage} className="bg-amber-50 border border-amber-100 p-4 rounded-2xl items-center flex-row justify-center gap-2 mb-4">
                            <ImageIcon size={20} color="#d97706" />
                            <Text className="text-amber-800 font-black text-[13px]">Select Photo</Text>
                        </TouchableOpacity>
                        {(prodImage?.uri || (prodModal && prodModal !== 'add' && prodModal.image)) && (
                            <Image 
                                source={{ uri: prodImage?.uri || getImageUrl(prodModal.image) }} 
                                style={{ width: 100, height: 100, borderRadius: 16, marginBottom: 16, alignSelf: 'center' }} 
                                contentFit="contain" 
                            />
                        )}
                        
                        <View className="flex-row items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
                            <View>
                                <Text className="text-[14px] font-black text-slate-900">In Stock</Text>
                                <Text className="text-[11px] font-semibold text-slate-500 mt-0.5">Show this item to customers</Text>
                            </View>
                            <Switch value={prodInStock} onValueChange={setProdInStock} trackColor={{ true: '#fbbf24', false: '#cbd5e1' }} />
                        </View>
                    </ScrollView>
                    <View className="pt-2">
                        <TouchableOpacity onPress={saveProd} disabled={prodSaving || !prodName.trim() || !prodPrice} className={`w-full py-4 bg-amber-400 rounded-2xl items-center ${prodSaving || !prodName.trim() || !prodPrice ? 'opacity-50' : ''}`}>
                            <Text className="text-amber-950 text-[14px] font-black">{prodSaving ? 'Saving...' : 'Save Item'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
