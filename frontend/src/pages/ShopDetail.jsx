import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ShopDetail.css';

const ShopDetail = () => {
    const { id } = useParams();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // New states for Category and Search
    const [selectedCategory, setSelectedCategory] = useState(null); // null = show categories, 'All' = all, '...' = specific
    const [searchQuery, setSearchQuery] = useState('');

    const { addToCart, cartItems } = useCart();

    useEffect(() => {
        // Fetch Shop Details
        fetch(`/api/shops/${id}`)
            .then(res => res.json())
            .then(data => setShop(data))
            .catch(err => console.error("Error fetching shop:", err));

        // Fetch Products
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
        <div className="shopdetail-style-1">
            {/* Shop Banner */}
            {shop && (
                <div className="shopdetail-style-2">
                    {shop.image && (
                        <div className="shopdetail-style-3">
                            <img src={shop.image} alt={shop.name} className="shopdetail-style-4" />
                        </div>
                    )}
                    <div className="shopdetail-style-5">
                        <div className="shopdetail-style-6">
                            <div>
                                <span className={`inline-block text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full mb-2 backdrop-blur-sm border ${shop.isOpen ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                                    {shop.isOpen ? '● Open Now' : '● Closed'}
                                </span>
                                <h1 className="shopdetail-style-7">{shop.name}</h1>
                                <p className="shopdetail-style-8">
                                    <span>📍 {shop.address}</span>
                                    {shop.vendorId?.phone && (
                                        <span className="shopdetail-style-9">
                                            📞 {shop.vendorId.phone}
                                        </span>
                                    )}
                                </p>
                            </div>
                            {shop.location?.coordinates && (
                                <button 
                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.location.coordinates[1]},${shop.location.coordinates[0]}`, '_blank')}
                                    className="shopdetail-style-10"
                                >
                                    <span className="shopdetail-style-11">🗺️</span> <span className="shopdetail-style-12">Directions</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Search & Back */}
            <div className="shopdetail-style-13">
                <div className="shopdetail-style-14">
                    <div>
                        <h2 className="shopdetail-style-15">Menu Items</h2>
                    </div>
                    {selectedCategory && (
                        <button 
                            onClick={() => setSelectedCategory(null)}
                            className="shopdetail-style-16"
                        >
                            ← Back
                        </button>
                    )}
                </div>
                
                <input 
                    type="text" 
                    placeholder="Search for items, categories..." 
                    className="shopdetail-style-17"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <p className="shopdetail-style-18">Loading menu...</p>
            ) : products.length === 0 ? (
                <p className="shopdetail-style-19">No products available in this shop right now.</p>
            ) : (
                <>
                    {/* View 1: Category Cards (Shows only if no category is selected and no search query) */}
                    {selectedCategory === null && !searchQuery && (
                        <div className="shopdetail-style-20">
                            <div 
                                onClick={() => setSelectedCategory('All')}
                                className="shopdetail-style-21"
                            >
                                <span className="shopdetail-style-22">🍔</span>
                                <h3 className="shopdetail-style-23">All Items</h3>
                                <p className="shopdetail-style-24">{products.length} items</p>
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
                                        className="shopdetail-style-25"
                                    >
                                        <span className="shopdetail-style-26">{emoji}</span>
                                        <h3 className="shopdetail-style-27">{cat}</h3>
                                        <p className="shopdetail-style-28">{count} items</p>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* View 2: Product Grid (Shows if category selected OR search query active) */}
                    {(selectedCategory !== null || searchQuery) && (
                        <div>
                            {selectedCategory && !searchQuery && (
                                <h2 className="shopdetail-style-29">
                                    <span className="shopdetail-style-30">#</span>
                                    {selectedCategory === 'All' ? 'All Menu Items' : selectedCategory}
                                </h2>
                            )}
                            {searchQuery && (
                                <h2 className="shopdetail-style-31">
                                    Search results for "{searchQuery}" ({filteredProducts.length})
                                </h2>
                            )}

                            {filteredProducts.length === 0 ? (
                                <div className="shopdetail-style-32">
                                    <span className="shopdetail-style-33">🔍</span>
                                    <p className="shopdetail-style-34">No items found matching your search.</p>
                                </div>
                            ) : (
                                <div className="shopdetail-style-35">
                                    {filteredProducts.map(product => {
                                        const inCart = cartItems.find(item => item.productId === product._id);
                                        return (
                                            <div key={product._id} className="shopdetail-style-36 group">
                                                <div className="shopdetail-style-37">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="shopdetail-style-38" />
                                                    ) : "📦"}
                                                </div>

                                                <div className="shopdetail-style-39">
                                                    <span className="shopdetail-style-40">
                                                        {product.category || 'General'}
                                                    </span>
                                                    <h3 className="shopdetail-style-41">
                                                        {product.name}
                                                    </h3>
                                                </div>

                                                <div className="shopdetail-style-42">
                                                    <span className="shopdetail-style-43">₹{product.price}</span>

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
                                                        <span className="shopdetail-style-44">
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
