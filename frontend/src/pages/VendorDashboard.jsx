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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center font-['Outfit']">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold text-lg tracking-wide">Loading your dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="vendor-dashboard-wrapper">
            {/* Glass Header */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Shop Avatar/Banner */}
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shadow-md flex-shrink-0 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center group">
                            {shop.image ? (
                                <img src={shop.image} alt="Shop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <span className="text-3xl">🏪</span>
                            )}
                            <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                                <span className="text-xs font-bold">{uploadingImage ? '...' : 'Edit'}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleUpdateShopImage} disabled={uploadingImage} />
                            </label>
                        </div>

                        {/* Shop Info */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">{shop.name}</h1>
                                {shop.udyamNumber && (
                                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 shadow-sm flex items-center gap-1 hidden sm:flex">
                                        🛡️ Verified
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-1 mt-0.5"><span className="text-gray-400">📍</span> {shop.address}</p>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                {/* Open/Close Toggle */}
                                <button 
                                    onClick={handleToggleShopStatus}
                                    className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${shop.isOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'}`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${shop.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                    {shop.isOpen ? 'Accepting Orders' : 'Currently Closed'}
                                </button>

                                {/* Push Alert Btn */}
                                <button onClick={handleEnableNotifications} className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all flex items-center gap-1.5">
                                    🔔 <span className="hidden sm:inline">Push Alerts</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Logged in as</p>
                            <p className="text-sm font-bold text-gray-800">{user.name}</p>
                        </div>
                        <button onClick={() => { logout(); navigate('/'); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">
                {/* Custom Tabs */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2 p-1.5 bg-white/60 backdrop-blur-md rounded-2xl border border-white mb-8 shadow-sm w-fit animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <button 
                        onClick={() => setActiveTab('orders')} 
                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'orders' ? 'bg-gray-900 text-white shadow-md scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <span>🛒 Live Orders</span>
                        {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length > 0 && (
                            <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md text-[10px] font-black">
                                {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab('products')} 
                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'products' ? 'bg-gray-900 text-white shadow-md scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <span>📦 Store Manager</span>
                    </button>
                </div>

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        {orders.length === 0 ? (
                            <div className="glass-panel p-12 flex flex-col items-center justify-center text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center text-4xl mb-4">😴</div>
                                <h3 className="text-xl font-black text-gray-800 mb-2">No Active Orders</h3>
                                <p className="text-gray-500 font-medium">Keep your shop open to receive orders.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2">
                                {orders.map((order, idx) => (
                                    <div key={order._id} className="glass-panel p-6 animate-slide-up flex flex-col" style={{ animationDelay: `${(idx * 50) + 100}ms` }}>
                                        {/* Order Header */}
                                        <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-black text-gray-900">#{order._id.slice(-6).toUpperCase()}</h3>
                                                    <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                                        {order.status.replace('_', ' ')}
                                                    </div>
                                                </div>
                                                <p className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                                    ⏱️ {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total</p>
                                                <p className="text-xl font-black text-amber-500">₹{order.totalAmount}</p>
                                            </div>
                                        </div>

                                        {/* Customer Details */}
                                        <div className="bg-gray-50/50 rounded-xl p-3 mb-4 border border-gray-100">
                                            <p className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-1">
                                                <span>👤 {order.customerId?.name || 'Guest'}</span> 
                                                <span className="text-gray-300">|</span>
                                                <span className="text-blue-600">📞 {order.customerId?.phone || 'No Number'}</span>
                                            </p>
                                            <div className="flex items-start gap-1.5 mt-2">
                                                <span className="text-gray-400 text-xs mt-0.5">📍</span>
                                                <p className="text-xs font-medium text-gray-600 leading-snug">{order.deliveryLocation?.address || 'Address missing'}</p>
                                            </div>
                                            {order.deliveryLocation?.lat && (
                                                <a href={`https://www.google.com/maps?q=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-500 hover:text-blue-600 underline mt-2 inline-block ml-4">
                                                    ↗ Open in Maps
                                                </a>
                                            )}
                                        </div>

                                        {/* Items */}
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Order Items</p>
                                            <div className="space-y-2 mb-6">
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center text-sm font-medium">
                                                        <span className="text-gray-700"><span className="text-gray-400 mr-1">{item.quantity}x</span> {item.name}</span>
                                                        <span className="text-gray-900 font-bold">₹{item.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Status Action */}
                                        <div className="mt-auto pt-4 border-t border-gray-100">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Change Status</label>
                                            <div className="relative">
                                                <select 
                                                    value={order.status} 
                                                    onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)} 
                                                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-gray-800 outline-none transition-all focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer hover:bg-gray-100"
                                                >
                                                    <option value="pending">⏳ Pending</option>
                                                    <option value="accepted">✅ Accepted</option>
                                                    <option value="preparing">🍳 Preparing</option>
                                                    <option value="out_for_delivery">🛵 Out for Delivery</option>
                                                    <option value="delivered">🎉 Delivered</option>
                                                    <option value="cancelled">❌ Cancelled</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === 'products' && (
                    <div className="space-y-8">
                        {/* Top Controls Grid */}
                        <div className="grid lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                            {/* Delivery Settings */}
                            <div className="glass-panel p-6">
                                <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2"><span className="p-1.5 bg-amber-100 rounded-lg">🛵</span> Delivery Rules</h2>
                                <form onSubmit={handleUpdateDeliverySettings} className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Min Order (₹)</label>
                                        <input type="number" required value={minCharge} onChange={e => setMinCharge(e.target.value)} className="input-field py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Free Upto (km)</label>
                                        <input type="number" step="0.1" required value={minDistance} onChange={e => setMinDistance(e.target.value)} className="input-field py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Charge/Km (₹)</label>
                                        <input type="number" required value={chargePerKm} onChange={e => setChargePerKm(e.target.value)} className="input-field py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Max Range (km)</label>
                                        <input type="number" step="0.1" required value={maxRange} onChange={e => setMaxRange(e.target.value)} className="input-field py-2" />
                                    </div>
                                    <div className="col-span-2 mt-2">
                                        <button type="submit" className="btn-primary w-full py-2">Update Rules</button>
                                    </div>
                                </form>
                            </div>

                            {/* Category Manager */}
                            <div className="glass-panel p-6">
                                <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2"><span className="p-1.5 bg-blue-100 rounded-lg">🏷️</span> Menu Categories</h2>
                                <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                                    <input type="text" placeholder="e.g. Starters, Beverages" className="input-field py-2 flex-1" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                                    <button type="submit" className="btn-secondary py-2 px-4 whitespace-nowrap">+ Add</button>
                                </form>
                                <div className="flex flex-wrap gap-2">
                                    {shop.customCategories?.length > 0 ? shop.customCategories.map((cat, idx) => (
                                        <span key={idx} className="bg-gray-100 border border-gray-200 text-gray-600 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">{cat}</span>
                                    )) : <span className="text-sm font-medium text-gray-400">No custom categories yet.</span>}
                                </div>
                            </div>
                        </div>

                        {/* Add Item Section */}
                        <div className="glass-panel p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><span className="text-2xl">✨</span> Add New Item</h2>
                                <button onClick={() => navigate('/vendor-godown')} className="btn-secondary bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 flex items-center gap-2 py-2">
                                    📦 Import from Godown
                                </button>
                            </div>

                            <form onSubmit={handleAddProduct} className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Item Name</label>
                                    <input type="text" required placeholder="e.g. Paneer Tikka" className="input-field py-2" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Category</label>
                                    <div className="relative">
                                        <select className="input-field py-2 appearance-none pr-8 cursor-pointer" value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)}>
                                            {shop.customCategories?.length > 0 ? (
                                                shop.customCategories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)
                                            ) : (
                                                <option value="General">General</option>
                                            )}
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Price (₹)</label>
                                    <input type="number" required placeholder="0" className="input-field py-2" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} />
                                </div>
                                <div className="md:col-span-1 flex flex-col gap-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-0">Photo (Optional)</label>
                                    <input id="imageInput" type="file" accept="image/*" className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 transition-colors cursor-pointer" onChange={e => setNewProductImage(e.target.files[0])} />
                                </div>
                                <div className="sm:col-span-2 md:col-span-4 mt-2">
                                    <button type="submit" className="btn-primary w-full">+ Create Menu Item</button>
                                </div>
                            </form>
                        </div>

                        {/* Menu List */}
                        <div className="glass-panel animate-slide-up" style={{ animationDelay: '300ms' }}>
                            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                                <h2 className="text-xl font-black text-gray-800">Your Menu ({products.length})</h2>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                    <input 
                                        type="text" 
                                        placeholder="Search menu..." 
                                        className="input-field py-2 pl-10 sm:w-64"
                                        value={productSearchQuery}
                                        onChange={(e) => setProductSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 bg-gray-50/30">
                                {(() => {
                                    const filtered = products.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()));
                                    const sorted = [...filtered].sort((a, b) => {
                                        if (a.inStock === b.inStock) return 0;
                                        return a.inStock ? 1 : -1;
                                    });

                                    if (sorted.length === 0) {
                                        return <div className="col-span-full py-12 text-center text-gray-400 font-bold">No items found matching your search.</div>;
                                    }

                                    return sorted.map(product => (
                                        <div key={product._id} className={`bg-white rounded-2xl p-4 border transition-all ${product.inStock ? 'border-gray-200 shadow-sm hover:shadow-md' : 'border-red-200 bg-red-50/30'} flex flex-col`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1 pr-2">
                                                    <h3 className={`font-bold text-lg leading-tight mb-1 ${product.inStock ? 'text-gray-900' : 'text-gray-500'}`}>{product.name}</h3>
                                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{product.category}</span>
                                                </div>
                                                <p className={`font-black text-lg ${product.inStock ? 'text-amber-500' : 'text-gray-400'}`}>₹{product.price}</p>
                                            </div>
                                            
                                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                                                <button 
                                                    onClick={() => handleToggleStock(product._id, product.inStock)} 
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${product.inStock ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-red-500 text-white border-red-600 hover:bg-red-600 shadow-sm'}`}
                                                >
                                                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteProduct(product._id)} 
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                                                    title="Delete Item"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default VendorDashboard;
