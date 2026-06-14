import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

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
        shopName: '', shopAddress: '', shopCategory: '', udyamNumber: '', shopLat: '', shopLng: '',
        openTime: '09:00', closeTime: '21:00'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editingShop, setEditingShop] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '', address: '', category: '', udyamNumber: '', lat: '', lng: ''
    });

    // Godown state
    const [godownItems, setGodownItems] = useState([]);
    const [loadingGodownItems, setLoadingGodownItems] = useState(true);
    const [editingGodownItem, setEditingGodownItem] = useState(null);
    const [godownSearchQuery, setGodownSearchQuery] = useState('');
    const [godownFormData, setGodownFormData] = useState({
        name: '', category: '', image: null, imagePreview: ''
    });

    // Settings state
    const [navbarMsg, setNavbarMsg] = useState({ line1: '', line2: '' });
    const [savingSettings, setSavingSettings] = useState(false);

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

    useEffect(() => {
        if (!token || user?.role !== 'super_admin') { navigate('/'); return; }
        fetchShops();
        fetchGodownItems();
        fetchSettings();
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
            setFormData({ vendorName: '', vendorEmail: '', vendorPhone: '', shopName: '', shopAddress: '', shopCategory: '', udyamNumber: '', shopLat: '', shopLng: '', openTime: '09:00', closeTime: '21:00' });
            fetchShops();
        } catch (error) { alert(error.message); }
        finally { setIsSubmitting(false); }
    };

    const handleEditClick = (shop) => {
        setEditingShop(shop);
        setEditFormData({
            name: shop.name || '', address: shop.address || '', category: shop.category || '',
            udyamNumber: shop.udyamNumber || '',
            lat: shop.location?.coordinates[1] || '', lng: shop.location?.coordinates[0] || ''
        });
    };
    const handleEditChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/shops/${editingShop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editFormData)
            });
            if (res.ok) { setEditingShop(null); fetchShops(); }
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
                const fi = document.getElementById('godownImageInput');
                if (fi) fi.value = '';
            } else { const d = await res.json(); alert(d.message || 'Failed'); }
        } catch (err) { console.error(err); }
    };

    const handleGodownEditClick = (item) => {
        setEditingGodownItem(item);
        setGodownFormData({ name: item.name, category: item.category || '', image: null, imagePreview: item.image || '' });
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

    if (!user) return null;

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

    const openCount = shops.filter(s => s.isOpen).length;
    const approvedGodown = godownItems.filter(i => i.status !== 'pending');
    const pendingGodown = godownItems.filter(i => i.status === 'pending');
    const filteredGodown = approvedGodown.filter(i => (i.name || '').toLowerCase().includes((godownSearchQuery || '').toLowerCase()));

    // ===== RENDER =====
    return (
        <div className="admin-root">
            {/* ---- HEADER ---- */}
            <div className="adm-header">
                <div className="adm-header-left" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <button onClick={() => navigate('/')} style={{background: 'transparent', border: 'none', cursor: 'pointer', color: 'white', display: 'flex'}}>
                        <IconBack />
                    </button>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <div className="adm-header-logo">M</div>
                        <span className="adm-header-brand">Admin Console</span>
                    </div>
                </div>
                <div className="adm-header-right">
                    <span className="adm-header-tag">Super Admin</span>
                    <button onClick={() => { logout(); navigate('/'); }} className="adm-header-signout">Sign Out</button>
                </div>
            </div>

            {/* ---- TABS ---- */}
            <div className="adm-tabbar">
                {['onboard', 'shops', 'godown', 'approvals', 'settings'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`adm-tabbar-item ${activeTab === tab ? 'adm-tabbar-item--active' : ''}`}>
                        {tab === 'onboard' ? 'Onboard' : tab === 'shops' ? 'Shops' : tab === 'godown' ? 'Godown' : tab === 'settings' ? 'Settings' : `Approvals (${pendingGodown.length})`}
                    </button>
                ))}
            </div>

            {/* ---- BODY ---- */}
            <div className="adm-body">

                {/* Stats */}
                <div className="adm-stats-bar">
                    <div className="adm-stat">
                        <div className="adm-stat-num">{shops.length}</div>
                        <div className="adm-stat-label">Total Shops</div>
                    </div>
                    <div className="adm-stat">
                        <div className="adm-stat-num adm-stat-num--green">{openCount}</div>
                        <div className="adm-stat-label">Open Now</div>
                    </div>
                    <div className="adm-stat">
                        <div className="adm-stat-num adm-stat-num--yellow">{godownItems.length}</div>
                        <div className="adm-stat-label">Godown Items</div>
                    </div>
                </div>

                {/* == ONBOARD == */}
                {activeTab === 'onboard' && (
                    <div className="adm-section" key="onboard">
                        <div className="adm-section-head">
                            <span className="adm-section-title">Register New Vendor</span>
                        </div>
                        <div className="adm-form-wrap">
                            <form onSubmit={handleSubmit}>
                                <div className="adm-fieldset">
                                    <div className="adm-fieldset-label">Vendor Details</div>
                                    <div className="adm-fields">
                                        <input type="text" name="vendorName" required placeholder="Full name" className="adm-input" value={formData.vendorName} onChange={handleChange} />
                                        <input type="email" name="vendorEmail" required placeholder="Google email" className="adm-input" value={formData.vendorEmail} onChange={handleChange} />
                                        <input type="tel" name="vendorPhone" required placeholder="Phone (10 digits)" className="adm-input" value={formData.vendorPhone} onChange={handleChange} minLength="10" maxLength="10" />
                                    </div>
                                </div>
                                <div className="adm-fieldset">
                                    <div className="adm-fieldset-label">Shop Details</div>
                                    <div className="adm-fields">
                                        <input type="text" name="shopName" required placeholder="Shop name" className="adm-input" value={formData.shopName} onChange={handleChange} />
                                        <input type="text" name="shopAddress" required placeholder="Full address" className="adm-input" value={formData.shopAddress} onChange={handleChange} />
                                        <input type="text" name="shopCategory" placeholder="Category — Kirana, Pharmacy..." className="adm-input" value={formData.shopCategory} onChange={handleChange} />
                                        <input type="text" name="udyamNumber" placeholder="Udyam number (optional)" className="adm-input adm-input--mono" value={formData.udyamNumber} onChange={handleChange} />
                                        <div className="adm-input-row">
                                            <input type="number" step="any" name="shopLat" required placeholder="Latitude" className="adm-input" value={formData.shopLat} onChange={handleChange} />
                                            <input type="number" step="any" name="shopLng" required placeholder="Longitude" className="adm-input" value={formData.shopLng} onChange={handleChange} />
                                        </div>
                                        <div className="adm-input-row">
                                            <div style={{flex: 1}}>
                                                <label style={{fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px'}}>Daily Open Time (Mandatory)</label>
                                                <input type="time" name="openTime" required className="adm-input" value={formData.openTime} onChange={handleChange} />
                                            </div>
                                            <div style={{flex: 1}}>
                                                <label style={{fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px'}}>Daily Close Time (Mandatory)</label>
                                                <input type="time" name="closeTime" required className="adm-input" value={formData.closeTime} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" disabled={isSubmitting} className="adm-submit">
                                    {isSubmitting ? 'Creating...' : 'Create Vendor & Shop'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* == SHOPS == */}
                {activeTab === 'shops' && (
                    <div className="adm-section" key="shops">
                        <div className="adm-section-head">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span className="adm-section-title">All Shops</span>
                                <span className="adm-section-count">{shops.length}</span>
                            </div>
                        </div>
                        {loadingShops ? (
                            <div className="adm-loading">Loading...</div>
                        ) : shops.length === 0 ? (
                            <div className="adm-empty">No shops registered yet.</div>
                        ) : (
                            <div className="adm-table-wrap">
                                <table className="adm-table">
                                    <thead>
                                        <tr>
                                            <th>Shop</th>
                                            <th>Status</th>
                                            <th>Vendor</th>
                                            <th>Udyam</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shops.map(shop => (
                                            <tr key={shop._id}>
                                                <td>
                                                    <div className="adm-table-name">{shop.name}</div>
                                                    <div className="adm-table-sub">{shop.address}</div>
                                                </td>
                                                <td>
                                                    {!shop.isActive ? (
                                                        <span className="adm-pill adm-pill--inactive">Inactive</span>
                                                    ) : (
                                                        <span className={`adm-pill ${shop.isOpen ? 'adm-pill--open' : 'adm-pill--closed'}`}>
                                                            {shop.isOpen ? 'Open' : 'Closed'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{shop.vendorId?.name || '—'}</td>
                                                <td>
                                                    {shop.udyamNumber ? <span className="adm-table-udyam">{shop.udyamNumber}</span> : '—'}
                                                </td>
                                                <td>
                                                    <div className="adm-table-actions">
                                                        <button onClick={() => handleEditClick(shop)} className="adm-tbl-btn adm-tbl-btn--edit">Edit</button>
                                                        <button onClick={() => handleToggleActive(shop)}
                                                            className={`adm-tbl-btn ${shop.isActive ? 'adm-tbl-btn--off' : 'adm-tbl-btn--on'}`}>
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

                {/* == GODOWN == */}
                {activeTab === 'godown' && (
                    <div className="adm-section" key="godown">
                        <div className="adm-section-head">
                            <span className="adm-section-title">Godown Inventory</span>
                            <div className="adm-godown-toolbar">
                                <div className="adm-search">
                                    <svg className="adm-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                    <input type="text" placeholder="Search..." value={godownSearchQuery} onChange={(e) => setGodownSearchQuery(e.target.value)} />
                                </div>
                                <button onClick={() => { setEditingGodownItem(null); setGodownFormData({ name: '', category: '', image: null, imagePreview: '' }); document.getElementById('godownModal').showModal(); }} className="adm-btn-add">+ Add Item</button>
                            </div>
                        </div>
                        {loadingGodownItems ? (
                            <div className="adm-loading">Loading inventory...</div>
                        ) : approvedGodown.length === 0 ? (
                            <div className="adm-empty">Godown is empty.</div>
                        ) : (
                            <div className="adm-godown-grid">
                                {filteredGodown.map(item => (
                                    <div key={item._id} className="adm-godown-cell">
                                        <div className="adm-godown-img">
                                            {item.image ? <img src={item.image} alt={item.name} /> : <span className="adm-godown-img-ph">▪</span>}
                                        </div>
                                        <div className="adm-godown-name">{item.name}</div>
                                        {item.category && <div className="adm-godown-cat">{item.category}</div>}
                                        <div className="adm-godown-actions">
                                            <button onClick={() => { handleGodownEditClick(item); document.getElementById('godownModal').showModal(); }} className="adm-godown-act-btn adm-godown-act-btn--edit">Edit</button>
                                            <button onClick={() => handleDeleteGodownItem(item._id)} className="adm-godown-act-btn adm-godown-act-btn--del">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* == APPROVALS == */}
                {activeTab === 'approvals' && (
                    <div className="adm-section" key="approvals">
                        <div className="adm-section-head">
                            <span className="adm-section-title">Pending Godown Approvals</span>
                        </div>
                        {loadingGodownItems ? (
                            <div className="adm-loading">Loading approvals...</div>
                        ) : pendingGodown.length === 0 ? (
                            <div className="adm-empty">No pending items for approval!</div>
                        ) : (
                            <div className="adm-table-wrap">
                                <table className="adm-table">
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Name</th>
                                            <th>Category</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingGodown.map(item => (
                                            <tr key={item._id}>
                                                <td>
                                                    <div style={{width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f1f5f9'}}>
                                                        {item.image ? <img src={item.image} alt={item.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : null}
                                                    </div>
                                                </td>
                                                <td style={{fontWeight: '500', color: '#1e293b'}}>{item.name}</td>
                                                <td>{item.category || '—'}</td>
                                                <td>
                                                    <div style={{display: 'flex', gap: '8px'}}>
                                                        <button onClick={() => handleApproveGodownItem(item._id)} style={{padding: '6px 12px', background: '#10b981', color: 'white', borderRadius: '4px', fontSize: '12px', fontWeight: '500'}}>Accept</button>
                                                        <button onClick={() => handleDeleteGodownItem(item._id)} style={{padding: '6px 12px', background: '#ef4444', color: 'white', borderRadius: '4px', fontSize: '12px', fontWeight: '500'}}>Delete</button>
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
                {/* == SETTINGS == */}
                {activeTab === 'settings' && (
                    <div className="adm-section" key="settings">
                        <div className="adm-section-head">
                            <span className="adm-section-title">App Settings</span>
                        </div>
                        <div className="adm-form-wrap" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <form onSubmit={handleSettingsSubmit}>
                                <div className="adm-fieldset">
                                    <div className="adm-fieldset-label">Dynamic Navbar Message</div>
                                    <p style={{fontSize: '12px', color: '#64748b', marginBottom: '16px', marginTop: '-4px'}}>This message appears at the top of the home screen for all users.</p>
                                    <div className="adm-fields">
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Line 1 (e.g. Your local market,)" 
                                            className="adm-input" 
                                            value={navbarMsg.line1} 
                                            onChange={(e) => setNavbarMsg({...navbarMsg, line1: e.target.value})} 
                                        />
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Line 2 (e.g. delivered in minutes ⚡)" 
                                            className="adm-input" 
                                            value={navbarMsg.line2} 
                                            onChange={(e) => setNavbarMsg({...navbarMsg, line2: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div className="adm-form-actions" style={{marginTop: '16px'}}>
                                    <button type="submit" disabled={savingSettings} className="adm-submit">
                                        {savingSettings ? 'Saving...' : 'Update Message'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* ---- GODOWN MODAL ---- */}
            <dialog id="godownModal" className="adm-dialog">
                <div className="adm-modal">
                    <div className="adm-modal-head">
                        <span className="adm-modal-title">{editingGodownItem ? 'Edit Item' : 'Add Item'}</span>
                        <button onClick={() => { document.getElementById('godownModal').close(); setEditingGodownItem(null); }} className="adm-modal-x">✕</button>
                    </div>
                    <form onSubmit={(e) => { handleGodownSubmit(e); document.getElementById('godownModal').close(); }} className="adm-modal-body">
                        <div className="adm-upload-zone">
                            <label style={{ cursor: 'pointer' }}>
                                <div className="adm-upload-box">
                                    {godownFormData.imagePreview ? <img src={godownFormData.imagePreview} alt="Preview" /> : <span className="adm-upload-hint">Add photo</span>}
                                </div>
                                <input id="godownImageInput" type="file" name="image" accept="image/*" onChange={handleGodownFormChange} style={{ display: 'none' }} />
                            </label>
                        </div>
                        <div className="adm-modal-field">
                            <label>Item Name</label>
                            <input type="text" name="name" required className="adm-input" value={godownFormData.name} onChange={handleGodownFormChange} placeholder="e.g. Aashirvaad Atta 5kg" />
                        </div>
                        <div className="adm-modal-field">
                            <label>Category</label>
                            <input type="text" name="category" className="adm-input" value={godownFormData.category} onChange={handleGodownFormChange} placeholder="e.g. Grocery" />
                        </div>
                        <button type="submit" className="adm-submit">{editingGodownItem ? 'Update Item' : 'Add to Godown'}</button>
                    </form>
                </div>
            </dialog>

            {/* ---- EDIT SHOP MODAL ---- */}
            {editingShop && (
                <div className="adm-modal-bg">
                    <div className="adm-modal">
                        <div className="adm-modal-head">
                            <span className="adm-modal-title">Edit Shop</span>
                            <button onClick={() => setEditingShop(null)} className="adm-modal-x">✕</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="adm-modal-body">
                            <div className="adm-modal-field">
                                <label>Shop Name</label>
                                <input type="text" name="name" required className="adm-input" value={editFormData.name} onChange={handleEditChange} />
                            </div>
                            <div className="adm-modal-field">
                                <label>Address</label>
                                <input type="text" name="address" required className="adm-input" value={editFormData.address} onChange={handleEditChange} />
                            </div>
                            <div className="adm-modal-field">
                                <label>Category</label>
                                <input type="text" name="category" className="adm-input" value={editFormData.category} onChange={handleEditChange} />
                            </div>
                            <div className="adm-modal-field">
                                <label>Udyam Number</label>
                                <input type="text" name="udyamNumber" className="adm-input adm-input--mono" value={editFormData.udyamNumber} onChange={handleEditChange} />
                            </div>
                            <div className="adm-input-row">
                                <div className="adm-modal-field">
                                    <label>Latitude</label>
                                    <input type="number" step="any" name="lat" required className="adm-input" value={editFormData.lat} onChange={handleEditChange} />
                                </div>
                                <div className="adm-modal-field">
                                    <label>Longitude</label>
                                    <input type="number" step="any" name="lng" required className="adm-input" value={editFormData.lng} onChange={handleEditChange} />
                                </div>
                            </div>
                            <button type="submit" className="adm-submit">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
