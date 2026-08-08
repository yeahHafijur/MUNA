import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { haversine } from '../utils/homeUtils.js';

import HomeHeader from '../components/home/HomeHeader';
import PromoBanners from '../components/home/PromoBanners';
import DailyMarketBanner from '../components/home/DailyMarketBanner';
import GlobalSearchBar from '../components/home/GlobalSearchBar';
import ShopByCategory from '../components/home/ShopByCategory';
import Bestsellers from '../components/home/Bestsellers';
import CuratedCollections from '../components/home/CuratedCollections';
import StoreListing from '../components/home/StoreListing';
import QuickDeliveryStores from '../components/home/QuickDeliveryStores';
import BecomeSellerCTA from '../components/home/BecomeSellerCTA';
import HowItWorks from '../components/home/HowItWorks';
import HomeFooter from '../components/home/HomeFooter';
import AllCategoriesModal from '../components/home/AllCategoriesModal';
import LocationPickerModal from '../components/home/LocationPickerModal';
import MidPageBanner from '../components/home/MidPageBanner';

const IconCart = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
);

const Home = () => {
    const { user } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();

    const [userLocation, setUserLocation] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    // eslint-disable-next-line no-unused-vars
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);

    /* ── Fetch Data ── */
    const { data: shops = [], isLoading: loading } = useQuery({
        queryKey: ['shops'],
        queryFn: () => fetch('/api/shops', { credentials: 'include' }).then(r => r.json()),
    });

    const { data: featuredProducts = [] } = useQuery({
        queryKey: ['featured-products', userLocation?.lat, userLocation?.lng],
        queryFn: () => {
            let url = '/api/products/bestsellers';
            if (userLocation?.lat && userLocation?.lng) {
                url += `?lat=${userLocation.lat}&lng=${userLocation.lng}`;
            }
            return fetch(url).then(r => r.json());
        },
    });

    const { data: dbCategories = [] } = useQuery({
        queryKey: ['shop-categories'],
        queryFn: () => fetch('/api/shop-categories', { credentials: 'include' }).then(r => r.json()),
    });

    const { data: banners = [] } = useQuery({
        queryKey: ['banners'],
        queryFn: () => fetch('/api/banners', { credentials: 'include' }).then(r => r.json()),
    });

    const { data: activeOrder = null } = useQuery({
        queryKey: ['activeOrder'],
        queryFn: async () => {
            if (!user) return null;
            try {
                const res = await fetch('/api/orders/active', { credentials: 'include' });
                if (!res.ok) return null;
                return await res.json();
            } catch {
                return null;
            }
        },
        enabled: !!user,
        refetchInterval: 30000,
    });

    const topBanners = useMemo(() => (Array.isArray(banners) ? banners : []).filter(b => b.position === 'top'), [banners]);
    const midBanners = useMemo(() => (Array.isArray(banners) ? banners : []).filter(b => b.position === 'mid'), [banners]);

    const safeShops = useMemo(() => (Array.isArray(shops) ? shops : []), [shops]);
    const safeFeaturedProducts = useMemo(() => (Array.isArray(featuredProducts) ? featuredProducts : []), [featuredProducts]);

    /* ── Geolocation ── */
    useEffect(() => {
        if (!('geolocation' in navigator)) return;
        navigator.geolocation.getCurrentPosition(
            pos => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: '📍 Current Location' });
            },
            () => {},
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
        );
    }, []);

    /* ── Derived Data ── */
    const categoryList = useMemo(() => {
        const categories = Array.isArray(dbCategories) ? dbCategories : [];
        if (categories.length === 0) {
            const cats = new Set(safeShops.map(s => s.category || 'Grocery'));
            return [{ name: 'All' }, ...Array.from(cats).sort().map(c => ({ name: c }))];
        }
        return [{ name: 'All' }, ...[...categories].sort((a, b) => a.sortOrder - b.sortOrder)];
    }, [safeShops, dbCategories]);

    const sortedShops = useMemo(() => {
        let list = safeShops.map(shop => {
            let distance = Infinity;
            if (userLocation && shop.location?.coordinates?.length === 2) {
                distance = haversine(userLocation.lat, userLocation.lng, shop.location.coordinates[1], shop.location.coordinates[0]);
            }
            return { ...shop, distance };
        });

        // HIDE SHOPS THAT ARE MORE THAN 25 KM AWAY
        list = list.filter(shop => {
            if (userLocation) {
                // If user location is known, only allow shops within 25km.
                // This correctly hides shops without coordinates (distance = Infinity)
                return shop.distance <= 25;
            }
            return true;
        });

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.address.toLowerCase().includes(q) ||
                (s.category || '').toLowerCase().includes(q)
            );
        }

        if (activeCategory !== 'All') {
            list = list.filter(s => (s.category || 'Grocery') === activeCategory);
        }

        return list.sort((a, b) => {
            if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
            return a.distance - b.distance;
        });
    }, [safeShops, userLocation, activeCategory, searchQuery]);

    const totalCartItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    return (
        /* PURE WHITE/LIGHT GRAY BACKGROUND (Blinkit Style) */
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50/50 overflow-hidden font-sans antialiased">

            {/* ════════ SCROLLABLE BODY ════════ */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-24 relative">
                
                {/* ════════ HEADER (Scrolls away) ════════ */}
                <HomeHeader userLocation={userLocation} onPressLocation={() => setShowLocationModal(true)} />

                {/* ════════ ACTIVE ORDER TRACKER ════════ */}
                {activeOrder && (
                    <div className="bg-amber-100/80 px-4 py-2 border-b border-amber-200/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-sm shrink-0">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 6v12a3 3 0 11-6 0V6a3 3 0 116 0zM6 15a3 3 0 010-6m12 6a3 3 0 000-6" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <span className="block text-[12px] font-black text-amber-950 leading-none">Order is arriving!</span>
                                <span className="block text-[9px] font-bold text-amber-700/80 uppercase tracking-widest mt-0.5">Track delivery</span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/profile/orders')}
                            className="bg-amber-500 px-3 py-1.5 rounded-full text-white text-[10px] font-black tracking-wide shadow-sm active:scale-95 transition-transform shrink-0"
                        >
                            VIEW
                        </button>
                    </div>
                )}

                <div className="w-full max-w-7xl mx-auto flex flex-col">
                    
                    {/* ═══ SECTION: BANNER CAROUSEL ═══ */}
                    <section className="bg-white pb-4">
                        <PromoBanners banners={topBanners} />
                        <DailyMarketBanner navigate={navigate} />
                    </section>

                    {/* ═══ SECTION: SEARCH ═══ */}
                    <section className="bg-white pt-1 pb-2 border-b border-slate-100 shadow-sm sticky top-0 z-50">
                        <GlobalSearchBar navigate={navigate} />
                    </section>

                    {/* ═══ SECTION: BESTSELLERS ═══ */}
                    <section className="mt-2">
                        <Bestsellers 
                            featuredProducts={safeFeaturedProducts} 
                            navigate={navigate} 
                        />
                    </section>

                    {/* ═══ SECTION: CURATED COLLECTIONS ═══ */}
                    <CuratedCollections featuredProducts={safeFeaturedProducts} />
                    
                    {/* ═══ SECTION: SHOP BY CATEGORY (Temporarily Hidden) ═══ */}
                    {/* 
                    <section className="mt-2">
                        <ShopByCategory 
                            categoryList={categoryList}
                            activeCategory={activeCategory}
                            setActiveCategory={setActiveCategory}
                            setShowAllCategories={setShowAllCategories}
                        />
                    </section>
                    */}
                    
                    {/* ═══ SECTION: QUICK DELIVERY ═══ */}
                    <section className="mt-2 bg-white border-y border-slate-100/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                        <QuickDeliveryStores shops={sortedShops} />
                    </section>
                    
                    {/* ═══ SECTION: MID BANNER ═══ */}
                    <section className="mt-2">
                        <MidPageBanner banners={midBanners} navigate={navigate} />
                    </section>
                    
                    {/* ═══ SECTION: ALL STORES ═══ */}
                    <section className="mt-4 bg-white border-t border-slate-100 pt-4">
                        <StoreListing 
                            sortedShops={sortedShops}
                            loading={loading}
                            activeCategory={activeCategory}
                            setActiveCategory={setActiveCategory}
                            limit={5}
                            showViewAll={true}
                        />
                    </section>
                    
                    {/* ═══ SECTION: CTA & FOOTER ═══ */}
                    <section className="mt-6 bg-slate-50 border-t border-slate-100">
                        <BecomeSellerCTA navigate={navigate} />
                        <HowItWorks />
                        <HomeFooter navigate={navigate} />
                    </section>

                </div>
            </div>

            {/* ─── FLOATING VIEW CART FAB ─── */}
            {cartItems.length > 0 && (
                <button
                    onClick={() => navigate('/cart')}
                    className="absolute bottom-[88px] right-4 z-[150] bg-amber-500 w-16 h-16 rounded-full flex items-center justify-center text-slate-900 shadow-lg shadow-amber-900/30 active:scale-95 transition-transform"
                    aria-label="View cart"
                >
                    <IconCart />
                    <span className="absolute top-0 right-0 bg-red-600 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white text-white text-[10px] font-black">
                        {totalCartItems}
                    </span>
                </button>
            )}

            {/* ─── ALL CATEGORIES MODAL ─── */}
            <AllCategoriesModal 
                showAllCategories={showAllCategories}
                setShowAllCategories={setShowAllCategories}
                categoryList={categoryList}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
            />

            {/* ─── LOCATION PICKER MODAL ─── */}
            <LocationPickerModal
                visible={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onSelectGPS={() => {
                    setUserLocation(null);
                    if ('geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition(
                            pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: '📍 Current Location' }),
                            () => {}
                        );
                    }
                }}
                onSelectLocation={(loc) => setUserLocation(loc)}
                shops={safeShops}
            />

        </div>
    );
};

export default Home;
