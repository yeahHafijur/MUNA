import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ShopDetail = () => {
    const { id } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // New states for Category and Search
    const [selectedCategory, setSelectedCategory] = useState(null); // null = show categories, 'All' = all, '...' = specific
    const [searchQuery, setSearchQuery] = useState('');

    const { addToCart, cartItems } = useCart();

    useEffect(() => {
        fetch(`/api/products/${id}`)
            .then(res => res.json())
            .then(data => {
                if(Array.isArray(data)) {
                    setProducts(data);
                } else {
                    setProducts([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching products:", err);
                setLoading(false);
            });
    }, [id]);

    // Extract unique categories from products
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category || 'General'));
        return Array.from(cats);
    }, [products]);

    // Filter products based on search and selected category
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            
            // If we are in the main view (selectedCategory === null), we don't show the product list unless there is a search query
            if (selectedCategory === null && !searchQuery) return false;

            return matchesSearch && (selectedCategory ? matchesCategory : true);
        });
    }, [products, searchQuery, selectedCategory]);

    return (
        <div className="mt-4 pb-20">
            {/* Header & Search */}
            <div className="mb-6">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800">Shop Menu</h1>
                        <p className="text-sm text-gray-500">Find exactly what you're craving</p>
                    </div>
                    {selectedCategory && (
                        <button 
                            onClick={() => setSelectedCategory(null)}
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                        >
                            ← Back
                        </button>
                    )}
                </div>
                
                <input 
                    type="text" 
                    placeholder="Search for items, categories..." 
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <p className="text-gray-500 text-sm font-semibold animate-pulse">Loading menu...</p>
            ) : products.length === 0 ? (
                <p className="text-gray-500 text-sm bg-white p-5 rounded-xl border border-gray-100 text-center">No products available in this shop right now.</p>
            ) : (
                <>
                    {/* View 1: Category Cards (Shows only if no category is selected and no search query) */}
                    {selectedCategory === null && !searchQuery && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            <div 
                                onClick={() => setSelectedCategory('All')}
                                className="bg-gradient-to-br from-yellow-500 to-yellow-500 p-5 rounded-2xl shadow-sm cursor-pointer transform hover:-translate-y-1 transition-transform flex flex-col justify-between h-32"
                            >
                                <span className="text-3xl">🍔</span>
                                <h3 className="font-black text-white text-lg">All Items</h3>
                                <p className="text-xs text-yellow-100 font-bold">{products.length} items</p>
                            </div>
                            
                            {categories.map((cat, idx) => {
                                const count = products.filter(p => p.category === cat).length;
                                // Simple emoji generator based on string hash or just standard
                                const emojiList = ["🍕", "🥗", "🍰", "🥤", "🌮", "🍛", "🍩", "🍟"];
                                const emoji = emojiList[idx % emojiList.length];
                                
                                return (
                                    <div 
                                        key={idx}
                                        onClick={() => setSelectedCategory(cat)}
                                        className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm cursor-pointer transform hover:-translate-y-1 hover:border-indigo-300 transition-all flex flex-col justify-between h-32"
                                    >
                                        <span className="text-3xl">{emoji}</span>
                                        <h3 className="font-black text-gray-800 text-lg leading-tight line-clamp-1">{cat}</h3>
                                        <p className="text-xs text-gray-500 font-bold">{count} items</p>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* View 2: Product Grid (Shows if category selected OR search query active) */}
                    {(selectedCategory !== null || searchQuery) && (
                        <div>
                            {selectedCategory && !searchQuery && (
                                <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                                    <span className="text-yellow-500">#</span>
                                    {selectedCategory === 'All' ? 'All Menu Items' : selectedCategory}
                                </h2>
                            )}
                            {searchQuery && (
                                <h2 className="text-md font-bold text-gray-500 mb-4">
                                    Search results for "{searchQuery}" ({filteredProducts.length})
                                </h2>
                            )}

                            {filteredProducts.length === 0 ? (
                                <div className="text-center bg-white p-10 rounded-xl border border-gray-100">
                                    <span className="text-4xl">🔍</span>
                                    <p className="text-gray-500 font-bold mt-2">No items found matching your search.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {filteredProducts.map(product => {
                                        const inCart = cartItems.find(item => item.productId === product._id);
                                        return (
                                            <div key={product._id} className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 flex flex-col relative group">
                                                <div className="w-full h-24 sm:h-32 bg-gray-50 rounded-lg mb-2 flex items-center justify-center text-3xl sm:text-4xl overflow-hidden">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : "📦"}
                                                </div>

                                                <div className="flex-1">
                                                    <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded">
                                                        {product.category || 'General'}
                                                    </span>
                                                    <h3 className="font-bold text-gray-800 text-xs sm:text-sm leading-tight mt-1.5 line-clamp-2">
                                                        {product.name}
                                                    </h3>
                                                </div>

                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                                                    <span className="font-black text-gray-900 text-sm sm:text-base">₹{product.price}</span>

                                                    {product.inStock ? (
                                                        <button
                                                            onClick={() => addToCart(product, id)}
                                                            className={`text-[10px] sm:text-xs font-bold px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg shadow-sm transition-colors ${
                                                                inCart 
                                                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                                                                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white'
                                                            }`}
                                                        >
                                                            {inCart ? `${inCart.quantity} Added` : 'ADD'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[8px] sm:text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                                                            OUT OF STOCK
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ShopDetail;
