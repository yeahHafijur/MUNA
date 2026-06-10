import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);

    // Backend se saari dukanen (Shops) le kar aate hain
    useEffect(() => {
        fetch('/api/shops')
            .then(res => res.json())
            .then(data => {
                setShops(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching shops:", err);
                setLoading(false);
            });
    }, []);

    const handleGetLocation = () => {
        if ("geolocation" in navigator) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationError(null);
                    setLoading(false);
                },
                (error) => {
                    console.warn("Location error:", error.message);
                    setLocationError("Location permission denied. Showing all shops.");
                    setLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setLocationError("Geolocation is not supported by your browser.");
        }
    };

    const getDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const shopsWithDistance = shops.map(shop => {
        let distance = Infinity;
        if (userLocation && shop.location?.coordinates && shop.location.coordinates.length === 2) {
            distance = getDistance(
                userLocation.lat, userLocation.lng,
                shop.location.coordinates[1], // lat
                shop.location.coordinates[0]  // lng
            );
        }
        return { ...shop, distance };
    });

    // Search filter
    const filteredShops = shopsWithDistance.filter(shop =>
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (shop.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Open shops pehle, uske andar jo sabse paas hai wo sabse upar
    const sortedShops = [...filteredShops].sort((a, b) => {
        if (a.isOpen === b.isOpen) {
            return a.distance - b.distance;
        }
        return a.isOpen ? -1 : 1;
    });

    return (
        <div className="home-style-1">

            {/* Hero Banner — MUNA Brand Indigo/Violet */}
            <div className="home-style-2">
                {/* Decorative shapes */}
                <div className="home-style-3"></div>
                <div className="home-style-4"></div>
                <div className="home-style-5"></div>
                <div className="home-style-6">🛒</div>

                <div className="home-style-7">
                    <span className="home-style-8">
                        ✨ Your Village, Your Store
                    </span>

                    <h1 className="home-style-9">
                        আপোনাৰ গাঁওৰ <br className="home-style-10" />
                        <span className="home-style-11">প্ৰত্যেক খন দোকান,</span> <br />
                        এক ঠাইত! ...
                    </h1>
                    <p className="home-style-12">
                        আপোনাৰ প্ৰিয় দোকানৰ পৰা ঘৰতে বহি সামগ্ৰী অ'ৰ্ডাৰ কৰক
                    </p>

                    {/* Search Bar — inside hero */}
                    <div className="home-style-13">
                        <div className="home-style-14">
                            <svg className="home-style-15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search shops near you..."
                                className="home-style-16"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="home-style-18">
                <div className="home-style-19">
                    <p className="home-style-20">{shops.length}</p>
                    <p className="home-style-21">Total Shops</p>
                </div>
                <div className="home-style-22">
                    <p className="home-style-23">{shops.filter(s => s.isOpen).length}</p>
                    <p className="home-style-24">Open Now</p>
                </div>
                <div className="home-style-25 flex flex-col justify-center items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={handleGetLocation} title="Find shops near me">
                    <svg className="w-6 h-6 text-indigo-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center" style={{marginTop: 0}}>
                        {userLocation ? "Location Set" : "Locate Me"}
                    </p>
                </div>
            </div>
            {locationError && <p className="text-red-500 text-xs mt-2 text-center">{locationError}</p>}

            {/* Shop Heading */}
            <div className="home-style-28">
                <h2 className="home-style-29">
                    {searchQuery ? `"${searchQuery}" ke Results` : 'Shops near you'}
                </h2>
                {searchQuery && (
                    <span className="home-style-30">{sortedShops.length} found</span>
                )}
            </div>

            {/* Shop Cards */}
            {loading ? (
                <div className="home-style-31">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="home-style-32">
                            <div className="home-style-33">
                                <div className="home-style-34"></div>
                                <div className="home-style-35">
                                    <div className="home-style-36"></div>
                                    <div className="home-style-37"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : sortedShops.length === 0 ? (
                <div className="home-style-38">
                    <span className="home-style-39">🔍</span>
                    <p className="home-style-40">
                        {searchQuery ? `No shops found for "${searchQuery}".` : 'No shops found right now.'}
                    </p>
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="home-style-41">
                            Saari dukanen dekhein
                        </button>
                    )}
                </div>
            ) : (
                <div className="home-style-42">
                    {sortedShops.map((shop, index) => (
                        <Link
                            to={`/shop/${shop._id}`}
                            key={shop._id}
                            className="home-style-43 group"
                            style={{ animationDelay: `${index * 60}ms` }}
                        >
                            <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${shop.isOpen ? 'border-gray-300' : 'border-gray-400'}`}>
                                
                                {/* Banner Section (Top) */}
                                <div className="relative w-full h-40 sm:h-48 bg-gray-100 overflow-hidden">
                                    {shop.image ? (
                                        <img
                                            src={`${shop.image}`}
                                            alt={shop.name}
                                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!shop.isOpen ? 'grayscale opacity-80' : ''}`}
                                        />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-amber-50 to-yellow-100 ${!shop.isOpen ? 'grayscale' : ''}`}>🏪</div>
                                    )}

                                    {/* Overlay Status Tag */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm border ${shop.isOpen ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-red-500/90 text-white border-red-400'}`}>
                                            {shop.isOpen ? '● Open' : '● Closed'}
                                        </span>
                                    </div>
                                    
                                    {/* Distance Overlay */}
                                    {shop.distance !== Infinity && (
                                        <div className="absolute bottom-3 left-3">
                                            <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 shadow-lg">
                                                📍 {shop.distance < 1 ? (shop.distance * 1000).toFixed(0) + ' m' : shop.distance.toFixed(1) + ' km'} away
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Details Section (Bottom) */}
                                <div className="p-4 flex flex-col">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold text-lg leading-tight truncate ${shop.isOpen ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {shop.name}
                                        </h3>
                                        <span className={`text-xs font-bold flex flex-shrink-0 items-center gap-1 ${shop.isOpen ? 'text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100' : 'text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200'}`}>
                                            ⭐ {shop.rating || '4.5'}
                                        </span>
                                    </div>

                                    <div className={`text-xs mb-3 truncate ${shop.isOpen ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <p>📍 {shop.address}</p>
                                    </div>

                                    {/* Tags & Action Row */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                        <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-md ${shop.isOpen ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                            {shop.category || 'Kirana'}
                                        </span>

                                        {shop.udyamNumber && (
                                            <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-md ${shop.isOpen ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                                🛡️ Verified
                                            </span>
                                        )}

                                        {shop.location?.coordinates && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.location.coordinates[1]},${shop.location.coordinates[0]}`, '_blank');
                                                }}
                                                className={`ml-auto flex-shrink-0 text-[10px] font-bold px-3 py-1 rounded-md transition-colors border ${shop.isOpen ? 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`}
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
