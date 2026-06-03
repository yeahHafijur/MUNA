import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

    // Delivery Settings State
    const [minCharge, setMinCharge] = useState(10);
    const [minDistance, setMinDistance] = useState(2);
    const [chargePerKm, setChargePerKm] = useState(5);
    const [maxRange, setMaxRange] = useState(5);

    const [shopImageFile, setShopImageFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

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
        fetch('/api/shops/my-shop', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(shopData => {
                if (shopData._id) {
                    setShop(shopData);
                    if (shopData.deliverySettings) {
                        setMinCharge(shopData.deliverySettings.minimumCharge ?? 10);
                        setMinDistance(shopData.deliverySettings.minimumDistance ?? 2);
                        setChargePerKm(shopData.deliverySettings.chargePerKm ?? 5);
                        setMaxRange(shopData.deliverySettings.maxRange ?? 5);
                    }
                    fetchOrders(true); // initial fetch
                    fetchProducts(shopData._id);
                }
            });

        // Fetch Godown Items
        fetch('/api/master-products')
            .then(res => res.json())
            .then(data => setGodownItems(Array.isArray(data) ? data : []));

    }, [token, user, navigate]);

    // Handle enabling push notifications explicitly via a button click
    const handleEnableNotifications = async () => {
        try {
            if (!("Notification" in window)) {
                alert("Browser does not support notifications");
                return;
            }
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                alert("Notification permission denied!");
                return;
            }

            const swRegistration = await navigator.serviceWorker.ready;
            const publicVapidKey = import.meta.env.VITE_PUBLIC_VAPID_KEY;
            
            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            // Send subscription to backend
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(subscription)
            });
            alert("✅ Push Notifications Enabled! Ab app minimize hone par bhi order aane ka alert aayega.");
        } catch (error) {
            console.error("Error subscribing to push:", error);
            alert("Failed to enable push notifications.");
        }
    };

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
        fetch('/api/orders/vendor', {
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
        fetch(`/api/products/${shopId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setProducts(data);
                else setProducts([]);
            });
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        fetchOrders();
    };

    const handleToggleStock = async (productId, currentStatus) => {
        await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ inStock: !currentStatus })
        });
        fetchProducts(shop._id);
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm("Are you sure? Delete this item?")) return;
        await fetch(`/api/products/${productId}`, {
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

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.message || 'Failed to add item manually');
                return;
            }

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
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Error adding item manually. Please check your connection.");
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        
        const updatedCategories = [...(shop.customCategories || []), newCategory.trim()];
        
        try {
            const res = await fetch(`/api/shops/${shop._id}`, {
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
            const res = await fetch(`/api/shops/${shop._id}`, {
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

    const handleUpdateDeliverySettings = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/shops/${shop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    deliverySettings: {
                        minimumCharge: Number(minCharge),
                        minimumDistance: Number(minDistance),
                        chargePerKm: Number(chargePerKm),
                        maxRange: Number(maxRange)
                    }
                })
            });
            const updatedShop = await res.json();
            setShop(updatedShop);
            alert("Delivery Settings updated successfully!");
        } catch (error) {
            console.error("Error updating delivery settings:", error);
            alert("Failed to update delivery settings");
        }
    };

    const handleUpdateShopImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`/api/shops/${shop._id}/image`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const updatedShop = await res.json();
            if (res.ok) {
                setShop(updatedShop);
                alert("Shop banner updated successfully!");
            } else {
                alert(updatedShop.message || "Failed to update banner");
            }
        } catch (error) {
            console.error("Error updating banner:", error);
        } finally {
            setUploadingImage(false);
            e.target.value = null; // reset input
        }
    };

    if (!shop) return <div className="text-center mt-20 font-bold">Loading Dashboard...</div>;

    return (
        <div className="max-w-4xl mx-auto mt-6 pb-20">
            {/* Header */}
            <div className="bg-gray-900 text-white p-6 rounded-xl mb-6 flex justify-between items-center shadow-lg relative overflow-hidden">
                {shop.image && (
                    <div className="absolute inset-0 opacity-20">
                        <img src={shop.image} alt="Shop Banner" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <h1 className="text-2xl font-black">{shop.name}</h1>
                        {shop.udyamNumber && (
                            <span className="bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                🛡️ Verified Udyam
                            </span>
                        )}
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{shop.address}</p>
                    
                    <div className="flex gap-2 items-center flex-wrap">
                        <button 
                            onClick={handleToggleShopStatus}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${shop.isOpen ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'}`}
                        >
                            {shop.isOpen ? '🟢 Shop is Open' : '🔴 Shop is Closed'}
                        </button>

                        <label className="cursor-pointer bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1">
                            {uploadingImage ? '⏳ Uploading...' : '🖼️ Change Banner'}
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleUpdateShopImage} 
                                disabled={uploadingImage}
                            />
                        </label>
                        <button 
                            onClick={handleEnableNotifications}
                            className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30"
                        >
                            🔔 Enable Push Alerts
                        </button>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-4">
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
                            <div key={order._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-start hover:shadow-md transition-shadow">
                                <div className="flex-1 w-full">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-black text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">#{order._id.slice(-6).toUpperCase()}</h3>
                                        <span className="text-xs text-gray-400 font-semibold">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <p className="text-sm font-bold text-gray-800 flex flex-wrap items-center gap-1.5">
                                            <span>👤 {order.customerId?.name || 'New Customer'}</span> 
                                            <span className="text-gray-300 hidden sm:inline">|</span>
                                            <span className="text-gray-500 text-xs bg-gray-50 px-1.5 py-0.5 rounded font-semibold border border-gray-100">📞 {order.customerId?.phone || 'No Number'}</span>
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-2">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="text-xs flex justify-between py-1 border-b border-gray-100 last:border-0">
                                                <span className="text-gray-600 font-semibold">{item.quantity} x {item.name}</span>
                                                <span className="font-bold text-gray-800">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                        <div className="mt-1.5 pt-1.5 border-t border-gray-200 flex justify-between font-black text-sm">
                                            <span>Total Amount</span>
                                            <span className="text-green-600">₹{order.totalAmount}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-2 bg-blue-50/50 p-2 rounded-lg border border-blue-50">
                                        <span className="text-xs text-blue-500">📍</span>
                                        <p className="text-[11px] font-semibold text-blue-900 line-clamp-2 flex-1">{order.deliveryLocation?.address || 'Address missing'}</p>
                                        {order.deliveryLocation?.lat && order.deliveryLocation?.lng && (
                                            <a 
                                                href={`https://www.google.com/maps?q=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-bold hover:bg-blue-700 shadow-sm"
                                            >
                                                Map
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full md:w-44 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
                                    <div className="w-full">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Update Status</label>
                                        <select 
                                            value={order.status} 
                                            onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)} 
                                            className={`w-full border rounded-lg p-2 font-bold text-xs outline-none cursor-pointer transition-colors shadow-sm
                                                ${order.status === 'delivered' ? 'bg-green-50 border-green-200 text-green-700' : 
                                                  order.status === 'cancelled' ? 'bg-red-50 border-red-200 text-red-700' :
                                                  order.status === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                                  'bg-blue-50 border-blue-200 text-blue-700'}`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="accepted">Accepted</option>
                                            <option value="preparing">Preparing</option>
                                            <option value="out_for_delivery">Out for Delivery</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="mt-auto hidden md:block">
                                        <div className={`text-[9px] font-black uppercase tracking-widest text-center py-1.5 rounded bg-gray-50 border ${order.status === 'delivered' ? 'text-green-500 border-green-100' : 'text-gray-400 border-gray-100'}`}>
                                            {order.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
                <div className="space-y-6">
                    {/* Delivery Settings */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><span>🛵</span> Delivery Charges Settings</h2>
                        <form onSubmit={handleUpdateDeliverySettings} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Minimum Charge (₹)</label>
                                <input type="number" required value={minCharge} onChange={e => setMinCharge(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-yellow-400 font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Minimum Distance (km)</label>
                                <input type="number" step="0.1" required value={minDistance} onChange={e => setMinDistance(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-yellow-400 font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Extra Charge Per Km (₹)</label>
                                <input type="number" required value={chargePerKm} onChange={e => setChargePerKm(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-yellow-400 font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Delivery Range (km)</label>
                                <input type="number" step="0.1" required value={maxRange} onChange={e => setMaxRange(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-yellow-400 font-bold" />
                            </div>
                            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                                <button type="submit" className="bg-gray-800 hover:bg-black text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm">
                                    Save Settings
                                </button>
                            </div>
                        </form>
                    </div>

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
