import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { haversine } from '../utils/homeUtils.js';
import StoreListing from '../components/home/StoreListing';
import PageHeader from '../components/ui/PageHeader';

const IcoSearch = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const AllStores = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    /* ── Fetch Data ── */
    const { data: shopsData = [], isLoading: loading } = useQuery({
        queryKey: ['shops'],
        queryFn: () => fetch('/api/shops', { credentials: 'include' }).then(r => r.json()),
    });
    const shops = Array.isArray(shopsData) ? shopsData : [];

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
    const categories = useMemo(() => {
        const set = new Set(shops.map(s => s.category || 'Grocery'));
        return ['All', ...Array.from(set).sort()];
    }, [shops]);

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

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.address?.toLowerCase().includes(q) ||
                (s.category || '').toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => {
            if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
            return a.distance - b.distance;
        });
    }, [shops, userLocation, activeCategory, searchQuery]);

    return (
        <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans">
            <PageHeader title="All Stores" subtitle="Explore everything near you" />

            {/* Search + category chips */}
            <div className="bg-white border-b border-slate-100 px-4 pt-3 pb-3 space-y-3">
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <IcoSearch />
                    </span>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search stores or categories..."
                        className="input-field pl-10"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-black tracking-tight transition-all active:scale-95 border
                                ${activeCategory === cat
                                    ? 'bg-brand-400 text-amber-950 border-brand-400 shadow-cta'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
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
