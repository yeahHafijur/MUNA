import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './VendorDashboard.css';

/* ─── Utility: convert base64 to Uint8Array (push notifications) ─── */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
}

/* ─── Icon Components ─── */
const IconBack = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);
const IconLogout = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);
const IconBell = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);
const IconSearch = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const IconTrash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

/* ─── Status pill helper ─── */
const StatusPill = ({ status }) => {
    const cls = `vnd-status-pill vnd-pill--${status.replace(' ', '_')}`;
    const labels = {
        pending: '⏳ Pending',
        accepted: '✅ Accepted',
        preparing: '🔥 Preparing',
        out_for_delivery: '🛵 On the Way',
        delivered: '🎉 Delivered',
        cancelled: '❌ Cancelled',
    };
    return <span className={cls}>{labels[status] || status}</span>;
};

/* ─── Toggle Switch ─── */
const Toggle = ({ checked, onChange }) => (
    <label className="vnd-toggle">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="vnd-toggle-track">
            <span className="vnd-toggle-thumb" />
        </span>
    </label>
);

/* ═══════════════════════════════════════════════════════════
   VENDOR DASHBOARD COMPONENT
═══════════════════════════════════════════════════════════ */
const VendorDashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [shop, setShop] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('orders');
    const prevOrderCountRef = useRef(0);

    /* Add-product form */
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductImage, setNewProductImage] = useState(null);
    const [newProductCategory, setNewProductCategory] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [productUploadProgress, setProductUploadProgress] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    /* Delivery settings */
    const [minCharge, setMinCharge] = useState(10);
    const [minDistance, setMinDistance] = useState(2);
    const [chargePerKm, setChargePerKm] = useState(5);
    const [maxRange, setMaxRange] = useState(5);

    /* Auto-schedule */
    const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);
    const [openTime, setOpenTime] = useState('09:00');
    const [closeTime, setCloseTime] = useState('21:00');

    /* Shop image */
    const [uploadingImage, setUploadingImage] = useState(false);
    const [bannerUploadProgress, setBannerUploadProgress] = useState(0);

    /* ── Edit Product ── */
    const [editingProduct, setEditingProduct] = useState(null);
    const [editProductName, setEditProductName] = useState('');
    const [editProductPrice, setEditProductPrice] = useState('');
    const [editProductCategory, setEditProductCategory] = useState('');
    const [editProductImage, setEditProductImage] = useState(null);
    const [editProductUploading, setEditProductUploading] = useState(false);

    /* ── Manage Categories ── */
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatImage, setNewCatImage] = useState(null);
    const [catUploading, setCatUploading] = useState(false);

    /* ── Initial data load ── */
    useEffect(() => {
        if (!token || user?.role !== 'vendor') { navigate('/'); return; }

        fetch('/api/shops/my-shop', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
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
                    fetchOrders(true);
                    fetchProducts(shopData._id);
                }
            });
    }, [token, user, navigate]);

    /* ── Polling (10 s) ── */
    useEffect(() => {
        if (!shop || !token) return;
        const id = setInterval(() => fetchOrders(false), 10000);
        return () => clearInterval(id);
    }, [shop, token]);

    /* ── Notification sound ── */
    const playNotificationSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const play = (freq, start, dur) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                gain.gain.setValueAtTime(0, ctx.currentTime + start);
                gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + start + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + start);
                osc.stop(ctx.currentTime + start + dur);
            };
            play(880, 0, 0.4);
            play(1108.73, 0.15, 0.6);
        } catch { /* ignore */ }
    };



    /* ── Fetch orders ── */
    const fetchOrders = (isInitial = false) => {
        fetch('/api/orders/vendor', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                if (!Array.isArray(data)) return;
                const liveCount = data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
                if (!isInitial && liveCount > prevOrderCountRef.current) {
                    playNotificationSound();
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('New Order Received! 🛒', {
                            body: 'A new order just arrived at your shop.',
                            icon: '/vite.svg',
                        });
                    }
                }
                prevOrderCountRef.current = liveCount;
                setOrders(data);
            });
            
        // Also fetch unread count
        fetch('/api/notifications/unread-count', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { if (data.count !== undefined) setUnreadCount(data.count); })
            .catch(() => {});
    };

    /* ── Fetch products ── */
    const fetchProducts = (shopId) => {
        fetch(`/api/products/${shopId}`)
            .then(r => r.json())
            .then(data => setProducts(Array.isArray(data) ? data : []));
    };

    /* ── CRUD handlers ── */
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus }),
        });
        fetchOrders();
    };

    const handleToggleStock = async (productId, current) => {
        await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ inStock: !current }),
        });
        fetchProducts(shop._id);
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Delete this item from your menu?')) return;
        await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchProducts(shop._id);
    };

    const handleAddProduct = (e) => {
        e.preventDefault();
        if (isAddingItem) return;
        setIsAddingItem(true);
        setProductUploadProgress(0);
        const formData = new FormData();
        formData.append('name', newProductName);
        formData.append('price', Number(newProductPrice));
        formData.append('category', newProductCategory || (shop.customCategories?.[0] || 'General'));
        if (newProductImage) formData.append('image', newProductImage);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/products', true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProductUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            setIsAddingItem(false);
            if (xhr.status >= 200 && xhr.status < 300) {
                setNewProductName('');
                setNewProductPrice('');
                setNewProductImage(null);
                setNewProductCategory('');
                const inp = document.getElementById('vnd-img-input');
                if (inp) inp.value = '';
                fetchProducts(shop._id);
                setTimeout(() => setProductUploadProgress(0), 1000);
            } else {
                try {
                    const d = JSON.parse(xhr.responseText);
                    alert(d.message || 'Failed to add item');
                } catch { alert('Failed to add item'); }
                setProductUploadProgress(0);
            }
        };
        xhr.onerror = () => {
            setIsAddingItem(false);
            setProductUploadProgress(0);
            alert('Error adding item. Check your connection.');
        };
        xhr.send(formData);
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        const updated = [...(shop.customCategories || []), newCategory.trim()];
        const res = await fetch(`/api/shops/${shop._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ customCategories: updated }),
        });
        setShop(await res.json());
        setNewCategory('');
    };

    const handleToggleShopStatus = async () => {
        const res = await fetch(`/api/shops/${shop._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ isOpen: !shop.isOpen }),
        });
        setShop(await res.json());
    };

    const handleUpdateDeliverySettings = async (e) => {
        e.preventDefault();
        const res = await fetch(`/api/shops/${shop._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                deliverySettings: {
                    minimumCharge: Number(minCharge),
                    minimumDistance: Number(minDistance),
                    chargePerKm: Number(chargePerKm),
                    maxRange: Number(maxRange),
                },
            }),
        });
        if (res.ok) { setShop(await res.json()); alert('Delivery settings saved!'); }
        else alert('Failed to save delivery settings.');
    };

    const handleUpdateSchedule = async (e) => {
        if (e) e.preventDefault();
        const res = await fetch(`/api/shops/${shop._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ autoSchedule: { enabled: autoScheduleEnabled, openTime, closeTime } }),
        });
        const updated = await res.json();
        if (res.ok) { setShop(updated); alert('Schedule updated!'); }
        else alert(updated.message || 'Failed to update schedule.');
    };

    const handleUpdateShopImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingImage(true);
        setBannerUploadProgress(0);
        const fd = new FormData();
        fd.append('image', file);

        const xhr = new XMLHttpRequest();
        xhr.open('PUT', `/api/shops/${shop._id}/image`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) setBannerUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        };
        xhr.onload = () => {
            setUploadingImage(false);
            e.target.value = null;
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    setShop(JSON.parse(xhr.responseText));
                    alert('Shop banner updated!');
                } catch { alert('Shop banner updated!'); }
            } else {
                try {
                    const updated = JSON.parse(xhr.responseText);
                    alert(updated.message || 'Failed to update banner.');
                } catch { alert('Failed to update banner.'); }
            }
            setTimeout(() => setBannerUploadProgress(0), 1000);
        };
        xhr.onerror = () => {
            setUploadingImage(false);
            e.target.value = null;
            setBannerUploadProgress(0);
        };
        xhr.send(fd);
    };

    /* ── Edit Product Handlers ── */
    const openEditProductModal = (product) => {
        setEditingProduct(product);
        setEditProductName(product.name);
        setEditProductPrice(product.price);
        setEditProductCategory(product.category);
        setEditProductImage(null); // Keep null unless they upload a new one
        setEditProductUploading(false);
    };

    const handleEditProductImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditProductImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProductEdit = async (e) => {
        e.preventDefault();
        setEditProductUploading(true);
        try {
            const payload = {
                name: editProductName,
                price: Number(editProductPrice),
                category: editProductCategory,
            };
            if (editProductImage) payload.image = editProductImage;

            const res = await fetch(`/api/products/${editingProduct._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const updatedProduct = await res.json();
                setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
                setEditingProduct(null);
                alert("Product updated successfully!");
            } else {
                alert("Failed to update product.");
            }
        } catch (error) {
            alert("Error updating product.");
        } finally {
            setEditProductUploading(false);
        }
    };

    /* ── Manage Custom Categories Handlers ── */
    const handleAddCustomCategory = async (e) => {
        e.preventDefault();
        if (!newCatName || !newCatImage) return alert("Please provide a name and an image.");
        setCatUploading(true);
        
        try {
            const existingCategories = shop.categoriesConfig || [];
            if (existingCategories.some(c => c.name.toLowerCase() === newCatName.toLowerCase())) {
                setCatUploading(false);
                return alert("A category with this name already exists.");
            }

            const updatedConfig = [...existingCategories, { name: newCatName, image: newCatImage }];

            const res = await fetch(`/api/shops/${shop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ categoriesConfig: updatedConfig })
            });

            if (res.ok) {
                const updatedShop = await res.json();
                setShop(updatedShop);
                setNewCatName('');
                setNewCatImage(null);
                alert("Custom category added!");
            } else {
                alert("Failed to add category.");
            }
        } catch (error) {
            alert("Error adding category.");
        } finally {
            setCatUploading(false);
        }
    };

    const handleDeleteCustomCategory = async (catName) => {
        if (!window.confirm(`Delete custom logo for ${catName}?`)) return;
        
        try {
            const existingCategories = shop.categoriesConfig || [];
            const updatedConfig = existingCategories.filter(c => c.name !== catName);

            const res = await fetch(`/api/shops/${shop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ categoriesConfig: updatedConfig })
            });

            if (res.ok) {
                setShop(await res.json());
            } else {
                alert("Failed to delete category.");
            }
        } catch (error) {
            alert("Error deleting category.");
        }
    };

    /* ── Computed ── */
    const liveOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    const completedOrders = orders.filter(o => o.status === 'delivered');
    const revenue = completedOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

    /* ── Filtered & sorted products ── */
    const filteredProducts = [...products]
        .filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
        .sort((a, b) => {
            if (a.inStock === b.inStock) return 0;
            return a.inStock ? 1 : -1; // OOS first
        });

    /* ── Loading screen ── */
    if (!shop) return (
        <div className="vnd-loading">
            <div className="vnd-loading-logo">M</div>
            <div className="vnd-loading-spinner" />
            <p className="vnd-loading-text">Loading your dashboard…</p>
        </div>
    );

    return (
        <div className="vnd-root">

            {/* ════════ HEADER ════════ */}
            <header className="vnd-header">
                <div className="vnd-header-left">
                    <button onClick={() => navigate('/')} className="vnd-icon-btn" title="Back to Home" style={{marginRight: '8px', color: '#1a0e00'}}>
                        <IconBack />
                    </button>
                    {/* Shop avatar (click to change image) */}
                    <label className="vnd-shop-avatar" title="Change shop image">
                        {shop.image
                            ? <img src={shop.image} alt={shop.name} />
                            : <span className="vnd-shop-avatar-ph">🏪</span>
                        }
                        <span className="vnd-shop-avatar-overlay">
                            {uploadingImage ? '…' : '📷'}
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            style={{ display: 'none' }}
                            onChange={handleUpdateShopImage}
                            disabled={uploadingImage}
                        />
                    </label>

                    <div className="vnd-shop-info">
                        <div className="vnd-shop-name">
                            {shop.name}
                            {shop.udyamNumber && (
                                <span className="vnd-verified-badge">✓ Verified</span>
                            )}
                        </div>
                        <div className="vnd-shop-address">{shop.address}</div>
                    </div>
                </div>

                <div className="vnd-header-right">
                    {/* Open / Closed toggle */}
                    <button
                        id="vnd-shop-status-btn"
                        onClick={handleToggleShopStatus}
                        className={`vnd-status-btn ${shop.isOpen ? 'vnd-status-btn--open' : 'vnd-status-btn--closed'}`}
                    >
                        <span className={`vnd-status-dot ${shop.isOpen ? 'vnd-status-dot--open' : 'vnd-status-dot--closed'}`} />
                        <span>{shop.isOpen ? 'Open' : 'Closed'}</span>
                    </button>

                    {/* Bell (notifications) */}
                    <button
                        id="vnd-notify-btn"
                        className="vnd-icon-btn"
                        title="Notifications"
                        onClick={() => navigate('/notifications')}
                        style={{ position: 'relative' }}
                    >
                        <IconBell />
                        {unreadCount > 0 && (
                            <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white', fontSize: '10px', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid white' }}>{unreadCount}</span>
                        )}
                    </button>

                    <div className="vnd-divider" />

                    {/* Shopping Profile */}
                    <button
                        className="vnd-icon-btn"
                        title="My Shopping Profile"
                        onClick={() => navigate('/profile')}
                    >
                        🛍️
                    </button>

                    {/* User info + logout */}
                    <span className="vnd-username">
                        {user.name}
                    </span>
                    <button
                        id="vnd-logout-btn"
                        className="vnd-icon-btn vnd-icon-btn--danger"
                        title="Sign out"
                        onClick={() => { logout(); navigate('/'); }}
                    >
                        <IconLogout />
                    </button>
                </div>
            </header>

            {/* ════════ TAB BAR ════════ */}
            <nav className="vnd-tabbar">
                <button
                    id="vnd-tab-orders"
                    className={`vnd-tab ${activeTab === 'orders' ? 'vnd-tab--active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    📋 Live Orders
                    {liveOrders.length > 0 && (
                        <span className="vnd-tab-badge">{liveOrders.length}</span>
                    )}
                </button>

                <button
                    id="vnd-tab-store"
                    className={`vnd-tab ${activeTab === 'store' ? 'vnd-tab--active' : ''}`}
                    onClick={() => setActiveTab('store')}
                >
                    🏪 Store Management
                </button>

                <button
                    id="vnd-tab-settings"
                    className={`vnd-tab ${activeTab === 'settings' ? 'vnd-tab--active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Settings
                </button>
            </nav>

            {/* ════════ BODY ════════ */}
            <div className="vnd-body">

                {/* ─── ORDERS TAB ─── */}
                {activeTab === 'orders' && (
                    <div className="vnd-tab-panel">
                        {/* Stats Row */}
                        <div className="vnd-stats-row">
                            <div className="vnd-stat-card">
                                <div className="vnd-stat-num">{liveOrders.length}</div>
                                <div className="vnd-stat-label">Live Orders</div>
                                <div className="vnd-stat-icon">📋</div>
                            </div>
                            <div className="vnd-stat-card">
                                <div className="vnd-stat-num vnd-stat-num--green">{completedOrders.length}</div>
                                <div className="vnd-stat-label">Delivered</div>
                                <div className="vnd-stat-icon">✅</div>
                            </div>
                            <div className="vnd-stat-card">
                                <div className="vnd-stat-num">₹{revenue}</div>
                                <div className="vnd-stat-label">Revenue</div>
                                <div className="vnd-stat-icon">💰</div>
                            </div>
                        </div>

                        {/* Live Orders Section - KANBAN */}
                        {(() => {
                            const pendingOrders = liveOrders.filter(o => o.status === 'pending');
                            const processingOrders = liveOrders.filter(o => ['accepted', 'preparing'].includes(o.status));
                            const dispatchOrders = liveOrders.filter(o => o.status === 'out_for_delivery');

                            const renderKanbanCard = (order) => (
                                <div key={order._id} className={`vnd-kanban-card ${order.status === 'pending' ? 'new' : ''}`}>
                                    <div className="vnd-kcard-header">
                                        <span className="vnd-kcard-id">#{order._id.slice(-5).toUpperCase()}</span>
                                        <span className="vnd-kcard-amount">₹{order.totalAmount}</span>
                                    </div>
                                    <div className="vnd-kcard-customer">
                                        <div style={{fontWeight: '600', color: '#1e293b'}}>{order.customerId?.name || "Guest Customer"}</div>
                                        <div style={{fontSize: '12px', color: '#64748b'}}>📞 {order.customerId?.phone || 'N/A'}</div>
                                    </div>
                                    <div className="vnd-kcard-items">
                                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                    </div>
                                    {order.deliveryLocation?.address && (
                                        <div className="vnd-kcard-address">
                                            📍 {order.deliveryLocation.address}
                                        </div>
                                    )}
                                    <div className="vnd-kcard-actions">
                                        {order.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleUpdateOrderStatus(order._id, 'accepted')} className="vnd-btn vnd-btn-primary" style={{flex: 1}}>Accept</button>
                                                <button onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')} className="vnd-btn vnd-btn-danger">Reject</button>
                                            </>
                                        )}
                                        {order.status === 'accepted' && (
                                            <button onClick={() => handleUpdateOrderStatus(order._id, 'preparing')} className="vnd-btn vnd-btn-secondary" style={{width: '100%'}}>Start Preparing</button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button onClick={() => handleUpdateOrderStatus(order._id, 'out_for_delivery')} className="vnd-btn vnd-btn-primary" style={{width: '100%'}}>Dispatch Order</button>
                                        )}
                                        {order.status === 'out_for_delivery' && (
                                            <button onClick={() => handleUpdateOrderStatus(order._id, 'delivered')} className="vnd-btn vnd-btn-success" style={{width: '100%'}}>Mark Delivered</button>
                                        )}
                                    </div>
                                </div>
                            );

                            return (
                                <div className="vnd-kanban-board">
                                    {/* Column 1: NEW */}
                                    <div className="vnd-kanban-col" style={{borderTop: '4px solid #f59e0b'}}>
                                        <div className="vnd-kcol-head">
                                            <h3 style={{color: '#d97706'}}>New Orders</h3>
                                            <span>{pendingOrders.length}</span>
                                        </div>
                                        <div className="vnd-kcol-body">
                                            {pendingOrders.length === 0 && <div className="vnd-kcol-empty">No new orders</div>}
                                            {pendingOrders.map(renderKanbanCard)}
                                        </div>
                                    </div>

                                    {/* Column 2: PROCESSING */}
                                    <div className="vnd-kanban-col" style={{borderTop: '4px solid #3b82f6'}}>
                                        <div className="vnd-kcol-head">
                                            <h3 style={{color: '#2563eb'}}>Processing</h3>
                                            <span>{processingOrders.length}</span>
                                        </div>
                                        <div className="vnd-kcol-body">
                                            {processingOrders.length === 0 && <div className="vnd-kcol-empty">No active processing</div>}
                                            {processingOrders.map(renderKanbanCard)}
                                        </div>
                                    </div>

                                    {/* Column 3: OUT FOR DELIVERY */}
                                    <div className="vnd-kanban-col" style={{borderTop: '4px solid #10b981'}}>
                                        <div className="vnd-kcol-head">
                                            <h3 style={{color: '#059669'}}>On The Way</h3>
                                            <span>{dispatchOrders.length}</span>
                                        </div>
                                        <div className="vnd-kcol-body">
                                            {dispatchOrders.length === 0 && <div className="vnd-kcol-empty">No orders in transit</div>}
                                            {dispatchOrders.map(renderKanbanCard)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Past Orders Section */}
                        <div className="vnd-section-card" style={{marginTop: "24px"}}>
                            <div className="vnd-section-head">
                                <div className="vnd-section-title">
                                    <span className="vnd-section-title-icon">📦</span>
                                    Past Orders
                                </div>
                            </div>
                            <div className="vnd-section-body" style={{padding: 0}}>
                                {orders.filter(o => o.status === 'delivered' || o.status === 'cancelled').length === 0 ? (
                                    <div style={{padding: "32px", textAlign: "center", color: "#64748b"}}>No past orders.</div>
                                ) : (
                                    <div className="vnd-order-list">
                                        {orders.filter(o => o.status === 'delivered' || o.status === 'cancelled').map(order => (
                                            <div
                                                key={order._id}
                                                className={`vnd-order-list-item ${expandedOrderId === order._id ? 'expanded' : ''}`}
                                                style={{ borderBottom: '1px solid #e2e8f0', background: expandedOrderId === order._id ? '#f8fafc' : 'white', transition: 'background 0.2s', opacity: 0.8 }}
                                            >
                                                {/* Single Line Header */}
                                                <div 
                                                    className="vnd-order-list-header" 
                                                    onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                                                    style={{ display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer', gap: '16px' }}
                                                >
                                                    <div style={{fontWeight: "600", width: '80px', color: '#1e293b'}}>#{order._id.slice(-6).toUpperCase()}</div>
                                                    <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                                                        <div style={{fontWeight: "600", color: "#1e293b"}}>{order.customerId?.name || "Guest Customer"}</div>
                                                        <div style={{fontSize: "12px", color: "#64748b"}}>
                                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {' · '}
                                                            {new Date(order.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                                        </div>
                                                    </div>
                                                    <div style={{width: '140px', display: 'flex', justifyContent: 'center'}}>
                                                         <StatusPill status={order.status} />
                                                    </div>
                                                    <div style={{fontWeight: "600", width: '80px', textAlign: 'right', color: '#0f172a'}}>
                                                        ₹{order.totalAmount}
                                                    </div>
                                                    <div style={{color: "#94a3b8", marginLeft: "8px", width: '24px', textAlign: 'center'}}>
                                                        {expandedOrderId === order._id ? "▲" : "▼"}
                                                    </div>
                                                </div>

                                                {/* Expanded Body */}
                                                {expandedOrderId === order._id && (
                                                    <div className="vnd-order-list-body" style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                                        <div style={{flex: '1 1 300px'}}>
                                                            {/* Customer */}
                                                            <div style={{marginBottom: '16px'}}>
                                                                <div style={{fontWeight: '600', color: '#1e293b', marginBottom: '4px'}}>Customer Details</div>
                                                                <div className="vnd-customer-name">{order.customerId?.name || 'Guest Customer'}</div>
                                                                <div className="vnd-customer-phone">📞 {order.customerId?.phone || 'N/A'}</div>
                                                            </div>

                                                            {/* Delivery address */}
                                                            <div>
                                                                <div style={{fontWeight: '600', color: '#1e293b', marginBottom: '4px'}}>Delivery Address</div>
                                                                <div className="vnd-delivery-addr">
                                                                    📍 {order.deliveryLocation?.address || 'Address not provided'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{flex: '1 1 300px'}}>
                                                            <div style={{fontWeight: '600', color: '#1e293b', marginBottom: '8px'}}>Order Items</div>
                                                            {/* Items */}
                                                            <div className="vnd-items-list" style={{maxHeight: '200px', overflowY: 'auto', paddingRight: '8px'}}>
                                                                {order.items.map((item, i) => (
                                                                    <div key={i} className="vnd-item-row" style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0'}}>
                                                                        <span className="vnd-item-name" style={{display: 'flex', gap: '8px'}}>
                                                                            <span className="vnd-item-qty" style={{fontWeight: '600', color: '#6366f1'}}>{item.quantity}×</span>
                                                                            {item.name}
                                                                        </span>
                                                                        <span className="vnd-item-price" style={{fontWeight: '500', color: '#0f172a'}}>₹{item.price * item.quantity}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STORE MANAGEMENT TAB ─── */}
                {activeTab === 'store' && (
                    <div className="vnd-tab-panel">

                        {/* ── Add Item ── */}
                        <div className="vnd-section-card">
                            <div className="vnd-section-head">
                                <div className="vnd-section-title">
                                    <span className="vnd-section-title-icon">➕</span>
                                    Add New Item
                                </div>
                                <button
                                    id="vnd-godown-btn"
                                    onClick={() => navigate('/vendor-godown')}
                                    className="vnd-btn vnd-btn--godown vnd-btn-sm"
                                >
                                    📦 Import from Godown
                                </button>
                            </div>
                            <div className="vnd-section-body">
                                <form onSubmit={handleAddProduct} className="vnd-add-form-grid">
                                    <div>
                                        <label className="vnd-label">Item Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Paneer Tikka"
                                            className="vnd-input"
                                            value={newProductName}
                                            onChange={e => setNewProductName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="vnd-label">Category</label>
                                        <select
                                            className="vnd-select"
                                            value={newProductCategory}
                                            onChange={e => setNewProductCategory(e.target.value)}
                                        >
                                            {shop.customCategories?.length > 0
                                                ? shop.customCategories.map((c, i) => <option key={i} value={c}>{c}</option>)
                                                : <option value="General">General</option>
                                            }
                                        </select>
                                    </div>
                                    <div>
                                        <label className="vnd-label">Price (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="0"
                                            className="vnd-input"
                                            value={newProductPrice}
                                            onChange={e => setNewProductPrice(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="vnd-label">Photo</label>
                                        <input
                                            id="vnd-img-input"
                                            type="file"
                                            accept="image/*"
                                            className="vnd-input"
                                            onChange={e => setNewProductImage(e.target.files[0])}
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                                        <button 
                                            type="submit" 
                                            id="vnd-add-item-btn" 
                                            className={`vnd-btn vnd-btn--primary vnd-btn-full ${isAddingItem ? 'opacity-75 cursor-not-allowed' : ''}`}
                                            disabled={isAddingItem}
                                        >
                                            {isAddingItem ? (
                                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                    <span className="vnd-loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                                                    Adding...
                                                </span>
                                            ) : '+ Create Item'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* ── Category Manager ── */}
                        <div className="vnd-section-card">
                            <div className="vnd-section-head">
                                <div className="vnd-section-title">
                                    <span className="vnd-section-title-icon">🏷️</span>
                                    Menu Categories
                                </div>
                            </div>
                            <div className="vnd-section-body">
                                <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 10 }}>
                                    <input
                                        type="text"
                                        placeholder="e.g. Starters, Drinks…"
                                        className="vnd-input"
                                        style={{ flex: 1 }}
                                        value={newCategory}
                                        onChange={e => setNewCategory(e.target.value)}
                                    />
                                    <button type="submit" id="vnd-add-cat-btn" className="vnd-btn vnd-btn--ghost" style={{ flexShrink: 0 }}>
                                        + Add
                                    </button>
                                </form>
                                <div className="vnd-cat-wrap">
                                    {shop.customCategories?.length > 0
                                        ? shop.customCategories.map((cat, i) => (
                                            <span key={i} className="vnd-cat-pill">🏷 {cat}</span>
                                        ))
                                        : <span style={{ fontSize: 12, color: '#3f4a5c' }}>No categories added yet.</span>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* ── Menu List ── */}
                        <div className="vnd-section-card">
                            <div className="vnd-table-toolbar">
                                <div>
                                    <span className="vnd-table-toolbar-title">Menu Items</span>
                                    <span className="vnd-table-count">{products.length}</span>
                                </div>
                                <div className="vnd-search-wrap">
                                    <span className="vnd-search-icon"><IconSearch /></span>
                                    <input
                                        type="text"
                                        placeholder="Search items…"
                                        className="vnd-search-input"
                                        value={productSearchQuery}
                                        onChange={e => setProductSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="vnd-table-wrap">
                                <table className="vnd-table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Price</th>
                                            <th style={{ textAlign: 'center' }}>Stock</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '40px 0', color: '#3f4a5c' }}>
                                                    No items found
                                                </td>
                                            </tr>
                                        ) : filteredProducts.map(product => (
                                            <tr key={product._id} className={!product.inStock ? 'vnd-row--oos' : ''}>
                                                <td>
                                                    <div className="vnd-product-name">{product.name}</div>
                                                    <div className="vnd-product-cat">{product.category}</div>
                                                </td>
                                                <td>
                                                    <span className="vnd-product-price">₹{product.price}</span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleToggleStock(product._id, product.inStock)}
                                                        className={`vnd-stock-btn ${product.inStock ? 'vnd-stock-btn--in' : 'vnd-stock-btn--out'}`}
                                                    >
                                                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                    </button>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => openEditProductModal(product)}
                                                        className="vnd-edit-btn"
                                                        title="Edit item"
                                                        style={{ marginRight: '8px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product._id)}
                                                        className="vnd-del-btn"
                                                        title="Delete item"
                                                    >
                                                        <IconTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── SETTINGS TAB ─── */}
                {activeTab === 'settings' && (
                    <div className="vnd-tab-panel">
                        <div className="vnd-mgmt-grid">

                            {/* Manage Custom Categories */}
                            <div className="vnd-section-card" style={{ gridColumn: '1 / -1' }}>
                                <div className="vnd-section-head">
                                    <div className="vnd-section-title">
                                        <span className="vnd-section-title-icon">🎨</span>
                                        Manage Custom Categories
                                    </div>
                                </div>
                                <div className="vnd-section-body">
                                    <form onSubmit={handleAddCustomCategory} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
                                        <div className="vnd-field" style={{ flex: 1, minWidth: '200px' }}>
                                            <label className="vnd-label">Category Name</label>
                                            <input type="text" required className="vnd-input" placeholder="e.g. Special Thali" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                                        </div>
                                        <div className="vnd-field" style={{ flex: 1, minWidth: '200px' }}>
                                            <label className="vnd-label">Category Logo</label>
                                            <input type="file" required accept="image/*" className="vnd-input" onChange={e => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setNewCatImage(reader.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }} />
                                        </div>
                                        <button type="submit" disabled={catUploading} className="vnd-btn vnd-btn--primary" style={{ padding: '0 20px', height: '42px', whiteSpace: 'nowrap' }}>
                                            {catUploading ? 'Uploading...' : 'Add Category'}
                                        </button>
                                    </form>

                                    {/* List existing custom categories */}
                                    {shop.categoriesConfig && shop.categoriesConfig.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                            {shop.categoriesConfig.map(cat => (
                                                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                                                    <img src={cat.image} alt={cat.name} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '50%' }} />
                                                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#f8fafc' }}>{cat.name}</span>
                                                    <button type="button" onClick={() => handleDeleteCustomCategory(cat.name)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: 'auto', fontSize: '16px' }} title="Delete">✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Delivery Settings */}
                            <div className="vnd-section-card">
                                <div className="vnd-section-head">
                                    <div className="vnd-section-title">
                                        <span className="vnd-section-title-icon">🛵</span>
                                        Delivery Rules
                                    </div>
                                </div>
                                <div className="vnd-section-body">
                                    <form onSubmit={handleUpdateDeliverySettings}>
                                        <div className="vnd-fields-grid">
                                            <div className="vnd-field">
                                                <label className="vnd-label">Min Order (₹)</label>
                                                <input type="number" required className="vnd-input" value={minCharge} onChange={e => setMinCharge(e.target.value)} />
                                            </div>
                                            <div className="vnd-field">
                                                <label className="vnd-label">Free Upto (km)</label>
                                                <input type="number" step="0.1" required className="vnd-input" value={minDistance} onChange={e => setMinDistance(e.target.value)} />
                                            </div>
                                            <div className="vnd-field">
                                                <label className="vnd-label">Charge / km (₹)</label>
                                                <input type="number" required className="vnd-input" value={chargePerKm} onChange={e => setChargePerKm(e.target.value)} />
                                            </div>
                                            <div className="vnd-field">
                                                <label className="vnd-label">Max Range (km)</label>
                                                <input type="number" step="0.1" required className="vnd-input" value={maxRange} onChange={e => setMaxRange(e.target.value)} />
                                            </div>
                                        </div>
                                        <button type="submit" id="vnd-save-delivery-btn" className="vnd-btn vnd-btn--primary vnd-btn-full">
                                            💾 Save Delivery Settings
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Auto Schedule */}
                            <div className="vnd-section-card">
                                <div className="vnd-section-head">
                                    <div className="vnd-section-title">
                                        <span className="vnd-section-title-icon">🕐</span>
                                        Auto Schedule
                                    </div>
                                </div>
                                <div className="vnd-section-body">
                                    <form onSubmit={handleUpdateSchedule}>
                                        <div className="vnd-toggle-row">
                                            <span className="vnd-toggle-label">Enable Auto Open / Close</span>
                                            <Toggle
                                                checked={autoScheduleEnabled}
                                                onChange={e => setAutoScheduleEnabled(e.target.checked)}
                                            />
                                        </div>
                                        <div className="vnd-fields-grid">
                                            <div className="vnd-field">
                                                <label className="vnd-label">Open Time</label>
                                                <input
                                                    type="time"
                                                    className="vnd-input"
                                                    value={openTime}
                                                    onChange={e => setOpenTime(e.target.value)}
                                                    disabled={!autoScheduleEnabled}
                                                    style={!autoScheduleEnabled ? { opacity: 0.4 } : {}}
                                                />
                                            </div>
                                            <div className="vnd-field">
                                                <label className="vnd-label">Close Time</label>
                                                <input
                                                    type="time"
                                                    className="vnd-input"
                                                    value={closeTime}
                                                    onChange={e => setCloseTime(e.target.value)}
                                                    disabled={!autoScheduleEnabled}
                                                    style={!autoScheduleEnabled ? { opacity: 0.4 } : {}}
                                                />
                                            </div>
                                        </div>
                                        <button type="submit" id="vnd-save-schedule-btn" className="vnd-btn vnd-btn--primary vnd-btn-full">
                                            💾 Save Schedule
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Shop Danger Zone / Info */}
                        <div className="vnd-section-card">
                            <div className="vnd-section-head">
                                <div className="vnd-section-title">
                                    <span className="vnd-section-title-icon">🏪</span>
                                    Shop Info
                                </div>
                            </div>
                            <div className="vnd-section-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                    <div>
                                        <div className="vnd-label">Shop Name</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{shop.name}</div>
                                    </div>
                                    <div>
                                        <div className="vnd-label">Status</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: shop.isOpen ? '#4ade80' : '#f87171' }}>
                                            {shop.isOpen ? '● Open for Orders' : '● Store Closed'}
                                        </div>
                                    </div>
                                    {shop.udyamNumber && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div className="vnd-label">Udyam Number</div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#f8cb46', fontFamily: 'monospace' }}>{shop.udyamNumber}</div>
                                        </div>
                                    )}
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <div className="vnd-label">Address</div>
                                        <div style={{ fontSize: 13, color: '#94a3b8' }}>{shop.address}</div>
                                    </div>
                                </div>
                                <button
                                    id="vnd-toggle-status-settings-btn"
                                    onClick={handleToggleShopStatus}
                                    className={`vnd-btn vnd-btn-full ${shop.isOpen ? 'vnd-btn--danger' : 'vnd-btn--primary'}`}
                                >
                                    {shop.isOpen ? '🔴 Close Store Now' : '🟢 Open Store Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* ─── EDIT PRODUCT MODAL ─── */}
            {editingProduct && (
                <div className="vnd-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="vnd-modal-content" style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', color: '#f8fafc' }}>Edit Item</h3>
                        <form onSubmit={handleSaveProductEdit}>
                            <div className="vnd-field" style={{ marginBottom: '15px' }}>
                                <label className="vnd-label">Item Name</label>
                                <input type="text" required className="vnd-input" value={editProductName} onChange={e => setEditProductName(e.target.value)} />
                            </div>
                            <div className="vnd-field" style={{ marginBottom: '15px' }}>
                                <label className="vnd-label">Price (₹)</label>
                                <input type="number" required className="vnd-input" value={editProductPrice} onChange={e => setEditProductPrice(e.target.value)} />
                            </div>
                            <div className="vnd-field" style={{ marginBottom: '15px' }}>
                                <label className="vnd-label">Category</label>
                                <input type="text" required className="vnd-input" value={editProductCategory} onChange={e => setEditProductCategory(e.target.value)} />
                                {shop.categoriesConfig && shop.categoriesConfig.length > 0 && (
                                    <div style={{ marginTop: '5px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                        {shop.categoriesConfig.map(cat => (
                                            <span key={cat.name} onClick={() => setEditProductCategory(cat.name)} style={{ fontSize: '12px', background: '#334155', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', color: '#cbd5e1' }}>
                                                {cat.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="vnd-field" style={{ marginBottom: '20px' }}>
                                <label className="vnd-label">New Photo (Optional)</label>
                                <input type="file" accept="image/*" className="vnd-input" onChange={handleEditProductImageChange} />
                                {editProductImage && <img src={editProductImage} alt="preview" style={{ marginTop: '10px', height: '60px', borderRadius: '8px' }} />}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setEditingProduct(null)} className="vnd-btn" style={{ background: '#475569' }}>Cancel</button>
                                <button type="submit" disabled={editProductUploading} className="vnd-btn vnd-btn--primary">
                                    {editProductUploading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default VendorDashboard;
