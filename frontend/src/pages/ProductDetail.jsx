import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';
import { toast } from 'react-toastify';

/* ─── Premium Outlined Icons ─── */
const IcoBack = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const IcoHeart = ({ filled }) => (
    <svg fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={filled ? 0 : 2} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

const IcoShare = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zm2.25 0h.008v.008H9.75V6z" />
    </svg>
);

const IcoMinus = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);

const IcoPlus = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const IcoStore = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-6h-3v6m-6 0H3m18 0h-1.5M3 21h18M3 10.5h18M3 7.5h18M5.25 3.75h13.5M5.25 3.75L3 7.5l2.25 3.75M5.25 3.75v13.5M18.75 3.75v13.5M18.75 3.75L21 7.5l-2.25 3.75" />
    </svg>
);

const IcoClock = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IcoShield = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
);

const triggerHaptic = (duration = 30) => {
    if (navigator.vibrate) navigator.vibrate(duration);
};

const ProductDetail = () => {
    const { shopId, productId } = useParams();
    const navigate = useNavigate();
    const { cartItems, addToCart, updateQuantity } = useCart();
    const { token } = useAuth();

    const [liked, setLiked] = useState(false);
    const cartItem = cartItems.find(i => i.productId === productId);

    useEffect(() => {
        const savedLikes = JSON.parse(localStorage.getItem('muna_likes') || '{}');
        if (savedLikes[productId]) setLiked(true);
    }, [productId]);

    const toggleLike = async () => {
        triggerHaptic(30);
        const newLiked = !liked;
        setLiked(newLiked);

        const savedLikes = JSON.parse(localStorage.getItem('muna_likes') || '{}');
        if (newLiked) savedLikes[productId] = true;
        else delete savedLikes[productId];
        localStorage.setItem('muna_likes', JSON.stringify(savedLikes));

        if (token) {
            try {
                await fetch(`/api/user/wishlist/${productId}`, {
                    method: newLiked ? 'POST' : 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch (err) {
                console.error('Wishlist sync failed', err);
            }
        }
    };

    const handleShare = async () => {
        triggerHaptic(30);
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Check out this on MUNA', url: window.location.href });
            } catch (err) {
                console.log('Error sharing', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied!');
        }
    };

    const { data: shop, isLoading: shopLoading } = useQuery({
        queryKey: ['shop', shopId],
        queryFn: async () => {
            const res = await fetch(`/api/shops/${shopId}`);
            if (!res.ok) throw new Error('Shop not found');
            return res.json();
        },
    });

    const { data: product, isLoading: productLoading } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const res = await fetch(`/api/products/detail/${productId}`);
            if (!res.ok) throw new Error('Product not found');
            return res.json();
        },
    });

    const isLoading = shopLoading || productLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            </div>
        );
    }

    if (!product || !shop) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center text-3xl mb-4">
                    🔍
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Item Unavailable</h2>
                <p className="text-sm font-medium text-slate-500 mb-8">This item might have been removed from the catalog.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl active:scale-[0.98] transition-transform shadow-lg"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const handleAdd = () => {
        if (!product.inStock) return;
        triggerHaptic(50);

        try {
            const res = addToCart(product, shop, 1);
            if (res && res.success === false) {
                if (res.error === 'DIFFERENT_SHOP_ERROR') {
                    toast.error('Clear your cart to order from a new shop.', { autoClose: 3000 });
                } else {
                    toast.error(res.message || 'Could not add item.');
                }
            } else {
                toast.success('Added to cart!');
            }
        } catch (error) {
            toast.error('Something went wrong.');
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans pb-28 animate-in fade-in duration-500">

            {/* ─── GLASS HEADER ─── */}
            <header className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-md border-b border-slate-100/60 flex items-center justify-between px-5 py-4 z-50">
                <button
                    className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    onClick={() => navigate(-1)}
                >
                    <IcoBack />
                </button>
                <div className="flex items-center gap-1 -mr-2">
                    <button
                        className={`w-11 h-11 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors ${liked ? 'text-rose-500' : 'text-slate-800'}`}
                        onClick={toggleLike}
                    >
                        <IcoHeart filled={liked} />
                    </button>
                    <button
                        className="w-11 h-11 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 transition-colors"
                        onClick={handleShare}
                    >
                        <IcoShare />
                    </button>
                </div>
            </header>

            {/* ─── PRODUCT IMAGE ─── */}
            <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] max-h-[550px] bg-gradient-to-br from-[#F0F4FA] to-[#E6EDF6] pt-16 flex items-center justify-center overflow-hidden">
                {product.image ? (
                    <img
                        src={optimizeImage(product.image, 800)}
                        alt={product.name}
                        className="w-[80%] h-[80%] object-contain drop-shadow-2xl animate-in zoom-in-95 duration-700 ease-out"
                    />
                ) : (
                    <span className="text-7xl opacity-10">🛍️</span>
                )}
                {/* Soft gradient overlay at bottom */}
                <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent" />
            </div>

            {/* ─── CONTENT ─── */}
            <div className="px-6 pt-4 pb-8 max-w-3xl mx-auto -mt-4 relative z-10">

                {/* Category & Shop */}
                <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-black uppercase tracking-widest rounded-full">
                        {typeof product.category === 'object' ? product.category?.name || 'General' : product.category || 'General'}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <IcoStore />
                        <span className="truncate">{shop.name}</span>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight mb-4">
                    {product.name}
                </h1>

                {/* Price & Stock */}
                <div className="flex items-center justify-between p-5 bg-slate-50/80 border border-slate-200/60 rounded-2xl mb-8 backdrop-blur-sm">
                    <div className="flex items-start">
                        <span className="text-xl font-bold text-slate-400 mt-1 mr-1">₹</span>
                        <span className="text-5xl font-black text-slate-900 tracking-tight leading-none">{product.price}</span>
                    </div>
                    <div>
                        {product.inStock ? (
                            <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200/70 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> In Stock
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200/70 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-rose-500" /> Sold Out
                            </span>
                        )}
                    </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="flex items-center gap-4 p-4 bg-slate-50/70 rounded-xl border border-slate-100/80">
                        <div className="w-10 h-10 rounded-full bg-white text-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                            <IcoClock />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-slate-900">Instant Delivery</span>
                            <span className="text-xs text-slate-500 font-medium">15‑30 min</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50/70 rounded-xl border border-slate-100/80">
                        <div className="w-10 h-10 rounded-full bg-white text-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                            <IcoShield />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-slate-900">100% Genuine</span>
                            <span className="text-xs text-slate-500 font-medium">Verified by MUNA</span>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-200/70 mb-8" />

                {/* Description */}
                <div>
                    <h2 className="text-lg font-black text-slate-900 mb-3">Product Details</h2>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                        {product.description ||
                            `Freshly sourced and securely packaged by ${shop.name}. We ensure strict quality standards so you only get the best products delivered right to your door.`}
                    </p>
                </div>
            </div>

            {/* ─── FLOATING ACTION BAR ─── */}
            <div className="fixed bottom-0 inset-x-0 p-4 pb-safe z-50 pointer-events-none">
                <div className="max-w-md mx-auto w-full bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-3 shadow-[0_12px_40px_rgba(0,0,0,0.15)] pointer-events-auto">
                    {!product.inStock ? (
                        <button className="w-full py-4 bg-slate-100 text-slate-400 rounded-xl font-bold text-[15px] cursor-not-allowed">
                            Currently Unavailable
                        </button>
                    ) : cartItem ? (
                        <div className="flex gap-3 h-[56px]">
                            {/* Quantity selector */}
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-2 w-[140px] shrink-0 border border-slate-200/80">
                                <button
                                    className="w-10 h-10 flex items-center justify-center text-slate-700 active:bg-slate-200 rounded-lg transition-colors"
                                    onClick={() => {
                                        triggerHaptic(30);
                                        updateQuantity(product._id, cartItem.quantity - 1);
                                    }}
                                >
                                    <IcoMinus />
                                </button>
                                <span className="font-black text-lg text-slate-900">{cartItem.quantity}</span>
                                <button
                                    className="w-10 h-10 flex items-center justify-center text-slate-700 active:bg-slate-200 rounded-lg transition-colors"
                                    onClick={() => {
                                        triggerHaptic(30);
                                        updateQuantity(product._id, cartItem.quantity + 1);
                                    }}
                                >
                                    <IcoPlus />
                                </button>
                            </div>

                            {/* View Cart */}
                            <button
                                className="flex-1 bg-slate-900 text-white rounded-xl font-bold text-[15px] shadow-sm active:scale-[0.97] transition-transform flex items-center justify-center gap-2 hover:bg-slate-800"
                                onClick={() => navigate('/cart')}
                            >
                                View Cart
                            </button>
                        </div>
                    ) : (
                        <button
                            className="w-full h-[56px] bg-amber-400 text-amber-950 rounded-xl font-bold text-[16px] shadow-md active:scale-[0.97] transition-transform flex items-center justify-center hover:bg-amber-300"
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