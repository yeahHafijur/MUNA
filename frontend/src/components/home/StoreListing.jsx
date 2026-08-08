import { memo } from 'react';
import { Link } from 'react-router-dom';
import { optimizeImage } from '../../utils/imageUtils';
import { IcoTimer, IcoStar } from './HomeIcons';

const StoreListing = ({ sortedShops, loading, activeCategory, setActiveCategory, limit, showViewAll }) => {
    const displayShops = limit ? sortedShops.slice(0, limit) : sortedShops;

    return (
        <div id="store-listing" className="px-4 pt-2 pb-6 md:mx-4">
            {/* ── Section Header ── */}
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-6 bg-amber-400 rounded-full"></div>
                        <h3 className="text-[18px] font-black text-slate-900 tracking-tight leading-none">
                            {activeCategory !== 'All' ? `${activeCategory} Stores` : 'Nearby Shops'}
                        </h3>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 mt-1.5 pl-4">
                        {sortedShops.length} {sortedShops.length === 1 ? 'store' : 'stores'} available near you
                    </p>
                </div>
                {activeCategory !== 'All' && (
                    <button className="text-[11px] font-black text-amber-700 bg-amber-100/70 px-3 py-1.5 rounded-full active:scale-95 transition-transform" onClick={() => setActiveCategory('All')}>✕ Clear</button>
                )}
            </div>

            <div className="space-y-3.5">
                {loading ? (
                    /* Skeleton loaders */
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="rounded-[22px] overflow-hidden animate-pulse bg-white border border-slate-100 shadow-sm">
                            <div className="w-full h-36 bg-slate-100" />
                            <div className="p-4 space-y-2.5">
                                <div className="h-4 bg-slate-100 w-3/4 rounded-full" />
                                <div className="h-3 bg-slate-50 w-1/2 rounded-full" />
                                <div className="h-3 bg-slate-50 w-1/3 rounded-full" />
                            </div>
                        </div>
                    ))
                ) : sortedShops.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-10 bg-white rounded-[32px] border border-amber-100/50 shadow-sm mx-1">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-5 border border-amber-100">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#b45309" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                            </svg>
                        </div>
                        <h2 className="text-[20px] font-black text-slate-900 text-center mb-2 tracking-tight">
                            We aren't here... yet!
                        </h2>
                        <p className="text-[13px] font-semibold text-slate-500 text-center leading-relaxed mb-8 px-4">
                            MUNA hasn't reached your exact location. Want to be a hero? Help us launch here by referring a local grocery or pharmacy vendor!
                        </p>
                        
                        <Link 
                            to="/profile/vendor-request"
                            className="bg-slate-900 w-full py-4 rounded-2xl flex items-center justify-center shadow-sm hover:bg-slate-800 active:bg-slate-800 gap-2 transition-colors"
                        >
                            <span className="text-white font-black text-[15px]">Refer a Vendor</span>
                            <span className="text-amber-400 text-lg leading-none mt-[-2px]">&rarr;</span>
                        </Link>
                    </div>
                ) : (
                    displayShops.map((shop) => {
                        const distVal = shop.distance !== Infinity ? shop.distance : null;
                        const isFast = distVal !== null && distVal < 2;
                        const distText = distVal !== null ? (distVal < 1 ? `${(distVal * 1000).toFixed(0)}m` : `${distVal.toFixed(1)} km`) : null;
                        const deliveryTime = isFast ? '15 min' : '25-30 min';

                        return (
                            <Link
                                to={`/shop/${shop._id}`}
                                key={shop._id}
                                className={`group flex flex-col rounded-[22px] bg-white border border-slate-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] active:scale-[0.985] transition-all duration-200 overflow-hidden ${!shop.isOpen ? 'opacity-60' : ''}`}
                            >
                                {/* Shop Image - Full Width */}
                                <div className="w-full aspect-[21/9] sm:aspect-[3/1] relative overflow-hidden bg-slate-100">
                                    {shop.image ? (
                                        <img 
                                            src={optimizeImage(shop.image, 600)} 
                                            alt={shop.name} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Closed overlay */}
                                    {!shop.isOpen && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
                                            <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-wider uppercase shadow-lg">CLOSED</span>
                                        </div>
                                    )}

                                    {/* Gradient overlay for premium feel */}
                                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                </div>

                                {/* Shop Info - Below Image */}
                                <div className="p-4 relative">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[16px] font-extrabold text-slate-900 leading-tight line-clamp-1">{shop.name}</h4>
                                            <p className="text-[12px] font-semibold text-slate-500 mt-1 truncate">{shop.category || 'Kirana & Grocery'}</p>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100/50">
                                                <IcoStar />
                                                <span className="text-[12px] font-black text-emerald-700">{shop.rating || '4.5'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom row: Distance + Delivery */}
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100/80">
                                        {shop.isOpen && (
                                            <div className={`flex items-center gap-1 text-[11.5px] font-bold ${isFast ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                <IcoTimer />
                                                <span>{deliveryTime}</span>
                                            </div>
                                        )}
                                        {distText && (
                                            <div className="flex items-center gap-1 text-[11.5px] font-semibold text-slate-400">
                                                <span>📍</span>
                                                <span>{distText} away</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>

            {/* View All Button */}
            {showViewAll && sortedShops.length > limit && (
                <div className="mt-6 text-center">
                    <Link 
                        to="/all-stores" 
                        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-900 text-white font-black text-[13px] rounded-2xl active:scale-95 transition-transform shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
                    >
                        View all {sortedShops.length} stores
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default memo(StoreListing);
