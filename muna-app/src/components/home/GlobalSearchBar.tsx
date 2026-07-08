import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const GlobalSearchBar: React.FC = () => {
  const router = useRouter();

  return (
    <View className="px-4 pb-4 mt-2">
      <Pressable
        onPress={() => router.push('/search')}
        className="w-full max-w-2xl mx-auto bg-white border border-slate-200 shadow-sm rounded-[14px] px-4 py-3.5 flex-row items-center gap-3">
        <Search size={18} color="#94a3b8" />
        <Text className="text-[13px] font-bold text-slate-400">Search for "Atta, Dal, Coke"</Text>
      </Pressable>
    </View>
  );
};

export default memo(GlobalSearchBar);
