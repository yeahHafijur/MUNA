import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

/* ─── Icon Components ─── */
const IconSearch = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const IconLocate = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

/* ═══════════════════════════════════════════════════════════
   HOME PAGE COMPONENT
═══════════════════════════════════════════════════════════ */
const Home = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);

    /* ── Fetch all shops ── */
    useEffect(() => {
        fetch('/api/shops')
            .then(res => res.json())
            .then(data => { setShops(data); setLoading(false); })
            .catch(err => { console.error('Error fetching shops:', err); setLoading(false); });
    }, []);

    /* ── Geolocation ── */
    const handleGetLocation = () => {
        if (!('geolocation' in navigator)) {
            setLocationError('Geolocation is not supported by your browser.');
            return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocationError(null);
                setLoading(false);
            },
            (err) => {
                console.warn('Location error:', err.message);
                setLocationError('Location permission denied. Showing all shops.');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    /* ── Distance calc (Haversine) ── */
    const getDistance = (lat1, lon1, lat2, lon2) => {
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

    const shopsWithDistance = shops.map(shop => {
        let distance = Infinity;
        if (userLocation && shop.location?.coordinates?.length === 2) {
            distance = getDistance(
                userLocation.lat, userLocation.lng,
                shop.location.coordinates[1],
                shop.location.coordinates[0]
            );
        }
        return { ...shop, distance };
    });

    /* ── Filter + Sort ── */
    const filteredShops = shopsWithDistance.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedShops = [...filteredShops].sort((a, b) => {
        if (a.isOpen === b.isOpen) return a.distance - b.distance;
        return a.isOpen ? -1 : 1;
    });

    const openCount = shops.filter(s => s.isOpen).length;

    /* ── Format distance ── */
    const fmtDist = (d) => d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`;

    /* ═══════════════════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════════════════ */
    return (
        <div className="muna-home">

            {/* ════════ HERO ════════ */}
            <div className="muna-hero">
                <div className="muna-hero-blob-1" />
                <div className="muna-hero-blob-2" />
                <div className="muna-hero-blob-3" />
                <div className="muna-hero-emoji">🛒</div>

                <div className="muna-hero-content">
                    <span className="muna-hero-tag">✨ Your Village, Your Store</span>

                    <h1 className="muna-hero-title">
                        আপোনাৰ গাঁওৰ <br className="mobile-br" />
                        <span className="muna-hero-title-accent">প্ৰত্যেক খন দোকান,</span> <br />
                        এক ঠাইত!
                    </h1>

                    <p className="muna-hero-subtitle">
                        আপোনাৰ প্ৰিয় দোকানৰ পৰা ঘৰতে বহি সামগ্ৰী অ'ৰ্ডাৰ কৰক
                    </p>

                    {/* Search */}
                    <div className="muna-hero-search">
                        <IconSearch />
                        <input
                            id="home-search-input"
                            type="text"
                            placeholder="Search shops near you..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* ════════ STATS ════════ */}
            <div className="muna-stats">
                <div className="muna-stat-card">
                    <div className="muna-stat-num muna-stat-num--amber">{shops.length}</div>
                    <div className="muna-stat-label">Total Shops</div>
                </div>
                <div className="muna-stat-card">
                    <div className="muna-stat-num muna-stat-num--green">{openCount}</div>
                    <div className="muna-stat-label">Open Now</div>
                </div>
                <div
                    className="muna-stat-card muna-stat-card--action"
                    onClick={handleGetLocation}
                    title="Find shops near me"
                    role="button"
                    tabIndex={0}
                >
                    <div className="muna-stat-icon">
                        <IconLocate />
                    </div>
                    <div className="muna-stat-label">
                        {userLocation ? '✓ Located' : 'Locate Me'}
                    </div>
                </div>
            </div>
            {locationError && <p className="muna-location-err">{locationError}</p>}

            {/* ════════ SECTION HEADING ════════ */}
            <div className="muna-section-head">
                <h2 className="muna-section-title">
                    {searchQuery ? `Results for "${searchQuery}"` : 'Shops near you'}
                </h2>
                {searchQuery && (
                    <span className="muna-section-count">{sortedShops.length} found</span>
                )}
            </div>

            {/* ════════ CONTENT ════════ */}
            {loading ? (
                /* ── Skeleton loader ── */
                <div className="muna-skeleton-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="muna-skeleton-card">
                            <div className="muna-skeleton-img" />
                            <div className="muna-skeleton-body">
                                <div className="muna-skeleton-line" />
                                <div className="muna-skeleton-line muna-skeleton-line--short" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : sortedShops.length === 0 ? (
                /* ── Empty state ── */
                <div className="muna-empty">
                    <span className="muna-empty-emoji">🔍</span>
                    <p className="muna-empty-text">
                        {searchQuery
                            ? `No shops found for "${searchQuery}".`
                            : 'No shops found right now.'}
                    </p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="muna-empty-btn"
                        >
                            Show all shops
                        </button>
                    )}
                </div>
            ) : (
                /* ── Shop cards ── */
                <div className="muna-shop-grid">
                    {sortedShops.map((shop, index) => (
                        <Link
                            to={`/shop/${shop._id}`}
                            key={shop._id}
                            className="muna-shop-link"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`muna-shop-card ${!shop.isOpen ? 'muna-shop-card--closed' : ''}`}>

                                {/* Banner */}
                                <div className={`muna-shop-banner ${!shop.isOpen ? 'muna-shop-banner--closed' : ''}`}>
                                    {shop.image ? (
                                        <img src={shop.image} alt={shop.name} loading="lazy" />
                                    ) : (
                                        <div className={`muna-shop-banner-placeholder ${!shop.isOpen ? 'muna-shop-banner-placeholder--closed' : ''}`}>
                                            🏪
                                        </div>
                                    )}

                                    {/* Status badge */}
                                    <span className={`muna-shop-status-badge ${shop.isOpen ? 'muna-badge--open' : 'muna-badge--closed'}`}>
                                        <span className="muna-badge-dot" />
                                        {shop.isOpen ? 'Open' : 'Closed'}
                                    </span>

                                    {/* Distance */}
                                    {shop.distance !== Infinity && (
                                        <span className="muna-distance-tag">
                                            📍 {fmtDist(shop.distance)} away
                                        </span>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="muna-shop-body">
                                    {/* Name + Rating */}
                                    <div className="muna-shop-row-1">
                                        <h3 className={`muna-shop-name ${!shop.isOpen ? 'muna-shop-name--closed' : ''}`}>
                                            {shop.name}
                                        </h3>
                                        <span className={`muna-shop-rating ${shop.isOpen ? 'muna-shop-rating--open' : 'muna-shop-rating--closed'}`}>
                                            ⭐ {shop.rating || '4.5'}
                                        </span>
                                    </div>

                                    {/* Address */}
                                    <div className={`muna-shop-address ${!shop.isOpen ? 'muna-shop-address--closed' : ''}`}>
                                        📍 {shop.address}
                                    </div>

                                    {/* Tags */}
                                    <div className="muna-shop-tags">
                                        <span className={`muna-tag ${shop.isOpen ? 'muna-tag--cat' : 'muna-tag--cat-closed'}`}>
                                            {shop.category || 'Kirana'}
                                        </span>

                                        {shop.udyamNumber && (
                                            <span className={`muna-tag ${shop.isOpen ? 'muna-tag--verified' : 'muna-tag--verified-closed'}`}>
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
                                                className={`muna-directions-btn ${!shop.isOpen ? 'muna-directions-btn--closed' : ''}`}
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
    );
};

export default Home;
