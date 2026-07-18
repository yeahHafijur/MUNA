import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const { colors, isDark } = useTheme();

    return (
        <RNModal
            visible={isOpen}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlayStrong }}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View className="absolute inset-0" />
                </TouchableWithoutFeedback>

                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="w-full rounded-t-3xl shadow-2xl overflow-hidden max-h-[85%]"
                    style={{ backgroundColor: colors.surface }}
                >
                    {/* Drag Handle */}
                    <View className="w-full items-center pt-3 pb-1">
                        <View className="w-12 h-1.5 rounded-full" style={{ backgroundColor: colors.borderStrong }} />
                    </View>

                    {/* Header */}
                    <View className="px-6 py-4 border-b flex-row items-center justify-between" style={{ borderBottomColor: colors.border }}>
                        <Text className="text-xl font-black tracking-tight" style={{ color: colors.primaryText }}>{title}</Text>
                        <TouchableOpacity 
                            onPress={onClose}
                            className="w-8 h-8 rounded-full items-center justify-center"
                            style={{ backgroundColor: isDark ? colors.elevated : colors.background }}
                        >
                            <X size={18} color={colors.icon} />
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
