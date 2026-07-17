import React, { memo } from 'react';
import { Pressable, Text, View, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

const HomeFooter = () => {
  const router = useRouter();

  return (
    <View className="bg-slate-900 rounded-t-[32px] px-6 pt-8 pb-10 mt-2">
      {/* Brand */}
      <View className="flex-row items-center gap-3 mb-6">
        <View className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-md overflow-hidden">
          <Image source={require('../../../assets/images/icon.png')} style={{ width: 40, height: 40 }} contentFit="cover" />
        </View>
        <View>
          <Text className="text-[16px] font-black text-white tracking-tight">MUNA</Text>
          <Text className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Delivery in Minutes</Text>
        </View>
      </View>

      {/* Links Grid */}
      <View className="flex-row flex-wrap mb-8">
        <View className="w-1/2 gap-y-3 pr-2">
          <Pressable onPress={() => router.push('/profile')}>
            <Text className="text-[12px] font-bold text-slate-400">My Account</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/daily-market')}>
            <Text className="text-[12px] font-bold text-slate-400">Daily Market</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/privacy-policy')}>
            <Text className="text-[12px] font-bold text-slate-400">Privacy Policy</Text>
          </Pressable>
        </View>
        <View className="w-1/2 gap-y-3 pl-2">
          <Pressable onPress={() => router.push('/orders')}>
            <Text className="text-[12px] font-bold text-slate-400">My Orders</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/wishlist')}>
            <Text className="text-[12px] font-bold text-slate-400">Wishlist</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/settings')}>
            <Text className="text-[12px] font-bold text-slate-400">Settings</Text>
          </Pressable>
        </View>
      </View>

      {/* Divider */}
      <View className="h-px bg-slate-800 mb-5" />

      {/* Bottom */}
      <View className="items-center mb-8">
        <Text className="text-[14px] font-black text-slate-300 tracking-widest mb-1">M U N A</Text>
        <Text className="text-[11px] font-semibold text-slate-400">Proudly made in Assam ❤️</Text>
      </View>

      {/* App Download - Optional placeholder since this IS the app */}
      <View className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 flex-col items-center">
        <Text className="text-[14px] font-black text-white mb-1">Love the MUNA App?</Text>
        <Text className="text-[11px] font-medium text-slate-400 mb-4 text-center">Rate us on the Play Store</Text>
        <Pressable 
          onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=app.vercel.muna_opal.twa')}
          className="active:opacity-80"
        >
          <Image 
            source={{ uri: 'https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png' }} 
            style={{ height: 45, width: 150 }}
            contentFit="contain"
          />
        </Pressable>
      </View>
    </View>
  );
};

export default memo(HomeFooter);
