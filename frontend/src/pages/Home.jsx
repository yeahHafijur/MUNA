import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { optimizeImage } from '../utils/imageUtils';
import './Home.css';

/* ─── Icon Components ─── */
const IcoSearch = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const IcoPin = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const IcoHome = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
    </svg>
);
const IcoCart = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const IcoBell = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);
const IcoUser = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const IcoShop = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

/* ─── Time-based greeting ─── */
const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 5) return { text: 'Late Night', emoji: '🌙' };
    if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
    if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
    if (h < 21) return { text: 'Good Evening', emoji: '🌇' };
    return { text: 'Good Night', emoji: '🌙' };
};

/* ─── Distance formatter ─── */
const fmtDist = (d) => d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`;

/* ─── Haversine ─── */
const haversine = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ═══════════════════════════════════════════════════════════
   HOME PAGE COMPONENT — Premium App Shell
═══════════════════════════════════════════════════════════ */
const Home = () => {
    const { user } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();
    const greeting = getGreeting();
    const totalCartItems = cartItems.reduce((s, i) => s + i.quantity, 0);

    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    /* ── Fetch shops & settings with React Query ── */
    const { data: shops = [], isLoading: loading } = useQuery({
        queryKey: ['shops'],
        queryFn: () => fetch('/api/shops').then(r => r.json()),
    });

    const { data: homeMsg = { line1: 'Your local market,', line2: 'delivered in minutes ⚡' } } = useQuery({
        queryKey: ['navbar-message'],
        queryFn: () => fetch('/api/settings/navbar-message').then(r => r.json()),
    });

    const token = localStorage.getItem('token');
    const { data: unreadData } = useQuery({
        queryKey: ['unread-count', user?._id],
        queryFn: () => fetch('/api/notifications/unread-count', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        enabled: !!user && !!token,
    });
    const unreadCount = unreadData?.count || 0;

    /* ── Geolocation ── */
    const handleLocate = () => {
        if (!('geolocation' in navigator)) {
            setLocationError('Geolocation not supported.');
            return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            pos => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocationError(null);
                setLoading(false);
            },
            () => {
                setLocationError('Location denied. Showing all shops.');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    /* ── Derived data ── */
    const categories = useMemo(() => {
        const cats = new Set(shops.map(s => s.category || 'Kirana'));
        return ['All', ...Array.from(cats).sort()];
    }, [shops]);

    const openCount = shops.filter(s => s.isOpen).length;

    const sortedShops = useMemo(() => {
        let list = shops.map(shop => {
            let distance = Infinity;
            if (userLocation && shop.location?.coordinates?.length === 2) {
                distance = haversine(
                    userLocation.lat, userLocation.lng,
                    shop.location.coordinates[1],
                    shop.location.coordinates[0]
                );
            }
            return { ...shop, distance };
        });

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.address.toLowerCase().includes(q) ||
                (s.category || '').toLowerCase().includes(q)
            );
        }

        // Category filter
        if (activeCategory !== 'All') {
            list = list.filter(s => (s.category || 'Kirana') === activeCategory);
        }

        // Sort: open first, then by distance
        return list.sort((a, b) => {
            if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
            return a.distance - b.distance;
        });
    }, [shops, userLocation, searchQuery, activeCategory]);

    /* ── Profile link target ── */
    const profileLink = user
        ? (user.role === 'super_admin' ? '/admin-dashboard' : user.role === 'vendor' ? '/vendor-dashboard' : '/profile')
        : '/login';
    const profileEmoji = user
        ? (user.role === 'super_admin' ? '👑' : user.role === 'vendor' ? '🏪' : '👤')
        : null;

    /* ═══════════════════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════════════════ */
    return (
        <div className="mu">

            {/* ════════ HEADER ════════ */}
            <header className="mu-header">
                <div className="mu-header-top">
                    {/* Brand */}
                    <Link to="/" className="mu-brand">
                        <img src="/muna-logo-new.png" alt="MUNA" className="mu-brand-logo" />
                        <div className="mu-brand-text">
                            <span className="mu-brand-name">GROCERY</span>
                            <span className="mu-brand-sub">In Minutes</span>
                        </div>
                    </Link>


                </div>

            </header>

            {/* ════════ SCROLLABLE BODY ════════ */}
            <div className="mu-body">

                {/* Slogan */}
                <div className="mu-slogan" style={{ padding: '20px 20px 10px 20px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', lineHeight: '1.1', letterSpacing: '-0.5px' }}>
                        {homeMsg.line1}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', lineHeight: '1.2', letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        {homeMsg.line2}
                    </div>
                </div>

                {/* Stats */}
                <div className="mu-stats">
                    <div className="mu-stat">
                        <div className="mu-stat-value mu-stat-value--amber">{shops.length}</div>
                        <div className="mu-stat-label">Total Shops</div>
                    </div>
                    <div className="mu-stat">
                        <div className="mu-stat-value mu-stat-value--green">{openCount}</div>
                        <div className="mu-stat-label">Open Now</div>
                    </div>
                    <div
                        className="mu-stat mu-stat--action"
                        onClick={handleLocate}
                        role="button"
                        tabIndex={0}
                        title="Find shops near me"
                    >
                        <div className="mu-stat-icon-val">
                            <IcoPin />
                        </div>
                        <div className="mu-stat-label">
                            {userLocation ? '✓ Located' : 'Locate Me'}
                        </div>
                    </div>
                </div>
                {locationError && <p className="mu-loc-err">{locationError}</p>}

                {/* Category Chips */}
                <div className="mu-cats">
                    <div className="mu-cats-scroll">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`mu-chip ${activeCategory === cat ? 'mu-chip--active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat === 'All' ? '🏠 All Shops' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section Head */}
                <div className="mu-sec-head">
                    <h2 className="mu-sec-title">
                        {searchQuery
                            ? `"${searchQuery}"`
                            : activeCategory !== 'All'
                                ? activeCategory
                                : 'Shops near you'}
                    </h2>
                    <span className="mu-sec-count">
                        {sortedShops.length} {sortedShops.length === 1 ? 'shop' : 'shops'}
                    </span>
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <div className="mu-skel-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="mu-skel">
                                <div className="mu-skel-img" />
                                <div className="mu-skel-body">
                                    <div className="mu-skel-line" />
                                    <div className="mu-skel-line mu-skel-line--sm" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sortedShops.length === 0 ? (
                    <div className="mu-empty">
                        <span className="mu-empty-emoji">🔍</span>
                        <div className="mu-empty-title">
                            {searchQuery ? `No shops found for "${searchQuery}"` : 'No shops available'}
                        </div>
                        <div className="mu-empty-sub">
                            {searchQuery ? 'Try a different search term' : 'Check back soon!'}
                        </div>
                        {(searchQuery || activeCategory !== 'All') && (
                            <button
                                className="mu-empty-btn"
                                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                            >
                                Show All Shops
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="mu-grid">
                        {sortedShops.map((shop, idx) => (
                            <Link
                                to={`/shop/${shop._id}`}
                                key={shop._id}
                                className="mu-card-link"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className={`mu-card ${!shop.isOpen ? 'mu-card--closed' : ''}`}>

                                    {/* Banner */}
                                    <div className="mu-card-banner">
                                        <div className="mu-shop-img-box">
                                            {shop.image ? (
                                                <img src={optimizeImage(shop.image)} alt={shop.name} loading="lazy" />
                                            ) : (
                                                <div className="mu-card-banner-ph">🏪</div>
                                            )}
                                        </div>

                                        {/* Top overlay: Status + Rating */}
                                        <div className="mu-card-overlay-top">
                                            <span className={`mu-badge ${shop.isOpen ? 'mu-badge--open' : 'mu-badge--closed'}`}>
                                                <span className="mu-badge-dot" />
                                                {shop.isOpen ? 'Open' : 'Closed'}
                                            </span>
                                            <span className="mu-card-rating">
                                                ⭐ {shop.rating || '4.5'}
                                            </span>
                                        </div>

                                        {/* Bottom overlay: Distance */}
                                        {shop.distance !== Infinity && (
                                            <div className="mu-card-overlay-bottom">
                                                <span className="mu-dist">
                                                    📍 {fmtDist(shop.distance)} away
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Body */}
                                    <div className="mu-card-body">
                                        <h3 className="mu-card-name">{shop.name}</h3>
                                        <p className="mu-card-addr">📍 {shop.address}</p>

                                        <div className="mu-card-tags">
                                            <span className={`mu-tag ${shop.isOpen ? 'mu-tag--cat' : 'mu-tag--closed'}`}>
                                                {shop.category || 'Kirana'}
                                            </span>
                                            {shop.udyamNumber && (
                                                <span className={`mu-tag ${shop.isOpen ? 'mu-tag--verified' : 'mu-tag--closed'}`}>
                                                    🛡️ Verified
                                                </span>
                                            )}
                                            {shop.location?.coordinates && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        window.open(
                                                            `https://www.google.com/maps/dir/?api=1&destination=${shop.location.coordinates[1]},${shop.location.coordinates[0]}`,
                                                            '_blank'
                                                        );
                                                    }}
                                                    className={`mu-dir-btn ${!shop.isOpen ? 'mu-dir-btn--closed' : ''}`}
                                                >
                                                    🗺️ Directions
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* ════════ BOTTOM NAV ════════ */}
            <nav className="mu-nav">
                <button className="mu-nav-item mu-nav-item--active" onClick={() => window.scrollTo(0, 0)}>
                    <span className="mu-nav-icon"><IcoHome /></span>
                    Home
                </button>

                <button className="mu-nav-item" onClick={() => navigate('/search')}>
                    <span className="mu-nav-icon"><IcoSearch /></span>
                    Search
                </button>

                <button className="mu-nav-item" onClick={() => navigate('/notifications')}>
                    <span className="mu-nav-icon" style={{ position: 'relative' }}>
                        <IcoBell />
                        {unreadCount > 0 && (
                            <span className="mu-nav-badge">{unreadCount}</span>
                        )}
                    </span>
                    Alerts
                </button>

                <Link to="/cart" className="mu-nav-item">
                    <span className="mu-nav-icon">
                        <IcoCart />
                        {totalCartItems > 0 && (
                            <span key={totalCartItems} className="mu-nav-badge">{totalCartItems}</span>
                        )}
                    </span>
                    Cart
                </Link>

                <Link
                    to={profileLink}
                    className="mu-nav-item"
                >
                    <span className="mu-nav-icon"><IcoUser /></span>
                    {user ? 'Profile' : 'Login'}
                </Link>
            </nav>
        </div>
    );
};

export default Home;
