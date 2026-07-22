import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    return (
        <RNModal
            visible={isOpen}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-slate-900/40">
                <TouchableWithoutFeedback onPress={onClose}>
                    <View className="absolute inset-0" />
                </TouchableWithoutFeedback>

                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="w-full bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[85%]"
                >
                    {/* Drag Handle */}
                    <View className="w-full items-center pt-3 pb-1">
                        <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
                    </View>

                    {/* Header */}
                    <View className="px-6 py-4 border-b border-slate-100 flex-row items-center justify-between">
                        <Text className="text-xl font-black text-slate-800 tracking-tight">{title}</Text>
                        <TouchableOpacity 
                            onPress={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                        >
                            <X size={18} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <ScrollView className="p-6" bounces={false} showsVerticalScrollIndicator={false}>
                        {children}
                        {/* Extra padding at bottom for scroll safety */}
                        <View className="h-10" />
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </RNModal>
    );
};

export default Modal;
