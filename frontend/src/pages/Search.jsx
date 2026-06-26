import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import { optimizeImage } from '../utils/imageUtils';

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

const IcoShop = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
);

const IcoProduct = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);

const IcoDairy = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);

const IcoVeggies = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
);

const IcoSnacks = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
);

const IcoDrinks = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
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
    const { addToCart, overrideAndReplaceCart } = useCart();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ shops: [], products: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [replacePrompt, setReplacePrompt] = useState(null);

    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults({ shops: [], products: [] });
                setHasSearched(false);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data);
                setHasSearched(true);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchResults();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

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
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans pb-24 text-slate-800">

            {/* ── Sticky Ultra-Clean Top Bar ── */}
            <div className="sticky top-0 z-50 bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="p-1.5 text-slate-700 rounded-lg active:bg-slate-50 transition-colors flex items-center justify-center"
                >
                    <div className="w-5 h-5"><IcoBack /></div>
                </button>
                <div className="relative flex-1 flex items-center">
                    <span className="absolute left-3.5 text-slate-400 w-[18px] h-[18px] pointer-events-none">
                        <IcoSearch />
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full py-2.5 pl-11 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-800 focus:ring-0 transition-all"
                        placeholder="Search for items, stores or categories..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <button
                            className="absolute right-3 w-5 h-5 bg-slate-200 text-slate-600 rounded-full text-[9px] font-bold flex items-center justify-center active:scale-90"
                            onClick={() => setQuery('')}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* ── Results Area ── */}
            <div className="p-4 flex-1">

                {isLoading && <SearchSkeleton />}

                {/* ── Minimal Empty State ── */}
                {!isLoading && hasSearched && results.shops.length === 0 && results.products.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-md mx-auto mt-2">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <div className="w-5 h-5"><IcoSearch /></div>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1 tracking-tight">No results found</h3>
                        <p className="text-xs font-medium text-slate-400 px-8 leading-relaxed">We couldn't find anything matching "{query}". Check spelling or try another term.</p>
                    </div>
                )}

                {/* ── STORES RESULTS ── */}
                {!isLoading && results.shops.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stores Near You</h2>
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">{results.shops.length}</span>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            {results.shops.map(shop => (
                                <Link to={`/shop/${shop._id}`} key={`shop-${shop._id}`} className="flex bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden active:bg-slate-50/50 transition-colors">
                                    <div className="w-20 min-h-[75px] bg-slate-50 relative shrink-0 flex items-center justify-center border-r border-slate-50">
                                        {shop.image ? (
                                            <img src={optimizeImage(shop.image)} alt={shop.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <IcoShop />
                                        )}
                                        <div className={`absolute bottom-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded text-white tracking-wide uppercase ${shop.isOpen ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                            {shop.isOpen ? 'Open' : 'Closed'}
                                        </div>
                                    </div>
                                    <div className="p-3 flex flex-col justify-center min-w-0">
                                        <h4 className="text-sm font-bold text-slate-900 truncate tracking-tight mb-0.5">{shop.name}</h4>
                                        <p className="text-xs font-medium text-slate-400 truncate">{shop.address}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── PRODUCTS RESULTS ── */}
                {!isLoading && results.products.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Products</h2>
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">{results.products.length}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                            {results.products.map(product => (
                                <div key={`prod-${product._id}`} className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all ${!product.inStock || !product.shopIsOpen ? 'opacity-60' : ''}`}>
                                    <Link to={`/shop/${product.shopId}`} className="h-28 bg-slate-50/50 p-3 relative flex items-center justify-center border-b border-slate-50">
                                        {product.image ? (
                                            <img src={optimizeImage(product.image, 200)} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                                        ) : (
                                            <IcoProduct />
                                        )}
                                        {(!product.inStock || !product.shopIsOpen) && (
                                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                                                <span className="bg-white text-slate-900 text-[9px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                                                    {!product.shopIsOpen ? 'Closed' : 'Out of Stock'}
                                                </span>
                                            </div>
                                        )}
                                    </Link>

                                    <div className="p-3 flex flex-col flex-1">
                                        <div className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded tracking-wide mb-1.5 self-start">
                                            <IcoTime /> 15 MINS
                                        </div>
                                        <Link to={`/shop/${product.shopId}`} className="block flex-1 mb-2">
                                            <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 tracking-tight">{product.name}</h4>
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">By {product.shopName}</p>
                                        </Link>
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-sm font-bold text-slate-900">₹{product.price}</span>
                                            <button
                                                className="bg-white text-emerald-600 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-bold hover:border-emerald-600 active:scale-95 transition-all disabled:border-slate-100 disabled:text-slate-300 disabled:bg-slate-50"
                                                onClick={(e) => handleAddToCart(e, product)}
                                                disabled={!product.inStock || !product.shopIsOpen}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Professional Dashboard Initial View ── */}
                {!hasSearched && !isLoading && (
                    <div className="space-y-6 pt-1 animate-in fade-in duration-200">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Popular Categories</h3>
                            <div className="grid grid-cols-4 gap-2.5">
                                <div className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform group" onClick={() => setQuery('Milk')}>
                                    <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-1.5 group-hover:border-slate-300 transition-colors"><IcoDairy /></div>
                                    <span className="text-xs font-medium text-slate-600 tracking-tight">Dairy</span>
                                </div>
                                <div className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform group" onClick={() => setQuery('Vegetable')}>
                                    <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-1.5 group-hover:border-slate-300 transition-colors"><IcoVeggies /></div>
                                    <span className="text-xs font-medium text-slate-600 tracking-tight">Veggies</span>
                                </div>
                                <div className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform group" onClick={() => setQuery('Snacks')}>
                                    <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-1.5 group-hover:border-slate-300 transition-colors"><IcoSnacks /></div>
                                    <span className="text-xs font-medium text-slate-600 tracking-tight">Snacks</span>
                                </div>
                                <div className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform group" onClick={() => setQuery('Drink')}>
                                    <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-1.5 group-hover:border-slate-300 transition-colors"><IcoDrinks /></div>
                                    <span className="text-xs font-medium text-slate-600 tracking-tight">Drinks</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">Trending Searches</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {['Atta', 'Bread', 'Eggs', 'Maggi', 'Cold Drink', 'Rice', 'Chips'].map(tag => (
                                    <span
                                        key={tag}
                                        onClick={() => setQuery(tag)}
                                        className="bg-white border border-slate-200/70 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 shadow-none active:bg-slate-900 active:text-white active:border-slate-900 transition-colors cursor-pointer tracking-tight"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
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