import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
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

/* Category emoji map */
const catEmojis = ['🍕', '🥗', '🍰', '🥤', '🌮', '🍛', '🍩', '🍟', '🧃', '🍿', '🧁', '🥘'];
const getCatEmoji = (idx) => catEmojis[idx % catEmojis.length];

/* ═══════════════════════════════════════════════════════════
   SHOP DETAIL PAGE — Premium Full-Page Experience
═══════════════════════════════════════════════════════════ */
const ShopDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, cartItems, getTotal } = useCart();

    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const totalCartItems = cartItems.reduce((s, i) => s + i.quantity, 0);
    const cartTotal = getTotal();

    /* ── Fetch data ── */
    useEffect(() => {
        Promise.all([
            fetch(`/api/shops/${id}`).then(r => r.json()),
            fetch(`/api/products/${id}`).then(r => r.json())
        ])
        .then(([shopData, prodData]) => {
            setShop(shopData);
            setProducts(Array.isArray(prodData) ? prodData : []);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }, [id]);

    /* ── Categories ── */
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category || 'General'));
        return Array.from(cats).sort();
    }, [products]);

    /* ── Filtered products ── */
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (selectedCategory === null && !searchQuery) return false;

            const matchesSearch = !searchQuery ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCat = !selectedCategory || selectedCategory === 'All' ||
                (p.category || 'General') === selectedCategory;

            return matchesSearch && matchesCat;
        });
    }, [products, searchQuery, selectedCategory]);

    /* ── Show product view? ── */
    const showProducts = selectedCategory !== null || !!searchQuery;

    /* ── Handle Add to Cart with Animation ── */
    const handleAddClick = (e, product) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const flyEl = document.createElement('div');
        flyEl.className = 'sd-fly-plus';
        flyEl.textContent = '+1';
        flyEl.style.left = `${rect.left + rect.width / 2}px`;
        flyEl.style.top = `${rect.top}px`;
        document.body.appendChild(flyEl);
        
        setTimeout(() => flyEl.remove(), 800);
        
        addToCart(product, id);
        
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
                                {[1,2,3,4].map(i => <div key={i} className="sd-skel-chip" />)}
                            </div>
                        </div>
                        <div className="sd-skel-grid">
                            {[1,2,3,4].map(i => (
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
                                    <img src={shop.image} alt={shop.name} className="sd-hero-img" />
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
                                    type="text"
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
                                        🍔 All <span className="sd-chip-count">({products.length})</span>
                                    </button>
                                    {categories.map((cat, idx) => (
                                        <button
                                            key={cat}
                                            className={`sd-chip ${selectedCategory === cat ? 'sd-chip--active' : ''}`}
                                            onClick={() => setSelectedCategory(cat)}
                                        >
                                            {getCatEmoji(idx)} {cat}
                                            <span className="sd-chip-count">
                                                ({products.filter(p => (p.category || 'General') === cat).length})
                                            </span>
                                        </button>
                                    ))}
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
                                        <span className="sd-cat-emoji">🍔</span>
                                        <div>
                                            <div className="sd-cat-name">All Items</div>
                                            <div className="sd-cat-count">{products.length} items</div>
                                        </div>
                                    </div>

                                    {categories.map((cat, idx) => {
                                        const count = products.filter(p => (p.category || 'General') === cat).length;
                                        return (
                                            <div
                                                key={cat}
                                                className="sd-cat-card"
                                                onClick={() => setSelectedCategory(cat)}
                                            >
                                                <span className="sd-cat-emoji">{getCatEmoji(idx)}</span>
                                                <div>
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
                                                <div
                                                    key={product._id}
                                                    className={`sd-prod ${!product.inStock ? 'sd-prod--oos' : ''}`}
                                                    style={{ animationDelay: `${idx * 40}ms` }}
                                                >
                                                    {/* Image */}
                                                    <div className="sd-prod-img">
                                                        {product.image ? (
                                                            <img src={product.image} alt={product.name} loading="lazy" />
                                                        ) : (
                                                            <div className="sd-prod-img-ph">📦</div>
                                                        )}
                                                        {!product.inStock && (
                                                            <span className="sd-prod-oos-tag">Out of Stock</span>
                                                        )}
                                                        <span className="sd-prod-cat-tag">
                                                            {product.category || 'General'}
                                                        </span>
                                                    </div>

                                                    {/* Body */}
                                                    <div className="sd-prod-body">
                                                        <h3 className="sd-prod-name">{product.name}</h3>
                                                        <div className="sd-prod-footer">
                                                            <span className="sd-prod-price">
                                                                <span className="sd-prod-price-symbol">₹</span>
                                                                {product.price}
                                                            </span>
                                                            {product.inStock ? (
                                                                <button
                                                                    className={`sd-add-btn ${inCart ? 'sd-add-btn--added' : 'sd-add-btn--add'}`}
                                                                    onClick={(e) => handleAddClick(e, product)}
                                                                >
                                                                    {inCart ? `${inCart.quantity} Added` : 'ADD'}
                                                                </button>
                                                            ) : (
                                                                <span className="sd-add-btn sd-add-btn--oos">
                                                                    Out of Stock
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
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
        </div>
    );
};

export default ShopDetail;
