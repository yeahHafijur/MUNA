import { memo } from 'react';
import { Link } from 'react-router-dom';
import { optimizeImage } from '../../utils/imageUtils';

const QuickDeliveryStores = ({ shops }) => {
    // Only shops within 2km that are open
    const quickShops = shops.filter(s => s.distance < 2 && s.isOpen);

    if (quickShops.length === 0) return null;

    return (
        <div className="px-4 py-5">
            <div className="flex items-center gap-2 mb-3.5">
                <span className="text-[18px]">⚡</span>
                <div>
                    <h3 className="text-[15px] font-black text-slate-900 tracking-tight leading-none">Quick Delivery</h3>
                    <p className="text-[10px] font-bold text-emerald-600 mt-0.5">Stores near you • Under 15 mins</p>
                </div>
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
                {quickShops.slice(0, 10).map(shop => (
                    <Link
                        to={`/shop/${shop._id}`}
                        key={shop._id}
                        className="snap-start shrink-0 w-[200px] group"
                    >
                        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden relative bg-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
                            {shop.image ? (
                                <img 
                                    src={optimizeImage(shop.image, 400)} 
                                    alt={shop.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-amber-50 to-orange-50">🏪</div>
                            )}

                            {/* Delivery badge */}
                            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase bg-emerald-500 text-white shadow-sm">
                                ⚡ 15 MIN
                            </div>

                            {/* Bottom gradient + shop name on image */}
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                            <h4 className="absolute bottom-2 left-2.5 right-2 text-[13px] font-black text-white leading-tight line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">{shop.name}</h4>
                        </div>

                        <div className="mt-1.5 px-0.5">
                            <p className="text-[10px] font-semibold text-slate-400 truncate">{shop.category || 'Grocery'}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default memo(QuickDeliveryStores);
