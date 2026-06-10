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

    useEffect(() => {
        // Try to get user location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn("Location error:", error.message);
                    setLocationError("Location off. Showing random order.");
                }
            );
        }
    }, []);

    const getDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
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
                        Apne Gaon ki <br className="home-style-10" />
                        <span className="home-style-11">Har Dukan,</span> <br />
                        Ek Jagah!
                    </h1>
                    <p className="home-style-12">
                        Ghar baithe saman mangwao, seedha aapki dukan se 🚀
                    </p>

                    {/* Search Bar — inside hero */}
                    <div className="home-style-13">
                        <div className="home-style-14">
                            <svg xmlns="http://www.w3.org/2000/svg" className="home-style-15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Dukan ka naam ya address search karein..."
                                className="home-style-16"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="home-style-17">
                                    ✕
                                </button>
                            )}
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
                <div className="home-style-25">
                    <p className="home-style-26">5 KM</p>
                    <p className="home-style-27">Delivery Range</p>
                </div>
            </div>

            {/* Shop Heading */}
            <div className="home-style-28">
                <h2 className="home-style-29">
                    {searchQuery ? `"${searchQuery}" ke Results` : 'Aas-paas ki Dukanen'}
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
                            <div className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${shop.isOpen ? 'border-gray-100' : 'border-gray-200'}`}>

                                {/* Card Top — Colored Accent */}
                                <div className={`h-1.5 w-full ${shop.isOpen ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`}></div>

                                <div className="home-style-44">
                                    <div className="home-style-45">

                                        {/* Shop Image / Avatar */}
                                        <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl sm:text-3xl overflow-hidden transition-transform duration-300 group-hover:scale-105 ${shop.isOpen ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-yellow-200/50 shadow-sm' : 'bg-gray-100 border-2 border-gray-200'}`}>
                                            {shop.image ? (
                                                <img
                                                    src={`${shop.image}`}
                                                    alt={shop.name}
                                                    className={`w-full h-full object-cover ${!shop.isOpen ? 'grayscale opacity-60' : ''}`}
                                                />
                                            ) : (
                                                <span className={`${!shop.isOpen ? 'grayscale' : ''}`}>🏪</span>
                                            )}

                                            {/* Live indicator dot */}
                                            {shop.isOpen && (
                                                <div className="home-style-46">
                                                    <div className="home-style-47"></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Shop Info */}
                                        <div className="home-style-48">
                                            <div className="home-style-49">
                                                <h3 className={`font-bold text-sm sm:text-base leading-tight truncate ${shop.isOpen ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {shop.name}
                                                </h3>
                                            </div>

                                            <div className={`text-xs leading-snug mb-2.5 ${shop.isOpen ? 'text-gray-500' : 'text-gray-400'}`}>
                                                <p className="home-style-50">📍 {shop.address}</p>
                                                {shop.vendorId?.phone && (
                                                    <p className="home-style-51">
                                                        📞 {shop.vendorId.phone}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Tags Row */}
                                            <div className="home-style-52">
                                                {/* Category Tag */}
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${shop.isOpen
                                                    ? 'bg-yellow-50 text-yellow-500 border border-yellow-200/60'
                                                    : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                                    {shop.category || 'Kirana'}
                                                </span>

                                                {/* Distance Badge */}
                                                {shop.distance !== Infinity && (
                                                    <span className="home-style-53">
                                                        📍 {shop.distance < 1 ? (shop.distance * 1000).toFixed(0) + ' m' : shop.distance.toFixed(1) + ' km'}
                                                    </span>
                                                )}

                                                {/* Udyam Badge */}
                                                {shop.udyamNumber && (
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${shop.isOpen ? 'bg-blue-50 text-blue-600 border border-blue-200/60' : 'bg-gray-100 text-gray-400 border border-gray-200'} flex items-center gap-1`}>
                                                        🛡️ Verified
                                                    </span>
                                                )}

                                                {/* Status Tag */}
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${shop.isOpen
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                                                    : 'bg-red-50 text-red-400 border border-red-200/60'}`}>
                                                    {shop.isOpen ? '● Open' : '● Closed'}
                                                </span>

                                                {/* Rating */}
                                                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${shop.isOpen ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    ⭐ {shop.rating || '4.5'}
                                                </span>

                                                {/* Directions Button */}
                                                {shop.location?.coordinates && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.location.coordinates[1]},${shop.location.coordinates[0]}`, '_blank');
                                                        }}
                                                        className={`ml-auto flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-md transition-colors border ${shop.isOpen ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`}
                                                    >
                                                        🗺️ Directions
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Arrow Icon */}
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 ${shop.isOpen ? 'bg-gray-100 text-gray-500 group-hover:bg-yellow-100 group-hover:text-yellow-500' : 'bg-gray-100 text-gray-300'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="home-style-54" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
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
