import { memo } from 'react';
import { Link } from 'react-router-dom';
import { optimizeImage } from '../../utils/imageUtils';
import { IcoTimer, IcoStar } from './HomeIcons';

const StoreListing = ({ sortedShops, loading, activeCategory, setActiveCategory }) => {
    return (
        <div id="store-listing" className="px-4 py-5 md:mx-4">
            <div className="flex items-center justify-between mb-4 px-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-[20px]">🏪</span>
                    <div>
                        <h3 className="text-[16px] font-black text-slate-900 tracking-tight leading-none">
                            {activeCategory !== 'All' ? `${activeCategory} Stores` : 'All Stores Near You'}
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                            {sortedShops.length} {sortedShops.length === 1 ? 'store' : 'stores'} available
                        </p>
                    </div>
                </div>
                {activeCategory !== 'All' && (
                    <button className="text-[11px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full active:scale-95 transition-transform border border-amber-100" onClick={() => setActiveCategory('All')}>✕ Clear</button>
                )}
            </div>

            <div className="space-y-3">
                {loading ? (
                    /* Skeleton loaders */
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="flex gap-3 rounded-2xl overflow-hidden animate-pulse bg-white p-3 shadow-sm">
                            <div className="w-[100px] h-[100px] rounded-xl bg-slate-100 shrink-0" />
                            <div className="flex-1 py-1 space-y-2.5">
                                <div className="h-4 bg-slate-100 w-3/4 rounded-full" />
                                <div className="h-3 bg-slate-100 w-1/2 rounded-full" />
                                <div className="h-3 bg-slate-100 w-1/3 rounded-full" />
                            </div>
                        </div>
                    ))
                ) : sortedShops.length === 0 ? (
                    <div className="text-center py-14 bg-gradient-to-b from-slate-50 to-white rounded-[24px] border border-slate-100 border-dashed mx-1">
                        <span className="text-5xl block mb-3 animate-bounce">🔍</span>
                        <p className="text-[14px] font-black text-slate-400">No stores found</p>
                        <p className="text-[11px] font-semibold text-slate-300 mt-1">Try a different category</p>
                    </div>
                ) : (
                    sortedShops.map((shop) => {
                        const distVal = shop.distance !== Infinity ? shop.distance : null;
                        const isFast = distVal !== null && distVal < 2;
                        const distText = distVal !== null ? (distVal < 1 ? `${(distVal * 1000).toFixed(0)}m` : `${distVal.toFixed(1)} km`) : null;
                        const deliveryTime = isFast ? '15 min' : '25-30 min';

                        return (
                            <Link
                                to={`/shop/${shop._id}`}
                                key={shop._id}
                                className={`group flex gap-3 rounded-2xl bg-white p-2.5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] active:scale-[0.98] transition-all duration-200 ${!shop.isOpen ? 'opacity-55' : ''}`}
                            >
                                {/* Shop Image */}
                                <div className="w-[100px] h-[100px] rounded-xl overflow-hidden relative shrink-0 bg-slate-100">
                                    {shop.image ? (
                                        <img 
                                            src={optimizeImage(shop.image, 250)} 
                                            alt={shop.name} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-amber-50 to-orange-50">🏪</div>
                                    )}

                                    {/* Closed overlay */}
                                    {!shop.isOpen && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                                            <span className="bg-slate-900 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-wider">CLOSED</span>
                                        </div>
                                    )}
                                </div>

                                {/* Shop Info */}
                                <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-[14px] font-extrabold text-slate-900 leading-tight line-clamp-1">{shop.name}</h4>
                                        
                                        {/* Rating + Category */}
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                                <IcoStar />
                                                <span className="text-[11px] font-black text-emerald-700">{shop.rating || '4.5'}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">•</span>
                                            <span className="text-[11px] font-semibold text-slate-500 truncate">{shop.category || 'Kirana & Grocery'}</span>
                                        </div>
                                    </div>

                                    {/* Bottom row: Distance + Delivery */}
                                    <div className="flex items-center gap-3 mt-2">
                                        {shop.isOpen && (
                                            <div className={`flex items-center gap-1 text-[10px] font-bold ${isFast ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                <IcoTimer />
                                                <span>{deliveryTime}</span>
                                            </div>
                                        )}
                                        {distText && (
                                            <span className="text-[10px] font-semibold text-slate-400">📍 {distText} away</span>
                                        )}
                                    </div>
                                </div>

                                {/* Chevron */}
                                <div className="flex items-center pr-1 opacity-30 group-hover:opacity-60 transition-opacity">
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-slate-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default memo(StoreListing);
