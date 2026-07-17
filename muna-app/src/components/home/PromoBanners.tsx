import React, { memo, useState } from 'react';
import { ScrollView, Text, View, Pressable, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';

interface PromoBannersProps {
  banners?: any[];
}

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32; // 16px padding on each side
const BANNER_HEIGHT = BANNER_WIDTH * 0.48; // Beautiful wide aspect ratio

const PromoBanners: React.FC<PromoBannersProps> = ({ banners }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    // Calculate current index (width + gap = BANNER_WIDTH + 14)
    const index = Math.round(scrollPosition / (BANNER_WIDTH + 14));
    setActiveIndex(index);
  };

  return (
    <View className="px-4 pt-5 pb-1">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3.5 pb-2"
        snapToInterval={BANNER_WIDTH + 14} // width + gap
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {banners && banners.length > 0 ? (
          banners.map((b, idx) => (
            <Pressable
              key={b._id}
              onPress={() => {
                if (b.link) Linking.openURL(b.link);
              }}
              style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
              className="rounded-[20px] overflow-hidden shadow-sm relative bg-slate-100">
              <Image source={{ uri: b.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            </Pressable>
          ))
        ) : (
          <View style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }} className="rounded-[20px] bg-slate-100 shadow-sm" />
        )}
      </ScrollView>

      {/* Scroll Indicators */}
      {banners && banners.length > 1 && (
        <View className="flex-row items-center justify-center gap-1.5 mt-3.5">
          {banners.map((_, i) => (
            <View
              key={i}
              className={`rounded-full transition-all duration-300 ${
                activeIndex === i ? 'w-5 h-1.5 bg-amber-500' : 'w-1.5 h-1.5 bg-slate-300'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default memo(PromoBanners);
