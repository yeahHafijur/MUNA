import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Search filter
    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (shop.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Open shops pehle, closed shops niche
    const sortedShops = [...filteredShops].sort((a, b) => {
        if (a.isOpen === b.isOpen) return 0;
        return a.isOpen ? -1 : 1;
    });

    return (
        <div className="mt-4 pb-8">

            {/* Hero Banner — MUNA Brand Indigo/Violet */}
            <div className="relative bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 rounded-2xl p-6 sm:p-8 mb-6 overflow-hidden shadow-xl">
                {/* Decorative shapes */}
                <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/5 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-yellow-400/10 rounded-full blur-xl"></div>
                <div className="absolute top-1/2 right-8 w-24 h-24 bg-yellow-400/10 rounded-full blur-lg"></div>
                <div className="absolute top-3 right-5 text-5xl sm:text-6xl opacity-10 select-none rotate-12">🛒</div>

                <div className="relative z-10">
                    <span className="inline-block text-[10px] sm:text-xs font-bold bg-white/30 text-gray-800 px-3 py-1 rounded-full mb-3 backdrop-blur-sm border border-white/20 uppercase tracking-widest">
                        ✨ Your Village, Your Store
                    </span>

                    <h1 className="text-2xl sm:text-3xl font-black text-black leading-tight">
                        Apne Gaon ki <br className="sm:hidden" />
                        <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">Har Dukan,</span> <br />
                        Ek Jagah!
                    </h1>
                    <p className="text-sm text-gray-800 mt-2 font-medium max-w-md">
                        Ghar baithe saman mangwao, seedha aapki dukan se 🚀
                    </p>

                    {/* Search Bar — inside hero */}
                    <div className="mt-5">
                        <div className="bg-white/95 backdrop-blur-md rounded-xl flex items-center gap-3 px-4 py-3 shadow-lg border border-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Dukan ka naam ya address search karein..."
                                className="w-full outline-none text-gray-700 bg-transparent text-sm font-medium placeholder:text-gray-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 transition-colors text-lg">
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xl sm:text-2xl font-black text-gray-800">{shops.length}</p>
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Total Shops</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xl sm:text-2xl font-black text-emerald-600">{shops.filter(s => s.isOpen).length}</p>
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Open Now</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">100 KM</p>
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Range</p>
                </div>
            </div>

            {/* Shop Heading */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-800">
                    {searchQuery ? `"${searchQuery}" ke Results` : 'Aas-paas ki Dukanen'}
                </h2>
                {searchQuery && (
                    <span className="text-xs font-bold text-gray-400">{sortedShops.length} found</span>
                )}
            </div>

            {/* Shop Cards */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : sortedShops.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl text-center border border-gray-100 shadow-sm">
                    <span className="text-5xl block mb-3">🔍</span>
                    <p className="text-gray-500 font-bold">
                        {searchQuery ? `No shops found for "${searchQuery}".` : 'No shops found right now.'}
                    </p>
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="mt-3 text-sm font-bold text-yellow-500 hover:text-yellow-600 underline underline-offset-2">
                            Saari dukanen dekhein
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedShops.map((shop, index) => (
                        <Link
                            to={`/shop/${shop._id}`}
                            key={shop._id}
                            className="group block"
                            style={{ animationDelay: `${index * 60}ms` }}
                        >
                            <div className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${shop.isOpen ? 'border-gray-100' : 'border-gray-200'}`}>
                                
                                {/* Card Top — Colored Accent */}
                                <div className={`h-1.5 w-full ${shop.isOpen ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`}></div>

                                <div className="p-4 sm:p-5">
                                    <div className="flex items-start gap-4">
                                        
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
                                                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
                                                    <div className="w-full h-full bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Shop Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className={`font-bold text-sm sm:text-base leading-tight truncate ${shop.isOpen ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {shop.name}
                                                </h3>
                                            </div>
                                            
                                            <div className={`text-xs leading-snug mb-2.5 ${shop.isOpen ? 'text-gray-500' : 'text-gray-400'}`}>
                                                <p className="line-clamp-1 mb-1">📍 {shop.address}</p>
                                                {shop.vendorId?.phone && (
                                                    <p className="font-semibold text-[10px] bg-gray-100 inline-block px-1.5 py-0.5 rounded text-gray-600">
                                                        📞 {shop.vendorId.phone}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Tags Row */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Category Tag */}
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${shop.isOpen 
                                                    ? 'bg-yellow-50 text-yellow-500 border border-yellow-200/60' 
                                                    : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                                    {shop.category || 'Kirana'}
                                                </span>

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
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
