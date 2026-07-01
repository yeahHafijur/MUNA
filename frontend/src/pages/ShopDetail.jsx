import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { optimizeImage } from '../utils/imageUtils';
import ProductCard from '../components/ProductCard';
import './ShopDetail.css';

/* ─── Icon Components ─── */
const IcoBack = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);
const IcoSearch = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const IcoCart = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const IcoArrow = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

/* Removed food emojis */

/* ═══════════════════════════════════════════════════════════
   SHOP DETAIL PAGE — Premium Full-Page Experience
═══════════════════════════════════════════════════════════ */
const ShopDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, overrideAndReplaceCart, cartItems, getTotal, updateQuantity } = useCart();

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [replacePrompt, setReplacePrompt] = useState(null); // stores the product if replace cart modal should be shown

    const totalCartItems = cartItems.reduce((s, i) => s + i.quantity, 0);
    const cartTotal = getTotal();

    /* ── Fetch data with React Query ── */
    const { data: shop, isLoading: shopLoading } = useQuery({
        queryKey: ['shop', id],
        queryFn: () => fetch(`/api/shops/${id}`).then(r => r.json()),
    });

    const { data: productsData = [], isLoading: productsLoading } = useQuery({
        queryKey: ['products', id],
        queryFn: () => fetch(`/api/products/${id}`).then(r => r.json()),
    });
    // Ensure products is an array
    const products = Array.isArray(productsData) ? productsData : [];

    const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories', id],
        queryFn: () => fetch(`/api/categories/${id}`).then(r => r.json()),
    });
    // Ensure categoriesList is an array
    const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];

    const loading = shopLoading || productsLoading || categoriesLoading;

    /* ── Categories ── */
    // Still support legacy string categories fallback
    const categories = useMemo(() => {
        const prodCatNames = new Set(products.map(p => {
            if (!p.category) return 'General';
            return typeof p.category === 'object' ? (p.category.name || 'General') : p.category;
        }));

        // Merge API categories with any legacy ones found in products
        categoriesList.forEach(c => prodCatNames.add(c.name));
        return Array.from(prodCatNames).sort();
    }, [products, categoriesList]);

    const getCatImage = (catName) => {
        const cat = categoriesList.find(c => c.name === catName);
        return cat ? cat.image : null;
    };

    /* ── Filtered products ── */
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            // Category filter
            const pCatName = typeof p.category === 'object' ? (p.category?.name || 'General') : (p.category || 'General');
            if (selectedCategory && selectedCategory !== 'All' && pCatName !== selectedCategory) return false;

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const nameMatch = p.name.toLowerCase().includes(query);
                const catMatch = pCatName.toLowerCase().includes(query);
                if (!nameMatch && !catMatch) return false;
            }

            return true;
        }).sort((a, b) => {
            if (a.inStock === b.inStock) return 0;
            return a.inStock ? 1 : -1;
        });
    }, [products, selectedCategory, searchQuery]);

    /* ── Show product view? ── */
    const showProducts = selectedCategory !== null || !!searchQuery;

    /* ── Handle Add to Cart with Animation ── */
    const handleAddClick = (e, product) => {
        const res = addToCart(product, id);
        if (res && res.success === false && res.error === 'DIFFERENT_SHOP_ERROR') {
            setReplacePrompt(product);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const flyEl = document.createElement('div');
        flyEl.className = 'sd-fly-plus';
        flyEl.textContent = '+1';
        flyEl.style.left = `${rect.left + rect.width / 2}px`;
        flyEl.style.top = `${rect.top}px`;
        document.body.appendChild(flyEl);

        setTimeout(() => flyEl.remove(), 800);

        // Vibrate on supported devices
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    };

    /* ═══════════════════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════════════════ */
    return (
        <div className="sd">

            {/* ════════ HEADER ════════ */}
            <header className="sd-header">
                <div className="sd-header-row">
                    <button className="sd-back-btn" onClick={() => navigate(-1)}>
                        <IcoBack />
                    </button>
                    <span className="sd-header-title">
                        {shop?.name || 'Shop'}
                    </span>
                    <div className="sd-header-actions">
                        <Link to="/cart" className="sd-hdr-btn" title="Cart">
                            <IcoCart />
                            {totalCartItems > 0 && (
                                <span key={totalCartItems} className="sd-hdr-badge">{totalCartItems}</span>
                            )}
                        </Link>
                    </div>
                </div>
            </header>

            {/* ════════ SCROLLABLE BODY ════════ */}
            <div className="sd-body">

                {loading ? (
                    /* ── Skeleton ── */
                    <>
                        <div className="sd-skel-hero" />
                        <div className="sd-skel">
                            <div className="sd-skel-row">
                                {[1, 2, 3, 4].map(i => <div key={i} className="sd-skel-chip" />)}
                            </div>
                        </div>
                        <div className="sd-skel-grid">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="sd-skel-card">
                                    <div className="sd-skel-card-img" />
                                    <div className="sd-skel-card-body">
                                        <div className="sd-skel-line" />
                                        <div className="sd-skel-line sd-skel-line--sm" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {/* ════════ HERO BANNER ════════ */}
                        {shop && !showProducts && (
                            <div className="sd-hero">
                                {shop.image ? (
                                    <img src={optimizeImage(shop.image)} alt={shop.name} className="sd-hero-img" />
                                ) : (
                                    <div className="sd-hero-placeholder">🏪</div>
                                )}
                                <div className="sd-hero-gradient" />
                                <div className="sd-hero-content">
                                    <span className={`sd-hero-status ${shop.isOpen ? 'sd-hero-status--open' : 'sd-hero-status--closed'}`}>
                                        <span className="sd-hero-status-dot" />
                                        {shop.isOpen ? 'Open Now' : 'Closed'}
                                    </span>
                                    <h1 className="sd-hero-name">{shop.name}</h1>
                                    <div className="sd-hero-info">
                                        <span className="sd-hero-info-item">📍 {shop.address}</span>
                                        {shop.vendorId?.phone && (
                                            <span className="sd-hero-info-item">📞 {shop.vendorId.phone}</span>
                                        )}
                                        {shop.location?.coordinates && (
                                            <button
                                                className="sd-hero-dir-btn"
                                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.location.coordinates[1]},${shop.location.coordinates[0]}`, '_blank')}
                                            >
                                                🗺️ Directions
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ════════ SEARCH ════════ */}
                        <div className="sd-search">
                            <div className="sd-search-wrap">
                                <IcoSearch />
                                <input
                                    type="search"
                                    name="q"
                                    id="shop-search-input"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    spellCheck="false"
                                    placeholder="Search items, categories..."
                                    className="sd-search-input"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button className="sd-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                                )}
                            </div>
                        </div>

                        {/* ════════ CATEGORY CHIPS ════════ */}
                        {showProducts && (
                            <div className="sd-cats">
                                <div className="sd-cats-scroll">
                                    <button
                                        className={`sd-chip ${selectedCategory === null && !searchQuery ? 'sd-chip--active' : ''}`}
                                        onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                                    >
                                        ← Categories
                                    </button>
                                    <button
                                        className={`sd-chip ${selectedCategory === 'All' ? 'sd-chip--active' : ''}`}
                                        onClick={() => setSelectedCategory('All')}
                                    >
                                        📦 All <span className="sd-chip-count">({products.length})</span>
                                    </button>
                                    {categories.map((cat, idx) => {
                                        const customImg = getCatImage(cat);
                                        return (
                                            <button
                                                key={cat}
                                                className={`sd-chip ${selectedCategory === cat ? 'sd-chip--active' : ''}`}
                                                onClick={() => setSelectedCategory(cat)}
                                            >
                                                {customImg ? (
                                                    <img src={optimizeImage(customImg)} alt={cat} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover', display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                                                ) : (
                                                    <span style={{ marginRight: '4px', fontSize: '16px' }}>🏷</span>
                                                )}
                                                {cat}
                                                <span className="sd-chip-count">
                                                    ({products.filter(p => {
                                                        const pCatName = typeof p.category === 'object' ? (p.category?.name || 'General') : (p.category || 'General');
                                                        return pCatName === cat;
                                                    }).length})
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {products.length === 0 ? (
                            /* ── No products ── */
                            <div className="sd-empty">
                                <span className="sd-empty-emoji">📦</span>
                                <div className="sd-empty-title">No products available</div>
                                <div className="sd-empty-sub">This shop hasn't added any items yet.</div>
                            </div>
                        ) : !showProducts ? (
                            /* ═══════ VIEW 1: CATEGORY CARDS ═══════ */
                            <>
                                <div className="sd-sec-head">
                                    <h2 className="sd-sec-title">Browse by Category</h2>
                                    <span className="sd-sec-count">{categories.length + 1} categories</span>
                                </div>
                                <div className="sd-cat-grid">
                                    {/* All Items card */}
                                    <div
                                        className="sd-cat-card sd-cat-card--all"
                                        onClick={() => setSelectedCategory('All')}
                                    >
                                        <div className="sd-cat-content">
                                            <div className="sd-cat-name">All Items</div>
                                            <div className="sd-cat-count">{products.length} items</div>
                                        </div>
                                    </div>

                                    {categories.map((cat, idx) => {
                                        const count = products.filter(p => {
                                            const pCatName = typeof p.category === 'object' ? (p.category?.name || 'General') : (p.category || 'General');
                                            return pCatName === cat;
                                        }).length;
                                        const customImg = getCatImage(cat);
                                        return (
                                            <div
                                                key={cat}
                                                className={`sd-cat-card ${customImg ? 'sd-cat-card--has-img' : ''}`}
                                                onClick={() => setSelectedCategory(cat)}
                                            >
                                                {customImg ? (
                                                    <>
                                                        <img src={optimizeImage(customImg)} alt={cat} className="sd-cat-bg-img" />
                                                        <div className="sd-cat-overlay"></div>
                                                    </>
                                                ) : (
                                                    <span className="sd-cat-emoji" style={{ fontSize: '28px' }}>🏷</span>
                                                )}
                                                <div className="sd-cat-content">
                                                    <div className="sd-cat-name">{cat}</div>
                                                    <div className="sd-cat-count">{count} items</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            /* ═══════ VIEW 2: PRODUCT GRID ═══════ */
                            <>
                                <div className="sd-sec-head">
                                    <h2 className="sd-sec-title">
                                        {searchQuery
                                            ? `Results for "${searchQuery}"`
                                            : selectedCategory === 'All'
                                                ? 'All Items'
                                                : selectedCategory}
                                    </h2>
                                    <span className="sd-sec-count">{filteredProducts.length} items</span>
                                </div>

                                {filteredProducts.length === 0 ? (
                                    <div className="sd-empty">
                                        <span className="sd-empty-emoji">🔍</span>
                                        <div className="sd-empty-title">No items found</div>
                                        <div className="sd-empty-sub">
                                            {searchQuery ? 'Try a different search term' : 'No items in this category'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="sd-prod-grid">
                                        {filteredProducts.map((product, idx) => {
                                            const inCart = cartItems.find(i => i.productId === product._id);
                                            return (
                                                <div key={product._id} style={{ animationDelay: `${idx * 40}ms` }} className="sd-prod-wrapper">
                                                    <ProductCard 
                                                        product={product}
                                                        onClick={() => navigate(`/shop/${id}/product/${product._id}`)}
                                                        onAddClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddClick(e, product);
                                                        }}
                                                        quantity={inCart?.quantity || 0}
                                                        onIncrement={(e) => {
                                                            e.stopPropagation();
                                                            updateQuantity(product._id, inCart.quantity + 1);
                                                        }}
                                                        onDecrement={(e) => {
                                                            e.stopPropagation();
                                                            updateQuantity(product._id, inCart.quantity - 1);
                                                        }}
                                                        discount="15%"
                                                        deliveryTime="10 MINS"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* ════════ FLOATING CART BAR ════════ */}
            {totalCartItems > 0 && (
                <Link to="/cart" key={totalCartItems} className="sd-cart-bar">
                    <div className="sd-cart-bar-left">
                        <span className="sd-cart-bar-count">{totalCartItems}</span>
                        <div>
                            <div className="sd-cart-bar-text">
                                {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'} added
                            </div>
                            <div className="sd-cart-bar-sub">from this shop</div>
                        </div>
                    </div>
                    <div className="sd-cart-bar-right">
                        View Cart <IcoArrow />
                    </div>
                </Link>
            )}

            {/* ════════ REPLACE CART MODAL ════════ */}
            {replacePrompt && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pt-4 pb-[80px] animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🛒</span>
                        </div>
                        <h3 className="text-xl font-black text-center text-gray-900 mb-2">Replace cart item?</h3>
                        <p className="text-sm text-center text-gray-500 font-medium mb-6 leading-relaxed">
                            Your cart contains dishes from another shop. Do you want to discard the selection and add dishes from <span className="text-amber-600 font-bold">{shop?.name || 'this shop'}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setReplacePrompt(null)}
                                className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                No, thanks
                            </button>
                            <button
                                onClick={() => {
                                    overrideAndReplaceCart(replacePrompt, id);
                                    setReplacePrompt(null);
                                    if (navigator.vibrate) navigator.vibrate(50);
                                }}
                                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md hover:shadow-lg transition-all"
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
export default ShopDetail;
