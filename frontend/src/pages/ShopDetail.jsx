import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { optimizeImage } from '../utils/imageUtils';

/* ─── Modern App Icons ─── */
const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const IcoSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IcoCart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const IcoStar = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>;
const IcoMap = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>;

/* ─── Pastel Colors for Bento Categories ─── */
const bentoColors = [
    'bg-rose-50 text-rose-900 border-rose-100',
    'bg-blue-50 text-blue-900 border-blue-100',
    'bg-amber-50 text-amber-900 border-amber-100',
    'bg-emerald-50 text-emerald-900 border-emerald-100',
    'bg-purple-50 text-purple-900 border-purple-100',
    'bg-sky-50 text-sky-900 border-sky-100'
];

const ShopDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, overrideAndReplaceCart, cartItems, updateQuantity } = useCart();

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [replacePrompt, setReplacePrompt] = useState(null);

    const totalCartItems = cartItems.reduce((s, i) => s + i.quantity, 0);

    /* ── Fetch Data ── */
    const { data: shop, isLoading: shopLoading } = useQuery({
        queryKey: ['shop', id],
        queryFn: () => fetch(`/api/shops/${id}`).then(r => r.json()),
    });

    const { data: productsData = [], isLoading: productsLoading } = useQuery({
        queryKey: ['products', id],
        queryFn: () => fetch(`/api/products/${id}`).then(r => r.json()),
    });
    const products = Array.isArray(productsData) ? productsData : [];

    const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories', id],
        queryFn: () => fetch(`/api/categories/${id}`).then(r => r.json()),
    });
    const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];

    const loading = shopLoading || productsLoading || categoriesLoading;

    /* ── Derived Categories & Filtering ── */
    const categories = useMemo(() => {
        const prodCatNames = new Set(products.map(p => {
            if (!p.category) return 'General';
            return typeof p.category === 'object' ? (p.category.name || 'General') : p.category;
        }));
        categoriesList.forEach(c => prodCatNames.add(c.name));
        return Array.from(prodCatNames).sort();
    }, [products, categoriesList]);

    const getCatImage = (catName) => {
        const cat = categoriesList.find(c => c.name === catName);
        return cat ? cat.image : null;
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const pCatName = typeof p.category === 'object' ? (p.category?.name || 'General') : (p.category || 'General');
            if (selectedCategory && selectedCategory !== 'All' && pCatName !== selectedCategory) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return p.name.toLowerCase().includes(query) || pCatName.toLowerCase().includes(query);
            }
            return true;
        }).sort((a, b) => {
            if (a.inStock === b.inStock) return 0;
            return a.inStock ? 1 : -1;
        });
    }, [products, selectedCategory, searchQuery]);

    const showProductsView = selectedCategory !== null || !!searchQuery;

    const handleAddClick = (e, product) => {
        e.stopPropagation();
        const res = addToCart(product, id);
        if (res && res.success === false && res.error === 'DIFFERENT_SHOP_ERROR') {
            setReplacePrompt(product);
            return;
        }
        if (navigator.vibrate) navigator.vibrate(40);
    };

    /* ── Loaders & Fallbacks ── */
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6">
                <span className="text-6xl mb-4">🏪</span>
                <h2 className="text-xl font-black text-slate-900">Shop Not Found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans pb-28">

            {/* ════════ FLOATING APP HEADER ════════ */}
            <div className="sticky top-0 z-50 px-4 pt-4 pb-2 bg-[#FDFDFD]/90 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-800 shadow-sm active:scale-90 transition-transform">
                        <IcoBack />
                    </button>
                    <Link to="/cart" className="relative w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-800 shadow-sm active:scale-90 transition-transform">
                        <IcoCart />
                        {totalCartItems > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-amber-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                {totalCartItems}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            {/* ════════ SHOP BENTO INFO CARD ════════ */}
            {!showProductsView && (
                <div className="px-4 mt-2 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-slate-900 rounded-[32px] p-1 relative overflow-hidden shadow-xl shadow-slate-900/10">
                        {/* Soft Glow Effect */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="bg-white rounded-[28px] p-5 relative z-10">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 rounded-[20px] bg-slate-100 shrink-0 overflow-hidden border border-slate-100 shadow-sm">
                                    {shop.image ? (
                                        <img src={optimizeImage(shop.image, 200)} alt={shop.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight mb-1 truncate">{shop.name}</h1>
                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-3 truncate">
                                        <IcoMap /> {shop.address}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${shop.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {shop.isOpen ? 'Open Now' : 'Closed'}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-black tracking-widest flex items-center gap-1">
                                            {shop.rating || '4.5'} <IcoStar />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ STICKY SEARCH BAR ════════ */}
            <div className="sticky top-[72px] z-40 px-4 mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 pointer-events-none">
                        <IcoSearch />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for groceries, items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border-2 border-slate-100 rounded-3xl pl-12 pr-12 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-semibold focus:outline-none focus:border-amber-400 shadow-sm transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-700">
                            <svg fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* ════════ VIEW 1: CATEGORIES FIRST (BENTO GRID) ════════ */}
            {!showProductsView ? (
                <div className="px-4 animate-in fade-in duration-500">
                    <h2 className="text-lg font-black text-slate-900 mb-4 px-1">Shop by Category</h2>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {/* "All Items" Big Card */}
                        <div
                            onClick={() => setSelectedCategory('All')}
                            className="col-span-2 bg-slate-900 rounded-[28px] p-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform shadow-md"
                        >
                            <div>
                                <h3 className="text-lg font-black text-white mb-1">Explore All Items</h3>
                                <p className="text-xs font-bold text-slate-400">{products.length} products available</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                            </div>
                        </div>

                        {/* Category Bento Cards */}
                        {categories.map((cat, index) => {
                            const count = products.filter(p => {
                                const pCatName = typeof p.category === 'object' ? (p.category?.name || 'General') : (p.category || 'General');
                                return pCatName === cat;
                            }).length;

                            const customImg = getCatImage(cat);
                            // Assign a pastel color based on index
                            const colorClass = bentoColors[index % bentoColors.length];

                            return (
                                <div
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`relative ${colorClass} border rounded-[28px] p-5 aspect-square flex flex-col cursor-pointer active:scale-[0.98] transition-transform overflow-hidden`}
                                >
                                    <span className="text-base font-black leading-tight z-10 pr-4">{cat}</span>
                                    <span className="text-[11px] font-bold opacity-70 z-10 mt-1">{count} items</span>

                                    {customImg ? (
                                        <img src={optimizeImage(customImg, 200)} alt={cat} className="absolute -bottom-4 -right-4 w-24 h-24 object-cover rounded-full shadow-lg opacity-90 rotate-[-10deg]" />
                                    ) : (
                                        <div className="absolute -bottom-2 -right-2 text-6xl opacity-30">🏷</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* ════════ VIEW 2: PRODUCTS GRID ════════ */
                <div className="animate-in slide-in-from-right-8 duration-300">

                    {/* Horizontal Category Selector (Replaces the big grid once inside) */}
                    {!searchQuery && (
                        <div className="px-4 mb-6">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                <button
                                    onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                                    className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-black bg-slate-100 text-slate-700 active:scale-95 transition-transform flex items-center gap-2 border border-transparent"
                                >
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg> Back
                                </button>
                                <button
                                    onClick={() => setSelectedCategory('All')}
                                    className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-black active:scale-95 transition-all border ${selectedCategory === 'All' ? 'bg-amber-400 border-amber-400 text-amber-950 shadow-sm' : 'bg-white border-slate-200 text-slate-600'}`}
                                >
                                    All Items
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-black active:scale-95 transition-all border ${selectedCategory === cat ? 'bg-amber-400 border-amber-400 text-amber-950 shadow-sm' : 'bg-white border-slate-200 text-slate-600'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="px-4 flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-slate-900">
                            {searchQuery ? `Search Results` : selectedCategory === 'All' ? 'All Products' : selectedCategory}
                        </h2>
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                            {filteredProducts.length} items
                        </span>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="px-4 py-16 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
                            <h3 className="text-base font-black text-slate-900 mb-1">No products found</h3>
                            <p className="text-xs font-bold text-slate-500">Try selecting a different category.</p>
                        </div>
                    ) : (
                        <div className="px-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {filteredProducts.map(product => {
                                const inCart = cartItems.find(i => i.productId === product._id);
                                return (
                                    <div
                                        key={product._id}
                                        onClick={() => navigate(`/shop/${id}/product/${product._id}`)}
                                        className={`bg-white rounded-[24px] border-2 border-slate-100 p-2.5 flex flex-col shadow-sm active:scale-[0.98] transition-transform cursor-pointer relative ${!product.inStock ? 'opacity-60 grayscale-[0.2]' : ''}`}
                                    >
                                        <div className="aspect-square w-full bg-[#F8FAFC] rounded-[18px] mb-3 overflow-hidden relative border border-slate-100/50 flex items-center justify-center">
                                            {product.image ? (
                                                <img src={optimizeImage(product.image, 400)} alt={product.name} className="w-full h-full object-contain mix-blend-multiply p-2" />
                                            ) : (
                                                <span className="text-4xl opacity-20">🛍️</span>
                                            )}
                                            {!product.inStock && (
                                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                                    <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-xl">Sold Out</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col px-1 pb-1">
                                            <h3 className="text-[13px] font-black text-slate-900 leading-snug line-clamp-2 mb-3">{product.name}</h3>

                                            <div className="mt-auto flex items-center justify-between">
                                                <div className="flex items-start">
                                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5 pr-0.5">₹</span>
                                                    <span className="text-base font-black text-slate-900 tracking-tight">{product.price}</span>
                                                </div>

                                                {product.inStock ? (
                                                    <div className="relative">
                                                        {inCart ? (
                                                            <div className="flex items-center bg-amber-100 rounded-xl h-8 overflow-hidden border border-amber-200" onClick={e => e.stopPropagation()}>
                                                                <button onClick={() => updateQuantity(product._id, inCart.quantity - 1)} className="w-8 h-full flex items-center justify-center text-amber-700 active:bg-amber-200"><svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg></button>
                                                                <span className="text-[11px] font-black text-amber-900 w-4 text-center">{inCart.quantity}</span>
                                                                <button onClick={() => updateQuantity(product._id, inCart.quantity + 1)} className="w-8 h-full flex items-center justify-center text-amber-700 active:bg-amber-200"><svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => handleAddClick(e, product)}
                                                                className="h-8 px-4 bg-amber-400 text-amber-950 font-black text-[11px] rounded-xl uppercase tracking-wider shadow-sm active:bg-amber-500 transition-colors"
                                                            >
                                                                Add
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="h-8 px-3 flex items-center bg-slate-100 text-slate-400 font-bold text-[10px] rounded-xl">Out</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ════════ FLOATING CART BAR ════════ */}
            {totalCartItems > 0 && (
                <div className="fixed bottom-6 inset-x-0 px-4 z-50 pointer-events-none animate-in slide-in-from-bottom-10">
                    <Link to="/cart" className="max-w-md mx-auto w-full bg-emerald-600 text-white rounded-[24px] p-4 flex items-center justify-between shadow-[0_8px_30px_rgba(5,150,105,0.4)] pointer-events-auto active:scale-[0.98] transition-transform">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-[16px] flex items-center justify-center font-black text-lg">
                                {totalCartItems}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[15px] font-black leading-none mb-1">View Cart</span>
                                <span className="text-[11px] font-bold text-emerald-100">₹{getTotal()} • Checkout ➔</span>
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* ════════ REPLACE CART MODAL ════════ */}
            {replacePrompt && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end sm:justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[32px] p-6 max-w-sm w-full text-center shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-[6px] border-white shadow-sm">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Start new cart?</h3>
                        <p className="text-sm text-slate-500 font-bold mb-8 leading-relaxed px-2">
                            Your cart contains items from another shop. Do you want to clear it and add items from <span className="text-slate-900">{shop?.name}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setReplacePrompt(null)} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl text-[14px] font-black active:bg-slate-200 transition-colors">Cancel</button>
                            <button onClick={() => { overrideAndReplaceCart(replacePrompt, id); setReplacePrompt(null); if (navigator.vibrate) navigator.vibrate(50); }} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[14px] font-black shadow-md active:scale-95 transition-transform">Replace Cart</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopDetail;