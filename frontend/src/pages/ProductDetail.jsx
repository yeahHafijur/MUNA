import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../context/CartContext';
import { optimizeImage } from '../utils/imageUtils';
import { toast } from 'react-toastify';

/* ─── Premium Crisp Icons ─── */
const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const IcoHeart = ({ filled }) => <svg fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const IcoShare = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>;
const IcoMinus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>;
const IcoPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;

const ProductDetail = () => {
    const { shopId, productId } = useParams();
    const navigate = useNavigate();
    const { cartItems, addToCart, updateQuantity } = useCart();

    const [liked, setLiked] = useState(false);

    // Check if item is already in cart
    const cartItem = cartItems.find(i => i.productId === productId);

    // Load liked status
    useEffect(() => {
        const savedLikes = JSON.parse(localStorage.getItem('muna_likes') || '{}');
        if (savedLikes[productId]) setLiked(true);
    }, [productId]);

    const toggleLike = () => {
        if (navigator.vibrate) navigator.vibrate(30);
        const newLiked = !liked;
        setLiked(newLiked);
        const savedLikes = JSON.parse(localStorage.getItem('muna_likes') || '{}');
        if (newLiked) savedLikes[productId] = true;
        else delete savedLikes[productId];
        localStorage.setItem('muna_likes', JSON.stringify(savedLikes));
    };

    const handleShare = async () => {
        if (navigator.vibrate) navigator.vibrate(30);
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Check out this on MUNA',
                    url: window.location.href,
                });
            } catch (err) { console.log('Error sharing', err); }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied!");
        }
    };

    // Data Fetching
    const { data: shop, isLoading: shopLoading } = useQuery({
        queryKey: ['shop', shopId],
        queryFn: () => fetch(`/api/shops/${shopId}`).then(r => {
            if (!r.ok) throw new Error('Shop not found');
            return r.json();
        }),
    });

    const { data: productsData = [], isLoading: productsLoading } = useQuery({
        queryKey: ['products', shopId],
        queryFn: () => fetch(`/api/products/${shopId}`).then(r => r.json()),
    });

    const isLoading = shopLoading || productsLoading;
    const products = Array.isArray(productsData) ? productsData : [];
    const product = products.find(p => p._id === productId);

    // --- LOADING STATE ---
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-sm font-black tracking-widest uppercase text-slate-400">Loading Product...</p>
            </div>
        );
    }

    // --- ERROR STATE ---
    if (!product || !shop) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-4">🔍</div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Item not found</h2>
                <p className="text-[13px] font-semibold text-slate-500 mb-6">This item might have been removed or is unavailable.</p>
                <button onClick={() => navigate(-1)} className="px-8 py-3.5 bg-slate-900 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform">
                    Go Back
                </button>
            </div>
        );
    }

    const handleAdd = () => {
        if (!product.inStock) return;
        if (navigator.vibrate) navigator.vibrate(50);

        const res = addToCart(product, shop, 1);
        if (res && res.success === false && res.error === 'DIFFERENT_SHOP_ERROR') {
            toast.error("You can only order from one shop at a time. Clear your cart first.", { autoClose: 3000 });
            return;
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans relative pb-28 animate-in fade-in duration-300">

            {/* ─── FLOATING HEADER (GLASSMORPHISM) ─── */}
            <header className="fixed top-0 inset-x-0 p-4 pt-safe flex justify-between z-50 pointer-events-none">
                <button className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-800 shadow-[0_4px_14px_rgba(0,0,0,0.05)] active:scale-90 transition-transform pointer-events-auto" onClick={() => navigate(-1)}>
                    <IcoBack />
                </button>
                <div className="flex gap-3 pointer-events-auto">
                    <button className={`w-11 h-11 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.05)] active:scale-90 transition-transform ${liked ? 'text-rose-500' : 'text-slate-800'}`} onClick={toggleLike}>
                        <IcoHeart filled={liked} />
                    </button>
                    <button className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-800 shadow-[0_4px_14px_rgba(0,0,0,0.05)] active:scale-90 transition-transform" onClick={handleShare}>
                        <IcoShare />
                    </button>
                </div>
            </header>

            {/* ─── IMMERSIVE HERO IMAGE ─── */}
            <div className="relative w-full h-[45vh] bg-slate-50 flex items-center justify-center overflow-hidden">
                {product.image ? (
                    <img src={optimizeImage(product.image, 800)} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-6xl opacity-20">🛍️</span>
                )}
                {/* Top Shadow for header visibility */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/20 to-transparent"></div>
            </div>

            {/* ─── CONTENT BOTTOM SHEET STYLE ─── */}
            <div className="relative -mt-6 bg-white rounded-t-[32px] p-6 z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] min-h-[50vh]">

                <div className="flex items-center gap-2 mb-3">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                        {typeof product.category === 'object' ? (product.category?.name || 'General') : (product.category || 'General')}
                    </span>
                    <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                        By {shop.name}
                    </span>
                </div>

                <h1 className="text-[26px] font-black text-slate-900 leading-tight mb-2 tracking-tight">
                    {product.name}
                </h1>

                <div className="flex items-end justify-between mt-4 pb-6 border-b border-slate-100">
                    <div className="flex items-start">
                        <span className="text-base font-bold text-slate-400 mt-1 mr-1">₹</span>
                        <span className="text-[34px] font-black text-slate-900 leading-none">{product.price}</span>
                    </div>
                    {product.inStock ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest">In Stock</span>
                    ) : (
                        <span className="bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest">Out of Stock</span>
                    )}
                </div>

                {/* Details Section */}
                <div className="mt-6 space-y-4">
                    <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">About this item</h2>
                    <div className="bg-[#f8fafc] p-4 rounded-[20px] border border-slate-100">
                        <p className="text-[13px] font-semibold text-slate-600 leading-relaxed">
                            This is a premium product available at <span className="font-bold text-slate-900">{shop.name}</span>.
                            We ensure the best quality items are delivered directly from local stores to your doorstep in minutes.
                        </p>
                    </div>
                </div>

                {/* Highlights */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center gap-3 bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">⚡</div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Delivery</span>
                            <span className="text-[12px] font-black text-slate-900">15-30 Mins</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg">🛡️</div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Quality</span>
                            <span className="text-[12px] font-black text-slate-900">Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── STICKY BOTTOM ACTION BAR ─── */}
            <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 pb-safe z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="max-w-md mx-auto w-full">
                    {!product.inStock ? (
                        <button className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[15px] uppercase tracking-wider cursor-not-allowed">
                            Currently Unavailable
                        </button>
                    ) : cartItem ? (
                        <div className="flex gap-3 h-14">
                            {/* Native Quantity Controller */}
                            <div className="flex items-center justify-between bg-amber-50 rounded-2xl px-2 w-[140px] border border-amber-200 shrink-0">
                                <button
                                    className="w-10 h-10 flex items-center justify-center text-amber-700 active:scale-75 transition-transform"
                                    onClick={() => { if (navigator.vibrate) navigator.vibrate(30); updateQuantity(product._id, cartItem.quantity - 1); }}
                                >
                                    <IcoMinus />
                                </button>
                                <span className="font-black text-[16px] text-amber-900">{cartItem.quantity}</span>
                                <button
                                    className="w-10 h-10 flex items-center justify-center text-amber-700 active:scale-75 transition-transform"
                                    onClick={() => { if (navigator.vibrate) navigator.vibrate(30); updateQuantity(product._id, cartItem.quantity + 1); }}
                                >
                                    <IcoPlus />
                                </button>
                            </div>

                            {/* View Cart Button */}
                            <button
                                className="flex-1 bg-amber-400 text-amber-950 rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-[0_4px_14px_rgba(251,191,36,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2"
                                onClick={() => navigate('/cart')}
                            >
                                View Cart <span className="text-lg leading-none">➔</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            className="w-full py-4 bg-amber-400 text-amber-950 rounded-2xl font-black text-[15px] shadow-[0_4px_14px_rgba(251,191,36,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2 uppercase tracking-widest"
                            onClick={handleAdd}
                        >
                            Add to Cart • ₹{product.price}
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
};

export default ProductDetail;