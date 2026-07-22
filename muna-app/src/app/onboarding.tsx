// @ts-nocheck
import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    logo: true,
    title: 'Apne Gaon Ki Dukaan,\nAb Online!',
    titleColor: '#166534',
    subtitle: '',
    subtitleColor: '#16a34a',
    description: 'MUNA aapko aapke local shops se jodta hai. Ghar baithe order karein aur tez delivery paayein.',
    image: require('../../assets/images/onboarding1.png'),
  },
  {
    id: 2,
    logo: false,
    title: 'MUNA Daily Market',
    titleColor: '#1e293b',
    subtitle: 'Bechein Apne Paas,\nKamaiye Aasaan!',
    subtitleColor: '#16a34a',
    description: 'Aap bhi bina vendor bane apne location ke aas paas saman bech sakte hain. Jo bechna ho, post karo aur buyers se connect karo.',
    image: require('../../assets/images/onboarding2.png'),
  },
  {
    id: 3,
    logo: false,
    title: 'Vendor Banna Hai?',
    titleColor: '#1e293b',
    subtitle: 'Profile Se Apply Karein!',
    subtitleColor: '#16a34a',
    description: 'Agar aap regular seller hain, toh apni shop ko vendor bana kar MUNA par grow karein. Profile page par \'Become Vendor\' se apply karein.',
    image: require('../../assets/images/onboarding3.png'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (activeIndex + 1), animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/login');
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        className="flex-1"
      >
        {SLIDES.map((slide, index) => (
          <View key={slide.id} style={{ width }} className="flex-1">
            {/* Top: Text Content (Vector & Crisp) */}
            <View className="px-7 pt-12 pb-2 items-center">
              {/* Logo row for first slide */}
              {slide.logo && (
                <View className="items-center mb-6">
                  <View className="flex-row items-center gap-3 mb-4">
                    <View className="w-12 h-12 bg-amber-400 rounded-2xl items-center justify-center overflow-hidden" style={{ elevation: 2 }}>
                      <Image
                        source={require('../../assets/images/icon.png')}
                        style={{ width: 42, height: 42 }}
                        contentFit="contain"
                      />
                    </View>
                    <View>
                      <Text className="text-[24px] font-black text-slate-900 tracking-tight">MUNA</Text>
                      <Text className="text-[10px] font-bold text-green-700 uppercase tracking-[2px]">Delivery in minutes</Text>
                    </View>
                  </View>
                  <Text className="text-[18px] font-bold text-green-700 mb-1">Your Local Shops. Online.</Text>
                  <Text className="text-[15px] text-center font-medium text-slate-500 leading-[22px] px-4">
                    Order from trusted local shops and get fast delivery at your doorstep.
                  </Text>
                </View>
              )}

              {/* Title (for slide 2 & 3, or customized slide 1) */}
              {!slide.logo && (
                <>
                  <Text className="text-[26px] font-black text-center leading-[32px] mb-1" style={{ color: slide.titleColor }}>
                    {slide.title}
                  </Text>

                  {/* Accent Subtitle */}
                  {slide.subtitle ? (
                    <Text className="text-[22px] font-bold text-center leading-[28px] mb-4" style={{ color: slide.subtitleColor }}>
                      {slide.subtitle}
                    </Text>
                  ) : null}

                  {/* Description */}
                  <Text className="text-[15px] font-medium text-center text-slate-500 leading-[22px] px-2">
                    {slide.description}
                  </Text>
                </>
              )}
            </View>

            {/* Bottom: Mockup Illustration */}
            <View className="flex-1 items-center justify-end px-4 pb-0 -mb-6 relative">
              <View className="w-full h-[95%] items-center justify-start rounded-t-[40px] overflow-hidden">
                <Image
                  source={slide.image}
                  style={{ width: '100%', height: '100%', transform: [{ scale: 1.15 }, { translateY: 40 }] }}
                  contentFit="cover"
                  contentPosition="top"
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Controls */}
      <View className="px-7 pb-6" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
        {/* Dot Indicators + Skip/Next */}
        <View className="flex-row items-center justify-between">
          {/* Dots */}
          <View className="flex-row items-center gap-2">
            {SLIDES.map((_, i) => (
              <View
                key={i}
                className="h-2.5 rounded-full"
                style={{
                  width: activeIndex === i ? 24 : 10,
                  backgroundColor: activeIndex === i ? '#16a34a' : '#d1d5db',
                }}
              />
            ))}
          </View>

          {/* Next / Get Started Button */}
          <Pressable
            onPress={handleNext}
            className="px-7 py-3 rounded-full items-center justify-center active:opacity-80"
            style={{ backgroundColor: '#16a34a', elevation: 3 }}
          >
            <Text className="text-[13px] font-black text-white tracking-wider uppercase">
              {isLastSlide ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>
        </View>

        {/* Skip text */}
        {!isLastSlide && (
          <Pressable onPress={handleSkip} className="mt-4 items-center active:opacity-60">
            <Text className="text-[12px] font-bold text-slate-400 tracking-wider uppercase">Skip</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
