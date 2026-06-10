import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './VendorDashboard.css';

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

    // Auto Schedule State
    const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);
    const [openTime, setOpenTime] = useState('09:00');
    const [closeTime, setCloseTime] = useState('21:00');

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
                    if (shopData.autoSchedule) {
                        setAutoScheduleEnabled(shopData.autoSchedule.enabled ?? false);
                        setOpenTime(shopData.autoSchedule.openTime ?? '09:00');
                        setCloseTime(shopData.autoSchedule.closeTime ?? '21:00');
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
            if (window.OneSignal) {
                await window.OneSignal.Slidedown.promptPush();
            } else {
                alert("Notification system is initializing. Please wait a moment and try again.");
            }
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

    const handleUpdateSchedule = async (e) => {
        if (e) e.preventDefault();
        try {
            const res = await fetch(`/api/shops/${shop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    autoSchedule: {
                        enabled: autoScheduleEnabled,
                        openTime,
                        closeTime
                    }
                })
            });
            const updatedShop = await res.json();
            if (res.ok) {
                setShop(updatedShop);
                alert("Schedule Settings updated successfully!");
            } else {
                alert(updatedShop.message || "Failed to update schedule");
            }
        } catch (error) {
            console.error("Error updating schedule settings:", error);
            alert("Failed to update schedule settings");
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

    if (!shop) return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center font-sans">
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 font-medium">Loading Dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="vendor-dashboard-wrapper font-sans text-sm">
            {/* Standard Header */}
            <header className="standard-header">
                <div className="header-content">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                        <div className="flex items-center gap-4 flex-1">
                            {/* Shop Logo/Avatar */}
                            <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-white flex items-center justify-center group">
                                {shop.image ? (
                                    <img src={shop.image} alt="Shop" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl text-gray-400">🏪</span>
                                )}
                                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <span className="text-[10px] font-medium">{uploadingImage ? '...' : 'Edit'}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleUpdateShopImage} disabled={uploadingImage} />
                                </label>
                            </div>

                            {/* Shop Info */}
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">{shop.name}</h1>
                                    {shop.udyamNumber && (
                                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-100">
                                            Verified
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{shop.address}</p>
                            </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Open/Close Toggle */}
                            <button 
                                onClick={handleToggleShopStatus}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${shop.isOpen ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${shop.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {shop.isOpen ? 'Accepting Orders' : 'Store Closed'}
                            </button>

                            <button onClick={handleEnableNotifications} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
                                🔔 Alerts
                            </button>
                            
                            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                            
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Vendor</p>
                                    <p className="text-sm font-semibold text-gray-800 leading-none">{user.name}</p>
                                </div>
                                <button onClick={() => { logout(); navigate('/'); }} className="text-gray-500 hover:text-red-600 transition-colors p-1" title="Logout">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full px-4 md:px-8 py-6">
                {/* Standard Tabs */}
                <div className="border-b border-gray-200 mb-6 flex gap-6">
                    <button 
                        onClick={() => setActiveTab('orders')} 
                        className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'orders' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        Live Orders
                        {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length > 0 && (
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}
                            </span>
                        )}
                        {activeTab === 'orders' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-md"></span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('products')} 
                        className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'products' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        Store Management
                        {activeTab === 'products' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-md"></span>}
                    </button>
                </div>

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="w-full">
                        {orders.length === 0 ? (
                            <div className="standard-panel p-12 flex flex-col items-center justify-center text-center">
                                <div className="text-4xl mb-4 opacity-50">📋</div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-1">No Active Orders</h3>
                                <p className="text-gray-500 text-sm">New orders will appear here automatically.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {orders.map(order => (
                                    <div key={order._id} className="standard-panel p-4 flex flex-col">
                                        {/* Order Header */}
                                        <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-sm font-bold text-gray-900">#{order._id.slice(-6).toUpperCase()}</h3>
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' : order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                                        {order.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-500">
                                                    {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-900">₹{order.totalAmount}</p>
                                                <p className="text-[10px] text-gray-500 uppercase">Total</p>
                                            </div>
                                        </div>

                                        {/* Customer Details */}
                                        <div className="mb-4">
                                            <p className="text-xs font-medium text-gray-800 mb-0.5">{order.customerId?.name || 'Guest Customer'}</p>
                                            <p className="text-[11px] text-gray-500 mb-2">📞 {order.customerId?.phone || 'N/A'}</p>
                                            
                                            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                                <p className="text-[11px] text-gray-600 line-clamp-2">{order.deliveryLocation?.address || 'Address missing'}</p>
                                                {order.deliveryLocation?.lat && (
                                                    <a href={`https://www.google.com/maps?q=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline mt-1 inline-block font-medium">
                                                        Open Map →
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="flex-1 mb-4">
                                            <div className="space-y-1.5">
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="flex justify-between items-start text-xs">
                                                        <span className="text-gray-700"><span className="text-gray-400 mr-1">{item.quantity}x</span> {item.name}</span>
                                                        <span className="text-gray-900 font-medium whitespace-nowrap ml-2">₹{item.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Status Action */}
                                        <div className="mt-auto pt-3 border-t border-gray-100">
                                            <select 
                                                value={order.status} 
                                                onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)} 
                                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                            >
                                                <option value="pending">⏳ Pending</option>
                                                <option value="accepted">✅ Accepted</option>
                                                <option value="preparing">🍳 Preparing</option>
                                                <option value="out_for_delivery">🛵 Out for Delivery</option>
                                                <option value="delivered">🎉 Delivered</option>
                                                <option value="cancelled">❌ Cancelled</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === 'products' && (
                    <div className="w-full space-y-6">
                        {/* Top Controls Grid - Delivery & Categories */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Delivery Settings */}
                            <div className="standard-panel p-5">
                                <h2 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Delivery Rules</h2>
                                <form onSubmit={handleUpdateDeliverySettings} className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Min Order (₹)</label>
                                        <input type="number" required value={minCharge} onChange={e => setMinCharge(e.target.value)} className="input-field py-1.5 text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Free Upto (km)</label>
                                        <input type="number" step="0.1" required value={minDistance} onChange={e => setMinDistance(e.target.value)} className="input-field py-1.5 text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Charge/Km (₹)</label>
                                        <input type="number" required value={chargePerKm} onChange={e => setChargePerKm(e.target.value)} className="input-field py-1.5 text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Max Range (km)</label>
                                        <input type="number" step="0.1" required value={maxRange} onChange={e => setMaxRange(e.target.value)} className="input-field py-1.5 text-xs" />
                                    </div>
                                    <div className="col-span-2 mt-1">
                                        <button type="submit" className="btn-secondary w-full py-1.5 text-xs">Save Rules</button>
                                    </div>
                                </form>
                            </div>

                            {/* Category Manager */}
                            <div className="standard-panel p-5">
                                <h2 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Menu Categories</h2>
                                <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                                    <input type="text" placeholder="e.g. Starters" className="input-field py-1.5 text-xs flex-1" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                                    <button type="submit" className="btn-secondary py-1.5 px-3 text-xs">+ Add</button>
                                </form>
                                <div className="flex flex-wrap gap-2">
                                    {shop.customCategories?.length > 0 ? shop.customCategories.map((cat, idx) => (
                                        <span key={idx} className="bg-gray-100 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded">{cat}</span>
                                    )) : <span className="text-xs text-gray-400">No categories yet.</span>}
                                </div>
                            </div>
                        </div>

                        {/* Add Item Section */}
                        <div className="standard-panel p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-gray-100 pb-2">
                                <h2 className="text-sm font-bold text-gray-800">Add New Item</h2>
                                <button onClick={() => navigate('/vendor-godown')} className="btn-primary py-1.5 px-3 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200">
                                    Import from Master Godown
                                </button>
                            </div>

                            <form onSubmit={handleAddProduct} className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Item Name</label>
                                    <input type="text" required placeholder="e.g. Paneer Tikka" className="input-field py-1.5 text-xs" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Category</label>
                                    <select className="input-field py-1.5 text-xs" value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)}>
                                        {shop.customCategories?.length > 0 ? (
                                            shop.customCategories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)
                                        ) : (
                                            <option value="General">General</option>
                                        )}
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Price (₹)</label>
                                    <input type="number" required placeholder="0" className="input-field py-1.5 text-xs" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Photo (Optional)</label>
                                    <input id="imageInput" type="file" accept="image/*" className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-gray-100 file:text-gray-700 cursor-pointer" onChange={e => setNewProductImage(e.target.files[0])} />
                                </div>
                                <div className="sm:col-span-2 md:col-span-4 mt-2">
                                    <button type="submit" className="btn-primary w-full py-2 text-xs">Create Item</button>
                                </div>
                            </form>
                        </div>

                        {/* Menu List */}
                        <div className="standard-panel">
                            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50">
                                <h2 className="text-sm font-bold text-gray-800">Menu List ({products.length})</h2>
                                <input 
                                    type="text" 
                                    placeholder="Search items..." 
                                    className="input-field py-1.5 text-xs sm:w-64 bg-white"
                                    value={productSearchQuery}
                                    onChange={(e) => setProductSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase text-gray-500 tracking-wider">
                                            <th className="p-3 font-medium">Item Details</th>
                                            <th className="p-3 font-medium text-right">Price</th>
                                            <th className="p-3 font-medium text-center">Status</th>
                                            <th className="p-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(() => {
                                            const filtered = products.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()));
                                            const sorted = [...filtered].sort((a, b) => {
                                                if (a.inStock === b.inStock) return 0;
                                                return a.inStock ? 1 : -1;
                                            });

                                            if (sorted.length === 0) {
                                                return <tr><td colSpan="4" className="py-8 text-center text-gray-500 text-sm">No items found.</td></tr>;
                                            }

                                            return sorted.map(product => (
                                                <tr key={product._id} className={`hover:bg-gray-50 transition-colors ${!product.inStock ? 'bg-red-50/30' : ''}`}>
                                                    <td className="p-3">
                                                        <p className={`text-sm font-semibold ${product.inStock ? 'text-gray-900' : 'text-gray-500'}`}>{product.name}</p>
                                                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{product.category}</span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <p className="text-sm font-medium text-gray-900">₹{product.price}</p>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button 
                                                            onClick={() => handleToggleStock(product._id, product.inStock)} 
                                                            className={`px-2 py-1 rounded text-[10px] font-semibold uppercase border ${product.inStock ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                                                        >
                                                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                        </button>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <button 
                                                            onClick={() => handleDeleteProduct(product._id)} 
                                                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                            title="Delete"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default VendorDashboard;
