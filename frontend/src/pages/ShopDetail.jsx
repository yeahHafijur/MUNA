import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { optimizeImage } from '../utils/imageUtils';

/* ─── Premium Native Icons ─── */
const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IcoSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IcoCart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>;
const IcoMapPin = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5 text-amber-500"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>;
const IcoPhone = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5 text-emerald-500"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" /></svg>;
const IcoArrow = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;

const ShopDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, overrideAndReplaceCart, cartItems, getTotal } = useCart();

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [replacePrompt, setReplacePrompt] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);

    const totalCartItems = cartItems.reduce((s, i) => s + i.quantity, 0);

    /* ── Scroll Listener for Header ── */
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 150);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    /* ── Derived Data ── */
    const categories = useMemo(() => {
        const prodCatNames = new Set(products.map(p => {
            if (!p.category) return 'General';
            return typeof p.category === 'object' ? (p.category.name || 'General') : p.category;
        }));
        categoriesList.forEach(c => prodCatNames.add(c.name));
        return ['All', ...Array.from(prodCatNames).sort()];
    }, [products, categoriesList]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const pCatName = typeof p.category === 'object' ? (p.category?.name || 'General') : (p.category || 'General');
            if (selectedCategory !== 'All' && pCatName !== selectedCategory) return false;

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

    /* ── Handlers ── */
    const handleAddClick = (e, product) => {
        e.stopPropagation();
        const res = addToCart(product, id);
        if (res && res.success === false && res.error === 'DIFFERENT_SHOP_ERROR') {
            setReplacePrompt(product);
            return;
        }
        if (navigator.vibrate) navigator.vibrate(50);
    };

    /* ── Loader ── */
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-5xl opacity-40 mb-4">🏪</span>
                <h2 className="text-xl font-black text-slate-900 mb-2">Store Not Found</h2>
                <button onClick={() => navigate(-1)} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl active:scale-[0.98]">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-28">

            {/* ════════ STICKY HEADER ════════ */}
            <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50' : 'bg-transparent'}`}>
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => navigate(-1)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-slate-800' : 'bg-black/30 backdrop-blur-md text-white'}`}
                    >
                        <IcoBack />
                    </button>
                    <span className={`text-base font-black tracking-tight transition-opacity duration-300 ${isScrolled ? 'opacity-100 text-slate-900' : 'opacity-0'}`}>
                        {shop.name}
                    </span>
                    <Link
                        to="/cart"
                        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-slate-800' : 'bg-black/30 backdrop-blur-md text-white'}`}
                    >
                        <IcoCart />
                        {totalCartItems > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                                {totalCartItems}
                            </span>
                        )}
                    </Link>
                </div>
            </header>

            {/* ════════ HERO BANNER ════════ */}
            <div className="relative h-[250px] w-full bg-slate-900 overflow-hidden">
                {shop.image ? (
                    <img src={optimizeImage(shop.image)} alt={shop.name} className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl opacity-20">🏪</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>

                <div className="absolute bottom-6 left-5 right-5">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${shop.isOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md' : 'bg-red-500/20 text-red-400 border border-red-500/30 backdrop-blur-md'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${shop.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                            {shop.isOpen ? 'Open Now' : 'Closed'}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black tracking-widest border border-white/20">
                            ⭐ {shop.rating || '4.5'}
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-white leading-none tracking-tight mb-2">{shop.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-white/70 text-[11px] font-bold">
                        <span className="flex items-center gap-1"><IcoMapPin /> {shop.address}</span>
                        {shop.vendorId?.phone && <span className="flex items-center gap-1"><IcoPhone /> {shop.vendorId.phone}</span>}
                    </div>
                </div>
            </div>

            {/* ════════ SEARCH & CATEGORIES (Sticky) ════════ */}
            <div className="sticky top-[64px] z-40 bg-slate-50/95 backdrop-blur-md pt-4 pb-2 border-b border-slate-200">
                <div className="px-4 mb-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <IcoSearch />
                        </div>
                        <input
                            type="text"
                            placeholder="Search in this store..."
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-[13px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="px-4">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`shrink-0 px-5 py-2 rounded-xl text-[12px] font-black transition-all whitespace-nowrap ${selectedCategory === cat
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ════════ PRODUCT GRID ════════ */}
            <div className="p-4 sm:p-6">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <span className="text-5xl opacity-30 mb-4 block">🔍</span>
                        <h3 className="text-sm font-black text-slate-900 mb-1">No items found</h3>
                        <p className="text-[11px] font-bold text-slate-500">Try searching for something else.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {filteredProducts.map(product => {
                            const inCart = cartItems.find(i => i.productId === product._id);

                            return (
                                <div
                                    key={product._id}
                                    onClick={() => navigate(`/shop/${id}/product/${product._id}`)}
                                    className={`bg-white rounded-2xl border border-slate-200 p-2.5 flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-transform cursor-pointer relative ${!product.inStock ? 'opacity-60' : ''}`}
                                >
                                    {/* Image Box */}
                                    <div className="aspect-[4/3] w-full bg-slate-50 rounded-xl mb-3 overflow-hidden relative border border-slate-100/50">
                                        {product.image ? (
                                            <img src={optimizeImage(product.image, 400)} alt={product.name} className="w-full h-full object-contain mix-blend-multiply p-2" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🛍️</div>
                                        )}
                                        {!product.inStock && (
                                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                                                <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">Sold Out</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 flex flex-col px-1">
                                        <h3 className="text-[13px] font-black text-slate-900 leading-snug line-clamp-2 mb-1.5">{product.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                            {typeof product.category === 'object' ? product.category?.name || 'General' : product.category || 'General'}
                                        </p>

                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="text-[15px] font-black text-slate-900 tracking-tight">₹{product.price}</span>

                                            {product.inStock ? (
                                                <button
                                                    onClick={(e) => handleAddClick(e, product)}
                                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wide uppercase transition-colors ${inCart ? 'bg-amber-100 text-amber-700' : 'bg-amber-400 text-amber-950 shadow-sm hover:bg-amber-500'}`}
                                                >
                                                    {inCart ? 'Added' : 'Add'}
                                                </button>
                                            ) : (
                                                <span className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 bg-slate-100">Out</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ════════ FLOATING CART BAR ════════ */}
            {totalCartItems > 0 && (
                <div className="fixed bottom-6 inset-x-0 px-4 z-50 pointer-events-none animate-in slide-in-from-bottom-10">
                    <Link to="/cart" className="max-w-md mx-auto w-full bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl pointer-events-auto active:scale-[0.98] transition-transform">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-400 text-amber-950 rounded-xl flex items-center justify-center font-black text-[15px]">
                                {totalCartItems}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[14px] font-bold leading-none mb-1">View your cart</span>
                                <span className="text-[11px] font-semibold text-slate-400">{shop.name}</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <IcoArrow />
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
                        <h3 className="text-[19px] font-black text-slate-900 mb-2">Replace cart item?</h3>
                        <p className="text-[13px] text-slate-500 font-medium mb-8 leading-relaxed px-2">
                            Your cart contains items from another shop. Do you want to discard them and add items from <span className="font-bold text-slate-900">{shop?.name}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setReplacePrompt(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl text-[14px] font-bold active:bg-slate-200 transition-colors">Cancel</button>
                            <button onClick={() => { overrideAndReplaceCart(replacePrompt, id); setReplacePrompt(null); if (navigator.vibrate) navigator.vibrate(50); }} className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl text-[14px] font-bold shadow-md active:scale-95 transition-transform">Replace Cart</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopDetail;