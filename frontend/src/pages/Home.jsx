import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';

/* ─── Minimal Native Icons (Blinkit Style) ─── */
const IcoSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IcoStar = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 text-amber-500"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>;
const IcoUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const IcoTimer = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" /></svg>;

/* ─── Category Style Mapper ─── */
const getCategoryIcon = (cat) => {
    const l = cat.toLowerCase();
    if (l.includes('grocery') || l.includes('kirana')) return { emoji: '🥬', bg: 'bg-green-50' };
    if (l.includes('fruit') || l.includes('veg')) return { emoji: '🍎', bg: 'bg-red-50' };
    if (l.includes('dairy') || l.includes('milk')) return { emoji: '🥛', bg: 'bg-blue-50' };
    if (l.includes('meat') || l.includes('egg')) return { emoji: '🥩', bg: 'bg-orange-50' };
    if (l.includes('personal') || l.includes('pharm')) return { emoji: '🧴', bg: 'bg-teal-50' };
    if (l.includes('all')) return { emoji: '🏪', bg: 'bg-gray-100' };
    return { emoji: '🛍️', bg: 'bg-purple-50' };
};

/* ─── Haversine ─── */
const haversine = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fmtDist = (d) => d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`;

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [userLocation, setUserLocation] = useState(null);
    const [locationText, setLocationText] = useState("Fetching location...");
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    /* ── Fetch Data ── */
    const { data: shops = [], isLoading: loading } = useQuery({
        queryKey: ['shops'],
        queryFn: () => fetch('/api/shops').then(r => r.json()),
    });

    /* ── Geolocation ── */
    useEffect(() => {
        if (!('geolocation' in navigator)) {
            setLocationText('Location not supported');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocationText("Current Location");
            },
            () => setLocationText("Select Location"),
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }, []);

    /* ── Derived Data ── */
    const categories = useMemo(() => {
        const cats = new Set(shops.map(s => s.category || 'Grocery'));
        return ['All', ...Array.from(cats).sort()];
    }, [shops]);

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
    }, [shops, userLocation, searchQuery, activeCategory]);

    return (
        /* PURE WHITE/LIGHT GRAY BACKGROUND (Blinkit Style) */
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50/50 overflow-hidden font-sans antialiased">

            {/* ════════ MINIMALIST HEADER ════════ */}
            <div className="shrink-0 bg-white pt-10 px-4 pb-3 z-50 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                    {/* Left: Logo & Location */}
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-4 cursor-pointer active:opacity-70 transition-opacity" onClick={handleLocate}>
                        {/* MUNA Logo */}
                        <img src="/muna-logo-new.png" alt="MUNA" className="w-10 h-10 object-contain drop-shadow-sm rounded-[10px] shrink-0 bg-slate-50 border border-slate-100/50" />
                        
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[11px] font-black tracking-widest text-emerald-600 uppercase flex items-center gap-1 mb-0.5">
                                Delivery in 15 mins
                            </span>
                            <div className="flex items-center gap-1">
                                <span className="text-[16px] font-bold text-slate-900 truncate">
                                    {userLocation ? 'Location updated' : 'Bhalukmari, Assam'}
                                </span>
                                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Right: Profile */}
                    <div
                        className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer overflow-hidden text-slate-500"
                        onClick={() => navigate('/profile')}
                    >
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <IcoUser />
                        )}
                    </div>
                </div>

                {/* Search Bar - Crisp and Pill-shaped */}
                <div
                    onClick={() => navigate('/search')}
                    className="w-full bg-slate-100/80 border border-slate-200/60 rounded-[14px] px-4 py-3 flex items-center gap-3 cursor-text active:bg-slate-200/80 transition-colors"
                >
                    <span className="text-slate-400"><IcoSearch /></span>
                    <span className="text-[13px] font-bold text-slate-400">Search "Atta, Dal, Coke"</span>
                </div>
            </div>

            {/* ════════ SCROLLABLE BODY ════════ */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-24">

                {/* ── Banners Area ── */}
                <div className="px-4 pt-4 pb-6">
                    <div
                        onClick={() => navigate('/daily-market')}
                        className="w-full bg-[#1a1a1a] rounded-[16px] p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform cursor-pointer overflow-hidden relative"
                    >
                        <div className="relative z-10">
                            <h3 className="text-[16px] font-black text-white tracking-tight mb-0.5">Daily Market</h3>
                            <p className="text-[11px] font-semibold text-slate-400">Buy & Sell used items locally</p>
                        </div>
                        <div className="relative z-10 bg-white/10 text-white rounded-full p-2">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        </div>
                    </div>
                </div>

                {/* ── Shop by Category (Clean 4-Column Grid) ── */}
                <div className="bg-white px-4 py-6 border-y border-slate-100 mb-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-black text-slate-900">Shop by Category</h3>
                    </div>

                    <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                        {categories.map(cat => {
                            const { emoji, bg } = getCategoryIcon(cat);
                            const isActive = activeCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className="flex flex-col items-center gap-2 active:opacity-60 transition-opacity"
                                >
                                    <div className={`w-[65px] h-[65px] rounded-2xl flex items-center justify-center text-[28px] ${isActive ? 'ring-2 ring-slate-900 shadow-md bg-slate-50' : bg}`}>
                                        {emoji}
                                    </div>
                                    <span className={`text-[10px] text-center leading-tight px-1 ${isActive ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                                        {cat === 'All' ? 'All Stores' : cat}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Store Listing (Blinkit Card Style) ── */}
                <div className="bg-white min-h-[50vh] px-4 py-5 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-black text-slate-900">
                            {activeCategory !== 'All' ? `${activeCategory} Stores` : 'Stores Around You'}
                        </h3>
                        {activeCategory !== 'All' && (
                            <span className="text-[12px] font-bold text-emerald-600 cursor-pointer" onClick={() => setActiveCategory('All')}>Clear</span>
                        )}
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-4 animate-pulse">
                                        <div className="w-[88px] h-[88px] bg-slate-100 rounded-xl" />
                                        <div className="flex-1 py-1">
                                            <div className="h-4 bg-slate-100 w-3/4 rounded mb-2" />
                                            <div className="h-3 bg-slate-100 w-1/2 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : sortedShops.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                <span className="text-4xl opacity-30 block mb-2">🏪</span>
                                <p className="text-sm font-bold text-slate-500">No stores found.</p>
                            </div>
                        ) : (
                            sortedShops.map((shop) => {
                                const distVal = shop.distance !== Infinity ? shop.distance : 1.5;
                                const isFast = distVal < 2;

                                return (
                                    <Link
                                        to={`/shop/${shop._id}`}
                                        key={shop._id}
                                        className={`block bg-white active:bg-slate-50 transition-colors ${!shop.isOpen ? 'opacity-50 grayscale-[0.3]' : ''}`}
                                    >
                                        <div className="flex gap-4 py-2 border-b border-slate-100/60 pb-4">
                                            {/* Store Image - Square, rounded edges */}
                                            <div className="w-[90px] h-[90px] rounded-[14px] bg-slate-50 shrink-0 overflow-hidden relative border border-slate-100/50">
                                                {shop.image ? (
                                                    <img src={optimizeImage(shop.image, 300)} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl">🏪</div>
                                                )}

                                                {!shop.isOpen && (
                                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                                        <span className="bg-slate-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">CLOSED</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Store Details - Crisp Typography */}
                                            <div className="flex-1 py-0.5 flex flex-col justify-start">
                                                <h3 className="text-[15px] font-black text-slate-900 leading-tight pr-2 mb-1 line-clamp-1">{shop.name}</h3>

                                                <p className="text-[12px] font-semibold text-slate-500 mb-2 truncate">
                                                    {shop.category || 'Kirana & Grocery'}
                                                </p>

                                                {/* Blinkit-Style "Time" Badge */}
                                                <div className="mt-auto flex items-center gap-3">
                                                    <div className="flex items-center gap-1 bg-slate-100/80 px-2 py-1 rounded text-[10px] font-black text-slate-700">
                                                        <IcoStar /> {shop.rating || '4.5'}
                                                    </div>

                                                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black tracking-wide uppercase ${isFast ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        <IcoTimer />
                                                        {isFast ? '15 MINS' : '30 MINS'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Home;