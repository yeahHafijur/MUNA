import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const VendorDashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [shop, setShop] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'products'
    const prevOrderCountRef = useRef(0); // Track previous order count to detect new ones

    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductImage, setNewProductImage] = useState(null);
    const [newProductCategory, setNewProductCategory] = useState('');
    
    const [newCategory, setNewCategory] = useState('');
    const [productSearchQuery, setProductSearchQuery] = useState('');

    // Godown State
    const [godownItems, setGodownItems] = useState([]);
    const [showGodown, setShowGodown] = useState(false);
    const [selectedGodownImage, setSelectedGodownImage] = useState('');

    useEffect(() => {
        // Agar normal user yahan aane ki koshish kare, toh wapas bhej do
        if (!token || user?.role !== 'vendor') {
            navigate('/');
            return;
        }

        // Vendor ki dukan ki details lao
        fetch('http://localhost:5000/api/shops/my-shop', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(shopData => {
                if (shopData._id) {
                    setShop(shopData);
                    fetchOrders(true); // initial fetch
                    fetchProducts(shopData._id);
                }
            });

        // Fetch Godown Items
        fetch('http://localhost:5000/api/master-products')
            .then(res => res.json())
            .then(data => setGodownItems(Array.isArray(data) ? data : []));

        // Request Notification permission if not granted
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, [token, user, navigate]);

    // Polling setup for live orders (every 10 seconds)
    useEffect(() => {
        if (!shop || !token) return;
        
        const interval = setInterval(() => {
            fetchOrders(false); // background fetch
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, [shop, token]);

    const playNotificationSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            
            // Nice double-chime sound
            const playNote = (freq, startTime, duration) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
                
                gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
                gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(ctx.currentTime + startTime);
                osc.stop(ctx.currentTime + startTime + duration);
            };

            playNote(880, 0, 0.4); // High A
            playNote(1108.73, 0.15, 0.6); // High C#
        } catch(e) {
            console.log("Audio not supported");
        }
    };

    const fetchOrders = (isInitial = false) => {
        fetch('http://localhost:5000/api/orders/vendor', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const currentLiveOrders = data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
                    
                    // If not initial fetch, and we have MORE live orders than before
                    if (!isInitial && currentLiveOrders > prevOrderCountRef.current) {
                        playNotificationSound();
                        
                        // Show Browser Notification
                        if ("Notification" in window && Notification.permission === "granted") {
                            new Notification("New Order Received! 🛒", {
                                body: "A new order just arrived at your shop. Please check the dashboard.",
                                icon: "/vite.svg"
                            });
                        }
                    }
                    
                    prevOrderCountRef.current = currentLiveOrders;
                    setOrders(data);
                }
            });
    };

    const fetchProducts = (shopId) => {
        fetch(`http://localhost:5000/api/products/${shopId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setProducts(data);
                else setProducts([]);
            });
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        fetchOrders();
    };

    const handleToggleStock = async (productId, currentStatus) => {
        await fetch(`http://localhost:5000/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ inStock: !currentStatus })
        });
        fetchProducts(shop._id);
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm("Are you sure? Delete this item?")) return;
        await fetch(`http://localhost:5000/api/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchProducts(shop._id);
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', newProductName);
        formData.append('price', Number(newProductPrice));
        formData.append('category', newProductCategory || (shop.customCategories?.[0] || 'General'));
        if (newProductImage) {
            formData.append('image', newProductImage);
        } else if (selectedGodownImage) {
            formData.append('image', selectedGodownImage);
        }

        await fetch('http://localhost:5000/api/products', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        // Reset forms
        setNewProductName('');
        setNewProductPrice('');
        setNewProductImage(null);
        setSelectedGodownImage('');
        setNewProductCategory('');
        setShowGodown(false);
        const imgInput = document.getElementById('imageInput');
        if (imgInput) imgInput.value = '';
        fetchProducts(shop._id);
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        
        const updatedCategories = [...(shop.customCategories || []), newCategory.trim()];
        
        try {
            const res = await fetch(`http://localhost:5000/api/shops/${shop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ customCategories: updatedCategories })
            });
            const updatedShop = await res.json();
            setShop(updatedShop);
            setNewCategory('');
        } catch (error) {
            console.error("Error adding category:", error);
        }
    };

    const handleToggleShopStatus = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/shops/${shop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ isOpen: !shop.isOpen })
            });
            const updatedShop = await res.json();
            setShop(updatedShop);
        } catch (error) {
            console.error("Error toggling shop status:", error);
        }
    };

    if (!shop) return <div className="text-center mt-20 font-bold">Loading Dashboard...</div>;

    return (
        <div className="max-w-4xl mx-auto mt-6 pb-20">
            {/* Header */}
            <div className="bg-gray-900 text-white p-6 rounded-xl mb-6 flex justify-between items-center shadow-lg">
                <div>
                    <h1 className="text-2xl font-black">{shop.name}</h1>
                    <p className="text-gray-400 text-sm">{shop.address}</p>
                    
                    <button 
                        onClick={handleToggleShopStatus}
                        className={`mt-3 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${shop.isOpen ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'}`}
                    >
                        {shop.isOpen ? '🟢 Shop is Open' : '🔴 Shop is Closed'}
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <span className="hidden sm:inline-block bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Vendor Mode</span>
                    <button onClick={() => { logout(); navigate('/'); }} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold text-sm transition-colors">Logout</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button onClick={() => setActiveTab('orders')} className={`flex-1 py-3 rounded-lg font-bold transition-colors ${activeTab === 'orders' ? 'bg-[#f8cb46] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>Live Orders ({orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length})</button>
                <button onClick={() => setActiveTab('products')} className={`flex-1 py-3 rounded-lg font-bold transition-colors ${activeTab === 'products' ? 'bg-[#f8cb46] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>Manage Menu</button>
            </div>

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
                <div className="space-y-4">
                    {orders.length === 0 ? <div className="bg-white p-10 text-center rounded-xl border border-gray-200"><span className="text-4xl block mb-2">😴</span><p className="text-gray-500 font-bold">No orders yet.</p></div> :
                        orders.map(order => (
                            <div key={order._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-black text-lg">#{order._id.slice(-6).toUpperCase()}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{order.status.replace('_', ' ')}</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">{order.customerId?.name || 'Customer'}</p>
                                    <p className="text-xs text-gray-500 mb-1">{new Date(order.createdAt).toLocaleString()}</p>
                                    
                                    <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg mb-3 flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">📍</span>
                                        <div>
                                            <p className="text-xs font-bold text-blue-900 line-clamp-2">{order.deliveryLocation?.address || 'Address missing'}</p>
                                            {order.deliveryLocation?.lat && order.deliveryLocation?.lng && (
                                                <a 
                                                    href={`https://www.google.com/maps?q=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-block mt-1 text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded shadow-sm hover:bg-blue-700 transition-colors"
                                                >
                                                    🗺️ View on Map
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="text-sm flex justify-between gap-4"><span>{item.quantity} x {item.name}</span><span className="font-bold">₹{item.price * item.quantity}</span></div>
                                        ))}
                                        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-black"><span>Total</span><span>₹{order.totalAmount}</span></div>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <select value={order.status} onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)} className="border border-gray-200 rounded-lg p-2 font-bold text-sm outline-none focus:border-yellow-400 bg-gray-50 cursor-pointer">
                                        <option value="pending">Pending</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="preparing">Preparing</option>
                                        <option value="out_for_delivery">Out for Delivery</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                        ))
                    }
                </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
                <div className="space-y-6">
                    {/* Category Manager */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="font-bold text-gray-800 mb-3">Manage Categories</h2>
                        <form onSubmit={handleAddCategory} className="flex gap-3 mb-4">
                            <input type="text" placeholder="New Category (e.g. Starters)" className="flex-1 border border-gray-200 rounded-lg p-2 outline-none focus:border-yellow-400" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                            <button type="submit" className="bg-[#f8cb46] hover:bg-yellow-400 text-white font-bold py-2 px-4 rounded-lg transition-colors">+ Add Category</button>
                        </form>
                        <div className="flex flex-wrap gap-2">
                            {shop.customCategories?.length > 0 ? shop.customCategories.map((cat, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">{cat}</span>
                            )) : <span className="text-sm text-gray-500">No custom categories yet.</span>}
                        </div>
                    </div>

                    {/* Godown and Add Product Section */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="mb-6">
                            <h2 className="font-black text-gray-800 text-lg mb-2">Want to add items quickly?</h2>
                            <button 
                                onClick={() => navigate('/vendor-godown')}
                                className="w-full bg-gradient-to-r from-yellow-400 to-[#f8cb46] hover:from-yellow-500 hover:to-yellow-500 text-black font-black py-4 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-3 text-lg border border-yellow-500"
                            >
                                <span className="text-2xl">📦</span> Select from Master Godown
                            </button>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Or Add Custom Item</h3>
                            <form onSubmit={handleAddProduct} className="flex flex-col md:flex-row gap-3">
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Item Name (e.g. Special Kulfi)" 
                                    className="flex-1 border border-gray-200 rounded-lg p-3 outline-none focus:border-yellow-400" 
                                    value={newProductName} 
                                    onChange={e => setNewProductName(e.target.value)} 
                                />
                                
                                <select className="border border-gray-200 rounded-lg p-3 outline-none focus:border-yellow-400 bg-white w-full md:w-auto" value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)}>
                                    {shop.customCategories?.length > 0 ? (
                                        shop.customCategories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)
                                    ) : (
                                        <option value="General">General</option>
                                    )}
                                </select>

                                <input type="number" required placeholder="Price (₹)" className="w-full md:w-32 border border-gray-200 rounded-lg p-3 outline-none focus:border-yellow-400" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} />
                                
                                <input id="imageInput" type="file" accept="image/*" className="flex-1 border border-gray-200 rounded-lg p-2 outline-none focus:border-yellow-400 text-sm w-full md:w-auto" onChange={e => setNewProductImage(e.target.files[0])} />

                                <button type="submit" className="bg-gray-800 hover:bg-black text-white font-bold py-3 px-6 rounded-lg transition-colors w-full md:w-auto shadow-md">
                                    + Create
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Products List with Search and Sort */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <h2 className="font-bold text-gray-800">Your Menu Items</h2>
                            <div className="relative w-full sm:w-64">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                <input 
                                    type="text" 
                                    placeholder="Search products..." 
                                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-yellow-400"
                                    value={productSearchQuery}
                                    onChange={(e) => setProductSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(() => {
                                // Filter based on search query
                                const filtered = products.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()));
                                // Sort: Out of stock first
                                const sorted = [...filtered].sort((a, b) => {
                                    if (a.inStock === b.inStock) return 0;
                                    return a.inStock ? 1 : -1;
                                });

                                if (sorted.length === 0) {
                                    return <p className="text-gray-500 text-sm col-span-full">No products found.</p>;
                                }

                                return sorted.map(product => (
                                    <div key={product._id} className={`bg-white p-4 rounded-xl shadow-sm border ${product.inStock ? 'border-gray-200' : 'border-red-300 bg-red-50/50 relative'} flex justify-between items-center`}>
                                        {!product.inStock && (
                                            <span className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                                                EMPTY
                                            </span>
                                        )}
                                        <div>
                                            <h3 className={`font-bold ${product.inStock ? 'text-gray-800' : 'text-gray-600'}`}>{product.name}</h3>
                                            <p className={`font-black ${product.inStock ? 'text-green-600' : 'text-gray-400'}`}>₹{product.price}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleToggleStock(product._id, product.inStock)} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${product.inStock ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-500 text-white shadow-sm hover:bg-red-600'}`}>
                                                {product.inStock ? 'IN STOCK' : 'MARK IN STOCK'}
                                            </button>
                                            <button onClick={() => handleDeleteProduct(product._id)} className="text-gray-400 hover:text-red-600 transition-colors text-xl">🗑️</button>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorDashboard;
