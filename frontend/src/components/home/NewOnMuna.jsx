import { memo } from 'react';
import { Link } from 'react-router-dom';
import { optimizeImage } from '../../utils/imageUtils';

const NewOnMuna = ({ shops }) => {
    // Sort by createdAt if available, otherwise just take the last added ones
    const newShops = [...shops]
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        })
        .slice(0, 6);
        
    if (newShops.length === 0) return null;

    return (
        <div className="px-4 py-6 mb-2">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-[18px]">✨</span>
                <h3 className="text-[16px] font-black text-slate-900 tracking-tight">New on MUNA</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
                {newShops.map(shop => (
                    <Link
                        to={`/shop/${shop._id}`}
                        key={shop._id}
                        className="snap-start shrink-0 w-[200px] rounded-[20px] overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-all group"
                    >
                        <div className="w-full h-[120px] relative overflow-hidden">
                            {shop.image ? (
                                <img src={optimizeImage(shop.image, 400)} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-amber-50 to-orange-50">🏪</div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-[8px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-sm">NEW</div>
                            <h4 className="absolute bottom-2 left-2 right-2 text-[12px] font-black text-white line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">{shop.name}</h4>
                        </div>
                        <div className="px-3 py-2">
                            <p className="text-[10px] font-bold text-slate-400 truncate">{shop.category || 'Kirana & Grocery'}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default memo(NewOnMuna);
