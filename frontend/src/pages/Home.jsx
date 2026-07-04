import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { haversine } from '../utils/homeUtils.js';

import HomeHeader from '../components/home/HomeHeader';
import PromoBanners from '../components/home/PromoBanners';
import DailyMarketBanner from '../components/home/DailyMarketBanner';
import GlobalSearchBar from '../components/home/GlobalSearchBar';
import ShopByCategory from '../components/home/ShopByCategory';
import Bestsellers from '../components/home/Bestsellers';
import StoreListing from '../components/home/StoreListing';
import NewOnMuna from '../components/home/NewOnMuna';
import BecomeSellerCTA from '../components/home/BecomeSellerCTA';
import HomeFooter from '../components/home/HomeFooter';
import AllCategoriesModal from '../components/home/AllCategoriesModal';

const Home = () => {
    // eslint-disable-next-line no-unused-vars
    const { user } = useAuth();
    const navigate = useNavigate();

    const [userLocation, setUserLocation] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [locationText, setLocationText] = useState("Fetching location...");
    const [activeCategory, setActiveCategory] = useState('All');
    // eslint-disable-next-line no-unused-vars
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllCategories, setShowAllCategories] = useState(false);

    /* ── Fetch Data ── */
    const { data: shops = [], isLoading: loading } = useQuery({
        queryKey: ['shops'],
        queryFn: () => fetch('/api/shops').then(r => r.json()),
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
        queryFn: () => fetch('/api/shop-categories').then(r => r.json()),
    });

    /* ── Geolocation ── */
    useEffect(() => {
        if (!('geolocation' in navigator)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLocationText('Location not supported');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocationText("Current Location");
            },
            (err) => {
                console.warn("Geolocation Error:", err.message);
                setLocationText("Select Location");
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
        );
    }, []);

    /* ── Derived Data ── */
    const categoryList = useMemo(() => {
        if (!dbCategories || dbCategories.length === 0) {
            const cats = new Set(shops.map(s => s.category || 'Grocery'));
            return [{ name: 'All' }, ...Array.from(cats).sort().map(c => ({ name: c }))];
        }
        return [{ name: 'All' }, ...dbCategories.sort((a, b) => a.sortOrder - b.sortOrder)];
    }, [shops, dbCategories]);

    const sortedShops = useMemo(() => {
        let list = shops.map(shop => {
            let distance = Infinity;
            if (userLocation && shop.location?.coordinates?.length === 2) {
                distance = haversine(userLocation.lat, userLocation.lng, shop.location.coordinates[1], shop.location.coordinates[0]);
            }
            return { ...shop, distance };
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
    }, [shops, userLocation, activeCategory, searchQuery]);

    return (
        /* PURE WHITE/LIGHT GRAY BACKGROUND (Blinkit Style) */
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50/50 overflow-hidden font-sans antialiased">

            {/* ════════ HEADER ════════ */}
            <HomeHeader userLocation={userLocation} />

            {/* ════════ SCROLLABLE BODY ════════ */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-24">
                <div className="w-full max-w-7xl mx-auto">
                    
                    <PromoBanners />
                    <DailyMarketBanner navigate={navigate} />
                    <GlobalSearchBar navigate={navigate} />
                    
                    <ShopByCategory 
                        categoryList={categoryList}
                        activeCategory={activeCategory}
                        setActiveCategory={setActiveCategory}
                        setShowAllCategories={setShowAllCategories}
                    />
                    
                    <Bestsellers 
                        featuredProducts={featuredProducts} 
                        navigate={navigate} 
                    />
                    
                    <StoreListing 
                        sortedShops={sortedShops}
                        loading={loading}
                        activeCategory={activeCategory}
                        setActiveCategory={setActiveCategory}
                    />
                    
                    <NewOnMuna shops={shops} />
                    <BecomeSellerCTA navigate={navigate} />
                    <HomeFooter navigate={navigate} />

                </div>
            </div>
            
            {/* ─── ALL CATEGORIES MODAL ─── */}
            <AllCategoriesModal 
                showAllCategories={showAllCategories}
                setShowAllCategories={setShowAllCategories}
                categoryList={categoryList}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
            />

        </div>
    );
};

export default Home;