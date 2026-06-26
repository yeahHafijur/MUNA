import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ─── Sharp Premium Outlined Icons ─── */
const IconBack = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const AdminDashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [shops, setShops] = useState([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [activeTab, setActiveTab] = useState('onboard');

    const [formData, setFormData] = useState({
        vendorName: '', vendorEmail: '', vendorPhone: '',
        shopName: '', shopAddress: '', shopCategory: '', shopCategoryId: '', udyamNumber: '', shopLat: '', shopLng: '',
        openTime: '09:00', closeTime: '21:00'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editingShop, setEditingShop] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '', address: '', category: '', udyamNumber: '', lat: '', lng: '', image: null, imagePreview: ''
    });

    // Godown state
    const [godownItems, setGodownItems] = useState([]);
    const [loadingGodownItems, setLoadingGodownItems] = useState(true);
    const [editingGodownItem, setEditingGodownItem] = useState(null);
    const [godownSearchQuery, setGodownSearchQuery] = useState('');
    const [godownFormData, setGodownFormData] = useState({
        name: '', category: '', image: null, imagePreview: ''
    });
    const [isGodownModalOpen, setIsGodownModalOpen] = useState(false); // Replaced native dialog for better Tailwind support

    // Settings state
    const [navbarMsg, setNavbarMsg] = useState({ line1: '', line2: '' });
    const [savingSettings, setSavingSettings] = useState(false);

    // Shop Categories state
    const [shopCategories, setShopCategories] = useState([]);
    const [shopCatForm, setShopCatForm] = useState({ name: '', image: null, imagePreview: '' });
    const [editingShopCat, setEditingShopCat] = useState(null);
    const [savingShopCat, setSavingShopCat] = useState(false);

    // Global Item Categories state
    const [globalItemCats, setGlobalItemCats] = useState([]);
    const [itemCatForm, setItemCatForm] = useState({ name: '', image: null, imagePreview: '' });
    const [editingItemCat, setEditingItemCat] = useState(null);
    const [savingItemCat, setSavingItemCat] = useState(false);

    // ---- DATA FETCHING ----
    const fetchShops = async () => {
        try {
            const res = await fetch('/api/shops?admin=true', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setShops(Array.isArray(data) ? data : []);
        } catch { setShops([]); }
        finally { setLoadingShops(false); }
    };

    const fetchGodownItems = async () => {
        try {
            const res = await fetch('/api/master-products');
            const data = await res.json();
            setGodownItems(Array.isArray(data) ? data : []);
        } catch { setGodownItems([]); }
        finally { setLoadingGodownItems(false); }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings/navbar-message');
            const data = await res.json();
            if (res.ok) setNavbarMsg(data);
        } catch (e) { console.error("Error fetching settings", e); }
    };

    const fetchShopCategories = async () => {
        try {
            const res = await fetch('/api/shop-categories');
            const data = await res.json();
            setShopCategories(Array.isArray(data) ? data : []);
        } catch { setShopCategories([]); }
    };

    const fetchGlobalItemCats = async () => {
        try {
            const res = await fetch('/api/categories/global');
            const data = await res.json();
            setGlobalItemCats(Array.isArray(data) ? data : []);
        } catch { setGlobalItemCats([]); }
    };

    useEffect(() => {
        if (!token || user?.role !== 'super_admin') { navigate('/'); return; }
        fetchShops();
        fetchGodownItems();
        fetchSettings();
        fetchShopCategories();
        fetchGlobalItemCats();
    }, [token, user, navigate]);

    // ---- HANDLERS ----
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error onboarding vendor');
            alert(data.message);
            setFormData({ vendorName: '', vendorEmail: '', vendorPhone: '', shopName: '', shopAddress: '', shopCategory: '', shopCategoryId: '', udyamNumber: '', shopLat: '', shopLng: '', openTime: '09:00', closeTime: '21:00' });
            fetchShops();
        } catch (error) { alert(error.message); }
        finally { setIsSubmitting(false); }
    };

    const handleEditClick = (shop) => {
        setEditingShop(shop);
        setEditFormData({
            name: shop.name || '', address: shop.address || '', category: shop.category || '',
            udyamNumber: shop.udyamNumber || '',
            lat: shop.location?.coordinates[1] || '', lng: shop.location?.coordinates[0] || '',
            image: null, imagePreview: shop.image || ''
        });
    };

    const handleEditChange = (e) => {
        if (e.target.name === 'image') {
            const file = e.target.files[0];
            setEditFormData({ ...editFormData, image: file, imagePreview: file ? URL.createObjectURL(file) : '' });
        } else {
            setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/shops/${editingShop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: editFormData.name, address: editFormData.address, category: editFormData.category,
                    udyamNumber: editFormData.udyamNumber, lat: editFormData.lat, lng: editFormData.lng
                })
            });
            if (res.ok) {
                if (editFormData.image) {
                    const fd = new FormData();
                    fd.append('image', editFormData.image);
                    const imgRes = await fetch(`/api/shops/${editingShop._id}/image`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: fd
                    });
                    if (!imgRes.ok) {
                        alert("Text updated but image upload failed.");
                    }
                }
                setEditingShop(null);
                fetchShops();
            }
            else { const d = await res.json(); alert(d.message || 'Failed'); }
        } catch (err) { console.error(err); }
    };

    const handleToggleActive = async (shop) => {
        if (!window.confirm(`${shop.isActive ? 'Deactivate' : 'Activate'} ${shop.name}?`)) return;
        try {
            const res = await fetch(`/api/shops/${shop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ isActive: !shop.isActive })
            });
            if (res.ok) fetchShops();
            else { const d = await res.json(); alert(d.message || 'Failed'); }
        } catch (err) { console.error(err); }
    };

    const handleGodownFormChange = (e) => {
        if (e.target.name === 'image') {
            const file = e.target.files[0];
            setGodownFormData({ ...godownFormData, image: file, imagePreview: file ? URL.createObjectURL(file) : '' });
        } else {
            setGodownFormData({ ...godownFormData, [e.target.name]: e.target.value });
        }
    };

    const handleGodownSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', godownFormData.name);
        fd.append('category', godownFormData.category);
        if (godownFormData.image) fd.append('image', godownFormData.image);
        try {
            const url = editingGodownItem ? `/api/master-products/${editingGodownItem._id}` : '/api/master-products';
            const res = await fetch(url, { method: editingGodownItem ? 'PUT' : 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
            if (res.ok) {
                setGodownFormData({ name: '', category: '', image: null, imagePreview: '' });
                setEditingGodownItem(null);
                fetchGodownItems();
                setIsGodownModalOpen(false);
            } else { const d = await res.json(); alert(d.message || 'Failed'); }
        } catch (err) { console.error(err); }
    };

    const handleGodownEditClick = (item) => {
        setEditingGodownItem(item);
        setGodownFormData({ name: item.name, category: item.category || '', image: null, imagePreview: item.image || '' });
        setIsGodownModalOpen(true);
    };

    const handleDeleteGodownItem = async (id) => {
        if (!window.confirm("Delete this item from Godown?")) return;
        try {
            const res = await fetch(`/api/master-products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) fetchGodownItems();
            else { const d = await res.json(); alert(d.message || 'Failed'); }
        } catch (err) { console.error(err); }
    };

    const handleApproveGodownItem = async (id) => {
        if (!window.confirm("Approve this item? It will be visible to all vendors.")) return;
        try {
            const res = await fetch(`/api/master-products/${id}/approve`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) fetchGodownItems();
            else { const d = await res.json(); alert(d.message || 'Failed'); }
        } catch (err) { console.error(err); }
    };

    const handleShopCatSubmit = async (e) => {
        e.preventDefault();
        setSavingShopCat(true);
        const fd = new FormData();
        fd.append('name', shopCatForm.name);
        if (shopCatForm.image) fd.append('image', shopCatForm.image);
        try {
            const url = editingShopCat ? `/api/shop-categories/${editingShopCat._id}` : '/api/shop-categories';
            const res = await fetch(url, { method: editingShopCat ? 'PUT' : 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
            if (res.ok) {
                setShopCatForm({ name: '', image: null, imagePreview: '' }); setEditingShopCat(null); fetchShopCategories();
            } else { const d = await res.json(); alert(d.message || 'Failed'); }
        } catch (err) { console.error(err); }
        setSavingShopCat(false);
    };

    const handleDeleteShopCat = async (id) => {
        if (!window.confirm('Delete this shop category?')) return;
        try {
            const res = await fetch(`/api/shop-categories/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) fetchShopCategories();
            else { const d = await res.json(); alert(d.message || 'Failed'); }
        } catch (err) { console.error(err); }
    };

    const handleItemCatSubmit = async (e) => {
        e.preventDefault();
        setSavingItemCat(true);
        const fd = new FormData();
        fd.append('name', itemCatForm.name);
        if (itemCatForm.image) fd.append('image', itemCatForm.image);
        try {
            const url = editingItemCat ? `/api/categories/${editingItemCat._id}` : '/api/categories/global';
            const res = await fetch(url, { method: editingItemCat ? 'PUT' : 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
            if (res.ok) {
                setItemCatForm({ name: '', image: null, imagePreview: '' }); setEditingItemCat(null); fetchGlobalItemCats();
            } else { const d = await res.json(); alert(d.message || 'Failed'); }
        } catch (err) { console.error(err); }
        setSavingItemCat(false);
    };

    const handleDeleteItemCat = async (id) => {
        if (!window.confirm('Delete this global item category?')) return;
        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) fetchGlobalItemCats();
            else { const d = await res.json(); alert(d.message || 'Failed'); }
        } catch (err) { console.error(err); }
    };

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            const res = await fetch('/api/settings/navbar-message', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(navbarMsg)
            });
            const data = await res.json();
            if (res.ok) alert("Navbar message updated successfully!");
            else alert(data.message || 'Failed to update settings');
        } catch (err) { console.error(err); }
        finally { setSavingSettings(false); }
    };

    if (!user) return null;

    const openCount = shops.filter(s => s.isOpen).length;
    const approvedGodown = godownItems.filter(i => i.status !== 'pending');
    const pendingGodown = godownItems.filter(i => i.status === 'pending');
    const filteredGodown = approvedGodown.filter(i => (i.name || '').toLowerCase().includes((godownSearchQuery || '').toLowerCase()));

    // Shared Input Styles
    const inputClasses = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all";
    const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";
    const btnPrimaryClasses = "px-6 py-2.5 bg-amber-400 text-gray-900 rounded-lg text-sm font-bold active:scale-95 transition-transform shadow-sm hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

            {/* ── HEADER ── */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-1.5 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <IconBack />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-white font-black shadow-inner">M</div>
                        <span className="text-lg font-black text-gray-900 tracking-tight hidden sm:block">Admin Console</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="hidden sm:inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider rounded-md">Super Admin</span>
                    <button onClick={() => { logout(); navigate('/'); }} className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100">
                        Sign Out
                    </button>
                </div>
            </div>

            {/* ── STATS BAR ── */}
            <div className="bg-white border-b border-gray-200">
                <div className="grid grid-cols-3 divide-x divide-gray-200">
                    <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-black text-gray-900">{shops.length}</span>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Total Shops</span>
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-black text-emerald-500">{openCount}</span>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Open Now</span>
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-black text-amber-500">{godownItems.length}</span>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Godown</span>
                    </div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 flex overflow-x-auto no-scrollbar gap-2 sm:gap-6">
                {[
                    { id: 'onboard', label: 'Onboard' },
                    { id: 'shops', label: 'Shops' },
                    { id: 'categories', label: 'Categories' },
                    { id: 'godown', label: 'Godown' },
                    { id: 'approvals', label: `Approvals (${pendingGodown.length})` },
                    { id: 'settings', label: 'Settings' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 px-2 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-amber-400 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── MAIN CONTENT AREA ── */}
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl w-full mx-auto animate-in fade-in duration-300">

                {/* == ONBOARD == */}
                {activeTab === 'onboard' && (
                    <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-base font-black text-gray-900 tracking-tight">Register New Vendor</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-8">

                            {/* Vendor Details */}
                            <div>
                                <h3 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                    <span className="w-1.5 h-4 bg-amber-400 rounded-full"></span> Vendor Details
                                </h3>
                                <div className="space-y-4">
                                    <input type="text" name="vendorName" required placeholder="Full name" className={inputClasses} value={formData.vendorName} onChange={handleChange} />
                                    <input type="email" name="vendorEmail" required placeholder="Google email" className={inputClasses} value={formData.vendorEmail} onChange={handleChange} />
                                    <input type="tel" name="vendorPhone" required placeholder="Phone (10 digits)" className={inputClasses} value={formData.vendorPhone} onChange={handleChange} minLength="10" maxLength="10" />
                                </div>
                            </div>

                            {/* Shop Details */}
                            <div>
                                <h3 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                    <span className="w-1.5 h-4 bg-amber-400 rounded-full"></span> Shop Details
                                </h3>
                                <div className="space-y-4">
                                    <input type="text" name="shopName" required placeholder="Shop name" className={inputClasses} value={formData.shopName} onChange={handleChange} />
                                    <input type="text" name="shopAddress" required placeholder="Full address" className={inputClasses} value={formData.shopAddress} onChange={handleChange} />
                                    <select name="shopCategoryId" className={inputClasses} value={formData.shopCategoryId} onChange={(e) => {
                                        const selected = shopCategories.find(c => c._id === e.target.value);
                                        setFormData({ ...formData, shopCategoryId: e.target.value, shopCategory: selected?.name || 'General' });
                                    }}>
                                        <option value="">Select Shop Category</option>
                                        {shopCategories.map(sc => <option key={sc._id} value={sc._id}>{sc.name}</option>)}
                                    </select>
                                    <input type="text" name="udyamNumber" placeholder="Udyam number (optional)" className={`${inputClasses} font-mono`} value={formData.udyamNumber} onChange={handleChange} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="number" step="any" name="shopLat" required placeholder="Latitude" className={inputClasses} value={formData.shopLat} onChange={handleChange} />
                                        <input type="number" step="any" name="shopLng" required placeholder="Longitude" className={inputClasses} value={formData.shopLng} onChange={handleChange} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <label className={labelClasses}>Open Time</label>
                                            <input type="time" name="openTime" required className={inputClasses} value={formData.openTime} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Close Time</label>
                                            <input type="time" name="closeTime" required className={inputClasses} value={formData.closeTime} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <button type="submit" disabled={isSubmitting} className={`${btnPrimaryClasses} w-full py-4 text-base`}>
                                    {isSubmitting ? 'Creating...' : 'Create Vendor & Shop'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* == SHOPS LIST == */}
                {activeTab === 'shops' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h2 className="text-base font-black text-gray-900 tracking-tight">Registered Shops</h2>
                            <span className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">{shops.length} Shops</span>
                        </div>

                        {loadingShops ? (
                            <div className="p-12 text-center text-sm font-bold text-gray-400">Loading shops...</div>
                        ) : shops.length === 0 ? (
                            <div className="p-12 text-center text-sm font-bold text-gray-400">No shops registered yet.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">Shop Details</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">Status</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">Vendor</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {shops.map(shop => (
                                            <tr key={shop._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-gray-900">{shop.name}</div>
                                                    <div className="text-xs font-medium text-gray-500 mt-0.5">{shop.address}</div>
                                                    {shop.udyamNumber && <div className="mt-1.5 inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono rounded font-bold">Udyam: {shop.udyamNumber}</div>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {!shop.isActive ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-orange-100 text-orange-800">Inactive</span>
                                                    ) : (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${shop.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                            {shop.isOpen ? 'Open' : 'Closed'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-700">{shop.vendorId?.name || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleEditClick(shop)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">Edit</button>
                                                        <button onClick={() => handleToggleActive(shop)} className={`px-3 py-1.5 border rounded-lg text-xs font-bold active:scale-95 transition-all ${shop.isActive ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                                                            {shop.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* == CATEGORIES == */}
                {activeTab === 'categories' && (
                    <div className="space-y-8">
                        {/* Shop Categories */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h2 className="text-base font-black text-gray-900 tracking-tight">Shop Categories (Strict)</h2>
                            </div>
                            <div className="p-6 border-b border-gray-100 bg-white">
                                <form onSubmit={handleShopCatSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full">
                                        <label className={labelClasses}>Category Name</label>
                                        <input type="text" required placeholder="e.g. Kirana" className={inputClasses} value={shopCatForm.name} onChange={(e) => setShopCatForm({ ...shopCatForm, name: e.target.value })} />
                                    </div>
                                    <div className="w-full sm:w-auto">
                                        <label className={labelClasses}>Icon Image</label>
                                        <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" onChange={(e) => setShopCatForm({ ...shopCatForm, image: e.target.files[0] })} />
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button type="submit" disabled={savingShopCat} className={btnPrimaryClasses}>{editingShopCat ? 'Update' : 'Add New'}</button>
                                        {editingShopCat && <button type="button" onClick={() => { setEditingShopCat(null); setShopCatForm({ name: '', image: null, imagePreview: '' }); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold">Cancel</button>}
                                    </div>
                                </form>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Category Name</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Icon</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {shopCategories.map(sc => (
                                        <tr key={sc._id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-3 text-sm font-bold text-gray-900">{sc.name}</td>
                                            <td className="px-6 py-3">{sc.image ? <img src={sc.image} alt="" className="w-8 h-8 rounded-md object-cover border border-gray-200" /> : '—'}</td>
                                            <td className="px-6 py-3 text-right">
                                                <button onClick={() => { setEditingShopCat(sc); setShopCatForm({ name: sc.name, image: null, imagePreview: sc.image || '' }); }} className="text-sm font-bold text-blue-600 hover:text-blue-800 mr-4">Edit</button>
                                                <button onClick={() => handleDeleteShopCat(sc._id)} className="text-sm font-bold text-red-600 hover:text-red-800">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Global Item Categories */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h2 className="text-base font-black text-gray-900 tracking-tight">Global Item Categories 🌐</h2>
                            </div>
                            <div className="p-6 border-b border-gray-100 bg-white">
                                <form onSubmit={handleItemCatSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full">
                                        <label className={labelClasses}>Category Name</label>
                                        <input type="text" required placeholder="e.g. Beverages" className={inputClasses} value={itemCatForm.name} onChange={(e) => setItemCatForm({ ...itemCatForm, name: e.target.value })} />
                                    </div>
                                    <div className="w-full sm:w-auto">
                                        <label className={labelClasses}>Cover Image</label>
                                        <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={(e) => setItemCatForm({ ...itemCatForm, image: e.target.files[0] })} />
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button type="submit" disabled={savingItemCat} className={btnPrimaryClasses}>{editingItemCat ? 'Update' : 'Add New'}</button>
                                        {editingItemCat && <button type="button" onClick={() => { setEditingItemCat(null); setItemCatForm({ name: '', image: null, imagePreview: '' }); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold">Cancel</button>}
                                    </div>
                                </form>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Category Name</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Image</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {globalItemCats.map(ic => (
                                        <tr key={ic._id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-3 text-sm font-bold text-gray-900">{ic.name} <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded">Global</span></td>
                                            <td className="px-6 py-3">{ic.image ? <img src={ic.image} alt="" className="w-8 h-8 rounded-md object-cover border border-gray-200" /> : '—'}</td>
                                            <td className="px-6 py-3 text-right">
                                                <button onClick={() => { setEditingItemCat(ic); setItemCatForm({ name: ic.name, image: null, imagePreview: ic.image || '' }); }} className="text-sm font-bold text-blue-600 hover:text-blue-800 mr-4">Edit</button>
                                                <button onClick={() => handleDeleteItemCat(ic._id)} className="text-sm font-bold text-red-600 hover:text-red-800">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* == GODOWN == */}
                {activeTab === 'godown' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <h2 className="text-base font-black text-gray-900 tracking-tight">Godown Inventory</h2>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <input type="text" placeholder="Search godown..." className={`${inputClasses} flex-1 py-1.5 sm:w-64`} value={godownSearchQuery} onChange={(e) => setGodownSearchQuery(e.target.value)} />
                                <button onClick={() => { setEditingGodownItem(null); setGodownFormData({ name: '', category: '', image: null, imagePreview: '' }); setIsGodownModalOpen(true); }} className={`${btnPrimaryClasses} whitespace-nowrap`}>
                                    + Add Item
                                </button>
                            </div>
                        </div>

                        {loadingGodownItems ? (
                            <div className="p-12 text-center text-sm font-bold text-gray-400">Loading inventory...</div>
                        ) : approvedGodown.length === 0 ? (
                            <div className="p-12 text-center text-sm font-bold text-gray-400">Godown is empty.</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-[1px] bg-gray-100 p-[1px]">
                                {filteredGodown.map(item => (
                                    <div key={item._id} className="bg-white p-4 flex flex-col items-center text-center group hover:bg-amber-50/30 transition-colors relative">
                                        <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1 mb-3">
                                            {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" /> : <span className="text-gray-300 font-black text-2xl">M</span>}
                                        </div>
                                        <div className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight mb-1">{item.name}</div>
                                        {item.category && <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.category}</div>}

                                        {/* Hover Actions */}
                                        <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 flex opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleGodownEditClick(item)} className="flex-1 py-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors">Edit</button>
                                            <div className="w-[1px] bg-gray-200"></div>
                                            <button onClick={() => handleDeleteGodownItem(item._id)} className="flex-1 py-2 text-[10px] font-bold text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* == APPROVALS == */}
                {activeTab === 'approvals' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h2 className="text-base font-black text-gray-900 tracking-tight">Pending Approvals</h2>
                        </div>
                        {loadingGodownItems ? (
                            <div className="p-12 text-center text-sm font-bold text-gray-400">Loading approvals...</div>
                        ) : pendingGodown.length === 0 ? (
                            <div className="p-12 text-center text-sm font-bold text-gray-400">No pending items to approve.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 w-20">Image</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Item Name</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Category</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pendingGodown.map(item => (
                                        <tr key={item._id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                                                    {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-sm font-bold text-gray-900">{item.name}</td>
                                            <td className="px-6 py-3 text-sm font-medium text-gray-500">{item.category || '—'}</td>
                                            <td className="px-6 py-3 text-right">
                                                <button onClick={() => handleApproveGodownItem(item._id)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 mr-2">Accept</button>
                                                <button onClick={() => handleDeleteGodownItem(item._id)} className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100">Reject</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* == SETTINGS == */}
                {activeTab === 'settings' && (
                    <div className="max-w-xl bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-base font-black text-gray-900 tracking-tight">App Settings</h2>
                        </div>
                        <form onSubmit={handleSettingsSubmit} className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-1">Dynamic Navbar Message</h3>
                                <p className="text-xs font-medium text-gray-500 mb-4">This message appears at the top of the home screen for all users.</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClasses}>Line 1</label>
                                        <input type="text" required placeholder="e.g. Your local market," className={inputClasses} value={navbarMsg.line1} onChange={(e) => setNavbarMsg({ ...navbarMsg, line1: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Line 2</label>
                                        <input type="text" required placeholder="e.g. delivered in minutes ⚡" className={inputClasses} value={navbarMsg.line2} onChange={(e) => setNavbarMsg({ ...navbarMsg, line2: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <button type="submit" disabled={savingSettings} className={`${btnPrimaryClasses} w-full py-3`}>
                                    {savingSettings ? 'Saving...' : 'Update Message'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* ---- TAILWIND MODALS ---- */}

            {/* Godown Modal */}
            {isGodownModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-base font-black text-gray-900">{editingGodownItem ? 'Edit Godown Item' : 'Add to Godown'}</h3>
                            <button onClick={() => setIsGodownModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleGodownSubmit} className="p-6 space-y-5">
                            <div className="flex justify-center">
                                <label className="cursor-pointer group">
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group-hover:border-amber-400 transition-colors">
                                        {godownFormData.imagePreview ? <img src={godownFormData.imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-400 group-hover:text-amber-500">+ Photo</span>}
                                    </div>
                                    <input type="file" name="image" accept="image/*" onChange={handleGodownFormChange} className="hidden" />
                                </label>
                            </div>
                            <div>
                                <label className={labelClasses}>Item Name</label>
                                <input type="text" name="name" required className={inputClasses} value={godownFormData.name} onChange={handleGodownFormChange} placeholder="e.g. Aashirvaad Atta 5kg" />
                            </div>
                            <div>
                                <label className={labelClasses}>Category</label>
                                <input type="text" name="category" className={inputClasses} value={godownFormData.category} onChange={handleGodownFormChange} placeholder="e.g. Grocery" />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className={`${btnPrimaryClasses} w-full py-3`}>{editingGodownItem ? 'Update Item' : 'Add to Godown'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Shop Modal */}
            {editingShop && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-base font-black text-gray-900">Edit Shop Profile</h3>
                            <button onClick={() => setEditingShop(null)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <label className="cursor-pointer block group">
                                <div className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group-hover:border-amber-400 transition-colors">
                                    {editFormData.imagePreview ? <img src={editFormData.imagePreview} alt="Shop Banner" className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-gray-400 group-hover:text-amber-500">Change Banner Photo</span>}
                                </div>
                                <input type="file" name="image" accept="image/*" onChange={handleEditChange} className="hidden" />
                            </label>

                            <div><label className={labelClasses}>Shop Name</label><input type="text" name="name" required className={inputClasses} value={editFormData.name} onChange={handleEditChange} /></div>
                            <div><label className={labelClasses}>Address</label><input type="text" name="address" required className={inputClasses} value={editFormData.address} onChange={handleEditChange} /></div>
                            <div><label className={labelClasses}>Category</label><input type="text" name="category" className={inputClasses} value={editFormData.category} onChange={handleEditChange} /></div>
                            <div><label className={labelClasses}>Udyam Number</label><input type="text" name="udyamNumber" className={`${inputClasses} font-mono`} value={editFormData.udyamNumber} onChange={handleEditChange} /></div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelClasses}>Latitude</label><input type="number" step="any" name="lat" required className={inputClasses} value={editFormData.lat} onChange={handleEditChange} /></div>
                                <div><label className={labelClasses}>Longitude</label><input type="number" step="any" name="lng" required className={inputClasses} value={editFormData.lng} onChange={handleEditChange} /></div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <button type="submit" className={`${btnPrimaryClasses} w-full py-3`}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;