import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../context/CartContext';
import { optimizeImage } from '../utils/imageUtils';
import './ProductDetail.css';

const ProductDetail = () => {
    const { shopId, productId } = useParams();
    const navigate = useNavigate();
    const { cartItems, addToCart, updateQuantity } = useCart();
    
    const [liked, setLiked] = useState(false);
    
    // Check if item is already in cart
    const cartItem = cartItems.find(i => i.productId === productId);
    const initialQty = cartItem ? cartItem.quantity : 1;
    const [quantity, setQuantity] = useState(initialQty);

    useEffect(() => {
        if (cartItem) {
            setQuantity(cartItem.quantity);
        }
    }, [cartItem]);

    // Load liked status from localStorage
    useEffect(() => {
        const savedLikes = JSON.parse(localStorage.getItem('muna_likes') || '{}');
        if (savedLikes[productId]) {
            setLiked(true);
        }
    }, [productId]);

    const toggleLike = () => {
        const newLiked = !liked;
        setLiked(newLiked);
        const savedLikes = JSON.parse(localStorage.getItem('muna_likes') || '{}');
        if (newLiked) {
            savedLikes[productId] = true;
        } else {
            delete savedLikes[productId];
        }
        localStorage.setItem('muna_likes', JSON.stringify(savedLikes));
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Check out this product on MUNA',
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    // Fetch the shop details
    const { data: shop, isLoading: shopLoading, error: shopError } = useQuery({
        queryKey: ['shop', shopId],
        queryFn: () => fetch(`/api/shops/${shopId}`).then(r => {
            if (!r.ok) throw new Error('Shop not found');
            return r.json();
        }),
    });

    // Fetch the products for this shop
    const { data: productsData = [], isLoading: productsLoading } = useQuery({
        queryKey: ['products', shopId],
        queryFn: () => fetch(`/api/products/${shopId}`).then(r => r.json()),
    });
    
    const isLoading = shopLoading || productsLoading;
    const error = shopError;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#fdfdfc]">
                <div className="relative flex items-center justify-center mb-4">
                    <div className="absolute w-16 h-16 rounded-full bg-yellow-400 opacity-30 animate-ping"></div>
                    <div className="absolute w-12 h-12 rounded-full bg-yellow-500 opacity-40 animate-pulse"></div>
                    <div className="z-10 text-4xl animate-bounce" style={{ animationDuration: '1s' }}>🛍️</div>
                </div>
                <div className="text-yellow-600 font-black tracking-[0.2em] text-xs animate-pulse">LOADING DETAILS</div>
            </div>
        );
    }

    if (error || !shop) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#fdfdfc]">
                <div className="text-4xl mb-4">😢</div>
                <h2 className="text-xl font-bold text-gray-800">Shop not found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-amber-500 text-white font-bold rounded-full">Go Back</button>
            </div>
        );
    }

    // Ensure products is an array
    const products = Array.isArray(productsData) ? productsData : [];
    
    // Find the product
    const product = products.find(p => p._id === productId);

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#fdfdfc]">
                <div className="text-4xl mb-4">🔍</div>
                <h2 className="text-xl font-bold text-gray-800">Product not found in this shop</h2>
                <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-amber-500 text-white font-bold rounded-full">Go Back</button>
            </div>
        );
    }

    const handleAdd = () => {
        if (!product.inStock) return;
        addToCart(product, shop, quantity);
        // We do not navigate back immediately so user can see it's added.
    };

    return (
        <div className="pd-page animate-in fade-in duration-300">
            {/* Header / Nav */}
            <header className="pd-header">
                <button className="pd-icon-btn" onClick={() => navigate(-1)} aria-label="Go back">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <div className="flex gap-3">
                    <button className={`pd-icon-btn ${liked ? 'liked' : ''}`} onClick={toggleLike} aria-label="Like product">
                        <svg fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                    </button>
                    <button className="pd-icon-btn" onClick={handleShare} aria-label="Share product">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Image Section */}
            <div className="pd-image-wrapper">
                {product.image ? (
                    <img src={optimizeImage(product.image, 800)} alt={product.name} className="pd-image" />
                ) : (
                    <div className="pd-image-placeholder">🛍️</div>
                )}
            </div>

            {/* Product Info */}
            <div className="pd-info-card">
                <span className="pd-cat-tag">
                    {typeof product.category === 'object' ? (product.category?.name || 'General') : (product.category || 'General')}
                </span>
                
                <h1 className="pd-title">{product.name}</h1>
                
                <div className="pd-price-row">
                    <div className="pd-price">
                        <span className="pd-price-symbol">₹</span>
                        {product.price}
                    </div>
                    {product.inStock ? (
                        <div className="pd-stock-tag">In Stock</div>
                    ) : (
                        <div className="pd-stock-tag oos">Out of Stock</div>
                    )}
                </div>
            </div>

            {/* Details Section (Mock for now as per user request to add slowly) */}
            <div className="pd-section mt-4">
                <h2 className="pd-section-title">Product Details</h2>
                <div className="pd-description">
                    This is a premium product available at {shop.name}. 
                    We are constantly updating our catalog to bring you the best quality items directly from local stores.
                    More details and reviews will be added soon!
                </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="pd-bottom-bar">
                {product.inStock ? (
                    <>
                        {cartItem ? (
                            <div className="pd-qty-ctrl">
                                <button className="pd-qty-btn" onClick={() => updateQuantity(product._id, cartItem.quantity - 1)}>
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                                </button>
                                <span className="pd-qty-val">{cartItem.quantity}</span>
                                <button className="pd-qty-btn" onClick={() => updateQuantity(product._id, cartItem.quantity + 1)}>
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                </button>
                            </div>
                        ) : (
                            <div className="pd-qty-ctrl">
                                <button className="pd-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                                </button>
                                <span className="pd-qty-val">{quantity}</span>
                                <button className="pd-qty-btn" onClick={() => setQuantity(quantity + 1)}>
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                </button>
                            </div>
                        )}
                        <button 
                            className="pd-add-btn" 
                            onClick={handleAdd}
                        >
                            {cartItem ? (
                                <>
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                    Updated Cart
                                </>
                            ) : (
                                <>
                                    Add to Cart - ₹{product.price * quantity}
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <button className="pd-add-btn oos" disabled>
                        Currently Out of Stock
                    </button>
                )}
            </div>

        </div>
    );
};

export default ProductDetail;
