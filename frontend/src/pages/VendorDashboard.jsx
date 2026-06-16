import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './VendorDashboard.css';

/* ─── SVG ICONS ─── */
const IconBell = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const IconStore = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>;
const IconClipboard = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>;
const IconSettings = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.252-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;

/* ─── MAIN COMPONENT ─── */
const VendorDashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [shop, setShop] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('orders'); // orders, inventory, settings
    const prevOrderCountRef = useRef(0);

    /* Form States */
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductImage, setNewProductImage] = useState(null);
    const [newProductCategory, setNewProductCategory] = useState('');
    const [isAddingItem, setIsAddingItem] = useState(false);

    /* Delivery & Schedule Settings */
    const [minCharge, setMinCharge] = useState(10);
    const [minDistance, setMinDistance] = useState(2);
    const [chargePerKm, setChargePerKm] = useState(5);
    const [maxRange, setMaxRange] = useState(5);
    const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);
    const [openTime, setOpenTime] = useState('09:00');
    const [closeTime, setCloseTime] = useState('21:00');

    /* ── Initial Load ── */
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

    /* ── Fetch Functions ── */
    const fetchOrders = (isInitial = false) => {
        fetch('/api/orders/vendor', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                if (!Array.isArray(data)) return;
                const liveCount = data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
                if (!isInitial && liveCount > prevOrderCountRef.current) {
                    try { new Audio('/notification.mp3').play(); } catch {}
                }
                prevOrderCountRef.current = liveCount;
                setOrders(data);
            });
    };

    const fetchProducts = (shopId) => {
        fetch(`/api/products/${shopId}`)
            .then(r => r.json())
            .then(data => setProducts(Array.isArray(data) ? data : []));
    };

    /* ── Action Handlers ── */
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
        if (!window.confirm('Delete this item?')) return;
        await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchProducts(shop._id);
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsAddingItem(true);
        const formData = new FormData();
        formData.append('name', newProductName);
        formData.append('price', Number(newProductPrice));
        formData.append('category', newProductCategory || 'General');
        if (newProductImage) formData.append('image', newProductImage);

        try {
            await fetch('/api/products', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            setNewProductName(''); setNewProductPrice(''); setNewProductImage(null);
            fetchProducts(shop._id);
        } finally {
            setIsAddingItem(false);
        }
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
                deliverySettings: { minimumCharge: Number(minCharge), minimumDistance: Number(minDistance), chargePerKm: Number(chargePerKm), maxRange: Number(maxRange) }
            }),
        });
        if (res.ok) { setShop(await res.json()); alert('Settings Saved!'); }
    };

    /* ── Render Check ── */
    if (!shop) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;

    /* ── Order Kanban Categories ── */
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const processingOrders = orders.filter(o => ['accepted', 'preparing'].includes(o.status));
    const dispatchOrders = orders.filter(o => o.status === 'out_for_delivery');

    return (
        <div className="vs-layout">
            
            {/* ════════ LEFT SIDEBAR ════════ */}
            <aside className="vs-sidebar">
                <div className="vs-brand">
                    <span className="font-black text-2xl tracking-tighter text-slate-900">MUNA <span className="text-amber-500">Partner</span></span>
                </div>
                
                <nav className="vs-nav">
                    <button onClick={() => setActiveTab('orders')} className={`vs-nav-item ${activeTab === 'orders' ? 'active' : ''}`}>
                        <IconClipboard /> Live Orders 
                        {pendingOrders.length > 0 && <span className="vs-badge">{pendingOrders.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('inventory')} className={`vs-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}>
                        <IconStore /> Inventory
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`vs-nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
                        <IconSettings /> Store Settings
                    </button>
                </nav>

                <div className="vs-sidebar-foot">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 truncate">
                            <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                            <button onClick={logout} className="text-xs text-red-500 font-bold hover:underline">Sign Out</button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ════════ MAIN CONTENT AREA ════════ */}
            <main className="vs-main">
                
                {/* ── TOP HEADER ── */}
                <header className="vs-header">
                    <h1 className="text-xl font-black text-slate-800 capitalize">{activeTab}</h1>
                    
                    <div className="flex items-center gap-6">
                        <button className="text-slate-500 hover:text-amber-500 transition">
                            <IconBell />
                        </button>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Store Status</span>
                            <button 
                                onClick={handleToggleShopStatus}
                                className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-colors ${shop.isOpen ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                            >
                                {shop.isOpen ? '● Open (Accepting)' : '● Closed'}
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── DYNAMIC WORKSPACE ── */}
                <div className="vs-workspace">

                    {/* === TAB 1: KANBAN LIVE ORDERS === */}
                    {activeTab === 'orders' && (
                        <div className="vs-kanban-board">
                            
                            {/* Column 1: NEW */}
                            <div className="vs-kanban-col">
                                <div className="vs-kcol-head border-l-4 border-amber-500">
                                    <h3>New Orders</h3>
                                    <span>{pendingOrders.length}</span>
                                </div>
                                <div className="vs-kcol-body">
                                    {pendingOrders.length === 0 ? <p className="vs-empty">No new orders</p> : null}
                                    {pendingOrders.map(order => (
                                        <div key={order._id} className="vs-order-card border-t-4 border-amber-400">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-mono font-bold text-slate-700 text-sm">#{order._id.slice(-5).toUpperCase()}</span>
                                                <span className="font-bold text-amber-600">₹{order.totalAmount}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mb-3 line-clamp-2">
                                                {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleUpdateOrderStatus(order._id, 'accepted')} className="vs-btn-primary flex-1">Accept</button>
                                                <button onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')} className="vs-btn-danger px-3">Reject</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Column 2: PREPARING */}
                            <div className="vs-kanban-col">
                                <div className="vs-kcol-head border-l-4 border-blue-500">
                                    <h3>Processing</h3>
                                    <span>{processingOrders.length}</span>
                                </div>
                                <div className="vs-kcol-body">
                                    {processingOrders.map(order => (
                                        <div key={order._id} className="vs-order-card border-t-4 border-blue-400">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-mono font-bold text-slate-700 text-sm">#{order._id.slice(-5).toUpperCase()}</span>
                                                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase">{order.status}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mb-3">
                                                📍 {order.deliveryLocation?.address || 'View on Map'}
                                            </div>
                                            {order.status === 'accepted' ? (
                                                <button onClick={() => handleUpdateOrderStatus(order._id, 'preparing')} className="vs-btn-secondary w-full">Start Preparing</button>
                                            ) : (
                                                <button onClick={() => handleUpdateOrderStatus(order._id, 'out_for_delivery')} className="vs-btn-primary w-full bg-blue-600 hover:bg-blue-700">Dispatch Order</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Column 3: OUT FOR DELIVERY */}
                            <div className="vs-kanban-col">
                                <div className="vs-kcol-head border-l-4 border-emerald-500">
                                    <h3>On The Way</h3>
                                    <span>{dispatchOrders.length}</span>
                                </div>
                                <div className="vs-kcol-body">
                                    {dispatchOrders.map(order => (
                                        <div key={order._id} className="vs-order-card border-t-4 border-emerald-400">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-mono font-bold text-slate-700 text-sm">#{order._id.slice(-5).toUpperCase()}</span>
                                                <span className="font-bold text-slate-800">₹{order.totalAmount}</span>
                                            </div>
                                            <div className="text-xs font-bold text-slate-600 mb-3">
                                                📞 {order.customerId?.phone || 'No Contact'}
                                            </div>
                                            <button onClick={() => handleUpdateOrderStatus(order._id, 'delivered')} className="vs-btn-primary w-full bg-emerald-500 hover:bg-emerald-600">Mark Delivered</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* === TAB 2: INVENTORY === */}
                    {activeTab === 'inventory' && (
                        <div className="vs-inventory-tab">
                            {/* Toolbar */}
                            <div className="flex justify-between items-end mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                <div>
                                    <h2 className="text-lg font-black text-slate-800">Store Catalog</h2>
                                    <p className="text-sm text-slate-500">Manage your items, stock, and pricing.</p>
                                </div>
                                <button onClick={() => navigate('/vendor-godown')} className="vs-btn-primary bg-slate-800 hover:bg-slate-900">
                                    📦 Import from Godown
                                </button>
                            </div>

                            {/* Add Quick Product */}
                            <form onSubmit={handleAddProduct} className="flex gap-3 mb-6 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                <input type="text" placeholder="Item Name" required value={newProductName} onChange={e=>setNewProductName(e.target.value)} className="vs-input flex-1" />
                                <input type="number" placeholder="Price ₹" required value={newProductPrice} onChange={e=>setNewProductPrice(e.target.value)} className="vs-input w-24" />
                                <select value={newProductCategory} onChange={e=>setNewProductCategory(e.target.value)} className="vs-input w-32">
                                    <option value="">Category</option>
                                    <option value="Grocery">Grocery</option>
                                    <option value="Snacks">Snacks</option>
                                </select>
                                <button type="submit" disabled={isAddingItem} className="vs-btn-primary shrink-0">
                                    {isAddingItem ? 'Adding...' : '+ Add Item'}
                                </button>
                            </form>

                            {/* Data Grid */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Item Name</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Price</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Stock Status</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {products.map(p => (
                                            <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800">{p.name}</div>
                                                    <div className="text-xs text-slate-400">{p.category}</div>
                                                </td>
                                                <td className="p-4 font-bold text-slate-700">₹{p.price}</td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => handleToggleStock(p._id, p.inStock)} className={`px-3 py-1 rounded-full text-xs font-bold border transition ${p.inStock ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                        {p.inStock ? 'In Stock' : 'Out of Stock'}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => handleDeleteProduct(p._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                                        <IconTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* === TAB 3: SETTINGS === */}
                    {activeTab === 'settings' && (
                        <div className="max-w-2xl">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                                <h3 className="text-lg font-black text-slate-800 mb-4 border-b pb-2">Delivery Rules</h3>
                                <form onSubmit={handleUpdateDeliverySettings} className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Min Order (₹)</label>
                                        <input type="number" value={minCharge} onChange={e=>setMinCharge(e.target.value)} className="vs-input mt-1 w-full" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Free Upto (km)</label>
                                        <input type="number" step="0.1" value={minDistance} onChange={e=>setMinDistance(e.target.value)} className="vs-input mt-1 w-full" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Charge / km (₹)</label>
                                        <input type="number" value={chargePerKm} onChange={e=>setChargePerKm(e.target.value)} className="vs-input mt-1 w-full" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Max Range (km)</label>
                                        <input type="number" step="0.1" value={maxRange} onChange={e=>setMaxRange(e.target.value)} className="vs-input mt-1 w-full" />
                                    </div>
                                    <button type="submit" className="vs-btn-primary col-span-2 mt-2">Save Delivery Rules</button>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default VendorDashboard;
