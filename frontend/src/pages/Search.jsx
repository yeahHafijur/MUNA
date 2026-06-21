import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import { optimizeImage } from '../utils/imageUtils';
import './Search.css';

const IcoSearch = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const IcoBack = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const IcoShop = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{width: '28px', height: '28px', opacity: 0.4}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
);

const IcoProduct = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{width: '32px', height: '32px', opacity: 0.3}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);

const IcoDairy = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{width: '28px', height: '28px', color: '#3b82f6'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);

const IcoVeggies = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{width: '28px', height: '28px', color: '#10b981'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
);

const IcoSnacks = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{width: '28px', height: '28px', color: '#ef4444'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
);

const IcoDrinks = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{width: '28px', height: '28px', color: '#f59e0b'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
);

const IcoTime = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{width: '12px', height: '12px', marginRight: '3px'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

/* ─── Skeleton Loaders ─── */
const SearchSkeleton = () => (
    <div className="search-skel-section">
        <div className="search-skel-title" />
        <div className="search-skel-grid">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="search-skel-card">
                    <div className="search-skel-img" />
                    <div className="search-skel-body">
                        <div className="search-skel-line" />
                        <div className="search-skel-line search-skel-line--short" />
                    </div>
                </div>
            ))}
        </div>
    </div>
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
            toast.warning("This shop is currently closed.");
            return;
        }

        const success = addToCart(product, product.shopId);
        if (success) {
            // Optional: toast success
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
                        placeholder="Search for atta, dal, coke..."
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
                
                {isLoading && <SearchSkeleton />}

                {!isLoading && hasSearched && results.shops.length === 0 && results.products.length === 0 && (
                    <div className="search-empty-state">
                        <div className="search-empty-icon-wrap">
                            <IcoSearch />
                        </div>
                        <h3>Item not found</h3>
                        <p>We couldn't find anything for "{query}". Try searching for something else.</p>
                    </div>
                )}

                {/* ── SHOPS RESULTS ── */}
                {!isLoading && results.shops.length > 0 && (
                    <div className="search-section">
                        <div className="search-section-header">
                            <h2>Stores Near You</h2>
                            <span className="search-count">{results.shops.length}</span>
                        </div>
                        <div className="search-shop-grid">
                            {results.shops.map(shop => (
                                <Link to={`/shop/${shop._id}`} key={`shop-${shop._id}`} className="search-shop-card">
                                    <div className="search-shop-banner">
                                        {shop.image ? <img src={optimizeImage(shop.image)} alt={shop.name} /> : <div className="search-shop-placeholder"><IcoShop /></div>}
                                        <div className={`search-shop-status ${shop.isOpen ? 'status-open' : 'status-closed'}`}>
                                            {shop.isOpen ? 'Open' : 'Closed'}
                                        </div>
                                    </div>
                                    <div className="search-shop-info">
                                        <h4>{shop.name}</h4>
                                        <p>{shop.address}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── PRODUCTS RESULTS ── */}
                {!isLoading && results.products.length > 0 && (
                    <div className="search-section">
                        <div className="search-section-header">
                            <h2>Products</h2>
                            <span className="search-count">{results.products.length}</span>
                        </div>
                        <div className="search-product-grid">
                            {results.products.map(product => (
                                <div key={`prod-${product._id}`} className={`search-product-card ${!product.inStock || !product.shopIsOpen ? 'product-unavailable' : ''}`}>
                                    <Link to={`/shop/${product.shopId}`} className="search-product-img-wrap">
                                        {product.image ? (
                                            <img src={optimizeImage(product.image, 200)} alt={product.name} />
                                        ) : (
                                            <div className="search-product-placeholder"><IcoProduct /></div>
                                        )}
                                        {(!product.inStock || !product.shopIsOpen) && (
                                            <div className="search-product-stock-badge">
                                                {!product.shopIsOpen ? 'Shop Closed' : 'Out of Stock'}
                                            </div>
                                        )}
                                    </Link>
                                    
                                    <div className="search-product-details">
                                        <div className="search-product-time">
                                            <IcoTime /> 15 MINS
                                        </div>
                                        <Link to={`/shop/${product.shopId}`} style={{textDecoration: 'none'}}>
                                            <h4 className="search-product-name">{product.name}</h4>
                                            <p className="search-product-shop">By {product.shopName}</p>
                                        </Link>
                                        <div className="search-product-bottom">
                                            <span className="search-product-price">₹{product.price}</span>
                                            <button 
                                                className="search-add-btn"
                                                onClick={(e) => handleAddToCart(e, product)}
                                                disabled={!product.inStock || !product.shopIsOpen}
                                            >
                                                ADD
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Initial State / Suggestions */}
                {!hasSearched && !isLoading && (
                    <div className="search-explore-section">
                        <h3>Popular Categories</h3>
                        <div className="search-explore-grid">
                            <div className="explore-card" onClick={() => setQuery('Milk')}>
                                <div className="explore-icon" style={{background: '#EFF6FF'}}><IcoDairy /></div>
                                <span>Dairy</span>
                            </div>
                            <div className="explore-card" onClick={() => setQuery('Vegetable')}>
                                <div className="explore-icon" style={{background: '#F0FDF4'}}><IcoVeggies /></div>
                                <span>Veggies</span>
                            </div>
                            <div className="explore-card" onClick={() => setQuery('Snacks')}>
                                <div className="explore-icon" style={{background: '#FEF2F2'}}><IcoSnacks /></div>
                                <span>Snacks</span>
                            </div>
                            <div className="explore-card" onClick={() => setQuery('Drink')}>
                                <div className="explore-icon" style={{background: '#FFFBEB'}}><IcoDrinks /></div>
                                <span>Drinks</span>
                            </div>
                        </div>

                        <h3 style={{marginTop: '32px'}}>Trending Searches</h3>
                        <div className="search-tags">
                            <span onClick={() => setQuery('Atta')}>Atta</span>
                            <span onClick={() => setQuery('Bread')}>Bread</span>
                            <span onClick={() => setQuery('Eggs')}>Eggs</span>
                            <span onClick={() => setQuery('Maggi')}>Maggi</span>
                            <span onClick={() => setQuery('Cold Drink')}>Cold Drink</span>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Search;
