import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';

interface VendorConfirmationModalProps {
    confirmAction: { orderId: string, newStatus: string } | null;
    deliveryOtp: string;
    setDeliveryOtp: (otp: string) => void;
    handleConfirm: () => void;
    onClose: () => void;
}

const VendorConfirmationModal: React.FC<VendorConfirmationModalProps> = ({
    confirmAction,
    deliveryOtp,
    setDeliveryOtp,
    handleConfirm,
    onClose
}) => {
    return (
        <Modal
            visible={!!confirmAction}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', paddingHorizontal: 16 }}
            >
                <View className="bg-white rounded-[32px] p-6 max-w-sm w-full items-center shadow-2xl">
                    {confirmAction?.newStatus === 'delivered' && (
                        <View className="w-full mb-6 mt-4">
                            <Text className="text-[12px] font-black text-center text-amber-600 uppercase tracking-widest mb-3">Ask Customer for PIN</Text>
                            <TextInput
                                keyboardType="numeric"
                                maxLength={4}
                                placeholder="••••"
                                value={deliveryOtp}
                                onChangeText={(val) => setDeliveryOtp(val.replace(/\D/g, ''))}
                                className="w-full text-center text-4xl font-black text-slate-800 bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 focus:border-amber-400 tracking-[0.4em]"
                            />
                        </View>
                    )}
                    {(!confirmAction || confirmAction.newStatus !== 'delivered') && (
                        <View className="items-center mb-6 mt-4">
                            <Text className="text-xl font-black text-slate-900 mb-2">Are you sure?</Text>
                            <Text className="text-[13px] font-semibold text-slate-500 text-center px-4">Update the status of this order.</Text>
                        </View>
                    )}

                    <View className="flex-row gap-3 w-full">
                        <TouchableOpacity onPress={onClose} className="flex-1 py-3.5 bg-slate-100 rounded-2xl items-center">
                            <Text className="text-slate-600 text-[13px] font-black">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} className="flex-1 py-3.5 bg-emerald-500 rounded-2xl items-center shadow-sm">
                            <Text className="text-white text-[13px] font-black">
                                {confirmAction?.newStatus === 'delivered' ? 'Verify' : 'Confirm'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default React.memo(VendorConfirmationModal);
