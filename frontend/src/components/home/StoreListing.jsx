import { memo } from 'react';
import { Link } from 'react-router-dom';
import { optimizeImage } from '../../utils/imageUtils';
import { IcoTimer, IcoStar } from './HomeIcons';

const StoreListing = ({ sortedShops, loading, activeCategory, setActiveCategory }) => {
    return (
        <div id="store-listing" className="min-h-[50vh] px-3 py-5 md:mx-4">
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center gap-2">
                    <span className="text-[20px]">🏪</span>
                    <div>
                        <h3 className="text-[16px] font-black text-slate-900 tracking-tight leading-none">
                            {activeCategory !== 'All' ? `${activeCategory} Stores` : 'Stores Around You'}
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

            <div className={sortedShops.length > 0 && !loading ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4" : "space-y-4"}>
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="rounded-[20px] overflow-hidden animate-pulse bg-white shadow-sm">
                                <div className="w-full aspect-[4/3] bg-slate-100" />
                                <div className="p-3 space-y-2">
                                    <div className="h-4 bg-slate-100 w-3/4 rounded-full" />
                                    <div className="h-3 bg-slate-100 w-1/2 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sortedShops.length === 0 ? (
                    <div className="text-center py-14 bg-gradient-to-b from-slate-50 to-white rounded-[24px] border border-slate-100 border-dashed col-span-full mx-1">
                        <span className="text-5xl block mb-3 animate-bounce">🔍</span>
                        <p className="text-[14px] font-black text-slate-400">No stores found</p>
                        <p className="text-[11px] font-semibold text-slate-300 mt-1">Try a different category</p>
                    </div>
                ) : (
                    sortedShops.map((shop) => {
                        const distVal = shop.distance !== Infinity ? shop.distance : 1.5;
                        const isFast = distVal < 2;

                        return (
                            <Link
                                to={`/shop/${shop._id}`}
                                key={shop._id}
                                className={`group flex flex-col rounded-[20px] overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] active:scale-[0.97] transition-all duration-200 ${!shop.isOpen ? 'opacity-50 grayscale-[0.4]' : ''}`}
                            >
                                {/* Image with Gradient Overlay */}
                                <div className="w-full aspect-[4/3] relative overflow-hidden">
                                    {shop.image ? (
                                        <img src={optimizeImage(shop.image, 400)} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-amber-50 to-orange-50">🏪</div>
                                    )}

                                    {/* Bottom gradient for text readability */}
                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

                                    {/* Floating delivery badge */}
                                    <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black tracking-wider uppercase backdrop-blur-md shadow-sm ${isFast ? 'bg-emerald-500/90 text-white' : 'bg-white/90 text-slate-700'}`}>
                                        <IcoTimer />
                                        {isFast ? '15 MIN' : '30 MIN'}
                                    </div>

                                    {/* Rating badge */}
                                    <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-md px-1.5 py-1 rounded-full text-[10px] font-black text-amber-700 shadow-sm">
                                        <IcoStar /> {shop.rating || '4.5'}
                                    </div>

                                    {/* Closed overlay */}
                                    {!shop.isOpen && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                                            <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg tracking-wider">CLOSED</span>
                                        </div>
                                    )}

                                    {/* Shop name on image */}
                                    <div className="absolute bottom-2 left-2 right-2">
                                        <h3 className="text-[13px] font-black text-white leading-tight line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">{shop.name}</h3>
                                    </div>
                                </div>

                                {/* Bottom info strip */}
                                <div className="px-2.5 py-2 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                                    <p className="text-[10px] font-bold text-slate-500 truncate flex-1">
                                        {shop.category || 'Kirana & Grocery'}
                                    </p>
                                    {shop.isOpen && (
                                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    )}
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
