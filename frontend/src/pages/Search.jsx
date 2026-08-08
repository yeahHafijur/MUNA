import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import { optimizeImage } from '../utils/imageUtils';
import ProductCard from '../components/ProductCard';

/* ─── Sharp Premium Outlined Icons ─── */
const IcoSearch = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const IcoBack = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const IcoTime = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-3 h-3 mr-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SearchSkeleton = () => (
    <div className="mb-6">
        <div className="h-3 w-24 bg-slate-200 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="h-28 bg-slate-50 animate-pulse" />
                    <div className="p-3">
                        <div className="h-3 w-3/4 bg-slate-200 rounded animate-pulse mb-2" />
                        <div className="h-2.5 w-1/2 bg-slate-100 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const Search = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart, overrideAndReplaceCart } = useCart();

    const [query, setQuery] = useState(() => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('q') || '';
    });
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const [replacePrompt, setReplacePrompt] = useState(null);

    const inputRef = useRef(null);

    // Auto-focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // 🚀 400ms Debounce Hook Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    // 🚀 TanStack React Query for Caching & Fetching
    const { data: results = { shops: [], products: [] }, isFetching } = useQuery({
        queryKey: ['search', debouncedQuery],
        queryFn: async () => {
            const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, { credentials: 'include' });
            if (!res.ok) throw new Error("Search failed");
            return res.json();
        },
        enabled: debouncedQuery.length > 0, // Sirf tab call hoga jab query mein kuch hoga
        staleTime: 1000 * 60 * 5, // 5 minutes tak result cache rahega (Instant loading!)
    });

    const hasSearched = debouncedQuery.length > 0;
    const isLoading = isFetching;

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();

        if (!product.shopIsOpen) {
            toast.warning("This shop is currently closed.");
            return;
        }

        const res = addToCart(product, product.shopId);
        if (res && res.success === false && res.error === 'DIFFERENT_SHOP_ERROR') {
            setReplacePrompt(product);
            return;
        }

        // Vibrate on supported devices
        if (navigator.vibrate) navigator.vibrate(50);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans pb-24 text-slate-800">

            {/* ── YELLOW THEME HEADER ── */}
            <div className="sticky top-0 z-50 bg-amber-400 pt-10 px-4 pb-4 shadow-md overflow-hidden rounded-b-[20px]">
                {/* Decorative Delivery Element */}
                <div className="absolute right-[-10px] top-2 text-[90px] opacity-[0.15] rotate-12 pointer-events-none drop-shadow-sm">
                    🛵
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-11 h-11 bg-white/50 border border-white/60 text-slate-800 rounded-full active:scale-95 transition-transform flex items-center justify-center shrink-0 shadow-sm"
                    >
                        <div className="w-5 h-5"><IcoBack /></div>
                    </button>
                    <div className="relative flex-1 flex items-center">
                        <span className="absolute left-3.5 text-amber-500 w-[18px] h-[18px] pointer-events-none">
                            <IcoSearch />
                        </span>
                        <input
                            ref={inputRef}
                            type="search"
                            name="q"
                            id="search-input"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            className="w-full py-3.5 pl-10 pr-10 bg-white border-0 shadow-[0_2px_15px_rgba(0,0,0,0.06)] rounded-[14px] text-[13px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none active:scale-[0.99] transition-transform"
                            placeholder="Search for items, stores or categories..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query && (
                            <button
                                className="absolute right-3 w-5 h-5 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black flex items-center justify-center active:scale-90"
                                onClick={() => setQuery('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Results Area ── */}
            <div className="p-4 flex-1">

                {isLoading && <SearchSkeleton />}

                {/* ── Minimal Empty State ── */}
                {!isLoading && hasSearched && (!results?.shops || results.shops.length === 0) && (!results?.products || results.products.length === 0) && (
                    <div className="text-center py-16 bg-white rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] max-w-md mx-auto mt-2">
                        <div className="text-5xl mb-3 opacity-80">
                            🔍
                        </div>
                        <h3 className="text-[16px] font-black text-slate-900 mb-1 tracking-tight">No results found</h3>
                        <p className="text-[12px] font-medium text-slate-500 px-8 leading-relaxed">We couldn't find anything matching "{debouncedQuery}". Try checking for typos or using more general terms.</p>
                    </div>
                )}

                {/* ── STORES RESULTS ── */}
                {!isLoading && results?.shops?.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Stores Near You</h2>
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-md">{results.shops.length}</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {results.shops.map(shop => (
                                <Link to={`/shop/${shop._id}`} key={`shop-${shop._id}`} className={`flex bg-white rounded-[14px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden active:bg-slate-50 transition-colors ${!shop.isOpen ? 'opacity-60 grayscale-[0.3]' : ''}`}>
                                    <div className="w-[80px] h-[80px] bg-slate-50 relative shrink-0 flex items-center justify-center border-r border-slate-100/50 p-1">
                                        {shop.image ? (
                                            <img src={optimizeImage(shop.image, 200)} alt={shop.name} className="w-full h-full object-cover rounded-[10px]" />
                                        ) : (
                                            <span className="text-3xl">🏪</span>
                                        )}
                                        {!shop.isOpen && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-[10px]">
                                                <span className="bg-slate-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">CLOSED</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 flex flex-col justify-center min-w-0 flex-1">
                                        <h4 className="text-[14px] font-black text-slate-900 truncate tracking-tight mb-0.5">{shop.name}</h4>
                                        <p className="text-[11px] font-semibold text-slate-400 truncate mb-1">{shop.address}</p>
                                        <div className="flex items-center gap-2 mt-auto">
                                            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5"><IcoTime /> 15 MINS</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── PRODUCTS RESULTS ── */}
                {!isLoading && results?.products?.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Products</h2>
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-md">{results.products.length}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {results.products.map(product => (
                                <div key={`prod-${product._id}`}>
                                    <ProductCard 
                                        product={product}
                                        onClick={() => navigate(`/shop/${product.shopId}`)}
                                        onAddClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToCart(e, product);
                                        }}
                                        discount="15%"
                                        deliveryTime="10 MINS"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Rich Initial View (Blinkit Style) ── */}
                {!hasSearched && !isLoading && (
                    <div className="pt-2 pb-10 animate-in fade-in duration-200">
                        {/* Trending Searches */}
                        <div className="mb-8">
                            <h3 className="text-[14px] font-black text-slate-800 mb-3 px-1">Trending Searches</h3>
                            <div className="flex flex-wrap gap-2">
                                {['Milk & Bread', 'Fresh Vegetables', 'Maggi', 'Cold Drinks', 'Chicken', 'Eggs', 'Snacks'].map((tag, i) => (
                                    <span
                                        key={tag}
                                        onClick={() => setQuery(tag)}
                                        className="bg-white border border-slate-200/70 px-4 py-2 rounded-[12px] text-[13px] font-bold text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:bg-amber-100 active:text-amber-900 active:border-amber-200 transition-colors cursor-pointer"
                                    >
                                        {i === 0 ? '🔥 ' : ''}{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Explore Categories - Emoji Grid */}
                        <div className="mb-6">
                            <h3 className="text-[14px] font-black text-slate-800 mb-3 px-1">Explore Categories</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { name: 'Vegetables', emoji: '🥦' },
                                    { name: 'Fruits', emoji: '🍎' },
                                    { name: 'Meat & Fish', emoji: '🍗' },
                                    { name: 'Dairy', emoji: '🥛' },
                                    { name: 'Sweets', emoji: '🍫' },
                                    { name: 'Cleaning', emoji: '🧼' },
                                ].map((cat) => (
                                    <div
                                        key={cat.name}
                                        onClick={() => setQuery(cat.name)}
                                        className="flex flex-col items-center justify-center bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] active:scale-95 transition-transform cursor-pointer"
                                    >
                                        <span className="text-3xl mb-2 drop-shadow-sm">{cat.emoji}</span>
                                        <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">{cat.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Type to find placeholder */}
                        <div className="flex flex-col items-center justify-center pt-10 opacity-40 pointer-events-none">
                            <span className="text-4xl mb-2">🛒</span>
                            <span className="text-[12px] font-bold text-slate-500 text-center">
                                Type to find products & stores
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ════════ REPLACE CART MODAL ════════ */}
            {replacePrompt && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🛒</span>
                        </div>
                        <h3 className="text-xl font-black text-center text-gray-900 mb-2">Replace cart item?</h3>
                        <p className="text-sm text-center text-gray-500 font-medium mb-6 leading-relaxed">
                            Your cart contains dishes from another shop. Do you want to discard the selection and add dishes from <span className="text-amber-600 font-bold">{replacePrompt?.shopName || 'this shop'}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setReplacePrompt(null)}
                                className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                No, thanks
                            </button>
                            <button
                                onClick={() => {
                                    overrideAndReplaceCart(replacePrompt, replacePrompt.shopId);
                                    setReplacePrompt(null);
                                    if (navigator.vibrate) navigator.vibrate(50);
                                }}
                                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md hover:shadow-lg transition-all"
                            >
                                Replace
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;