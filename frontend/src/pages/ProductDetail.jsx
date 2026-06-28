import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';
import { toast } from 'react-toastify';

/* ─── Premium Icons ─── */
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
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);
const IcoPlus = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
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
    const [headerOpaque, setHeaderOpaque] = useState(false);
    const cartItem = cartItems.find(i => i.productId === productId);

    // ── Scroll listener for header transparency ──
    useEffect(() => {
        const handleScroll = () => setHeaderOpaque(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ── Wishlist local persistence ──
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

    // ── Data fetching ──
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

    // ── Loading state ──
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            </div>
        );
    }

    // ── Error state ──
    if (!product || !shop) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center text-3xl mb-4">🔍</div>
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

    // ── Cart handler ──
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

    const productImage = product.image ? optimizeImage(product.image, 1200) : null;

    return (
        <div className="min-h-screen bg-white font-sans pb-32">

            {/* ─── 1. HERO SECTION (full‑width image with overlay) ─── */}
            <section className="relative h-[75vh] min-h-[500px] w-full overflow-hidden">
                {productImage ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center scale-105"
                        style={{ backgroundImage: `url(${productImage})` }}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-8xl text-slate-300">
                        🛍️
                    </div>
                )}
                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Hero text – overlaid on image */}
                <div className="absolute bottom-10 left-6 right-6 text-white z-10">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/80 mb-2">
                        <IcoStore />
                        <span>{shop.name}</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight drop-shadow-lg">
                        {product.name}
                    </h1>
                    <div className="flex items-end gap-2 mt-3">
                        <span className="text-2xl font-light text-white/70">₹</span>
                        <span className="text-5xl font-black">{product.price}</span>
                        {product.inStock && (
                            <span className="ml-3 px-3 py-1 bg-emerald-400/20 backdrop-blur-sm text-emerald-100 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-400/30">
                                In Stock
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Floating Header (transparent → opaque on scroll) ── */}
                <header
                    className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 py-4 transition-all duration-300 ${headerOpaque
                            ? 'bg-white/80 backdrop-blur-md border-b border-slate-100/60'
                            : 'bg-transparent'
                        }`}
                >
                    <button
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${headerOpaque
                                ? 'text-slate-800 hover:bg-slate-100'
                                : 'text-white hover:bg-white/10'
                            }`}
                        onClick={() => navigate(-1)}
                    >
                        <IcoBack />
                    </button>
                    <div className="flex items-center gap-1">
                        <button
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${headerOpaque
                                    ? 'text-slate-800 hover:bg-slate-100'
                                    : 'text-white hover:bg-white/10'
                                } ${liked ? 'text-rose-500' : ''}`}
                            onClick={toggleLike}
                        >
                            <IcoHeart filled={liked} />
                        </button>
                        <button
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${headerOpaque
                                    ? 'text-slate-800 hover:bg-slate-100'
                                    : 'text-white hover:bg-white/10'
                                }`}
                            onClick={handleShare}
                        >
                            <IcoShare />
                        </button>
                    </div>
                </header>
            </section>

            {/* ─── 2. BOTTOM SHEET (rounded card with details) ─── */}
            <section className="relative -mt-8 z-20 px-6 pt-8 pb-6 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
                {/* Category chip */}
                <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                        {typeof product.category === 'object' ? product.category?.name || 'General' : product.category || 'General'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">•</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        by {shop.name}
                    </span>
                </div>

                {/* Description */}
                <div className="mb-8">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">
                        Description
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                        {product.description ||
                            `Freshly sourced and securely packaged by ${shop.name}. We ensure strict quality standards so you only get the best products delivered right to your door.`}
                    </p>
                </div>

                {/* Trust features – horizontal scroll / grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100/70">
                        <div className="w-9 h-9 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-sm shrink-0">
                            <IcoClock />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-slate-900">Instant</span>
                            <span className="text-[10px] text-slate-500 font-medium">15‑30 min</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100/70">
                        <div className="w-9 h-9 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-sm shrink-0">
                            <IcoShield />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-slate-900">Genuine</span>
                            <span className="text-[10px] text-slate-500 font-medium">Verified</span>
                        </div>
                    </div>
                </div>

                {/* Shop card */}
                <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                            {shop.name.charAt(0)}
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-slate-900">{shop.name}</span>
                            <span className="text-[10px] text-slate-500 font-medium">Verified shop</span>
                        </div>
                    </div>
                    <button className="text-xs font-bold text-slate-900 underline-offset-2 hover:underline">
                        Visit
                    </button>
                </div>
            </section>

            {/* ─── 3. FLOATING ACTION DOCK (pill‑shaped, bottom) ─── */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
                <div className="max-w-sm w-full bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border border-white/40 p-1.5 pointer-events-auto flex items-center gap-1.5">
                    {!product.inStock ? (
                        <button className="w-full py-3.5 bg-slate-100 text-slate-400 rounded-full font-bold text-sm cursor-not-allowed px-6">
                            Currently Unavailable
                        </button>
                    ) : cartItem ? (
                        <>
                            {/* Quantity controls */}
                            <div className="flex items-center gap-1 pl-1">
                                <button
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 active:bg-slate-200 transition-colors hover:bg-slate-100"
                                    onClick={() => {
                                        triggerHaptic(30);
                                        updateQuantity(product._id, cartItem.quantity - 1);
                                    }}
                                >
                                    <IcoMinus />
                                </button>
                                <span className="font-black text-base text-slate-900 min-w-[24px] text-center">
                                    {cartItem.quantity}
                                </span>
                                <button
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 active:bg-slate-200 transition-colors hover:bg-slate-100"
                                    onClick={() => {
                                        triggerHaptic(30);
                                        updateQuantity(product._id, cartItem.quantity + 1);
                                    }}
                                >
                                    <IcoPlus />
                                </button>
                            </div>
                            {/* View Cart button */}
                            <button
                                className="flex-1 py-3.5 bg-slate-900 text-white rounded-full font-bold text-sm shadow-sm active:scale-[0.97] transition-transform flex items-center justify-center px-4 hover:bg-slate-800"
                                onClick={() => navigate('/cart')}
                            >
                                View Cart
                            </button>
                        </>
                    ) : (
                        <button
                            className="w-full py-3.5 bg-amber-400 text-amber-950 rounded-full font-bold text-sm shadow-md active:scale-[0.97] transition-transform flex items-center justify-center gap-2 px-6 hover:bg-amber-300"
                            onClick={handleAdd}
                        >
                            Add to Cart <span className="opacity-60">•</span> ₹{product.price}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;