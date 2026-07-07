import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';
import { toast } from 'react-toastify';

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
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
            </div>
        );
    }

    if (!product || !shop) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 mb-4"><IcoPlaceholder /></div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Product Not Found</h2>
                <p className="text-sm text-gray-500 mb-6">This item is currently unavailable.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg"
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
        <div className="min-h-screen bg-gray-100 font-sans pb-40">

            {/* ─── STANDARD STICKY HEADER ─── */}
            <header className="sticky top-0 inset-x-0 z-50 bg-white border-b border-gray-200 flex items-center justify-between px-2 py-2">
                <button
                    className="p-2 text-gray-800 active:bg-gray-100 rounded-full transition-colors"
                    onClick={() => navigate(-1)}
                >
                    <IcoBack />
                </button>
                <div className="flex items-center">
                    <button
                        className={`p-2 rounded-full active:bg-gray-100 transition-colors ${liked ? 'text-red-500' : 'text-gray-800'}`}
                        onClick={toggleLike}
                    >
                        <IcoHeart filled={liked} />
                    </button>
                    <button
                        className="p-2 text-gray-800 active:bg-gray-100 rounded-full transition-colors"
                        onClick={handleShare}
                    >
                        <IcoShare />
                    </button>
                </div>
            </header>

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
                                className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-amber-400 scale-105 shadow-sm' : 'border-gray-100 opacity-70 active:scale-95'}`}
                            >
                                <img src={optimizeImage(img, 200)} className="w-full h-full object-contain mix-blend-multiply" alt={`Gallery ${idx+1}`} />
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* ─── MAIN INFO SECTION ─── */}
            <section className="bg-white px-4 py-5 mb-2 border-b border-gray-200">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    {typeof product.category === 'object' ? product.category?.name || 'Category' : product.category || 'Category'}
                </p>
                <h1 className="text-xl font-bold text-gray-900 leading-snug mb-3 tracking-tight">
                    {product.name} {product.quantity && <span className="text-gray-500 font-medium text-lg">({product.quantity})</span>}
                </h1>

                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-gray-900 tracking-tight">₹{product.price}</span>
                </div>

                <div className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                    Sold by <span className="font-semibold text-gray-900">{shop.name}</span>
                </div>
            </section>

            {/* ─── DETAILS SECTION ─── */}
            <section className="bg-white px-4 py-5 border-y border-gray-200 mb-2">
                <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Product Details</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                    {product.description || `High-quality product sourced directly from ${shop.name}. We ensure standard packaging and swift delivery directly to your location.`}
                </p>
            </section>

            {/* ─── SIMILAR PRODUCTS CAROUSEL ─── */}
            {similarProducts.length > 0 && (
                <section className="bg-white py-5 border-y border-gray-200 mb-2">
                    <div className="px-4 flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">More from this store</h2>
                    </div>

                    {/* Horizontal Scroll Container */}
                    <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {similarProducts.map(p => (
                            <div
                                key={p._id}
                                onClick={() => navigate(`/shop/${shopId}/product/${p._id}`)}
                                className="w-[140px] shrink-0 border border-gray-200 rounded-lg p-2.5 flex flex-col snap-start cursor-pointer active:bg-gray-50 transition-colors"
                            >
                                <div className="aspect-square w-full bg-white mb-2 flex items-center justify-center relative rounded overflow-hidden">
                                    {p.image ? (
                                        <img src={optimizeImage(p.image, 200)} alt={p.name} className="w-full h-full object-contain mix-blend-multiply" />
                                    ) : (
                                        <div className="w-12 h-12"><IcoPlaceholder /></div>
                                    )}
                                    {!p.inStock && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                                            <span className="bg-white text-gray-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-gray-200 shadow-sm">Sold Out</span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug mb-2 flex-1">
                                    {p.name} {p.quantity && <span className="text-gray-500">({p.quantity})</span>}
                                </h3>
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-sm font-bold text-gray-900 tracking-tight">₹{p.price}</span>
                                    <button
                                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 active:bg-gray-200 transition-colors disabled:opacity-50"
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

            {/* ─── STANDARD BOTTOM BAR ─── */}
            <div className="fixed bottom-[64px] inset-x-0 bg-white border-t border-gray-200 p-3 z-50">
                <div className="max-w-xl mx-auto w-full flex gap-3">
                    {!product.inStock ? (
                        <button className="w-full py-3.5 bg-gray-100 text-gray-400 rounded-lg font-semibold text-sm cursor-not-allowed">
                            Out of Stock
                        </button>
                    ) : cartItem ? (
                        <>
                            {/* Native Quantity Controller */}
                            <div className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-2 w-[120px] shrink-0">
                                <button
                                    className="p-2 text-gray-600 active:bg-gray-100 rounded"
                                    onClick={() => { triggerHaptic(30); updateQuantity(product._id, cartItem.quantity - 1); }}
                                >
                                    <IcoMinus />
                                </button>
                                <span className="font-semibold text-base text-gray-900">
                                    {cartItem.quantity}
                                </span>
                                <button
                                    className="p-2 text-gray-600 active:bg-gray-100 rounded"
                                    onClick={() => { triggerHaptic(30); updateQuantity(product._id, cartItem.quantity + 1); }}
                                >
                                    <IcoPlus />
                                </button>
                            </div>
                            <button
                                className="flex-1 py-3.5 bg-gray-900 text-white rounded-lg font-semibold text-sm active:bg-gray-800 transition-colors"
                                onClick={() => navigate('/cart')}
                            >
                                Go to Cart
                            </button>
                        </>
                    ) : (
                        <button
                            className="w-full py-3.5 bg-amber-400 text-amber-950 rounded-lg font-semibold text-sm active:bg-amber-500 transition-colors"
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