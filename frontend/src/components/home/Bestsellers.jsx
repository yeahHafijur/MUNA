import { memo } from 'react';
import ProductCard from '../ProductCard';

const Bestsellers = ({ featuredProducts, navigate }) => {
    if (!featuredProducts || featuredProducts.length === 0) return null;

    return (
        <div className="bg-white px-4 py-6 border-b border-slate-100 mb-2 md:rounded-2xl md:mx-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-black text-slate-900">Bestsellers</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
                {featuredProducts.slice(0, 8).map(prod => {
                    const shopIdToNavigate = prod.shopId?._id || prod.shopId;
                    const navigateToProduct = () => {
                        shopIdToNavigate ? navigate(`/shop/${shopIdToNavigate}`) : navigate(`/search?q=${encodeURIComponent(prod.name)}`)
                    };
                    return (
                        <div key={prod._id} className="snap-start shrink-0 w-[140px] sm:w-[160px]">
                            <ProductCard 
                                product={prod}
                                onClick={navigateToProduct}
                                onAddClick={(e) => {
                                    e.stopPropagation();
                                    navigateToProduct();
                                }}
                                discount="15%"
                                deliveryTime="10 MINS"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default memo(Bestsellers);
