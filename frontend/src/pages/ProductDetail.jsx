import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';
import { toast } from 'react-toastify';
import PageHeader from '../components/ui/PageHeader';

/* ─── Standard Native Icons ─── */
const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IcoHeart = ({ filled }) => <svg fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={filled ? 0 : 1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const IcoShare = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>;
const IcoMinus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>;
const IcoPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const IcoPlaceholder = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-full h-full text-gray-300 p-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>;

const triggerHaptic = (duration = 30) => {
    if (navigator.vibrate) navigator.vibrate(duration);
};

const ProductDetail = () => {
    const { shopId, productId } = useParams();
    const navigate = useNavigate();
    const { cartItems, addToCart, updateQuantity } = useCart();
    const { token } = useAuth();

    const [liked, setLiked] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
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

    // ─── Fetching Data ───
    const { data: shop, isLoading: shopLoading } = useQuery({
        queryKey: ['shop', shopId],
        queryFn: async () => {
            const res = await fetch(`/api/shops/${shopId}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Shop not found');
            return res.json();
        },
    });

    const { data: product, isLoading: productLoading } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const res = await fetch(`/api/products/detail/${productId}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Product not found');
            return res.json();
        },
    });

    // Fetch all shop products to display the "Similar Products" carousel
    const { data: allShopProducts = [] } = useQuery({
        queryKey: ['products', shopId],
        queryFn: async () => {
            const res = await fetch(`/api/products/${shopId}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Products not found');
            return res.json();
        },
    });

    const isLoading = shopLoading || productLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50/70 font-sans">
                <div className="sticky top-0 z-20 bg-white px-4 py-3.5 flex items-center gap-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
                    <div className="skeleton w-40 h-4" />
                </div>
                <div className="p-4 sm:p-8 bg-white">
                    <div className="aspect-square max-h-[400px] w-full skeleton-block rounded-2xl" />
                </div>
                <div className="bg-white px-4 py-5 space-y-3">
                    <div className="skeleton w-24 h-3" />
                    <div className="skeleton w-3/4 h-5" />
                    <div className="skeleton w-28 h-7" />
                </div>
                <div className="bg-white px-4 py-5 space-y-2 border-t border-slate-100">
                    <div className="skeleton w-32 h-4" />
                    <div className="skeleton w-full h-3" />
                    <div className="skeleton w-full h-3" />
                    <div className="skeleton w-2/3 h-3" />
                </div>
            </div>
        );
    }

    if (!product || !shop) {
        return (
            <div className="min-h-screen bg-slate-50/70 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 mb-4 text-slate-300"><IcoPlaceholder /></div>
                <h2 className="text-lg font-black text-slate-900 mb-1">Product Not Found</h2>
                <p className="text-sm text-slate-500 mb-6">This item is currently unavailable.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="btn-dark btn-md"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // Filter out the current product and grab up to 6 random/recent items
    const similarProducts = Array.isArray(allShopProducts)
        ? allShopProducts.filter(p => p._id !== productId).slice(0, 6)
        : [];

    const handleAdd = (itemToAdd = product) => {
        if (!itemToAdd.inStock) return;
        triggerHaptic(50);

        try {
            const res = addToCart(itemToAdd, shopId);
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
    const allImages = product ? [product.image, ...(product.gallery || [])].filter(Boolean) : [];
    const activeImage = allImages.length > 0 ? optimizeImage(allImages[activeImageIndex], 800) : null;

    return (
        <div className="min-h-screen bg-slate-50/70 font-sans pb-40">

            {/* ─── STICKY HEADER ─── */}
            <PageHeader
                title={product.name || 'Product'}
                onBack={() => navigate(-1)}
                right={
                    <div className="flex items-center gap-1">
                        <button
                            className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${liked ? 'text-rose-500 bg-rose-50' : 'text-slate-600 bg-slate-50 hover:bg-slate-100'}`}
                            onClick={toggleLike}
                            aria-label="Save to wishlist"
                        >
                            <IcoHeart filled={liked} />
                        </button>
                        <button
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 bg-slate-50 hover:bg-slate-100 active:scale-90 transition-all"
                            onClick={handleShare}
                            aria-label="Share"
                        >
                            <IcoShare />
                        </button>
                    </div>
                }
            />

            {/* ─── PRODUCT IMAGE GALLERY ─── */}
            <section className="w-full bg-white flex flex-col p-4 sm:p-8">
                <div className="aspect-square w-full max-h-[400px] flex items-center justify-center relative bg-white">
                    {activeImage ? (
                        <img
                            src={activeImage}
                            alt={product.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                        />
                    ) : (
                        <IcoPlaceholder />
                    )}
                </div>
                
                {allImages.length > 1 && (
                    <div className="flex gap-2.5 mt-4 overflow-x-auto pb-2 px-1 [scrollbar-width:none]">
                        {allImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setActiveImageIndex(idx); triggerHaptic(20); }}
                                className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-brand-400 scale-105 shadow-sm' : 'border-slate-100 opacity-70 active:scale-95'}`}
                            >
                                <img src={optimizeImage(img, 200)} className="w-full h-full object-contain mix-blend-multiply" alt={`Gallery ${idx+1}`} />
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* ─── MAIN INFO SECTION ─── */}
            <section className="bg-white px-4 py-5 mb-2 border-b border-slate-100">
                <p className="text-[11px] font-black text-brand-600 uppercase tracking-widest mb-1.5">
                    {typeof product.category === 'object' ? product.category?.name || 'Category' : product.category || 'Category'}
                </p>
                <h1 className="text-xl font-black text-slate-900 leading-snug mb-3 tracking-tight">
                    {product.name} {product.quantity && <span className="text-slate-500 font-semibold text-lg">({product.quantity})</span>}
                </h1>

                <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">₹{product.price}</span>
                    <span className="text-[15px] font-bold text-slate-400 line-through">₹{Math.floor((product.price || 0) * 1.15)}</span>
                    <span className="text-[11px] font-black text-success-700 bg-success-50 px-1.5 py-0.5 rounded-md border border-success-100">15% OFF</span>
                </div>

                <div className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    Sold by <span className="font-semibold text-slate-900">{shop.name}</span>
                </div>
            </section>

            {/* ─── DETAILS SECTION ─── */}
            <section className="bg-white px-4 py-5 border-y border-slate-100 mb-2">
                <h2 className="text-[13px] font-black text-slate-900 mb-2 uppercase tracking-wide">Product Details</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                    {product.description || `High-quality product sourced directly from ${shop.name}. We ensure standard packaging and swift delivery directly to your location.`}
                </p>
            </section>

            {/* ─── SIMILAR PRODUCTS CAROUSEL ─── */}
            {similarProducts.length > 0 && (
                <section className="bg-white py-5 border-y border-slate-100 mb-2">
                    <div className="px-4 flex justify-between items-center mb-4">
                        <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-wide">More from this store</h2>
                    </div>

                    {/* Horizontal Scroll Container */}
                    <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {similarProducts.map(p => (
                            <div
                                key={p._id}
                                onClick={() => navigate(`/shop/${shopId}/product/${p._id}`)}
                                className="w-[140px] shrink-0 bg-white rounded-xl border border-slate-100 p-2.5 flex flex-col snap-start cursor-pointer active:scale-[0.98] transition-all shadow-card hover:shadow-card-hover"
                            >
                                <div className="aspect-square w-full bg-[#F8F9FA] mb-2 flex items-center justify-center relative rounded-lg overflow-hidden">
                                    {p.image ? (
                                        <img src={optimizeImage(p.image, 200)} alt={p.name} className="w-full h-full object-contain mix-blend-multiply" />
                                    ) : (
                                        <div className="w-12 h-12"><IcoPlaceholder /></div>
                                    )}
                                    {!p.inStock && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                                            <span className="bg-slate-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">Sold Out</span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug mb-2 flex-1">
                                    {p.name} {p.quantity && <span className="text-slate-500">({p.quantity})</span>}
                                </h3>
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-sm font-black text-slate-900 tracking-tight">₹{p.price}</span>
                                    <button
                                        className="w-7 h-7 rounded-full bg-success-600 text-white flex items-center justify-center active:bg-success-700 active:scale-90 transition-all disabled:opacity-50 shadow-sm"
                                        disabled={!p.inStock}
                                        onClick={(e) => { e.stopPropagation(); handleAdd(p); }}
                                    >
                                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ─── BOTTOM BAR ─── */}
            <div className="fixed bottom-[64px] inset-x-0 bg-white border-t border-slate-100 p-3 z-50 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]">
                <div className="max-w-xl mx-auto w-full flex gap-3">
                    {!product.inStock ? (
                        <button className="w-full py-3.5 bg-slate-100 text-slate-400 rounded-xl font-black text-sm cursor-not-allowed">
                            Out of Stock
                        </button>
                    ) : cartItem ? (
                        <>
                            {/* Native Quantity Controller */}
                            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-2 w-[120px] shrink-0 shadow-sm">
                                <button
                                    className="p-2 text-slate-600 active:bg-slate-100 rounded-lg"
                                    onClick={() => { triggerHaptic(30); updateQuantity(product._id, cartItem.quantity - 1); }}
                                >
                                    <IcoMinus />
                                </button>
                                <span className="font-black text-base text-slate-900">
                                    {cartItem.quantity}
                                </span>
                                <button
                                    className="p-2 text-slate-600 active:bg-slate-100 rounded-lg"
                                    onClick={() => { triggerHaptic(30); updateQuantity(product._id, cartItem.quantity + 1); }}
                                >
                                    <IcoPlus />
                                </button>
                            </div>
                            <button
                                className="flex-1 py-3.5 bg-success-600 text-white rounded-xl font-black text-sm active:bg-success-700 transition-colors shadow-[0_4px_14px_rgba(16,185,129,0.3)]"
                                onClick={() => navigate('/cart')}
                            >
                                Go to Cart
                            </button>
                        </>
                    ) : (
                        <button
                            className="w-full py-3.5 bg-success-600 text-white rounded-xl font-black text-sm active:bg-success-700 transition-colors shadow-[0_4px_14px_rgba(16,185,129,0.3)]"
                            onClick={() => handleAdd(product)}
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