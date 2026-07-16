import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';

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
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', paddingHorizontal: 16 }}>
                <View className="bg-white rounded-3xl p-6 max-w-sm w-full items-center shadow-lg border border-slate-200">
                    {confirmAction?.newStatus === 'delivered' && (
                        <View className="w-full mb-6 mt-2">
                            <Text className="text-[12px] font-bold text-center text-slate-500 uppercase tracking-widest mb-4">Customer PIN</Text>
                            <TextInput
                                keyboardType="numeric"
                                maxLength={4}
                                placeholder="••••"
                                value={deliveryOtp}
                                onChangeText={(val) => setDeliveryOtp(val.replace(/\D/g, ''))}
                                className="w-full text-center text-4xl font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl py-4 focus:border-slate-400 tracking-[0.4em]"
                            />
                        </View>
                    )}
                    {(!confirmAction || confirmAction.newStatus !== 'delivered') && (
                        <View className="items-center mb-6 mt-2">
                            <Text className="text-xl font-bold text-slate-900 mb-2">Are you sure?</Text>
                            <Text className="text-[13px] font-medium text-slate-500 text-center px-4">Update the status of this order.</Text>
                        </View>
                    )}

                    <View className="flex-row gap-3 w-full">
                        <TouchableOpacity onPress={onClose} className="flex-1 py-3.5 bg-slate-50 border border-slate-200 rounded-xl items-center">
                            <Text className="text-slate-600 text-[13px] font-bold">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} className="flex-1 py-3.5 bg-slate-900 rounded-xl items-center shadow-sm">
                            <Text className="text-white text-[13px] font-bold">
                                {confirmAction?.newStatus === 'delivered' ? 'Verify' : 'Confirm'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default React.memo(VendorConfirmationModal);
