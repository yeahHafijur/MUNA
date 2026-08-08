import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../ProductCard';
import { useCart } from '../../context/CartContext';

const collections = [
    {
        title: 'Breakfast Essentials 🍳',
        subtitle: 'Start your day right',
        keywords: ['milk', 'bread', 'egg', 'butter', 'poha', 'oats', 'tea', 'coffee'],
        bgColor: 'bg-orange-50'
    },
    {
        title: 'Snacks & Munchies 🍿',
        subtitle: 'For your cravings',
        keywords: ['chips', 'namkeen', 'biscuit', 'maggi', 'noodles', 'chocolate', 'kurkure'],
        bgColor: 'bg-purple-50'
    },
    {
        title: 'Cold Drinks & Juices 🥤',
        subtitle: 'Stay refreshed',
        keywords: ['coke', 'pepsi', 'sprite', 'juice', 'maaza', 'frooti', 'water', 'soda'],
        bgColor: 'bg-blue-50'
    }
];

const CuratedCollections = ({ featuredProducts }) => {
    const navigate = useNavigate();
    const { cartItems, addToCart, overrideAndReplaceCart, updateQuantity, removeFromCart } = useCart();
    const [replacePrompt, setReplacePrompt] = useState(null);

    const handleAddToCart = (product, shopId) => {
        const result = addToCart(product, shopId);
        if (!result.success && result.error === 'DIFFERENT_SHOP_ERROR') {
            setReplacePrompt(product);
            return;
        }
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const [activeCollection, setActiveCollection] = useState(null);

    useEffect(() => {
        if (!featuredProducts || featuredProducts.length === 0) {
            setActiveCollection(null);
            return;
        }
        
        const validCollections = collections.map(collection => {
            const matchedProducts = featuredProducts
                .filter(prod => {
                    const name = prod.name?.toLowerCase() || '';
                    const cat = prod.category?.name?.toLowerCase() || (typeof prod.category === 'string' ? prod.category.toLowerCase() : '');
                    return collection.keywords.some(kw => name.includes(kw) || cat.includes(kw));
                })
                .slice(0, 5);
            return { ...collection, matchedProducts };
        }).filter(c => c.matchedProducts.length > 0);

        if (validCollections.length > 0) {
            // Pick a random collection to display
            const randomIdx = Math.floor(Math.random() * validCollections.length);
            setActiveCollection(validCollections[randomIdx]);
        }
    }, [featuredProducts]);

    if (!activeCollection) return null;

    return (
        <div className="mt-2">
            <section className={`mb-6 py-5 ${activeCollection.bgColor} border-y border-slate-100/50`}>
                <div className="px-4 mb-3">
                    <h3 className="text-[18px] font-black text-slate-900 tracking-tight">{activeCollection.title}</h3>
                    <p className="text-[12px] font-medium text-slate-600 mt-0.5">{activeCollection.subtitle}</p>
                </div>
                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-3 pb-2">
                    {activeCollection.matchedProducts.map(prod => {
                        const cartItem = cartItems.find(item => item.productId === prod._id);
                        const quantity = cartItem ? cartItem.quantity : 0;
                        const shopId = prod.shopId?._id || prod.shopId;

                        return (
                            <div key={prod._id} className="snap-start shrink-0 w-[140px]">
                                <ProductCard
                                    product={prod}
                                    quantity={quantity}
                                    onIncrement={() => updateQuantity(prod._id, quantity + 1)}
                                    onDecrement={() => {
                                        if (quantity === 1) removeFromCart(prod._id);
                                        else updateQuantity(prod._id, quantity - 1);
                                    }}
                                    onClick={() => shopId
                                        ? navigate(`/shop/${shopId}/product/${prod._id}`)
                                        : navigate(`/search?q=${encodeURIComponent(prod.name)}`)}
                                    onAddClick={(e) => { e.stopPropagation(); handleAddToCart(prod, shopId); }}
                                    discount="15%"
                                    deliveryTime="10 MINS"
                                />
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── REPLACE CART MODAL ── */}
            {replacePrompt && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🛒</span>
                        </div>
                        <h3 className="text-xl font-black text-center text-gray-900 mb-2">Replace cart item?</h3>
                        <p className="text-sm text-center text-gray-500 font-medium mb-6 leading-relaxed">
                            Your cart contains items from another shop. Do you want to discard the selection and add items from this shop?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setReplacePrompt(null)}
                                className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                No, thanks
                            </button>
                            <button
                                onClick={() => {
                                    const shopId = replacePrompt.shopId?._id || replacePrompt.shopId;
                                    overrideAndReplaceCart(replacePrompt, shopId);
                                    setReplacePrompt(null);
                                    if (navigator.vibrate) navigator.vibrate(50);
                                }}
                                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md hover:shadow-lg transition-all"
                            >
                                Replace
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(CuratedCollections);
