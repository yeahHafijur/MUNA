import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { useUnreadChats } from '../hooks/useUnreadChats';

/* ─── Premium Native Icons ─── */
const IcoSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IcoMapPin = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-amber-500"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>;
const IcoBell = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const IcoUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const IcoStar = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 text-white"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>;
const IcoStore = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>;

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
    const [locationText, setLocationText] = useState("Fetching location...");
    const [activeCategory, setActiveCategory] = useState('All');

    // Hardcoded categories for a visual visual menu
    const categoryMenu = [
        { name: 'All', icon: '🏪' },
        { name: 'Kirana', icon: '🍚' },
        { name: 'Vegetables', icon: '🥬' },
        { name: 'Pharmacy', icon: '💊' },
        { name: 'Meat', icon: '🥩' },
        { name: 'Dairy', icon: '🥛' },
        { name: 'Bakery', icon: '🍞' }
    ];

    /* ── Fetch Data ── */
    const { data: shops = [], isLoading: loading } = useQuery({
        queryKey: ['shops'],
        queryFn: () => fetch('/api/shops').then(r => r.json()),
    });

    const { data: homeMsg = { line1: 'Delivery in', line2: '15 Minutes' } } = useQuery({
        queryKey: ['navbar-message'],
        queryFn: () => fetch('/api/settings/navbar-message').then(r => r.json()),
    });

    const { data: unreadCount = 0 } = useUnreadNotifications();
    const { data: unreadChatCount = 0 } = useUnreadChats();
    const totalAlerts = unreadCount + unreadChatCount;

    /* ── Carousel ── */
    const { data: godownItems = [] } = useQuery({
        queryKey: ['featured-carousel'],
        queryFn: () => fetch('/api/settings/featured-items').then(r => r.json()),
        select: (data) => (Array.isArray(data) ? data : []).filter(item => item.image),
    });

    const [carouselIdx, setCarouselIdx] = useState(0);
    useEffect(() => {
        if (godownItems.length <= 1) return;
        const timer = setInterval(() => {
            setCarouselIdx(prev => (prev + 1) % godownItems.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [godownItems.length]);

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
    const sortedShops = useMemo(() => {
        let list = shops.map(shop => {
            let distance = Infinity;
            if (userLocation && shop.location?.coordinates?.length === 2) {
                distance = haversine(userLocation.lat, userLocation.lng, shop.location.coordinates[1], shop.location.coordinates[0]);
            }
            return { ...shop, distance };
        });

        if (activeCategory !== 'All') {
            list = list.filter(s => (s.category || 'Kirana').includes(activeCategory));
        }

        return list.sort((a, b) => {
            if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
            return a.distance - b.distance;
        });
    }, [shops, userLocation, activeCategory]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">

            {/* ════════ HEADER SECTION ════════ */}
            <header className="bg-white px-4 pt-3 pb-4 sticky top-0 z-50 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">

                {/* Top Row: Location & Profile */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-4">
                        <IcoMapPin />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[15px] font-black text-slate-900 truncate tracking-tight flex items-center gap-1">
                                {homeMsg.line2}
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-amber-500"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 truncate">{locationText}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => navigate('/notifications')} className="relative text-slate-700 active:scale-95 transition-transform">
                            <IcoBell />
                            {totalAlerts > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">{totalAlerts}</span>}
                        </button>
                        <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-transform">
                            {user?.name ? <span className="font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span> : <IcoUser />}
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div
                    onClick={() => navigate('/search')}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 cursor-text active:scale-[0.98] transition-transform"
                >
                    <span className="text-amber-500"><IcoSearch /></span>
                    <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-900 leading-none mb-0.5">Search for "{homeMsg.line1.replace(/[^a-zA-Z ]/g, "").trim() || 'Groceries'}"</span>
                        <span className="text-[10px] font-medium text-slate-500">Over 5,000 products available</span>
                    </div>
                </div>
            </header>

            {/* ════════ MAIN CONTENT ════════ */}
            <main className="pt-4">

                {/* ── Visual Category Menu ── */}
                <div className="px-4 mb-6">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
                        {categoryMenu.map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className="flex flex-col items-center gap-2 shrink-0 snap-start active:scale-95 transition-transform"
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-colors border ${activeCategory === cat.name ? 'bg-amber-100 border-amber-300' : 'bg-white border-slate-100'}`}>
                                    {cat.icon}
                                </div>
                                <span className={`text-[11px] font-bold ${activeCategory === cat.name ? 'text-amber-700' : 'text-slate-600'}`}>
                                    {cat.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Promotional Carousel ── */}
                {godownItems.length > 0 && (
                    <div className="px-4 mb-8">
                        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden bg-slate-200">
                            {godownItems.map((item, idx) => (
                                <img
                                    key={item._id}
                                    src={optimizeImage(item.image, 800)}
                                    alt="Promo"
                                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${idx === carouselIdx ? 'opacity-100' : 'opacity-0'}`}
                                />
                            ))}
                            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 z-10">
                                {godownItems.map((_, idx) => (
                                    <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === carouselIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Daily Market CTA ── */}
                <div className="px-4 mb-8">
                    <div onClick={() => navigate('/daily-market')} className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
                        <div>
                            <h3 className="text-white font-black text-sm tracking-wide mb-1">Muna Daily Market</h3>
                            <p className="text-slate-400 text-[11px] font-semibold">Buy & Sell used items locally</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                            ➔
                        </div>
                    </div>
                </div>

                {/* ── Stores List ── */}
                <div className="px-4">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center justify-between">
                        {activeCategory === 'All' ? 'Stores Near You' : `${activeCategory} Stores`}
                        <span className="text-xs font-bold text-slate-500">{sortedShops.length} options</span>
                    </h2>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-2xl p-3 border border-slate-100 flex gap-4 animate-pulse">
                                    <div className="w-20 h-20 bg-slate-100 rounded-xl shrink-0" />
                                    <div className="flex-1 py-1">
                                        <div className="h-4 bg-slate-100 w-2/3 rounded mb-2" />
                                        <div className="h-3 bg-slate-100 w-1/2 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sortedShops.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
                            <span className="text-4xl opacity-50 mb-2 block">🏪</span>
                            <h3 className="text-sm font-bold text-slate-900">No stores found</h3>
                            <p className="text-xs font-medium text-slate-500 mt-1">Try selecting a different category</p>
                            <button onClick={() => setActiveCategory('All')} className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">View All Stores</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sortedShops.map((shop) => (
                                <Link
                                    to={`/shop/${shop._id}`}
                                    key={shop._id}
                                    className={`bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex gap-4 active:scale-[0.98] transition-all ${!shop.isOpen ? 'opacity-60' : ''}`}
                                >
                                    {/* Store Image */}
                                    <div className="w-20 h-20 rounded-xl bg-slate-50 shrink-0 relative overflow-hidden border border-slate-100">
                                        {shop.image ? (
                                            <img src={optimizeImage(shop.image, 200)} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><IcoStore /></div>
                                        )}
                                        {/* Rating Badge on Image */}
                                        <div className="absolute bottom-1 left-1 bg-green-600/90 backdrop-blur text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                            <span>{shop.rating || '4.5'}</span> <IcoStar />
                                        </div>
                                    </div>

                                    {/* Store Details */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className="text-sm font-bold text-slate-900 truncate pr-2">{shop.name}</h3>
                                            {!shop.isOpen && (
                                                <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-1.5 py-0.5 rounded shrink-0">Closed</span>
                                            )}
                                        </div>

                                        <p className="text-[11px] font-semibold text-slate-500 truncate mb-1">
                                            {shop.category || 'Kirana Store'}
                                        </p>

                                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 mt-auto">
                                            <span className="flex items-center gap-1">
                                                <IcoMapPin />
                                                {shop.distance !== Infinity ? fmtDist(shop.distance) : 'Nearby'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                ⏱️ {shop.distance < 2 ? '15 mins' : '30 mins'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Home;