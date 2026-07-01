import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { useUnreadChats } from '../hooks/useUnreadChats';

/* ─── Premium Native Icons ─── */
const IcoSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IcoStar = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 text-amber-400"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>;

/* ─── Category Style Mapper ─── */
const getCategoryIcon = (cat) => {
    const l = cat.toLowerCase();
    if (l.includes('grocery') || l.includes('kirana')) return { emoji: '🥬', bg: 'bg-emerald-50' };
    if (l.includes('fruit') || l.includes('veg')) return { emoji: '🍎', bg: 'bg-rose-50' };
    if (l.includes('dairy') || l.includes('baker') || l.includes('milk')) return { emoji: '🍞', bg: 'bg-amber-50' };
    if (l.includes('meat') || l.includes('egg') || l.includes('fish')) return { emoji: '🥩', bg: 'bg-red-50' };
    if (l.includes('personal') || l.includes('care') || l.includes('pharm')) return { emoji: '🧴', bg: 'bg-cyan-50' };
    if (l.includes('all')) return { emoji: '🏪', bg: 'bg-slate-100' };
    return { emoji: '🛍️', bg: 'bg-indigo-50' };
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

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    /* ── Fetch Data ── */
    const { data: shops = [], isLoading: loading } = useQuery({
        queryKey: ['shops'],
        queryFn: () => fetch('/api/shops').then(r => r.json()),
    });

    const { data: featuredProducts = [] } = useQuery({
        queryKey: ['featured-products'],
        queryFn: () => fetch('/api/master-products').then(r => r.json()),
    });

    const { data: homeMsg = { line1: 'Your local market,', line2: 'delivered in minutes ⚡' } } = useQuery({
        queryKey: ['navbar-message'],
        queryFn: () => fetch('/api/settings/navbar-message').then(r => r.json()),
    });

    /* ── Geolocation ── */
    const handleLocate = () => {
        if (!('geolocation' in navigator)) {
            setLocationError('Geolocation not supported.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocationError(null);
            },
            () => setLocationError('Location denied.'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

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
        /* FRESH SLATE BACKGROUND */
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 overflow-hidden font-sans antialiased">

            {/* ════════ HEADER SECTION ════════ */}
            <div className="shrink-0 pt-10 px-5 pb-3">
                {/* Logo Row */}
                <div className="flex items-center gap-2 mb-6">
                    <img src="/muna-logo-new.png" alt="MUNA" className="w-10 h-10 object-contain drop-shadow-sm rounded-xl" />
                    <div className="flex flex-col">
                        <span className="text-[22px] font-black tracking-tight text-slate-900 leading-none">MUNA</span>
                        <span className="text-[7.5px] font-extrabold text-slate-500 tracking-widest uppercase mt-0.5 whitespace-nowrap">
                            — Local Delivery & Shopping —
                        </span>
                    </div>
                </div>

                {/* Location & Delivery Illustration Row */}
                <div className="flex items-end justify-between w-full">
                    <div className="flex flex-col cursor-pointer active:opacity-70 transition-opacity" onClick={handleLocate}>
                        <span className="text-[12px] font-bold text-slate-400 mb-0.5">Delivering in your area</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[17px] font-black text-emerald-600 tracking-tight">
                                {userLocation ? 'Location updated' : 'Bhalukmari, Assam'}
                            </span>
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </div>
                    </div>
                    {/* Placeholder for Delivery Boy Illustration */}
                    <div className="w-[85px] h-[65px] bg-transparent flex items-end justify-end shrink-0 -mb-2">
                        <span className="text-5xl drop-shadow-sm">🛵</span>
                    </div>
                </div>
            </div>

            {/* ════════ SCROLLABLE BODY ════════ */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-5 pb-24">

                {/* Search Bar */}
                <div
                    onClick={() => navigate('/search')}
                    className="w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm mb-6 cursor-text active:scale-[0.98] transition-transform border border-slate-200"
                >
                    <span className="text-slate-400"><IcoSearch /></span>
                    <span className="text-[13px] font-semibold text-slate-400">Search for products or stores...</span>
                </div>

                {/* Promo Banners (Carousel) */}
                <div className="mb-8 flex gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-5 px-5">
                    {/* Slide 1 */}
                    <div
                        onClick={() => navigate('/daily-market')}
                        className="snap-center shrink-0 w-[85vw] sm:w-[300px] rounded-2xl bg-gradient-to-r from-emerald-100 to-teal-200 p-5 flex flex-col justify-center relative overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer border border-emerald-100"
                    >
                        <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 text-[100px] opacity-80">🧺</div>
                        <div className="relative z-10 w-2/3">
                            <h2 className="text-2xl font-black text-teal-900 leading-tight mb-1">GROCERIES</h2>
                            <p className="text-[15px] font-bold text-teal-800 mb-3">Fresh & Daily</p>
                            <p className="text-[10px] font-bold text-teal-700 tracking-widest uppercase mb-4">Up to 20% Off</p>
                            <button className="bg-teal-700 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-md hover:bg-teal-800 transition-colors w-fit">Shop Now</button>
                        </div>
                    </div>
                    {/* Slide 2 */}
                    <div
                        onClick={() => navigate('/search')}
                        className="snap-center shrink-0 w-[85vw] sm:w-[300px] rounded-2xl bg-gradient-to-r from-rose-100 to-pink-200 p-5 flex flex-col justify-center relative overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer border border-rose-100"
                    >
                        <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 text-[100px] opacity-80">🍎</div>
                        <div className="relative z-10 w-2/3">
                            <h2 className="text-2xl font-black text-pink-900 leading-tight mb-1">FRESH FRUITS</h2>
                            <p className="text-[15px] font-bold text-pink-800 mb-3">Straight from farms</p>
                            <p className="text-[10px] font-bold text-pink-700 tracking-widest uppercase mb-4">Deal of the Day</p>
                            <button className="bg-pink-700 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-md hover:bg-pink-800 transition-colors w-fit">Explore</button>
                        </div>
                    </div>
                    {/* Slide 3 */}
                    <div
                        onClick={() => navigate('/search')}
                        className="snap-center shrink-0 w-[85vw] sm:w-[300px] rounded-2xl bg-gradient-to-r from-indigo-100 to-blue-200 p-5 flex flex-col justify-center relative overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer border border-indigo-100"
                    >
                        <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 text-[100px] opacity-80">🧴</div>
                        <div className="relative z-10 w-2/3">
                            <h2 className="text-2xl font-black text-blue-900 leading-tight mb-1">PERSONAL CARE</h2>
                            <p className="text-[15px] font-bold text-blue-800 mb-3">Top brands</p>
                            <p className="text-[10px] font-bold text-blue-700 tracking-widest uppercase mb-4">Buy 1 Get 1</p>
                            <button className="bg-blue-700 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-md hover:bg-blue-800 transition-colors w-fit">Grab Now</button>
                        </div>
                    </div>
                </div>

                {/* Shop by Category */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-black text-slate-900">Shop by Category</h3>
                    </div>

                    <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                        {categories.map(cat => {
                            const { emoji, bg } = getCategoryIcon(cat);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className="flex flex-col items-center gap-2 active:opacity-70 transition-opacity"
                                >
                                    <div className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-[28px] ${activeCategory === cat ? 'bg-emerald-100 ring-2 ring-emerald-500 shadow-sm' : bg}`}>
                                        {emoji}
                                    </div>
                                    <span className="text-[10px] font-bold text-center text-slate-700 leading-tight px-1">
                                        {cat === 'All' ? 'Grocery' : cat}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Featured Products (Bestsellers) */}
                {featuredProducts && featuredProducts.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[15px] font-black text-slate-900">Bestsellers in your area</h3>
                            <span className="text-[13px] font-bold text-emerald-600" onClick={() => navigate('/search')}>See All</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-5 px-5 pb-4">
                            {featuredProducts.slice(0, 6).map(prod => (
                                <div key={prod._id} className="snap-start shrink-0 w-[120px] bg-white rounded-2xl p-2 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col">
                                    <div className="w-full h-[90px] rounded-xl bg-slate-50 mb-2 p-2 flex items-center justify-center relative overflow-hidden">
                                        {prod.image ? <img src={prod.image} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply" /> : <span className="text-3xl">📦</span>}
                                        {/* Optional discount badge */}
                                        <div className="absolute top-1 left-1 bg-amber-400 text-amber-950 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">10% OFF</div>
                                    </div>
                                    <h4 className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight mb-1">{prod.name}</h4>
                                    <span className="text-[10px] font-bold text-slate-400 mb-2">{prod.category || '1 unit'}</span>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-[13px] font-black text-slate-900">₹{prod.price || Math.floor(Math.random() * 200 + 50)}</span>
                                        <button className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 active:bg-emerald-100 transition-colors">
                                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top Picks from Local Shops */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-black text-slate-900">
                            {activeCategory !== 'All' ? `${activeCategory} Shops` : 'Top Picks from Local Shops'}
                        </h3>
                        <span className="text-[13px] font-bold text-emerald-600">View All</span>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white rounded-2xl p-4 flex gap-4 animate-pulse">
                                        <div className="w-20 h-20 bg-slate-100 rounded-xl" />
                                        <div className="flex-1 py-1">
                                            <div className="h-4 bg-slate-100 w-2/3 rounded mb-2" />
                                            <div className="h-3 bg-slate-100 w-1/2 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : sortedShops.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-2xl shadow-sm border border-slate-200">
                                <span className="text-4xl opacity-50 block mb-2">🏪</span>
                                <p className="text-sm font-bold text-slate-600">No stores found</p>
                            </div>
                        ) : (
                            sortedShops.map((shop) => (
                                <Link
                                    to={`/shop/${shop._id}`}
                                    key={shop._id}
                                    className={`block bg-white rounded-[24px] p-3 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform hover:border-emerald-200 ${!shop.isOpen ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex gap-4">
                                        {/* Store Image */}
                                        <div className="w-[85px] h-[85px] rounded-[16px] bg-slate-50 shrink-0 overflow-hidden relative border border-slate-100">
                                            {shop.image ? (
                                                <img src={optimizeImage(shop.image, 300)} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl">🏪</div>
                                            )}
                                        </div>

                                        {/* Store Details */}
                                        <div className="flex-1 py-1 flex flex-col justify-center">
                                            <div className="flex items-start justify-between">
                                                <h3 className="text-[15px] font-black text-slate-900 leading-tight pr-2">{shop.name}</h3>
                                                {!shop.isOpen && (
                                                    <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1.5 py-0.5 rounded shrink-0">Closed</span>
                                                )}
                                            </div>

                                            <p className="text-[12px] font-bold text-slate-500 mt-1">
                                                {shop.category || 'Kirana & Grocery'}
                                            </p>

                                            <div className="mt-auto flex items-end justify-between">
                                                <div className="flex items-center gap-1 text-[12px] font-bold text-slate-600">
                                                    {shop.rating || '4.5'} <IcoStar />
                                                </div>
                                                <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                                    ⏱ {shop.distance < 2 ? '15-20' : '30-40'} min
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Home;