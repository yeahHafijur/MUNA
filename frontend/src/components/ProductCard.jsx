import React from 'react';
import { optimizeImage } from '../utils/imageUtils';

const IcoTime = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3 text-slate-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ProductCard = ({ 
    product, 
    onClick, 
    onAddClick,
    quantity = 0,
    onIncrement,
    onDecrement,
    discount = "15%",
    deliveryTime = "10 MINS"
}) => {
    // Generate a random original price for UI purposes if not provided by backend
    const currentPrice = product.price || 0;
    const originalPrice = Math.floor(currentPrice * 1.15); // 15% more

    const isOutOfStock = product.inStock === false || product.shopIsOpen === false;

    return (
        <div 
            onClick={onClick}
            className={`bg-white rounded-[16px] p-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group h-full
            ${isOutOfStock ? 'opacity-60 grayscale-[0.2]' : ''}`}
        >
            {/* ── DISCOUNT BADGE (Top Left Ribbon) ── */}
            {product.inStock !== false && product.shopIsOpen !== false && discount && (
                <div className="absolute top-0 left-2 bg-[#2563EB] text-white flex flex-col items-center justify-center pt-1.5 pb-2 px-1.5 z-10 shadow-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)' }}>
                    <span className="text-[10px] font-black leading-none">{discount}</span>
                    <span className="text-[7px] font-bold leading-none mt-0.5">OFF</span>
                </div>
            )}

            {/* ── IMAGE WRAPPER ── */}
            <div className="w-full aspect-[4/5] rounded-xl bg-[#F8F9FA] mb-2 p-3 flex flex-col relative overflow-hidden">
                {product.image ? (
                    <img src={optimizeImage(product.image, 300)} alt={product.name} className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">📦</div>
                )}
                
                {/* Out of stock overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-20">
                        <span className="bg-slate-800 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                            {!product.shopIsOpen ? 'Shop Closed' : 'Out of Stock'}
                        </span>
                    </div>
                )}
            </div>

            {/* ── TIME BADGE ── */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 w-fit px-1.5 py-0.5 rounded-[4px] mb-1.5">
                <IcoTime />
                <span className="text-[9px] font-black text-slate-700 tracking-tight">{deliveryTime}</span>
            </div>

            {/* ── TITLE ── */}
            <h4 className="text-[13px] font-bold text-slate-900 line-clamp-2 leading-tight mb-1 tracking-tight min-h-[30px]">
                {product.name} {product.quantity && <span className="text-slate-500 text-[12px]">({product.quantity})</span>}
            </h4>

            {/* ── SUBTITLE (Weight/Unit) ── */}
            <span className="text-[11px] font-medium text-slate-500 mb-2 truncate">
                {product.shopId?.name ? `By ${product.shopId.name}` : (product.category?.name || product.category || '1 unit')}
            </span>

            {/* ── BOTTOM ROW (Price & Add Button) ── */}
            <div className="mt-auto flex items-end justify-between pt-1">
                <div className="flex flex-col">
                    <span className="text-[14px] font-black text-slate-900 leading-none mb-0.5">₹{currentPrice}</span>
                    <span className="text-[11px] font-semibold text-slate-400 line-through leading-none">₹{originalPrice}</span>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    {quantity > 0 ? (
                        <div className="flex items-center justify-between bg-emerald-700 text-white rounded-[8px] h-8 w-[72px] px-1 shadow-sm">
                            <button 
                                onClick={onDecrement}
                                className="w-7 h-full flex items-center justify-center text-lg font-bold active:scale-90"
                            >
                                −
                            </button>
                            <span className="text-[13px] font-bold">{quantity}</span>
                            <button 
                                onClick={onIncrement}
                                className="w-7 h-full flex items-center justify-center text-lg font-bold active:scale-90"
                            >
                                +
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={onAddClick}
                            disabled={isOutOfStock}
                            className={`h-8 px-4 rounded-[8px] border font-black text-[12px] flex items-center justify-center transition-all
                            ${isOutOfStock 
                                ? 'border-slate-200 text-slate-300 bg-slate-50' 
                                : 'border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 active:scale-95 shadow-sm'}`}
                        >
                            ADD
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
