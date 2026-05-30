import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Backend se saari dukanen (Shops) le kar aate hain
    useEffect(() => {
        fetch('http://localhost:5000/api/shops')
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

            {/* Hero Banner */}
            <div className="relative bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 rounded-2xl p-6 sm:p-8 mb-6 overflow-hidden shadow-lg">
                {/* Decorative shapes */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute top-4 right-6 text-5xl sm:text-6xl opacity-20 select-none">🏪</div>

                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight relative z-10">
                    Apne Gaon ki <br className="sm:hidden" />
                    <span className="text-white drop-shadow-sm">Har Dukan,</span> <br />
                    Ek Jagah!
                </h1>
                <p className="text-sm text-gray-800/80 mt-2 font-semibold relative z-10">
                    Ghar baithe saman mangwao, seedha aapki dukan se 🚀
                </p>

                {/* Search Bar — inside hero */}
                <div className="mt-5 relative z-10">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl flex items-center gap-3 px-4 py-3 shadow-md border border-white/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 transition-colors">
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                    <p className="text-xl sm:text-2xl font-black text-gray-800">{shops.length}</p>
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Total Shops</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                    <p className="text-xl sm:text-2xl font-black text-green-600">{shops.filter(s => s.isOpen).length}</p>
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Open Now</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                    <p className="text-xl sm:text-2xl font-black text-amber-500">4 KM</p>
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
                        {searchQuery ? `"${searchQuery}" se koi dukan nahi mili.` : 'Abhi koi dukan nahi mili.'}
                    </p>
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="mt-3 text-sm font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2">
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
                                        <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl sm:text-3xl overflow-hidden transition-transform duration-300 group-hover:scale-105 ${shop.isOpen ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-200/50 shadow-sm' : 'bg-gray-100 border-2 border-gray-200'}`}>
                                            {shop.image ? (
                                                <img 
                                                    src={`http://localhost:5000${shop.image}`} 
                                                    alt={shop.name} 
                                                    className={`w-full h-full object-cover ${!shop.isOpen ? 'grayscale opacity-60' : ''}`} 
                                                />
                                            ) : (
                                                <span className={`${!shop.isOpen ? 'grayscale' : ''}`}>🏪</span>
                                            )}
                                            
                                            {/* Live indicator dot */}
                                            {shop.isOpen && (
                                                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm">
                                                    <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
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
                                            
                                            <p className={`text-xs leading-snug line-clamp-1 mb-2.5 ${shop.isOpen ? 'text-gray-500' : 'text-gray-400'}`}>
                                                📍 {shop.address}
                                            </p>

                                            {/* Tags Row */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Category Tag */}
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${shop.isOpen 
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60' 
                                                    : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                                    {shop.category || 'Kirana'}
                                                </span>

                                                {/* Status Tag */}
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${shop.isOpen 
                                                    ? 'bg-green-50 text-green-600 border border-green-200/60' 
                                                    : 'bg-red-50 text-red-400 border border-red-200/60'}`}>
                                                    {shop.isOpen ? '● Open' : '● Closed'}
                                                </span>
                                                
                                                {/* Rating */}
                                                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${shop.isOpen ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    ⭐ {shop.rating || '4.5'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Arrow Icon */}
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 ${shop.isOpen ? 'bg-gray-100 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-600' : 'bg-gray-100 text-gray-300'}`}>
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
