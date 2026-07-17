import React, { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { MapPin, Navigation, X, Store } from 'lucide-react-native';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGPS: () => void;
  onSelectLocation: (location: { lat: number; lng: number; label: string }) => void;
  shops: any[];
}

export default function LocationPickerModal({
  visible,
  onClose,
  onSelectGPS,
  onSelectLocation,
  shops,
}: LocationPickerModalProps) {

  // Extract unique locations from shops
  const demoLocations = useMemo(() => {
    if (!shops || shops.length === 0) return [];
    
    const uniqueMap = new Map();
    
    shops.forEach(shop => {
      if (shop.location?.coordinates && shop.address) {
        // Simple extraction: use the full address or just a short version
        const lat = shop.location.coordinates[1];
        const lng = shop.location.coordinates[0];
        
        // We use the address string as the unique key to prevent duplicates in the same building
        // But to make it look clean, we format the label
        let label = shop.address;
        const addressParts = shop.address.split(',');
        if (addressParts.length > 2) {
          // Get the last two meaningful parts (e.g., City, State)
          label = addressParts.slice(-2).join(',').trim();
        }

        const key = label.toLowerCase();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, { lat, lng, label });
        }
      }
    });
    
    return Array.from(uniqueMap.values()).slice(0, 5); // Limit to top 5 unique areas
  }, [shops]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable 
          className="bg-white rounded-t-[32px] pt-4 pb-10 px-6 max-h-[80%]"
          onPress={(e) => e.stopPropagation()} // Prevent closing when tapping inside
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-[20px] font-black text-slate-900">Select Location</Text>
            <TouchableOpacity onPress={onClose} className="bg-slate-100 p-2 rounded-full">
              <X size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* GPS Option */}
            <TouchableOpacity 
              className="flex-row items-center p-4 bg-amber-50 rounded-2xl mb-6 border border-amber-100"
              onPress={() => {
                onSelectGPS();
                onClose();
              }}
            >
              <View className="w-10 h-10 bg-amber-500 rounded-full items-center justify-center mr-4">
                <Navigation size={18} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-extrabold text-amber-950">Use Current Location</Text>
                <Text className="text-[12px] font-medium text-amber-700 mt-0.5">Using GPS</Text>
              </View>
            </TouchableOpacity>

            {/* Explore Mode */}
            {demoLocations.length > 0 && (
              <View>
                <Text className="text-[14px] font-bold text-slate-400 mb-3 ml-1 uppercase tracking-wider">
                  Explore Active Areas
                </Text>
                
                <View className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                  {demoLocations.map((loc, index) => (
                    <TouchableOpacity
                      key={index}
                      className={`flex-row items-center p-4 ${index !== demoLocations.length - 1 ? 'border-b border-slate-200/60' : ''}`}
                      onPress={() => {
                        onSelectLocation(loc);
                        onClose();
                      }}
                    >
                      <View className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mr-4">
                        <Store size={18} color="#0f172a" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold text-slate-900" numberOfLines={1}>
                          {loc.label}
                        </Text>
                        <Text className="text-[12px] font-medium text-slate-500 mt-0.5">
                          MUNA is active here
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
