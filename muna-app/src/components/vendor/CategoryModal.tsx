import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { ImageIcon } from 'lucide-react-native';
import { getImageUrl } from '@/utils/format';

interface CategoryModalProps {
    catModal: any;
    setCatModal: (val: any) => void;
    catName: string;
    setCatName: (name: string) => void;
    catImage: any;
    pickCatImage: () => void;
    catSaving: boolean;
    saveCat: () => void;
    deleteCat: (cat: any) => void;
}

export default function CategoryModal({
    catModal, setCatModal, catName, setCatName, catImage, pickCatImage, catSaving, saveCat, deleteCat
}: CategoryModalProps) {
    return (
        <Modal visible={!!catModal} transparent animationType="slide" onRequestClose={() => setCatModal(null)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-slate-900/40">
                <View className="bg-white rounded-t-[32px] p-6 pb-10 max-h-[80%]">
                    <View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-black text-slate-900">{catModal && catModal !== 'add' ? 'Edit Category' : 'New Category'}</Text>
                        <TouchableOpacity onPress={() => setCatModal(null)} className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center">
                            <Text className="text-slate-500 font-bold">✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category Name</Text>
                        <TextInput 
                            value={catName} 
                            onChangeText={setCatName} 
                            placeholder="Enter name" 
                            className="bg-slate-50 p-4 rounded-2xl text-[15px] font-bold text-slate-900 mb-4 border border-slate-100 focus:border-amber-400" 
                        />
                        
                        <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Icon/Image (Optional)</Text>
                        <TouchableOpacity onPress={pickCatImage} className="bg-amber-50 border border-amber-100 p-4 rounded-2xl items-center flex-row justify-center gap-2 mb-4">
                            <ImageIcon size={20} color="#d97706" />
                            <Text className="text-amber-800 font-black text-[13px]">Select Image</Text>
                        </TouchableOpacity>
                        {(catImage?.uri || (catModal && catModal !== 'add' && catModal?.image)) && (
                            <Image 
                                source={{ uri: catImage?.uri || getImageUrl(catModal?.image) }} 
                                style={{ width: 100, height: 100, borderRadius: 16, marginBottom: 16, alignSelf: 'center' }} 
                                contentFit="cover" 
                            />
                        )}
                    </ScrollView>
                    <View className="flex-row gap-3 pt-2">
                        {catModal && catModal !== 'add' && (
                            <TouchableOpacity onPress={() => { setCatModal(null); deleteCat(catModal); }} className="py-4 px-6 bg-rose-50 rounded-2xl items-center">
                                <Text className="text-rose-600 text-[14px] font-black">Delete</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={saveCat} disabled={catSaving || !catName.trim()} className={`flex-1 py-4 bg-amber-400 rounded-2xl items-center ${catSaving || !catName.trim() ? 'opacity-50' : ''}`}>
                            <Text className="text-amber-950 text-[14px] font-black">{catSaving ? 'Saving...' : 'Save Category'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
