import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { useUnreadChats } from '../hooks/useUnreadChats';

/* ─── Premium Native Icons ─── */
const IcoPin = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const IcoBell = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);
const IcoSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IcoStore = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>;
const IcoStar = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 text-white"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>;

/* ─── Distance formatter ─── */
const fmtDist = (d) => d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`;

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

    const { data: homeMsg = { line1: 'Your local market,', line2: 'delivered in minutes ⚡' } } = useQuery({
        queryKey: ['navbar-message'],
        queryFn: () => fetch('/api/settings/navbar-message').then(r => r.json()),
    });

    const { data: unreadCount = 0 } = useUnreadNotifications();
    const { data: unreadChatCount = 0 } = useUnreadChats();
    const totalAlerts = unreadCount + unreadChatCount;

    /* ── Godown Carousel ── */
    const { data: godownItems = [] } = useQuery({
        queryKey: ['featured-carousel'],
        queryFn: () => fetch('/api/settings/featured-items').then(r => r.json()),
        select: (data) => (Array.isArray(data) ? data : []).filter(item => item.image),
    });

    const carouselPairs = useMemo(() => {
        const pairs = [];
        for (let i = 0; i < godownItems.length; i += 2) {
            pairs.push(godownItems.slice(i, i + 2));
        }
        return pairs;
    }, [godownItems]);

    const [carouselIdx, setCarouselIdx] = useState(0);
    const nextSlide = useCallback(() => {
        setCarouselIdx(prev => (carouselPairs.length > 0 ? (prev + 1) % carouselPairs.length : 0));
    }, [carouselPairs.length]);

    useEffect(() => {
        if (carouselPairs.length <= 1) return;
        const timer = setInterval(nextSlide, 3500);
        return () => clearInterval(timer);
    }, [carouselPairs.length, nextSlide]);

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
        const cats = new Set(shops.map(s => s.category || 'Kirana'));
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
            list = list.filter(s => (s.category || 'Kirana') === activeCategory);
        }

        return list.sort((a, b) => {
            if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
            return a.distance - b.distance;
        });
    }, [shops, userLocation, searchQuery, activeCategory]);

    return (
        /* VIBRANT AMBER BACKGROUND (Restored) */
        <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-[#FFC107] via-[#F59E0B] to-[#D97706] overflow-hidden font-sans antialiased">

            {/* ════════ HEADER ════════ */}
            <header className="shrink-0 px-5 py-4 z-10">
                <div className="flex items-center justify-between gap-3">
                    <Link to="/" className="flex items-center gap-2 shrink-0">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl font-black text-amber-500">M</div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[16px] font-black tracking-tight text-white drop-shadow-sm">MUNA</span>
                            <span className="text-[9px] font-extrabold text-amber-100 tracking-widest uppercase mt-[2px]">
                                In Minutes
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleLocate}
                            className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-md hover:bg-white/40 transition-colors border border-white/20 flex items-center justify-center text-white active:scale-95"
                        >
                            {userLocation ? <span className="text-[14px]">✓</span> : <IcoPin className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => navigate('/notifications')}
                            className="relative w-10 h-10 rounded-full bg-white/25 backdrop-blur-md hover:bg-white/40 transition-colors border border-white/20 flex items-center justify-center text-white active:scale-95"
                        >
                            <IcoBell className="w-5 h-5" />
                            {totalAlerts > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-lg animate-pulse">
                                    {totalAlerts > 9 ? '9+' : totalAlerts}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* ════════ SCROLLABLE BODY ════════ */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                {/* --- YELLOW TOP SECTION (Restored) --- */}
                <div className="pb-6">
                    {/* Slogan */}
                    <div className="px-5 pt-2 pb-4">
                        <div className="text-[28px] md:text-[32px] font-black text-[#1F1300] leading-tight tracking-tight">
                            {homeMsg.line1}
                        </div>
                        <div className="text-[32px] md:text-[36px] font-black text-white leading-tight tracking-tight drop-shadow-md mt-1">
                            {homeMsg.line2}
                        </div>
                    </div>

                    {/* Daily Market Banner */}
                    <div className="px-5 pb-5">
                        <div
                            onClick={() => navigate('/daily-market')}
                            className="w-full bg-gradient-to-r from-sky-400 to-cyan-500 rounded-2xl p-4 flex items-center justify-between shadow-[0_8px_30px_rgba(14,165,233,0.3)] cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="relative z-10">
                                <h3 className="text-[17px] font-black text-white flex items-center gap-2 tracking-tight drop-shadow-sm">
                                    MunaDailyMarket <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse mt-0.5"></span>
                                </h3>
                                <p className="text-[11px] font-bold text-cyan-50 uppercase tracking-widest mt-0.5 drop-shadow-sm">
                                    Sell & Buy in your neighborhood
                                </p>
                            </div>
                            <div className="relative z-10 w-10 h-10 bg-white text-sky-500 rounded-full flex items-center justify-center shrink-0 shadow-md">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Godown Items Carousel */}
                    {carouselPairs.length > 0 && (
                        <div className="px-5">
                            <div className="relative h-[140px] overflow-hidden">
                                {carouselPairs.map((pair, pairIdx) => (
                                    <div
                                        key={pairIdx}
                                        className="absolute inset-0 flex gap-3 transition-all duration-700 ease-in-out"
                                        style={{
                                            opacity: pairIdx === carouselIdx ? 1 : 0,
                                            transform: pairIdx === carouselIdx ? 'translateY(0)' : 'translateY(20px)',
                                            pointerEvents: pairIdx === carouselIdx ? 'auto' : 'none',
                                        }}
                                    >
                                        {pair.map(item => (
                                            <div key={item._id} className="flex-1 rounded-2xl overflow-hidden shadow-lg shadow-black/10 relative bg-white">
                                                <img src={optimizeImage(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                                    <div className="text-[13px] font-black text-white leading-tight drop-shadow-md truncate">{item.name}</div>
                                                    {item.price > 0 && <div className="text-[12px] font-extrabold text-amber-300 mt-0.5">₹{item.price}</div>}
                                                </div>
                                            </div>
                                        ))}
                                        {pair.length === 1 && <div className="flex-1" />}
                                    </div>
                                ))}
                            </div>
                            {carouselPairs.length > 1 && (
                                <div className="flex justify-center gap-1.5 mt-3">
                                    {carouselPairs.map((_, idx) => (
                                        <button key={idx} onClick={() => setCarouselIdx(idx)} className={`rounded-full transition-all duration-300 ${idx === carouselIdx ? 'w-5 h-1.5 bg-[#1F1300]' : 'w-1.5 h-1.5 bg-[#1F1300]/30'}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* --- WHITE BOTTOM SECTION (With New Clean List Layout) --- */}
                <div className="bg-slate-50 rounded-t-[32px] min-h-screen pt-6 pb-28 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">

                    {/* Category Chips */}
                    <div className="px-5 pb-4">
                        <div className="flex gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
                            {categories.map(cat => {
                                const isActive = activeCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap shadow-sm ${isActive
                                            ? 'bg-gradient-to-br from-[#F8CB46] to-[#E5A817] text-[#1a0e00] border-transparent shadow-amber-500/30'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {cat === 'All' ? '🏠 All Stores' : cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="px-5 pb-6">
                        <div
                            onClick={() => navigate('/search')}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm cursor-text active:scale-[0.98] transition-transform"
                        >
                            <span className="text-amber-500"><IcoSearch /></span>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-400 leading-none">Search for groceries, shops...</span>
                            </div>
                        </div>
                    </div>

                    {/* Section Head */}
                    <div className="flex items-center justify-between px-5 pb-4">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">
                            {activeCategory !== 'All' ? `${activeCategory} Stores` : 'Stores Near You'}
                        </h2>
                        <span className="text-xs font-bold text-slate-400">
                            {sortedShops.length} options
                        </span>
                    </div>

                    {/* CLEAN LIST VIEW */}
                    <div className="px-5 pb-6">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white rounded-2xl p-3 border border-slate-100 flex gap-4 animate-pulse">
                                        <div className="w-[120px] h-[84px] bg-slate-100 rounded-xl shrink-0" />
                                        <div className="flex-1 py-1">
                                            <div className="h-4 bg-slate-100 w-2/3 rounded mb-2" />
                                            <div className="h-3 bg-slate-100 w-1/2 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : sortedShops.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-4xl opacity-50 mb-2 block">🏪</span>
                                <h3 className="text-sm font-bold text-slate-900">No stores found</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Try selecting a different category</p>
                                <button onClick={() => setActiveCategory('All')} className="mt-4 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md">View All Stores</button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sortedShops.map((shop) => (
                                    <Link
                                        to={`/shop/${shop._id}`}
                                        key={shop._id}
                                        className={`bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex gap-4 active:scale-[0.98] transition-all hover:border-amber-400 group ${!shop.isOpen ? 'opacity-60 bg-slate-50' : ''}`}
                                    >
                                        {/* Store Image */}
                                        <div className="w-[120px] h-[84px] rounded-xl bg-slate-50 shrink-0 relative overflow-hidden border border-slate-100">
                                            {shop.image ? (
                                                <img src={optimizeImage(shop.image, 300)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300"><IcoStore /></div>
                                            )}
                                            {/* Rating Badge */}
                                            <div className="absolute bottom-1 left-1 bg-green-600/90 backdrop-blur text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                <span>{shop.rating || '4.5'}</span> <IcoStar />
                                            </div>
                                        </div>

                                        {/* Store Details */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h3 className="text-[15px] font-black text-slate-900 truncate pr-2 tracking-tight">{shop.name}</h3>
                                                {!shop.isOpen && (
                                                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-1.5 py-0.5 rounded shrink-0">Closed</span>
                                                )}
                                            </div>

                                            <p className="text-[11px] font-bold text-slate-500 truncate mb-1.5">
                                                {shop.category || 'Kirana Store'} • {shop.address}
                                            </p>

                                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 mt-auto bg-slate-50/80 px-2 py-1.5 rounded-lg border border-slate-100/50 self-start">
                                                <span className="flex items-center gap-1 text-slate-700">
                                                    📍 {shop.distance !== Infinity ? fmtDist(shop.distance) : 'Nearby'}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                                <span className="flex items-center gap-1 text-emerald-600">
                                                    ⏱️ {shop.distance < 2 ? '15 mins' : '30 mins'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;