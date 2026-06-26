import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import { optimizeImage } from '../utils/imageUtils';

/* ─── Premium SVG Icons ─── */
const IcoSearch = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const IcoBack = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const IcoShop = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 opacity-40">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
);

const IcoProduct = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);

const IcoDairy = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-blue-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);

const IcoVeggies = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-emerald-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
);

const IcoSnacks = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-red-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
);

const IcoDrinks = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-amber-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
);

const IcoTime = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3 mr-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

/* ─── Tailwind Skeleton Loader ─── */
const SearchSkeleton = () => (
    <div className="mb-6">
        <div className="h-4 w-32 bg-gray-200 rounded-md mb-4 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="h-28 bg-gray-100 animate-pulse" />
                    <div className="p-3">
                        <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const Search = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ shops: [], products: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const inputRef = useRef(null);

    // Auto focus search input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Debounced search
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
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();

        if (!product.shopIsOpen) {
            toast.warning("This shop is currently closed.");
            return;
        }

        const success = addToCart(product, product.shopId);
        if (success) {
            // Optional: toast success
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans pb-24">

            {/* ── Sticky Top Bar ── */}
            <div className="sticky top-0 z-50 bg-white px-3 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-center gap-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-1 text-gray-800 rounded-full active:scale-90 active:bg-gray-100 transition-all flex items-center justify-center"
                >
                    <div className="w-[22px] h-[22px]"><IcoBack /></div>
                </button>
                <div className="relative flex-1 flex items-center">
                    <span className="absolute left-3.5 text-amber-500 w-[18px] h-[18px] pointer-events-none">
                        <IcoSearch />
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full py-3.5 pl-11 pr-10 bg-gray-50 border border-gray-100 rounded-[18px] text-[15px] font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all shadow-inner"
                        placeholder="Search for atta, dal, coke..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <button
                            className="absolute right-3 w-6 h-6 bg-gray-200 text-gray-500 rounded-full text-[10px] font-black flex items-center justify-center active:scale-90 transition-transform"
                            onClick={() => setQuery('')}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* ── Scrollable Results Area ── */}
            <div className="p-4 flex-1">

                {isLoading && <SearchSkeleton />}

                {/* ── Empty State ── */}
                {!isLoading && hasSearched && results.shops.length === 0 && results.products.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-[24px] shadow-sm border border-gray-100 mt-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                            <div className="w-9 h-9"><IcoSearch /></div>
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-900 mb-2 tracking-tight">Item not found</h3>
                        <p className="text-sm font-medium text-gray-500 px-6 leading-relaxed">We couldn't find anything for "{query}". Try searching for something else.</p>
                    </div>
                )}

                {/* ── SHOPS RESULTS ── */}
                {!isLoading && results.shops.length > 0 && (
                    <div className="mb-8 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Stores Near You</h2>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">{results.shops.length}</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {results.shops.map(shop => (
                                <Link to={`/shop/${shop._id}`} key={`shop-${shop._id}`} className="flex bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden active:scale-[0.98] transition-all">
                                    <div className="w-[90px] min-h-[85px] bg-gradient-to-br from-amber-50 to-amber-100 relative shrink-0 flex items-center justify-center">
                                        {shop.image ? (
                                            <img src={optimizeImage(shop.image)} alt={shop.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <IcoShop />
                                        )}
                                        <div className={`absolute bottom-1.5 left-1.5 text-[9px] font-black px-2 py-0.5 rounded-[6px] text-white uppercase tracking-wider shadow-sm ${shop.isOpen ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {shop.isOpen ? 'Open' : 'Closed'}
                                        </div>
                                    </div>
                                    <div className="p-3.5 flex flex-col justify-center min-w-0">
                                        <h4 className="text-sm font-extrabold text-gray-900 truncate tracking-tight mb-0.5">{shop.name}</h4>
                                        <p className="text-xs font-semibold text-gray-500 truncate">{shop.address}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── PRODUCTS RESULTS ── */}
                {!isLoading && results.products.length > 0 && (
                    <div className="mb-6 animate-in fade-in duration-300 delay-75">
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Products</h2>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">{results.products.length}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {results.products.map(product => (
                                <div key={`prod-${product._id}`} className={`bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden flex flex-col active:scale-[0.98] transition-all ${!product.inStock || !product.shopIsOpen ? 'opacity-60' : ''}`}>
                                    <Link to={`/shop/${product.shopId}`} className="h-[120px] bg-gray-50 p-4 relative flex items-center justify-center">
                                        {product.image ? (
                                            <img src={optimizeImage(product.image, 200)} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                                        ) : (
                                            <IcoProduct />
                                        )}
                                        {(!product.inStock || !product.shopIsOpen) && (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider whitespace-nowrap shadow-xl">
                                                {!product.shopIsOpen ? 'Shop Closed' : 'Out of Stock'}
                                            </div>
                                        )}
                                    </Link>

                                    <div className="p-3.5 flex flex-col flex-1">
                                        <div className="inline-flex items-center self-start text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md uppercase tracking-widest mb-2 border border-green-100">
                                            <IcoTime /> 15 MINS
                                        </div>
                                        <Link to={`/shop/${product.shopId}`} className="block flex-1">
                                            <h4 className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2 tracking-tight mb-0.5">{product.name}</h4>
                                            <p className="text-[11px] font-semibold text-gray-400 mb-3 truncate">By {product.shopName}</p>
                                        </Link>
                                        <div className="flex justify-between items-center mt-auto">
                                            <span className="text-[15px] font-black text-gray-900 tracking-tight">₹{product.price}</span>
                                            <button
                                                className="bg-white text-green-600 border-[1.5px] border-green-600 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 active:bg-green-50 transition-all disabled:border-gray-200 disabled:text-gray-400 disabled:bg-gray-50 shadow-sm"
                                                onClick={(e) => handleAddToCart(e, product)}
                                                disabled={!product.inStock || !product.shopIsOpen}
                                            >
                                                ADD
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Initial State / Suggestions ── */}
                {!hasSearched && !isLoading && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-[15px] font-extrabold text-gray-900 mb-3 tracking-tight mt-2">Popular Categories</h3>
                        <div className="grid grid-cols-4 gap-3 mb-8">
                            <div className="flex flex-col items-center cursor-pointer active:scale-90 transition-transform group" onClick={() => setQuery('Milk')}>
                                <div className="w-[64px] h-[64px] rounded-[20px] bg-blue-50 flex items-center justify-center mb-2 shadow-sm border border-blue-100/50 group-hover:shadow-md transition-shadow"><IcoDairy /></div>
                                <span className="text-xs font-bold text-gray-600 tracking-tight">Dairy</span>
                            </div>
                            <div className="flex flex-col items-center cursor-pointer active:scale-90 transition-transform group" onClick={() => setQuery('Vegetable')}>
                                <div className="w-[64px] h-[64px] rounded-[20px] bg-emerald-50 flex items-center justify-center mb-2 shadow-sm border border-emerald-100/50 group-hover:shadow-md transition-shadow"><IcoVeggies /></div>
                                <span className="text-xs font-bold text-gray-600 tracking-tight">Veggies</span>
                            </div>
                            <div className="flex flex-col items-center cursor-pointer active:scale-90 transition-transform group" onClick={() => setQuery('Snacks')}>
                                <div className="w-[64px] h-[64px] rounded-[20px] bg-red-50 flex items-center justify-center mb-2 shadow-sm border border-red-100/50 group-hover:shadow-md transition-shadow"><IcoSnacks /></div>
                                <span className="text-xs font-bold text-gray-600 tracking-tight">Snacks</span>
                            </div>
                            <div className="flex flex-col items-center cursor-pointer active:scale-90 transition-transform group" onClick={() => setQuery('Drink')}>
                                <div className="w-[64px] h-[64px] rounded-[20px] bg-amber-50 flex items-center justify-center mb-2 shadow-sm border border-amber-100/50 group-hover:shadow-md transition-shadow"><IcoDrinks /></div>
                                <span className="text-xs font-bold text-gray-600 tracking-tight">Drinks</span>
                            </div>
                        </div>

                        <h3 className="text-[15px] font-extrabold text-gray-900 mb-3 tracking-tight">Trending Searches</h3>
                        <div className="flex flex-wrap gap-2.5">
                            {['Atta', 'Bread', 'Eggs', 'Maggi', 'Cold Drink', 'Rice', 'Chips'].map(tag => (
                                <span
                                    key={tag}
                                    onClick={() => setQuery(tag)}
                                    className="bg-white border border-gray-100 px-4 py-2.5 rounded-full text-[13px] font-bold text-gray-600 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-95 active:bg-amber-50 active:border-amber-400 active:text-amber-800 transition-all cursor-pointer tracking-tight"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;