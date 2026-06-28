import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../context/CartContext';
import { optimizeImage } from '../utils/imageUtils';
import { toast } from 'react-toastify';

/* ─── Standard Clean Icons ─── */
const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const IcoHeart = ({ filled }) => <svg fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const IcoShare = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>;
const IcoMinus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>;
const IcoPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const IcoTruck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V11.625c0-.621-.504-1.125-1.125-1.125h-9.75a1.125 1.125 0 00-1.125 1.125v4.5m11.25 0v-4.5m0 0H21m-2.25-4.5h.008v.008h-.008V6.75z" /></svg>;
const IcoShield = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;

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
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    // --- ERROR STATE ---
    if (!product || !shop) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mb-4">🔍</div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Item not found</h2>
                <p className="text-[13px] text-slate-500 mb-6">This item might have been removed or is unavailable.</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl active:scale-95 transition-transform">
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
        <div className="min-h-screen bg-white font-sans pb-28 animate-in fade-in duration-300">

            {/* ─── STANDARD SOLID HEADER ─── */}
            <header className="sticky top-0 inset-x-0 bg-white border-b border-slate-100 flex items-center justify-between px-4 py-3 z-50 shadow-sm">
                <button
                    className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                    onClick={() => navigate(-1)}
                >
                    <IcoBack />
                </button>
                <span className="text-[15px] font-extrabold text-slate-900">Details</span>
                <div className="flex items-center gap-1 -mr-2">
                    <button
                        className={`w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all ${liked ? 'text-rose-500' : 'text-slate-500'}`}
                        onClick={toggleLike}
                    >
                        <IcoHeart filled={liked} />
                    </button>
                    <button
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50 active:scale-95 transition-all"
                        onClick={handleShare}
                    >
                        <IcoShare />
                    </button>
                </div>
            </header>

            {/* ─── STANDARD PRODUCT IMAGE BOX ─── */}
            <div className="w-full aspect-[4/3] max-h-[400px] bg-[#F8FAFC] flex items-center justify-center p-6 border-b border-slate-100">
                {product.image ? (
                    <img src={optimizeImage(product.image, 800)} alt={product.name} className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm" />
                ) : (
                    <span className="text-5xl opacity-20">🛍️</span>
                )}
            </div>

            {/* ─── PRODUCT INFO DETAILS ─── */}
            <div className="p-5 max-w-3xl mx-auto">

                {/* Brand & Category */}
                <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        {typeof product.category === 'object' ? (product.category?.name || 'General') : (product.category || 'General')}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest truncate">
                        Sold by {shop.name}
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-black text-slate-900 leading-tight mb-4">
                    {product.name}
                </h1>

                {/* Price & Stock */}
                <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                    <div className="flex items-start">
                        <span className="text-lg font-bold text-slate-500 mt-1 mr-1">₹</span>
                        <span className="text-4xl font-black text-slate-900 leading-none">{product.price}</span>
                    </div>
                    {product.inStock ? (
                        <span className="text-[12px] font-bold text-emerald-600 mb-1">✓ In Stock</span>
                    ) : (
                        <span className="text-[12px] font-bold text-rose-600 mb-1">✗ Out of Stock</span>
                    )}
                </div>

                <hr className="border-slate-100 mb-6" />

                {/* Features / Highlights */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
                            <IcoTruck />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-900">Fast Delivery</span>
                            <span className="text-[11px] text-slate-500 font-medium">15 - 30 Mins</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
                            <IcoShield />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-900">Quality Checked</span>
                            <span className="text-[11px] text-slate-500 font-medium">100% Genuine</span>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100 mb-6" />

                {/* Description */}
                <div>
                    <h2 className="text-[15px] font-black text-slate-900 mb-3">About this item</h2>
                    <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                        This is a premium quality product sourced directly from <span className="font-bold text-slate-800">{shop.name}</span>.
                        We take pride in ensuring that you receive the freshest and best items delivered to your doorstep swiftly.
                    </p>
                </div>
            </div>

            {/* ─── STANDARD STICKY BOTTOM BAR ─── */}
            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="max-w-md mx-auto w-full">
                    {!product.inStock ? (
                        <button className="w-full py-3.5 bg-slate-100 text-slate-400 rounded-xl font-black text-[14px] uppercase tracking-wider cursor-not-allowed border border-slate-200">
                            Currently Unavailable
                        </button>
                    ) : cartItem ? (
                        <div className="flex gap-3 h-[50px]">
                            {/* Quantity Controller */}
                            <div className="flex items-center justify-between bg-white rounded-xl px-2 w-[130px] border-2 border-amber-400 shrink-0 shadow-sm">
                                <button
                                    className="w-10 h-10 flex items-center justify-center text-amber-600 active:scale-75 transition-transform"
                                    onClick={() => { if (navigator.vibrate) navigator.vibrate(30); updateQuantity(product._id, cartItem.quantity - 1); }}
                                >
                                    <IcoMinus />
                                </button>
                                <span className="font-black text-[15px] text-slate-900">{cartItem.quantity}</span>
                                <button
                                    className="w-10 h-10 flex items-center justify-center text-amber-600 active:scale-75 transition-transform"
                                    onClick={() => { if (navigator.vibrate) navigator.vibrate(30); updateQuantity(product._id, cartItem.quantity + 1); }}
                                >
                                    <IcoPlus />
                                </button>
                            </div>

                            {/* View Cart Button */}
                            <button
                                className="flex-1 bg-amber-400 text-amber-950 rounded-xl font-black text-[14px] shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
                                onClick={() => navigate('/cart')}
                            >
                                View Cart <span className="text-lg leading-none">➔</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            className="w-full h-[50px] bg-amber-400 text-amber-950 rounded-xl font-black text-[15px] shadow-sm active:scale-95 transition-transform flex items-center justify-center"
                            onClick={handleAdd}
                        >
                            Add to Cart
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
};

export default ProductDetail;