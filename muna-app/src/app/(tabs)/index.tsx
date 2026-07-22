import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import api from '@/api/api';
import HomeHeader from '@/components/home/HomeHeader';
import PromoBanners from '@/components/home/PromoBanners';
import DailyMarketBanner from '@/components/home/DailyMarketBanner';
import GlobalSearchBar from '@/components/home/GlobalSearchBar';
import ShopByCategory from '@/components/home/ShopByCategory';
import Bestsellers from '@/components/home/Bestsellers';
import StoreListing from '@/components/home/StoreListing';
import QuickDeliveryStores from '@/components/home/QuickDeliveryStores';
import BecomeSellerCTA from '@/components/home/BecomeSellerCTA';
import HowItWorks from '@/components/home/HowItWorks';
import HomeFooter from '@/components/home/HomeFooter';
import CuratedCollections from '@/components/home/CuratedCollections';
import { haversine } from '@/utils/homeUtils';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Navigation, ShoppingCart } from 'lucide-react-native';


type UserLocation = {
  lat: number;
  lng: number;
  label?: string;
};

const defaultCategories = [
  { name: 'All' },
  { name: 'Kirana & Grocery' },
  { name: 'Fruits & Vegetables' },
  { name: 'Dairy & Bakery' },
  { name: 'Meat & Fish' },
  { name: 'Pharmacy' },
  { name: 'Daily Market' },
];

import LocationPickerModal from '@/components/home/LocationPickerModal';
import AllCategoriesModal from '@/components/home/AllCategoriesModal';

export default function HomeScreen() {
  const router = useRouter();
  const { cartItems, getTotal } = useCart();
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchGPSLocation = useCallback(async () => {
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== 'granted') return;

      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 })) ||
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      if (!position) return;

      const baseLocation: UserLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      const addresses = await Location.reverseGeocodeAsync({
        latitude: baseLocation.lat,
        longitude: baseLocation.lng,
      });
      const address = addresses[0];
      const label = [address?.district || address?.city, address?.region].filter(Boolean).join(', ');

      setUserLocation({ ...baseLocation, label: label || 'Current location' });
    } catch {
      // The home remains fully usable when location is unavailable.
    }
  }, []);

  useEffect(() => {
    fetchGPSLocation();
  }, [fetchGPSLocation]);

  const {
    data: shops = [],
    isLoading: loadingShops,
    refetch: refetchShops,
  } = useQuery({
    queryKey: ['shops'],
    queryFn: async ({ signal }) => (await api.get('/api/shops', { signal })).data,
  });

  const { data: featuredProducts = [], refetch: refetchProducts } = useQuery({
    queryKey: ['featured-products', userLocation?.lat, userLocation?.lng],
    queryFn: async ({ signal }) => {
      const params = userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined;
      return (await api.get('/api/products/bestsellers', { params, signal })).data;
    },
  });

  const { data: dbCategories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['shop-categories'],
    queryFn: async ({ signal }) => (await api.get('/api/shop-categories', { signal })).data,
  });

  const { data: banners = [], refetch: refetchBanners } = useQuery({
    queryKey: ['banners'],
    queryFn: async ({ signal }) => (await api.get('/api/banners', { signal })).data,
  });

  const { data: activeOrder = null, refetch: refetchActiveOrder } = useQuery({
    queryKey: ['activeOrder'],
    queryFn: async ({ signal }) => {
      if (!user) return null;
      try {
        const res = await api.get('/api/orders/active', { signal });
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: !!user,
    refetchInterval: 30000 // Poll every 30s
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchShops(), refetchProducts(), refetchCategories(), refetchBanners(), refetchActiveOrder()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchShops, refetchProducts, refetchCategories, refetchBanners, refetchActiveOrder]);

  const categoryList = useMemo(() => {
    if (!dbCategories.length) return defaultCategories;
    const sorted = [...dbCategories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return [{ name: 'All' }, ...sorted.filter((category) => category.name !== 'All')];
  }, [dbCategories]);

  const sortedShops = useMemo(() => {
    const list = shops.map((shop: any) => {
      let distance = Number.isFinite(shop.distance) ? shop.distance : Infinity;
      const coordinates = shop.location?.coordinates;

      if (userLocation && coordinates?.length === 2) {
        distance = haversine(userLocation.lat, userLocation.lng, coordinates[1], coordinates[0]);
      }
      return { ...shop, distance };
    });

    return list
      .filter((shop: any) => {
        // HIDE SHOPS THAT ARE MORE THAN 25 KM AWAY
        if (shop.distance !== Infinity && shop.distance > 25) {
          return false;
        }

        if (activeCategory === 'All') return true;
        const shopCatName = typeof shop.category === 'object' ? (shop.category?.name || 'General') : (shop.category || 'General');
        return shopCatName === activeCategory;
      })
      .sort((a: any, b: any) => {
        if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
        return a.distance - b.distance;
      });
  }, [shops, activeCategory, userLocation]);

  const topBanners = useMemo(() => {
    const positioned = banners.filter((banner: any) => banner.position === 'top');
    return positioned.length ? positioned : banners;
  }, [banners]);

  return (
    <View className="flex-1 bg-amber-400">
      <StatusBar style="dark" backgroundColor="#f59e0b" />
      
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-4 w-full max-w-7xl mx-auto"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          stickyHeaderIndices={[activeOrder ? 3 : 2]} // 0: Header, 1: Order(opt), 2: Banners, 3: Search
          bounces={false}
          overScrollMode="never"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#f59e0b']}
              tintColor="#f59e0b"
              progressBackgroundColor="#FFFFFF"
            />
          }>
          
          {/* HEADER (Scrolls away natively) */}
        <HomeHeader 
          userLocation={userLocation} 
          onPressLocation={() => setShowLocationModal(true)}
        />

        {/* ACTIVE ORDER TRACKER */}
        {activeOrder && (
          <View className="bg-amber-100/80 px-4 py-2 border-b border-amber-200/50 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <View className="w-7 h-7 bg-amber-500 rounded-full items-center justify-center shadow-sm">
                <Navigation size={14} color="white" />
              </View>
              <View>
                <Text className="text-[12px] font-black text-amber-950">Order is arriving!</Text>
                <Text className="text-[9px] font-bold text-amber-700/80 uppercase tracking-widest">Track delivery 🛵</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => router.push(`/orders`)}
              className="bg-amber-500 px-3 py-1.5 rounded-full shadow-sm"
            >
              <Text className="text-white text-[10px] font-black tracking-wide">VIEW</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* BANNER CAROUSEL */}
        <View className="bg-white pb-4">
          <PromoBanners banners={topBanners} />
        </View>

        {/* SEARCH (Sticky) */}
        <View className="bg-white pt-1 pb-2 border-b border-slate-100 shadow-sm z-50" style={{ elevation: 50 }}>
          <GlobalSearchBar />
        </View>

          {/* BESTSELLERS */}
          <View className="mt-2">
            <Bestsellers featuredProducts={featuredProducts} />
          </View>

          {/* CURATED COLLECTIONS */}
          <CuratedCollections featuredProducts={featuredProducts} />

          {/* SHOP BY CATEGORY (Temporarily Hidden) */}
          {/* 
          <View className="mt-2">
            <ShopByCategory
              categoryList={categoryList}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              showAllCategories={showAllCategories}
              setShowAllCategories={setShowAllCategories}
              userLocation={userLocation}
            />
          </View> 
          */}

          {/* QUICK DELIVERY */}
          <View className="mt-2 bg-white">
            <QuickDeliveryStores shops={sortedShops} />
          </View>

          {/* ALL STORES */}
          <View className="mt-2 bg-white pt-4">
            <StoreListing
              sortedShops={sortedShops}
              loading={loadingShops}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              limit={6}
              showViewAll={true}
              userLocation={userLocation}
            />
          </View>
          
          {/* CTA & FOOTER */}
          <View className="mt-2 bg-slate-50">
            <BecomeSellerCTA />
            <HowItWorks />
            <HomeFooter />
          </View>
        </ScrollView>
      </View>

      {/* ─── FLOATING VIEW CART FAB ─── */}
      {cartItems.length > 0 && (
        <TouchableOpacity 
            onPress={() => router.push('/cart')}
            className="absolute bottom-[24px] right-[24px] z-50 bg-amber-500 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-amber-900/30"
            style={{ elevation: 10 }}
        >
            <ShoppingCart size={24} color="#0f172a" />
            <View className="absolute top-0 right-0 bg-red-600 w-6 h-6 rounded-full items-center justify-center border-2 border-white">
                <Text className="text-white text-[10px] font-black">{cartItems.length}</Text>
            </View>
        </TouchableOpacity>
      )}

      {/* ─── ALL CATEGORIES MODAL ─── */}
      {showAllCategories && (
        <AllCategoriesModal 
            showAllCategories={showAllCategories}
            setShowAllCategories={setShowAllCategories}
            categoryList={categoryList}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
        />
      )}

      {/* ─── LOCATION PICKER MODAL ─── */}
      {showLocationModal && (
        <LocationPickerModal
          visible={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onSelectGPS={() => {
            setUserLocation(null);
            fetchGPSLocation();
          }}
          onSelectLocation={(loc) => {
            setUserLocation(loc);
          }}
          shops={shops}
        />
      )}
    </View>
  );
}
