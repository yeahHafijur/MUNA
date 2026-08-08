import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { optimizeImage } from '../utils/imageUtils';
import PageHeader from '../components/ui/PageHeader';
import { toast } from 'react-toastify';

/* ─── Icons ─── */
const IconHeart = ({ filled }) => (
    <svg fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={filled ? 0 : 1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);
const IconEmpty = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-16 h-16">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

/* Extract shop id whether the backend returns a string or populated object */
const getShopId = (product) => (
    typeof product.shopId === 'object' && product.shopId !== null ? product.shopId._id : product.shopId
);

const Wishlist = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { cartItems, addToCart, overrideAndReplaceCart, updateQuantity } = useCart();
    const [replacePrompt, setReplacePrompt] = useState(null);

    const { data: wishlist = [], isLoading, isError } = useQuery({
        queryKey: ['wishlist'],
        queryFn: async () => {
            const res = await fetch('/api/user/wishlist', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch wishlist');
            return res.json();
        },
        enabled: true
    });

    const handleRemove = async (productId, e) => {
        if (e) e.stopPropagation();
        try {
            if (token) await fetch(`/api/user/wishlist/${productId}`, { method: 'DELETE', credentials: 'include' });
        } catch { /* ignore */ }
        toast.info('Removed from wishlist');
    };

    const handleAdd = (e, product) => {
        e.stopPropagation();
        const shopId = getShopId(product);
        if (!shopId) return;
        const res = addToCart(product, shopId);
        if (res && res.success === false && res.error === 'DIFFERENT_SHOP_ERROR') {
            setReplacePrompt(product);
            return;
        }
        if (navigator.vibrate) navigator.vibrate(50);
        toast.success('Added to cart');
    };

    const cartQty = (productId) => cartItems.find(i => i.productId === productId)?.quantity || 0;

    return (
        <div className="min-h-screen bg-slate-50/70 font-sans pb-10">
            <PageHeader title="Wishlist" subtitle="Items you saved for later" variant="white" />

            {isLoading ? (
                <div className="p-4 sm:p-5 max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="card overflow-hidden">
                                <div className="aspect-square skeleton-block rounded-none" />
                                <div className="p-3 space-y-2">
                                    <div className="skeleton w-3/4 h-3" />
                                    <div className="skeleton w-1/3 h-3" />
                                    <div className="skeleton w-1/2 h-6" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : isError ? (
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-sm font-semibold text-slate-500 mb-4">We couldn't fetch your saved items.</p>
                    <button onClick={() => navigate(-1)} className="btn-dark btn-md">Go Back</button>
                </div>
            ) : wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-24 text-center px-4">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-card border border-slate-100 mb-5 text-rose-300">
                        <IconEmpty />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 mb-2 tracking-tight">No items saved yet</h2>
                    <p className="text-sm text-slate-500 mb-6 max-w-xs leading-relaxed">
                        Tap the heart on any product to keep it here for later.
                    </p>
                    <button onClick={() => navigate('/')} className="btn-primary btn-lg">
                        Continue Shopping
                    </button>
                </div>
            ) : (
                <div className="p-4 sm:p-5 max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {wishlist.map(product => {
                            const qty = cartQty(product._id);
                            const isOut = product.inStock === false || product.shopIsOpen === false;
                            const shopId = getShopId(product);
                            return (
                                <div
                                    key={product._id}
                                    onClick={() => shopId && navigate(`/shop/${shopId}/product/${product._id}`)}
                                    className="bg-white rounded-2xl p-2.5 shadow-card border border-slate-100 flex flex-col cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group h-full"
                                >
                                    {/* Heart — remove from wishlist */}
                                    <button
                                        onClick={(e) => handleRemove(product._id, e)}
                                        className="absolute top-2 right-2 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-sm flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
                                        aria-label="Remove from wishlist"
                                    >
                                        <IconHeart filled />
                                    </button>

                                    {/* Image */}
                                    <div className="w-full aspect-square rounded-xl bg-[#F8F9FA] mb-2 p-3 flex flex-col relative overflow-hidden">
                                        {product.image ? (
                                            <img
                                                src={optimizeImage(product.image, 300)}
                                                alt={product.name}
                                                className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                                            </div>
                                        )}
                                        {isOut && (
                                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                                                <span className="bg-slate-800 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                                                    {product.shopIsOpen === false ? 'Shop Closed' : 'Out of Stock'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <h4 className="text-[13px] font-bold text-slate-900 line-clamp-2 leading-tight mb-1 tracking-tight min-h-[30px]">
                                        {product.name} {product.quantity && <span className="text-slate-500 text-[12px]">({product.quantity})</span>}
                                    </h4>
                                    <span className="text-[11px] font-medium text-slate-500 mb-2 truncate">
                                        {typeof product.shopId === 'object' && product.shopId?.name ? `By ${product.shopId.name}` : (product.category?.name || product.category || '')}
                                    </span>

                                    {/* Price + Add */}
                                    <div className="mt-auto flex items-end justify-between pt-1">
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-black text-slate-900 leading-none">₹{product.price || 0}</span>
                                            <span className="text-[11px] font-semibold text-slate-400 line-through leading-none mt-0.5">₹{Math.floor((product.price || 0) * 1.15)}</span>
                                        </div>
                                        {qty > 0 ? (
                                            <div className="flex items-center justify-between bg-success-700 text-white rounded-lg h-8 w-[72px] px-1 shadow-sm">
                                                <button onClick={(e) => { e.stopPropagation(); updateQuantity(product._id, qty - 1); }} className="w-7 h-full flex items-center justify-center text-lg font-bold active:scale-90">−</button>
                                                <span className="text-[13px] font-bold">{qty}</span>
                                                <button onClick={(e) => { e.stopPropagation(); updateQuantity(product._id, qty + 1); }} className="w-7 h-full flex items-center justify-center text-lg font-bold active:scale-90">+</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => handleAdd(e, product)}
                                                disabled={isOut}
                                                className={`h-8 px-4 rounded-lg border font-black text-[12px] flex items-center justify-center transition-all
                                                    ${isOut
                                                        ? 'border-slate-200 text-slate-300 bg-slate-50'
                                                        : 'border-success-600 text-success-700 bg-success-50/50 hover:bg-success-100 active:scale-95 shadow-sm'}`}
                                            >
                                                ADD
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Replace cart modal ── */}
            {replacePrompt && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pt-4 pb-[80px]">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🛒</span>
                        </div>
                        <h3 className="text-xl font-black text-center text-slate-900 mb-2">Replace cart items?</h3>
                        <p className="text-sm text-center text-slate-500 font-medium mb-6 leading-relaxed">
                            Your cart contains items from another shop. Replace it with this item?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setReplacePrompt(null)} className="flex-1 py-3.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
                                No, thanks
                            </button>
                            <button
                                onClick={() => {
                                    const shopId = getShopId(replacePrompt);
                                    if (shopId) overrideAndReplaceCart(replacePrompt, shopId);
                                    setReplacePrompt(null);
                                    if (navigator.vibrate) navigator.vibrate(50);
                                }}
                                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-md transition-all"
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

export default Wishlist;