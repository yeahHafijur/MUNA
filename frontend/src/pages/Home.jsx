import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';
import ProductCard from '../components/ProductCard';
/* ─── Minimal Native Icons (Blinkit Style) ─── */
const IcoSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IcoStar = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 text-amber-500"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>;

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

            {/* ════════ YELLOW THEME HEADER ════════ */}
            <div className="shrink-0 bg-amber-400 pt-10 px-4 pb-4 z-50 shadow-md relative overflow-hidden rounded-b-[20px]">
                {/* Decorative Delivery Element */}
                <div className="absolute right-[-10px] top-2 text-[90px] opacity-[0.15] rotate-12 pointer-events-none drop-shadow-sm">
                    🛵
                </div>
                
                <div className="flex items-center justify-between relative z-10 max-w-7xl mx-auto">
                    {/* Left: Logo & Location */}
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-4 cursor-pointer active:opacity-70 transition-opacity">
                        {/* MUNA Logo */}
                        <div className="w-11 h-11 bg-white rounded-[12px] shadow-sm flex items-center justify-center p-1 shrink-0">
                            <img src="/muna-logo-new.png" alt="MUNA" className="w-full h-full object-contain" />
                        </div>
                        
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[11px] font-black tracking-widest text-amber-950 uppercase flex items-center gap-1.5 mb-0.5">
                                Delivery in 15 mins <span className="text-[14px]">🛵⚡</span>
                            </span>
                            <div className="flex items-center gap-1">
                                <span className="text-[16px] font-black text-slate-900 truncate">
                                    {userLocation ? 'Location updated' : 'Bhalukmari, Assam'}
                                </span>
                                <svg className="w-4 h-4 text-slate-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ SCROLLABLE BODY ════════ */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-24">
                
                <div className="w-full max-w-7xl mx-auto">
                    {/* ── Promo Banners Carousel ── */}
                    <div className="pt-4 pb-2">
                        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4">
                            
                            {/* Banner 1: Blinkit Style Grocery Offer */}
                            <div className="snap-center shrink-0 w-[90vw] sm:w-[360px] h-[160px] rounded-[20px] bg-[#0052FF] p-5 flex flex-col justify-center relative overflow-hidden shadow-[0_4px_15px_rgba(0,82,255,0.15)] active:scale-[0.98] transition-transform cursor-pointer">
                                <div className="absolute top-[-50%] left-[-20%] w-[180px] h-[180px] bg-white rounded-full blur-[60px] opacity-10 pointer-events-none"></div>
                                <div className="relative z-10 w-[70%]">
                                    <span className="inline-block px-2.5 py-1 bg-black/20 text-white text-[10px] font-black uppercase tracking-widest rounded-md mb-2 backdrop-blur-sm">Weekend Special</span>
                                    <h2 className="text-[24px] font-black text-white leading-tight mb-1">MEGA OFFERS</h2>
                                    <p className="text-[12px] font-semibold text-blue-100">Up to 50% OFF on Essentials</p>
                                </div>
                                <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-[100px] drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)] rotate-[-10deg] pointer-events-none">
                                    🛒
                                </div>
                            </div>

                            {/* Banner 2: Fresh Vibrant */}
                            <div className="snap-center shrink-0 w-[90vw] sm:w-[360px] h-[160px] rounded-[20px] bg-[#FFF5EB] p-5 flex flex-col justify-center relative overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer border border-[#F2E4D3]">
                                <div className="relative z-10 w-[65%]">
                                    <span className="inline-block px-2.5 py-1 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-md mb-2">Fresh Arrival</span>
                                    <h2 className="text-[24px] font-black text-[#3A2C1C] leading-tight mb-1">FARM FRESH</h2>
                                    <p className="text-[12px] font-bold text-[#8C7A65]">Straight from local farms</p>
                                </div>
                                <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-[100px] drop-shadow-[0_15px_15px_rgba(0,0,0,0.1)] rotate-[10deg] pointer-events-none">
                                    🍎
                                </div>
                            </div>

                            {/* Banner 3: Blinkit Yellow */}
                            <div className="snap-center shrink-0 w-[90vw] sm:w-[360px] h-[160px] rounded-[20px] bg-[#FFDE00] p-5 flex flex-col justify-center relative overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer border border-[#E6C800]">
                                <div className="relative z-10 w-[70%]">
                                    <span className="inline-block px-2.5 py-1 bg-black/10 text-amber-900 text-[10px] font-black uppercase tracking-widest rounded-md mb-2">Quick Delivery</span>
                                    <h2 className="text-[24px] font-black text-slate-900 leading-tight mb-1">MIDNIGHT CRAVINGS?</h2>
                                    <p className="text-[12px] font-bold text-amber-950/70">We deliver till 2 AM</p>
                                </div>
                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-[100px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.1)] rotate-[-5deg] pointer-events-none">
                                    🍕
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* ── Daily Market ── */}
                    <div className="px-4 py-2 mb-2 md:mx-4">
                        <div
                            onClick={() => navigate('/daily-market')}
                            className="w-full max-w-2xl mx-auto bg-amber-400 rounded-[14px] p-4 flex items-center justify-between shadow-[0_4px_15px_rgba(251,191,36,0.3)] hover:shadow-[0_8px_20px_rgba(251,191,36,0.4)] active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative"
                        >
                            <div className="absolute right-[-10px] top-[-10px] text-[60px] opacity-[0.2] rotate-12 pointer-events-none drop-shadow-sm">
                                🛒
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-[16px] font-black text-amber-950 tracking-tight mb-0.5 drop-shadow-sm">Daily Market</h3>
                                <p className="text-[12px] font-bold text-amber-900/80">Buy & Sell used items locally</p>
                            </div>
                            <div className="relative z-10 bg-white/40 text-amber-950 rounded-full p-2 hover:bg-white/50 transition-colors shadow-sm">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5-7.5" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* ── Global Search Bar ── */}
                    <div className="px-4 pb-4 mt-2">
                        <div
                            onClick={() => navigate('/search')}
                            className="w-full max-w-2xl mx-auto bg-white border border-slate-200 shadow-sm rounded-[14px] px-4 py-3.5 flex items-center gap-3 cursor-text active:scale-[0.99] transition-transform"
                        >
                            <span className="text-slate-400"><IcoSearch /></span>
                            <span className="text-[13px] font-bold text-slate-400">Search for "Atta, Dal, Coke"</span>
                        </div>
                    </div>

                    {/* ── Shop by Category (Horizontal Scroll) ── */}
                    <div className="bg-white px-4 py-6 border-y border-slate-100 mb-2 md:rounded-2xl md:mx-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[15px] font-black text-slate-900">Shop by Category</h3>
                            <span className="text-[12px] font-bold text-amber-500 cursor-pointer" onClick={() => setShowAllCategories(true)}>View All</span>
                        </div>

                        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
                            {categoryList.map(catObj => {
                                const catName = catObj.name;
                                const isActive = activeCategory === catName;
                                const { emoji, bg } = getCategoryIcon(catName);
                                return (
                                    <button
                                        key={catName}
                                        onClick={() => {
                                            setActiveCategory(catName);
                                            const storeList = document.getElementById('store-listing');
                                            if (storeList) {
                                                storeList.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }}
                                        className="flex flex-col items-center gap-2 snap-start shrink-0 w-[72px] active:opacity-60 transition-opacity"
                                    >
                                        <div className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-[32px] overflow-hidden ${isActive ? 'ring-2 ring-slate-900 shadow-md bg-slate-50' : bg}`}>
                                            {catObj.image ? (
                                                <img src={catObj.image} alt={catName} className="w-full h-full object-cover" />
                                            ) : (
                                                emoji
                                            )}
                                        </div>
                                        <span className={`text-[11px] text-center leading-tight px-1 ${isActive ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                                            {catName === 'All' ? 'All' : catName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Top Sellers (Horizontal Scroll) ── */}
                    {featuredProducts && featuredProducts.length > 0 && (
                        <div className="bg-white px-4 py-6 border-b border-slate-100 mb-2 md:rounded-2xl md:mx-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[15px] font-black text-slate-900">Bestsellers</h3>
                            </div>
                            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
                                {featuredProducts.slice(0, 8).map(prod => {
                                    const shopIdToNavigate = prod.shopId?._id || prod.shopId;
                                    const navigateToProduct = () => {
                                        shopIdToNavigate ? navigate(`/shop/${shopIdToNavigate}`) : navigate(`/search?q=${encodeURIComponent(prod.name)}`)
                                    };
                                    return (
                                        <div key={prod._id} className="snap-start shrink-0 w-[140px] sm:w-[160px]">
                                            <ProductCard 
                                                product={prod}
                                                onClick={navigateToProduct}
                                                onAddClick={(e) => {
                                                    e.stopPropagation();
                                                    navigateToProduct();
                                                }}
                                                discount="15%"
                                                deliveryTime="10 MINS"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Store Listing (Premium Immersive Cards) ── */}
                    <div id="store-listing" className="min-h-[50vh] px-3 py-5 md:mx-4">
                        <div className="flex items-center justify-between mb-5 px-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[20px]">🏪</span>
                                <div>
                                    <h3 className="text-[16px] font-black text-slate-900 tracking-tight leading-none">
                                        {activeCategory !== 'All' ? `${activeCategory} Stores` : 'Stores Around You'}
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                        {sortedShops.length} {sortedShops.length === 1 ? 'store' : 'stores'} available
                                    </p>
                                </div>
                            </div>
                            {activeCategory !== 'All' && (
                                <button className="text-[11px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full active:scale-95 transition-transform border border-amber-100" onClick={() => setActiveCategory('All')}>✕ Clear</button>
                            )}
                        </div>

                        <div className={sortedShops.length > 0 && !loading ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4" : "space-y-4"}>
                            {loading ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="rounded-[20px] overflow-hidden animate-pulse bg-white shadow-sm">
                                            <div className="w-full aspect-[4/3] bg-slate-100" />
                                            <div className="p-3 space-y-2">
                                                <div className="h-4 bg-slate-100 w-3/4 rounded-full" />
                                                <div className="h-3 bg-slate-100 w-1/2 rounded-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : sortedShops.length === 0 ? (
                                <div className="text-center py-14 bg-gradient-to-b from-slate-50 to-white rounded-[24px] border border-slate-100 border-dashed col-span-full mx-1">
                                    <span className="text-5xl block mb-3 animate-bounce">🔍</span>
                                    <p className="text-[14px] font-black text-slate-400">No stores found</p>
                                    <p className="text-[11px] font-semibold text-slate-300 mt-1">Try a different category</p>
                                </div>
                            ) : (
                                sortedShops.map((shop) => {
                                    const distVal = shop.distance !== Infinity ? shop.distance : 1.5;
                                    const isFast = distVal < 2;

                                    return (
                                        <Link
                                            to={`/shop/${shop._id}`}
                                            key={shop._id}
                                            className={`group flex flex-col rounded-[20px] overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] active:scale-[0.97] transition-all duration-200 ${!shop.isOpen ? 'opacity-50 grayscale-[0.4]' : ''}`}
                                        >
                                            {/* Image with Gradient Overlay */}
                                            <div className="w-full aspect-[4/3] relative overflow-hidden">
                                                {shop.image ? (
                                                    <img src={optimizeImage(shop.image, 400)} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-amber-50 to-orange-50">🏪</div>
                                                )}

                                                {/* Bottom gradient for text readability */}
                                                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

                                                {/* Floating delivery badge */}
                                                <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black tracking-wider uppercase backdrop-blur-md shadow-sm ${isFast ? 'bg-emerald-500/90 text-white' : 'bg-white/90 text-slate-700'}`}>
                                                    <IcoTimer />
                                                    {isFast ? '15 MIN' : '30 MIN'}
                                                </div>

                                                {/* Rating badge */}
                                                <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-md px-1.5 py-1 rounded-full text-[10px] font-black text-amber-700 shadow-sm">
                                                    <IcoStar /> {shop.rating || '4.5'}
                                                </div>

                                                {/* Closed overlay */}
                                                {!shop.isOpen && (
                                                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                                                        <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg tracking-wider">CLOSED</span>
                                                    </div>
                                                )}

                                                {/* Shop name on image */}
                                                <div className="absolute bottom-2 left-2 right-2">
                                                    <h3 className="text-[13px] font-black text-white leading-tight line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">{shop.name}</h3>
                                                </div>
                                            </div>

                                            {/* Bottom info strip */}
                                            <div className="px-2.5 py-2 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                                                <p className="text-[10px] font-bold text-slate-500 truncate flex-1">
                                                    {shop.category || 'Kirana & Grocery'}
                                                </p>
                                                {shop.isOpen && (
                                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ── New on MUNA (Recently Added Shops) ── */}
                    {(() => {
                        // Sort by createdAt if available, otherwise just take the last added ones
                        const newShops = [...shops]
                            .sort((a, b) => {
                                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                                return dateB - dateA;
                            })
                            .slice(0, 6);
                            
                        if (newShops.length === 0) return null;
                        return (
                            <div className="px-4 py-6 mb-2">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-[18px]">✨</span>
                                    <h3 className="text-[16px] font-black text-slate-900 tracking-tight">New on MUNA</h3>
                                </div>
                                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
                                    {newShops.map(shop => (
                                        <Link
                                            to={`/shop/${shop._id}`}
                                            key={shop._id}
                                            className="snap-start shrink-0 w-[200px] rounded-[20px] overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-all group"
                                        >
                                            <div className="w-full h-[120px] relative overflow-hidden">
                                                {shop.image ? (
                                                    <img src={optimizeImage(shop.image, 400)} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-amber-50 to-orange-50">🏪</div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
                                                <div className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-[8px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-sm">NEW</div>
                                                <h4 className="absolute bottom-2 left-2 right-2 text-[12px] font-black text-white line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">{shop.name}</h4>
                                            </div>
                                            <div className="px-3 py-2">
                                                <p className="text-[10px] font-bold text-slate-400 truncate">{shop.category || 'Kirana & Grocery'}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── Become a Seller CTA ── */}
                    <div className="px-4 py-3 mb-4 md:mx-4">
                        <div
                            onClick={() => navigate('/vendor-request')}
                            className="w-full max-w-2xl mx-auto bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 rounded-[20px] p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(251,191,36,0.3)] active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative"
                        >
                            <div className="absolute right-[-20px] bottom-[-20px] text-[100px] opacity-[0.15] rotate-[-15deg] pointer-events-none">
                                🏪
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center text-[28px] shadow-inner shrink-0">
                                🚀
                            </div>
                            <div className="relative z-10 flex-1">
                                <h3 className="text-[16px] font-black text-amber-950 tracking-tight leading-tight mb-0.5">Become a Seller</h3>
                                <p className="text-[12px] font-bold text-amber-900/70">Start selling on MUNA — reach thousands of local customers!</p>
                            </div>
                            <div className="relative z-10 bg-white/30 backdrop-blur-sm text-amber-950 rounded-full p-2.5 shrink-0">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="bg-slate-900 rounded-t-[32px] px-6 pt-8 pb-28 mt-2">
                        {/* Brand */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-md">
                                <img src="/muna-logo-new.png" alt="MUNA" className="w-7 h-7 object-contain" />
                            </div>
                            <div>
                                <h4 className="text-[16px] font-black text-white tracking-tight">MUNA</h4>
                                <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Delivery in Minutes</p>
                            </div>
                        </div>

                        {/* Links Grid */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8">
                            <button onClick={() => navigate('/profile')} className="text-left text-[12px] font-bold text-slate-400 hover:text-white transition-colors">My Account</button>
                            <button onClick={() => navigate('/orders')} className="text-left text-[12px] font-bold text-slate-400 hover:text-white transition-colors">My Orders</button>
                            <button onClick={() => navigate('/daily-market')} className="text-left text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Daily Market</button>
                            <button onClick={() => navigate('/wishlist')} className="text-left text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Wishlist</button>
                            <button onClick={() => navigate('/privacy-policy')} className="text-left text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Privacy Policy</button>
                            <button onClick={() => navigate('/settings')} className="text-left text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Settings</button>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-slate-800 mb-5" />

                        {/* Bottom */}
                        <div className="text-center">
                            <p className="text-[11px] font-bold text-slate-600 mb-1">Made with ❤️ in Assam</p>
                            <p className="text-[10px] font-semibold text-slate-700">© {new Date().getFullYear()} MUNA. All rights reserved.</p>
                        </div>
                    </div>

                </div>

            </div>
            
            {/* ─── ALL CATEGORIES MODAL ─── */}
            {showAllCategories && (
                <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
                    <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
                        <button onClick={() => setShowAllCategories(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 active:scale-95 transition-transform">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                        </button>
                        <h2 className="text-[16px] font-black text-slate-900 tracking-tight">All Categories</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-6 gap-x-3">
                            {categoryList.map(catObj => {
                                const catName = catObj.name;
                                const isActive = activeCategory === catName;
                                const { emoji, bg } = getCategoryIcon(catName);
                                return (
                                    <button
                                        key={catName}
                                        onClick={() => {
                                            setShowAllCategories(false);
                                            setActiveCategory(catName);
                                            // Optional: Scroll to store listing
                                            setTimeout(() => {
                                                const storeList = document.getElementById('store-listing');
                                                if(storeList) {
                                                    storeList.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }, 100);
                                        }}
                                        className="flex flex-col items-center gap-2 active:opacity-60 transition-opacity"
                                    >
                                        <div className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-[32px] overflow-hidden shadow-sm ${isActive ? 'ring-2 ring-slate-900 bg-slate-50' : bg}`}>
                                            {catObj.image ? (
                                                <img src={catObj.image} alt={catName} className="w-full h-full object-cover" />
                                            ) : (
                                                emoji
                                            )}
                                        </div>
                                        <span className={`text-[11px] text-center leading-tight px-1 ${isActive ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                            {catName === 'All' ? 'All' : catName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;