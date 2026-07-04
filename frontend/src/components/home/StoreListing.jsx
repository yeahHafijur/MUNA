import { memo } from 'react';
import { Link } from 'react-router-dom';
import { optimizeImage } from '../../utils/imageUtils';
import { IcoTimer, IcoStar } from './HomeIcons';

const StoreListing = ({ sortedShops, loading, activeCategory, setActiveCategory }) => {
    return (
        <div id="store-listing" className="px-4 py-5 md:mx-4">
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-amber-400 rounded-full"></div>
                        <h3 className="text-[18px] font-black text-slate-900 tracking-tight leading-none">
                            {activeCategory !== 'All' ? `${activeCategory} Stores` : 'Explore Stores Around You'}
                        </h3>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 mt-1.5 pl-3.5">
                        {sortedShops.length} {sortedShops.length === 1 ? 'store' : 'stores'} available for you
                    </p>
                </div>
                {activeCategory !== 'All' && (
                    <button className="text-[11px] font-black text-amber-700 bg-amber-100/70 px-3 py-1.5 rounded-full active:scale-95 transition-transform" onClick={() => setActiveCategory('All')}>✕ Clear</button>
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
                                className={`group flex flex-col rounded-[20px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all duration-200 overflow-hidden ${!shop.isOpen ? 'opacity-60' : ''}`}
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
                                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-amber-50 to-orange-50">🏪</div>
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
                                <div className="p-3.5 relative">
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
        </div>
    );
};

export default memo(StoreListing);
