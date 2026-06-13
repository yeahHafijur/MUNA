import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Search.css';

const IcoSearch = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const IcoBack = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const Search = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ shops: [], products: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    
    const inputRef = useRef(null);

    // Auto focus search input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults({ shops: [], products: [] });
                setHasSearched(false);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data);
                setHasSearched(true);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchResults();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!product.shopIsOpen) {
            alert("This shop is currently closed.");
            return;
        }

        const success = addToCart(product, product.shopId);
        if (success) {
            // Optional: Show a subtle toast here instead of alert
        }
    };

    return (
        <div className="search-page-container">
            {/* ── Sticky Top Bar ── */}
            <div className="search-top-bar">
                <button onClick={() => navigate(-1)} className="search-back-btn">
                    <IcoBack />
                </button>
                <div className="search-input-wrapper">
                    <span className="search-input-icon"><IcoSearch /></span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input-field"
                        placeholder="Search for groceries, shops, or categories..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <button className="search-clear-btn" onClick={() => setQuery('')}>
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* ── Scrollable Results Area ── */}
            <div className="search-results-area">
                
                {isLoading && (
                    <div className="search-loader">
                        <div className="spinner"></div>
                        <p>Searching globally...</p>
                    </div>
                )}

                {!isLoading && hasSearched && results.shops.length === 0 && results.products.length === 0 && (
                    <div className="search-empty-state">
                        <div className="search-empty-emoji">🔍</div>
                        <h3>No results found</h3>
                        <p>We couldn't find any shops or items matching "{query}". Try checking the spelling or use simpler words.</p>
                    </div>
                )}

                {!isLoading && results.shops.length > 0 && (
                    <div className="search-section">
                        <h2 className="search-section-title">🏪 Shops ({results.shops.length})</h2>
                        <div className="search-shop-list">
                            {results.shops.map(shop => (
                                <Link to={`/shop/${shop._id}`} key={`shop-${shop._id}`} className="search-shop-card">
                                    <div className="search-shop-icon">
                                        {shop.image ? <img src={shop.image} alt={shop.name} /> : '🏪'}
                                    </div>
                                    <div className="search-shop-info">
                                        <h4>{shop.name}</h4>
                                        <p>{shop.address}</p>
                                        <span className={`search-badge ${shop.isOpen ? 'badge-open' : 'badge-closed'}`}>
                                            {shop.isOpen ? 'Open Now' : 'Closed'}
                                        </span>
                                    </div>
                                    <div className="search-shop-arrow">›</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {!isLoading && results.products.length > 0 && (
                    <div className="search-section">
                        <h2 className="search-section-title">🛒 Items ({results.products.length})</h2>
                        <div className="search-product-grid">
                            {results.products.map(product => (
                                <Link to={`/shop/${product.shopId}`} key={`prod-${product._id}`} className={`search-product-card ${!product.inStock || !product.shopIsOpen ? 'product-unavailable' : ''}`}>
                                    <div className="search-product-img">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} />
                                        ) : (
                                            <div className="search-product-placeholder">📦</div>
                                        )}
                                        {(!product.inStock || !product.shopIsOpen) && (
                                            <div className="search-product-overlay">
                                                {!product.shopIsOpen ? 'Shop Closed' : 'Out of Stock'}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="search-product-details">
                                        <h4 className="search-product-name">{product.name}</h4>
                                        <p className="search-product-shop">from <strong>{product.shopName}</strong></p>
                                        <div className="search-product-bottom">
                                            <span className="search-product-price">₹{product.price}</span>
                                            <button 
                                                className="search-add-btn"
                                                onClick={(e) => handleAddToCart(e, product)}
                                                disabled={!product.inStock || !product.shopIsOpen}
                                            >
                                                + ADD
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Initial State / Suggestions */}
                {!hasSearched && !isLoading && (
                    <div className="search-suggestions">
                        <h3>Trending Searches</h3>
                        <div className="search-tags">
                            <span onClick={() => setQuery('Milk')}>🥛 Milk</span>
                            <span onClick={() => setQuery('Bread')}>🍞 Bread</span>
                            <span onClick={() => setQuery('Eggs')}>🥚 Eggs</span>
                            <span onClick={() => setQuery('Atta')}>🌾 Atta</span>
                            <span onClick={() => setQuery('Snacks')}>🍿 Snacks</span>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Search;
