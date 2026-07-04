import { memo } from 'react';
import ProductCard from '../ProductCard';
import ProductSkeleton from './ProductSkeleton';

const BuyAgain = ({ navigate, loading }) => {
    // Mock data for Buy Again section (to be replaced with actual API data)
    const mockPreviousOrders = [
        {
            _id: 'mock1',
            name: 'Aashirvaad Shudh Chakki Atta',
            price: 240,
            image: 'https://images.unsplash.com/photo-1627485937980-221c88ce04be?w=400&q=80',
            shopId: 'mockShopId',
            unit: '5 kg'
        },
        {
            _id: 'mock2',
            name: 'Amul Taaza Homogenised Toned Milk',
            price: 72,
            image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
            shopId: 'mockShopId',
            unit: '1 L'
        }
    ];

    return (
        <div className="bg-amber-50/50 px-4 py-6 border-b border-amber-100 mb-2 md:rounded-2xl md:mx-4 shadow-[0_2px_10px_rgba(251,191,36,0.05)]">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-[18px]">🔁</span>
                <h3 className="text-[15px] font-black text-amber-950">Buy it again</h3>
            </div>
            
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
                {loading ? (
                    <>
                        <ProductSkeleton />
                        <ProductSkeleton />
                        <ProductSkeleton />
                    </>
                ) : (
                    mockPreviousOrders.map(prod => {
                        const navigateToProduct = () => navigate(`/search?q=${encodeURIComponent(prod.name)}`);
                        return (
                            <div key={prod._id} className="snap-start shrink-0 w-[140px] sm:w-[160px]">
                                <ProductCard 
                                    product={prod}
                                    onClick={navigateToProduct}
                                    onAddClick={(e) => {
                                        e.stopPropagation();
                                        navigateToProduct();
                                    }}
                                    deliveryTime="15 MINS"
                                />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default memo(BuyAgain);
