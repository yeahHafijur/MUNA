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

    if (!shop) return <div className="vendordashboard-style-1">Loading Dashboard...</div>;

    return (
        <div className="vendordashboard-style-2">
            {/* Header */}
            <div className="vendordashboard-style-3">
                {shop.image && (
                    <div className="vendordashboard-style-4">
                        <img src={shop.image} alt="Shop Banner" className="vendordashboard-style-5" />
                    </div>
                )}
                <div className="vendordashboard-style-6">
                    <div className="vendordashboard-style-7">
                        <h1 className="vendordashboard-style-8">{shop.name}</h1>
                        {shop.udyamNumber && (
                            <span className="vendordashboard-style-9">
                                🛡️ Verified Udyam
                            </span>
                        )}
                    </div>
                    <p className="vendordashboard-style-10">{shop.address}</p>
                    
                    <div className="vendordashboard-style-11">
                        <button 
                            onClick={handleToggleShopStatus}
                            disabled={autoScheduleEnabled}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${shop.isOpen ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'} ${autoScheduleEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {shop.isOpen ? '🟢 Shop is Open' : '🔴 Shop is Closed'}
                        </button>

                        <label className="vendordashboard-style-12">
                            {uploadingImage ? '⏳ Uploading...' : '🖼️ Change Banner'}
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="vendordashboard-style-13" 
                                onChange={handleUpdateShopImage} 
                                disabled={uploadingImage}
                            />
                        </label>
                        <button 
                            onClick={handleEnableNotifications}
                            className="vendordashboard-style-14"
                        >
                            🔔 Enable Push Alerts
                        </button>
                    </div>

                    {/* Schedule Settings Panel */}
                    <div className="vendordashboard-schedule-panel mt-4 bg-white/5 p-4 rounded-xl border border-white/10 text-white w-full">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-sm">⏰ Auto Open/Close Settings</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={autoScheduleEnabled} 
                                    onChange={(e) => setAutoScheduleEnabled(e.target.checked)} 
                                />
                                <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#f8cb46]"></div>
                            </label>
                        </div>
                        {autoScheduleEnabled && (
                            <div className="flex flex-col gap-3 mt-2 animate-fade-in">
                                <div className="flex gap-3">
                                    <div className="flex flex-col flex-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Open Time</label>
                                        <input type="time" className="bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:border-[#f8cb46] outline-none" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Close Time</label>
                                        <input type="time" className="bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:border-[#f8cb46] outline-none" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
                                    </div>
                                </div>
                                <button className="bg-[#f8cb46] text-black font-bold py-2 rounded-lg text-sm mt-1 hover:bg-[#e0b431] transition-colors" onClick={handleUpdateSchedule}>Save Schedule</button>
                                <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                                    ℹ️ Manual toggle is overridden. Shop will automatically open and close daily at these times.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="vendordashboard-style-15">
                    <span className="vendordashboard-style-16">Vendor Mode</span>
                    <button onClick={() => { logout(); navigate('/'); }} className="vendordashboard-style-17">Logout</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="vendordashboard-style-18">
                <button onClick={() => setActiveTab('orders')} className={`flex-1 py-3 rounded-lg font-bold transition-colors ${activeTab === 'orders' ? 'bg-[#f8cb46] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>Live Orders ({orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length})</button>
                <button onClick={() => setActiveTab('products')} className={`flex-1 py-3 rounded-lg font-bold transition-colors ${activeTab === 'products' ? 'bg-[#f8cb46] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>Manage Menu</button>
            </div>

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
                <div className="vendordashboard-style-19">
                    {orders.length === 0 ? <div className="vendordashboard-style-20"><span className="vendordashboard-style-21">😴</span><p className="vendordashboard-style-22">No orders yet.</p></div> :
                        orders.map(order => (
                            <div key={order._id} className="vendordashboard-style-23">
                                <div className="vendordashboard-style-24">
                                    <div className="vendordashboard-style-25">
                                        <h3 className="vendordashboard-style-26">#{order._id.slice(-6).toUpperCase()}</h3>
                                        <span className="vendordashboard-style-27">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    
                                    <div className="vendordashboard-style-28">
                                        <p className="vendordashboard-style-29">
                                            <span>👤 {order.customerId?.name || 'New Customer'}</span> 
                                            <span className="vendordashboard-style-30">|</span>
                                            <span className="vendordashboard-style-31">📞 {order.customerId?.phone || 'No Number'}</span>
                                        </p>
                                    </div>

                                    <div className="vendordashboard-style-32">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="vendordashboard-style-33">
                                                <span className="vendordashboard-style-34">{item.quantity} x {item.name}</span>
                                                <span className="vendordashboard-style-35">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                        <div className="vendordashboard-style-36">
                                            <span>Total Amount</span>
                                            <span className="vendordashboard-style-37">₹{order.totalAmount}</span>
                                        </div>
                                    </div>

                                    <div className="vendordashboard-style-38">
                                        <span className="vendordashboard-style-39">📍</span>
                                        <p className="vendordashboard-style-40">{order.deliveryLocation?.address || 'Address missing'}</p>
                                        {order.deliveryLocation?.lat && order.deliveryLocation?.lng && (
                                            <a 
                                                href={`https://www.google.com/maps?q=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="vendordashboard-style-41"
                                            >
                                                Map
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="vendordashboard-style-42">
                                    <div className="vendordashboard-style-43">
                                        <label className="vendordashboard-style-44">Update Status</label>
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
                                    <div className="vendordashboard-style-45">
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
                <div className="vendordashboard-style-46">
                    {/* Delivery Settings */}
                    <div className="vendordashboard-style-47">
                        <h2 className="vendordashboard-style-48"><span>🛵</span> Delivery Charges Settings</h2>
                        <form onSubmit={handleUpdateDeliverySettings} className="vendordashboard-style-49">
                            <div>
                                <label className="vendordashboard-style-50">Minimum Charge (₹)</label>
                                <input type="number" required value={minCharge} onChange={e => setMinCharge(e.target.value)} className="vendordashboard-style-51" />
                            </div>
                            <div>
                                <label className="vendordashboard-style-52">Minimum Distance (km)</label>
                                <input type="number" step="0.1" required value={minDistance} onChange={e => setMinDistance(e.target.value)} className="vendordashboard-style-53" />
                            </div>
                            <div>
                                <label className="vendordashboard-style-54">Extra Charge Per Km (₹)</label>
                                <input type="number" required value={chargePerKm} onChange={e => setChargePerKm(e.target.value)} className="vendordashboard-style-55" />
                            </div>
                            <div>
                                <label className="vendordashboard-style-56">Max Delivery Range (km)</label>
                                <input type="number" step="0.1" required value={maxRange} onChange={e => setMaxRange(e.target.value)} className="vendordashboard-style-57" />
                            </div>
                            <div className="vendordashboard-style-58">
                                <button type="submit" className="vendordashboard-style-59">
                                    Save Settings
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Category Manager */}
                    <div className="vendordashboard-style-60">
                        <h2 className="vendordashboard-style-61">Manage Categories</h2>
                        <form onSubmit={handleAddCategory} className="vendordashboard-style-62">
                            <input type="text" placeholder="New Category (e.g. Starters)" className="vendordashboard-style-63" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                            <button type="submit" className="vendordashboard-style-64">+ Add Category</button>
                        </form>
                        <div className="vendordashboard-style-65">
                            {shop.customCategories?.length > 0 ? shop.customCategories.map((cat, idx) => (
                                <span key={idx} className="vendordashboard-style-66">{cat}</span>
                            )) : <span className="vendordashboard-style-67">No custom categories yet.</span>}
                        </div>
                    </div>

                    {/* Godown and Add Product Section */}
                    <div className="vendordashboard-style-68">
                        <div className="vendordashboard-style-69">
                            <h2 className="vendordashboard-style-70">Want to add items quickly?</h2>
                            <button 
                                onClick={() => navigate('/vendor-godown')}
                                className="vendordashboard-style-71"
                            >
                                <span className="vendordashboard-style-72">📦</span> Select from Master Godown
                            </button>
                        </div>

                        <div className="vendordashboard-style-73">
                            <h3 className="vendordashboard-style-74">Or Add Custom Item</h3>
                            <form onSubmit={handleAddProduct} className="vendordashboard-style-75">
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Item Name (e.g. Special Kulfi)" 
                                    className="vendordashboard-style-76" 
                                    value={newProductName} 
                                    onChange={e => setNewProductName(e.target.value)} 
                                />
                                
                                <select className="vendordashboard-style-77" value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)}>
                                    {shop.customCategories?.length > 0 ? (
                                        shop.customCategories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)
                                    ) : (
                                        <option value="General">General</option>
                                    )}
                                </select>

                                <input type="number" required placeholder="Price (₹)" className="vendordashboard-style-78" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} />
                                
                                <input id="imageInput" type="file" accept="image/*" className="vendordashboard-style-79" onChange={e => setNewProductImage(e.target.files[0])} />

                                <button type="submit" className="vendordashboard-style-80">
                                    + Create
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Products List with Search and Sort */}
                    <div className="vendordashboard-style-81">
                        <div className="vendordashboard-style-82">
                            <h2 className="vendordashboard-style-83">Your Menu Items</h2>
                            <div className="vendordashboard-style-84">
                                <span className="vendordashboard-style-85">🔍</span>
                                <input 
                                    type="text" 
                                    placeholder="Search products..." 
                                    className="vendordashboard-style-86"
                                    value={productSearchQuery}
                                    onChange={(e) => setProductSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="vendordashboard-style-87">
                            {(() => {
                                // Filter based on search query
                                const filtered = products.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()));
                                // Sort: Out of stock first
                                const sorted = [...filtered].sort((a, b) => {
                                    if (a.inStock === b.inStock) return 0;
                                    return a.inStock ? 1 : -1;
                                });

                                if (sorted.length === 0) {
                                    return <p className="vendordashboard-style-88">No products found.</p>;
                                }

                                return sorted.map(product => (
                                    <div key={product._id} className={`bg-white p-4 rounded-xl shadow-sm border ${product.inStock ? 'border-gray-200' : 'border-red-300 bg-red-50/50 relative'} flex justify-between items-center`}>
                                        {!product.inStock && (
                                            <span className="vendordashboard-style-89">
                                                EMPTY
                                            </span>
                                        )}
                                        <div>
                                            <h3 className={`font-bold ${product.inStock ? 'text-gray-800' : 'text-gray-600'}`}>{product.name}</h3>
                                            <p className={`font-black ${product.inStock ? 'text-green-600' : 'text-gray-400'}`}>₹{product.price}</p>
                                        </div>
                                        <div className="vendordashboard-style-90">
                                            <button onClick={() => handleToggleStock(product._id, product.inStock)} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${product.inStock ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-500 text-white shadow-sm hover:bg-red-600'}`}>
                                                {product.inStock ? 'IN STOCK' : 'MARK IN STOCK'}
                                            </button>
                                            <button onClick={() => handleDeleteProduct(product._id)} className="vendordashboard-style-91">🗑️</button>
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
