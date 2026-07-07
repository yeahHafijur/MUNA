import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { haversine } from '../utils/homeUtils.js';
import StoreListing from '../components/home/StoreListing';

const AllStores = () => {
    const navigate = useNavigate();
    const [userLocation, setUserLocation] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');

    /* ── Fetch Data ── */
    const { data: shops = [], isLoading: loading } = useQuery({
        queryKey: ['shops'],
        queryFn: () => fetch('/api/shops', { credentials: 'include' }).then(r => r.json()),
    });

    /* ── Geolocation ── */
    useEffect(() => {
        if (!('geolocation' in navigator)) return;
        navigator.geolocation.getCurrentPosition(
            pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn("Geolocation Error:", err.message),
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
        );
    }, []);

    /* ── Derived Data ── */
    const sortedShops = useMemo(() => {
        let list = shops.map(shop => {
            let distance = Infinity;
            if (userLocation && shop.location?.coordinates?.length === 2) {
                distance = haversine(userLocation.lat, userLocation.lng, shop.location.coordinates[1], shop.location.coordinates[0]);
            }
            return { ...shop, distance };
        });

        if (activeCategory !== 'All') {
            list = list.filter(s => (s.category || 'Grocery') === activeCategory);
        }

        return list.sort((a, b) => {
            if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
            return a.distance - b.distance;
        });
    }, [shops, userLocation, activeCategory]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col -mx-4 -mt-4">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-[18px] font-black text-slate-900 leading-tight">All Stores</h1>
                    <p className="text-[11px] font-bold text-slate-500">Explore everything near you</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 pb-20">
                <StoreListing 
                    sortedShops={sortedShops}
                    loading={loading}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    limit={undefined}
                    showViewAll={false}
                />
            </div>
        </div>
    );
};

export default AllStores;
