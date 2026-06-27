import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { optimizeImage } from '../utils/imageUtils';
// Naye hooks jo humne pichle step mein banaye the
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

/* ─── Icon Components ─── */
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

/* ─── Distance formatter ─── */
const fmtDist = (d) => d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`;

/* ─── Haversine ─── */
const haversine = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ═══════════════════════════════════════════════════════════
   HOME PAGE COMPONENT — Premium App Shell
═══════════════════════════════════════════════════════════ */
const Home = () => {
    const { user } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();

    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    /* ── Fetch shops & settings with React Query ── */
    const { data: shops = [], isLoading: loading } = useQuery({
        queryKey: ['shops'],
        queryFn: () => fetch('/api/shops').then(r => r.json()),
    });

    const { data: homeMsg = { line1: 'Your local market,', line2: 'delivered in minutes ⚡' } } = useQuery({
        queryKey: ['navbar-message'],
        queryFn: () => fetch('/api/settings/navbar-message').then(r => r.json()),
    });

    /* Global unread count hook jo humne banaya tha */
    const { data: unreadCount = 0 } = useUnreadNotifications();

    /* ── Godown items for carousel ── */
    const { data: godownItems = [] } = useQuery({
        queryKey: ['godown-carousel'],
        queryFn: () => fetch('/api/master-products').then(r => r.json()),
        select: (data) => (Array.isArray(data) ? data : []).filter(item => item.image),
    });

    const [carouselIdx, setCarouselIdx] = useState(0);
    const nextSlide = useCallback(() => {
        setCarouselIdx(prev => (godownItems.length > 0 ? (prev + 1) % godownItems.length : 0));
    }, [godownItems.length]);

    useEffect(() => {
        if (godownItems.length <= 1) return;
        const timer = setInterval(nextSlide, 3500);
        return () => clearInterval(timer);
    }, [godownItems.length, nextSlide]);

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
            () => {
                setLocationError('Location denied. Showing all shops.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    /* ── Derived data ── */
    const categories = useMemo(() => {
        const cats = new Set(shops.map(s => s.category || 'Kirana'));
        return ['All', ...Array.from(cats).sort()];
    }, [shops]);


    const sortedShops = useMemo(() => {
        let list = shops.map(shop => {
            let distance = Infinity;
            if (userLocation && shop.location?.coordinates?.length === 2) {
                distance = haversine(
                    userLocation.lat, userLocation.lng,
                    shop.location.coordinates[1],
                    shop.location.coordinates[0]
                );
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

    /* ═══════════════════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════════════════ */
    return (
        /* RESTORED THEME: The main wrapper has your custom amber gradient */
        <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-[#FFC107] via-[#F59E0B] to-[#D97706] overflow-hidden font-sans antialiased">

            {/* ════════ HEADER (Transparent so it blends with theme) ════════ */}
            <header className="shrink-0 px-5 py-4 z-10">
                <div className="flex items-center justify-between gap-3">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2 shrink-0">
                        <img src="/muna-logo-new.png" alt="MUNA" className="w-10 h-10 rounded-xl object-contain shadow-sm" />
                        <div className="flex flex-col leading-none">
                            <span className="text-[16px] font-black tracking-tight text-white drop-shadow-sm">MUNA</span>
                            <span className="text-[9px] font-extrabold text-amber-100 tracking-widest uppercase mt-[2px]">
                                In Minutes
                            </span>
                        </div>
                    </Link>

                    {/* Right Actions: Locate Me + Alert Bell */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleLocate}
                            className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-md hover:bg-white/40 transition-colors border border-white/20 flex items-center justify-center text-white active:scale-95"
                            title={userLocation ? 'Located ✓' : 'Locate Me'}
                        >
                            {userLocation ? (
                                <span className="text-[14px]">✓</span>
                            ) : (
                                <IcoPin className="w-5 h-5" />
                            )}
                        </button>
                        <button
                            onClick={() => navigate('/notifications')}
                            className="relative w-10 h-10 rounded-full bg-white/25 backdrop-blur-md hover:bg-white/40 transition-colors border border-white/20 flex items-center justify-center text-white active:scale-95"
                        >
                            <IcoBell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-lg shadow-red-500/40 animate-pulse">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* ════════ SCROLLABLE BODY ════════ */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                {/* --- YELLOW TOP SECTION --- */}
                <div className="pb-6">
                    {/* Slogan */}
                    <div className="px-5 pt-2 pb-5">
                        <div className="text-[28px] md:text-[32px] font-black text-[#1F1300] leading-tight tracking-tight">
                            {homeMsg.line1}
                        </div>
                        <div className="text-[32px] md:text-[36px] font-black text-white leading-tight tracking-tight drop-shadow-md mt-1">
                            {homeMsg.line2}
                        </div>
                    </div>

                    {/* ── Godown Items Carousel ── */}
                    {godownItems.length > 0 && (
                        <div className="px-5">
                            <div className="relative w-full h-[160px] rounded-2xl overflow-hidden shadow-lg shadow-black/15">
                                {godownItems.map((item, idx) => (
                                    <div
                                        key={item._id}
                                        className="absolute inset-0 transition-all duration-700 ease-in-out"
                                        style={{
                                            opacity: idx === carouselIdx ? 1 : 0,
                                            transform: idx === carouselIdx ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.97)',
                                            pointerEvents: idx === carouselIdx ? 'auto' : 'none',
                                        }}
                                    >
                                        <img
                                            src={optimizeImage(item.image)}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Dark gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        {/* Item info */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                                            <div>
                                                <div className="text-[15px] font-black text-white leading-tight drop-shadow-md">{item.name}</div>
                                                {item.category && (
                                                    <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider mt-0.5">{item.category}</div>
                                                )}
                                            </div>
                                            {item.price > 0 && (
                                                <div className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30">
                                                    <span className="text-[14px] font-black text-white">₹{item.price}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {/* Dots indicator */}
                                {godownItems.length > 1 && (
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                        {godownItems.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCarouselIdx(idx)}
                                                className={`rounded-full transition-all duration-300 ${idx === carouselIdx
                                                    ? 'w-5 h-1.5 bg-white shadow-md'
                                                    : 'w-1.5 h-1.5 bg-white/40'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {locationError && <p className="text-center text-[11px] font-bold text-red-700 bg-red-100/80 rounded-lg mx-5 mt-3 py-1.5 backdrop-blur-sm">{locationError}</p>}
                </div>

                {/* --- WHITE BOTTOM SECTION (With Premium Curve) --- */}
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
                                        className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold border transition-all whitespace-nowrap ${isActive
                                                ? 'bg-gradient-to-br from-[#F8CB46] to-[#E5A817] text-[#1a0e00] border-transparent shadow-lg shadow-amber-500/30'
                                                : 'bg-white text-[#6B5020] border-[#E8D5A0] hover:bg-[#FFF4DA]'
                                            }`}
                                    >
                                        {cat === 'All' ? '🏠 All Shops' : cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section Head */}
                    <div className="flex items-center justify-between px-5 pb-4">
                        <h2 className="text-[16px] font-extrabold text-[#1F1300] tracking-tight">
                            {searchQuery
                                ? `"${searchQuery}"`
                                : activeCategory !== 'All'
                                    ? activeCategory
                                    : 'Shops near you'}
                        </h2>
                        <span className="px-2.5 py-1 rounded-full bg-[#FDF3D7] text-[#8C7A55] text-[10px] font-bold border border-[#F0E0A0]">
                            {sortedShops.length} {sortedShops.length === 1 ? 'shop' : 'shops'}
                        </span>
                    </div>

                    {/* Grid Content */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-5 pb-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-[20px] overflow-hidden border border-[#F0E4C0] shadow-sm animate-pulse">
                                    <div className="w-full h-48 bg-gradient-to-r from-[#F5ECD4] to-[#FDF3D7]" />
                                    <div className="p-4">
                                        <div className="h-4 bg-[#F0E8D0] rounded-md w-3/4 mb-3" />
                                        <div className="h-3 bg-[#F0E8D0] rounded-md w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sortedShops.length === 0 ? (
                        <div className="mx-5 my-2 p-8 bg-white text-center rounded-[20px] border border-[#F0E4C0] shadow-sm">
                            <span className="block text-5xl mb-3 opacity-60">🔍</span>
                            <div className="text-[16px] font-extrabold text-[#1F1300] mb-1">
                                {searchQuery ? `No shops found for "${searchQuery}"` : 'No shops available'}
                            </div>
                            <div className="text-[13px] font-medium text-[#8C7A55] mb-4">
                                {searchQuery ? 'Try a different search term' : 'Check back soon!'}
                            </div>
                            {(searchQuery || activeCategory !== 'All') && (
                                <button
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#F8CB46] to-[#E5A817] text-[#1a0e00] text-[13px] font-bold shadow-md shadow-amber-500/20 hover:scale-[1.02] transition-transform"
                                    onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                                >
                                    Show All Shops
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-5 pb-6">
                            {sortedShops.map((shop, idx) => (
                                <Link
                                    to={`/shop/${shop._id}`}
                                    key={shop._id}
                                    className="group block"
                                    style={{ animationFillMode: 'both', animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s` }}
                                >
                                    <div className={`bg-white rounded-[20px] overflow-hidden border border-[#F0E4C0] shadow-sm hover:shadow-[0_12px_32px_rgba(200,170,100,0.18)] hover:-translate-y-1 hover:border-[#F8CB46] transition-all duration-300 ${!shop.isOpen ? 'opacity-75 border-[#E8E0D0]' : ''}`}>

                                        {/* Banner */}
                                        <div className="relative w-full h-48 bg-gradient-to-br from-[#FEF9EB] to-[#FDF3D7] overflow-hidden">
                                            {shop.image ? (
                                                <img
                                                    src={optimizeImage(shop.image)}
                                                    alt={shop.name}
                                                    loading="lazy"
                                                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${!shop.isOpen ? 'grayscale-[0.6] brightness-[0.85]' : ''}`}
                                                />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-[#FEF9EB] to-[#FDF0D0] ${!shop.isOpen ? 'grayscale-[0.8]' : ''}`}>
                                                    🏪
                                                </div>
                                            )}

                                            {/* Top overlay: Status + Rating */}
                                            <div className="absolute top-0 inset-x-0 p-3 flex justify-between items-start bg-gradient-to-b from-black/40 to-transparent">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur-md ${shop.isOpen ? 'bg-green-600/90 shadow-lg shadow-green-900/20' : 'bg-red-700/85'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full bg-white ${shop.isOpen ? 'animate-pulse' : ''}`} />
                                                    {shop.isOpen ? 'Open' : 'Closed'}
                                                </span>
                                                <span className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-[11px] font-extrabold">
                                                    ⭐ {shop.rating || '4.5'}
                                                </span>
                                            </div>

                                            {/* Bottom overlay: Distance */}
                                            {shop.distance !== Infinity && (
                                                <div className="absolute bottom-0 inset-x-0 p-3 flex justify-end bg-gradient-to-t from-black/60 to-transparent">
                                                    <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md text-white text-[10px] font-bold tracking-wide">
                                                        📍 {fmtDist(shop.distance)} away
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Body */}
                                        <div className="p-4">
                                            <h3 className={`text-[16px] font-extrabold truncate tracking-tight mb-1 ${shop.isOpen ? 'text-[#1F1300]' : 'text-[#8C8070]'}`}>
                                                {shop.name}
                                            </h3>
                                            <p className={`text-[12px] font-medium truncate mb-3 ${shop.isOpen ? 'text-[#8C7A55]' : 'text-[#aaa]'}`}>
                                                📍 {shop.address}
                                            </p>

                                            <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                                <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold border ${shop.isOpen ? 'text-[#8B6914] bg-[#FEF9EB] border-[#F0E0A0]' : 'text-[#999] bg-[#f5f5f5] border-[#e8e8e8]'}`}>
                                                    {shop.category || 'Kirana'}
                                                </span>
                                                {shop.udyamNumber && (
                                                    <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold border ${shop.isOpen ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-[#999] bg-[#f5f5f5] border-[#e8e8e8]'}`}>
                                                        🛡️ Verified
                                                    </span>
                                                )}
                                                {shop.location?.coordinates && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            window.open(
                                                                `https://www.google.com/maps/dir/?api=1&destination=${shop.location.coordinates[1]},${shop.location.coordinates[0]}`,
                                                                '_blank'
                                                            );
                                                        }}
                                                        className={`ml-auto shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors ${shop.isOpen ? 'text-[#8B6914] bg-[#FEF9EB] border-[#F0E0A0] hover:bg-[#F8E8B8] hover:border-[#D4B060]' : 'text-[#999] bg-[#f5f5f5] border-[#e5e5e5]'}`}
                                                    >
                                                        🗺️ Directions
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Home;