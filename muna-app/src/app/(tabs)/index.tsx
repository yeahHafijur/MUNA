import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';

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
import { haversine } from '@/utils/homeUtils';

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

import AllCategoriesModal from '@/components/home/AllCategoriesModal';

export default function HomeScreen() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadGrantedLocation = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;

        const position =
          (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 })) ||
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!mounted || !position) return;

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

        if (mounted) setUserLocation({ ...baseLocation, label: label || 'Current location' });
      } catch {
        // The home remains fully usable when location is unavailable.
      }
    };

    loadGrantedLocation();
    return () => {
      mounted = false;
    };
  }, []);

  const {
    data: shops = [],
    isLoading: loadingShops,
    refetch: refetchShops,
  } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => (await api.get('/api/shops')).data,
  });

  const { data: featuredProducts = [], refetch: refetchProducts } = useQuery({
    queryKey: ['featured-products', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      const params = userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined;
      return (await api.get('/api/products/bestsellers', { params })).data;
    },
  });

  const { data: dbCategories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['shop-categories'],
    queryFn: async () => (await api.get('/api/shop-categories')).data,
  });

  const { data: banners = [], refetch: refetchBanners } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => (await api.get('/api/banners')).data,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchShops(), refetchProducts(), refetchCategories(), refetchBanners()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchShops, refetchProducts, refetchCategories, refetchBanners]);

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
    <View className="flex-1 bg-slate-50/50">
      <StatusBar style="light" />
      <HomeHeader userLocation={userLocation} />
      
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#f59e0b']}
            tintColor="#f59e0b"
            progressBackgroundColor="#FFFFFF"
          />
        }>
        
        <View className="w-full max-w-7xl mx-auto">
          {/* BANNER CAROUSEL */}
          <View className="bg-white pb-4">
            <PromoBanners banners={topBanners} />
            <DailyMarketBanner />
          </View>

          {/* SEARCH */}
          <View className="bg-slate-50/80 py-1">
            <GlobalSearchBar />
          </View>

          {/* BESTSELLERS */}
          <View className="mt-2">
            <Bestsellers featuredProducts={featuredProducts} />
          </View>

          {/* SHOP BY CATEGORY */}
          <View className="mt-2">
            <ShopByCategory
              categoryList={categoryList}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              showAllCategories={showAllCategories}
              setShowAllCategories={setShowAllCategories}
            />
          </View>

          {/* QUICK DELIVERY */}
          <View className="mt-2 bg-white border-y border-slate-100/80 shadow-sm">
            <QuickDeliveryStores shops={sortedShops} />
          </View>

          {/* ALL STORES */}
          <View className="mt-4 bg-white border-t border-slate-100 pt-4">
            <StoreListing
              sortedShops={sortedShops}
              loading={loadingShops}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              limit={6}
              showViewAll={true}
            />
          </View>
          
          {/* CTA & FOOTER */}
          <View className="mt-6 bg-slate-50 border-t border-slate-100">
            <BecomeSellerCTA />
            <HowItWorks />
            <HomeFooter />
          </View>
        </View>
      </ScrollView>

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
    </View>
  );
}
