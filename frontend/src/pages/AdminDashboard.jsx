import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [shops, setShops] = useState([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [activeTab, setActiveTab] = useState('onboard');

    const [formData, setFormData] = useState({
        vendorName: '',
        vendorEmail: '',
        vendorPhone: '',
        shopName: '',
        shopAddress: '',
        shopCategory: '',
        udyamNumber: '',
        shopLat: '',
        shopLng: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editingShop, setEditingShop] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        address: '',
        category: '',
        udyamNumber: '',
        lat: '',
        lng: ''
    });

    const handleEditClick = (shop) => {
        setEditingShop(shop);
        setEditFormData({
            name: shop.name || '',
            address: shop.address || '',
            category: shop.category || '',
            udyamNumber: shop.udyamNumber || '',
            lat: shop.location?.coordinates[1] || '',
            lng: shop.location?.coordinates[0] || ''
        });
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/shops/${editingShop._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editFormData)
            });
            if (res.ok) {
                setEditingShop(null);
                fetchShops();
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to update shop');
            }
        } catch (error) {
            console.error('Error updating shop:', error);
        }
    };

    const handleToggleActive = async (shop) => {
        if (!window.confirm(`Are you sure you want to ${shop.isActive ? 'DEACTIVATE' : 'ACTIVATE'} ${shop.name}?`)) return;
        try {
            const res = await fetch(`/api/shops/${shop._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !shop.isActive })
            });
            if (res.ok) {
                fetchShops();
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to toggle status');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    const fetchShops = async () => {
        try {
            const res = await fetch('/api/shops?admin=true', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            setShops(Array.isArray(data) ? data : []);
            setLoadingShops(false);
        } catch (error) {
            console.error('Error fetching shops:', error);
            setShops([]);
            setLoadingShops(false);
        }
    };

    // --- GODOWN INVENTORY STATE & FUNCTIONS ---
    const [godownItems, setGodownItems] = useState([]);
    const [loadingGodownItems, setLoadingGodownItems] = useState(true);
    const [editingGodownItem, setEditingGodownItem] = useState(null);
    const [godownSearchQuery, setGodownSearchQuery] = useState('');

    const [godownFormData, setGodownFormData] = useState({
        name: '',
        category: '',
        image: null,
        imagePreview: ''
    });

    const fetchGodownItems = async () => {
        try {
            const res = await fetch('/api/master-products');
            const data = await res.json();
            setGodownItems(Array.isArray(data) ? data : []);
            setLoadingGodownItems(false);
        } catch (error) {
            console.error("Error fetching godown items:", error);
            setGodownItems([]);
            setLoadingGodownItems(false);
        }
    };

    const handleGodownFormChange = (e) => {
        if (e.target.name === 'image') {
            const file = e.target.files[0];
            setGodownFormData({
                ...godownFormData,
                image: file,
                imagePreview: file ? URL.createObjectURL(file) : ''
            });
        } else {
            setGodownFormData({ ...godownFormData, [e.target.name]: e.target.value });
        }
    };

    const handleGodownSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', godownFormData.name);
        fd.append('category', godownFormData.category);
        if (godownFormData.image) {
            fd.append('image', godownFormData.image);
        }

        try {
            const url = editingGodownItem
                ? `/api/master-products/${editingGodownItem._id}`
                : '/api/master-products';
            const method = editingGodownItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: fd
            });

            if (res.ok) {
                setGodownFormData({ name: '', category: '', image: null, imagePreview: '' });
                setEditingGodownItem(null);
                fetchGodownItems();
                const fileInput = document.getElementById('godownImageInput');
                if (fileInput) fileInput.value = '';
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to save godown item');
            }
        } catch (error) {
            console.error("Error saving godown item:", error);
        }
    };

    const handleGodownEditClick = (item) => {
        setEditingGodownItem(item);
        setGodownFormData({
            name: item.name,
            category: item.category || '',
            image: null,
            imagePreview: item.image || ''
        });
    };

    const handleDeleteGodownItem = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item from the Global Godown?")) return;
        try {
            const res = await fetch(`/api/master-products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchGodownItems();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to delete item");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    useEffect(() => {
        if (!token || user?.role !== 'super_admin') {
            navigate('/');
            return;
        }
        fetchShops();
        fetchGodownItems();
    }, [token, user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/admin/onboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Error onboarding vendor');
            }

            alert(data.message);
            setFormData({
                vendorName: '',
                vendorEmail: '',
                vendorPhone: '',
                shopName: '',
                shopAddress: '',
                shopCategory: '',
                udyamNumber: '',
                shopLat: '',
                shopLng: ''
            });

            fetchShops();

        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    const openShops = shops.filter(s => s.isOpen).length;

    return (
        <div className="admin-page">
            {/* ---- Top Bar ---- */}
            <div className="admin-topbar">
                <div className="admin-topbar-left">
                    <div className="admin-topbar-logo">M</div>
                    <div>
                        <div className="admin-topbar-title">Admin Console</div>
                        <div className="admin-topbar-subtitle">MUNA Platform Management</div>
                    </div>
                </div>
                <div className="admin-topbar-right">
                    <span className="admin-role-chip">Super Admin</span>
                    <button onClick={() => { logout(); navigate('/'); }} className="admin-logout-btn">Sign Out</button>
                </div>
            </div>

            {/* ---- Stats ---- */}
            <div className="admin-stats">
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Total Shops</div>
                    <div className="admin-stat-value">{shops.length}</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Open Now</div>
                    <div className="admin-stat-value admin-stat-value--green">{openShops}</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-label">Godown Items</div>
                    <div className="admin-stat-value admin-stat-value--accent">{godownItems.length}</div>
                </div>
            </div>

            {/* ---- Tabs ---- */}
            <div className="admin-tabs">
                <button
                    onClick={() => setActiveTab('onboard')}
                    className={`admin-tab ${activeTab === 'onboard' ? 'admin-tab--active' : ''}`}
                >
                    Onboard Vendor
                </button>
                <button
                    onClick={() => setActiveTab('shops')}
                    className={`admin-tab ${activeTab === 'shops' ? 'admin-tab--active' : ''}`}
                >
                    Shops
                </button>
                <button
                    onClick={() => setActiveTab('godown')}
                    className={`admin-tab ${activeTab === 'godown' ? 'admin-tab--active' : ''}`}
                >
                    Godown
                </button>
            </div>

            {/* ---- Content ---- */}
            <div className="admin-content">

                {/* == ONBOARD TAB == */}
                {activeTab === 'onboard' && (
                    <div className="admin-panel" key="onboard">
                        <div className="admin-panel-header">
                            <span className="admin-panel-title">New Vendor Registration</span>
                        </div>
                        <div className="admin-panel-body">
                            <form onSubmit={handleSubmit} className="admin-form">
                                <div className="admin-fieldset">
                                    <div className="admin-fieldset-title">Vendor Information</div>
                                    <div className="admin-fields">
                                        <input type="text" name="vendorName" required placeholder="Full name" className="admin-input" value={formData.vendorName} onChange={handleChange} />
                                        <input type="email" name="vendorEmail" required placeholder="Google email" className="admin-input" value={formData.vendorEmail} onChange={handleChange} />
                                        <input type="tel" name="vendorPhone" required placeholder="Phone number (10 digits)" className="admin-input" value={formData.vendorPhone} onChange={handleChange} minLength="10" maxLength="10" />
                                    </div>
                                </div>

                                <div className="admin-fieldset">
                                    <div className="admin-fieldset-title">Shop Information</div>
                                    <div className="admin-fields">
                                        <input type="text" name="shopName" required placeholder="Shop name" className="admin-input" value={formData.shopName} onChange={handleChange} />
                                        <input type="text" name="shopAddress" required placeholder="Full address" className="admin-input" value={formData.shopAddress} onChange={handleChange} />
                                        <input type="text" name="shopCategory" placeholder="Category — e.g. Kirana, Pharmacy" className="admin-input" value={formData.shopCategory} onChange={handleChange} />
                                        <input type="text" name="udyamNumber" placeholder="Udyam number (optional)" className="admin-input admin-input--mono" value={formData.udyamNumber} onChange={handleChange} />
                                        <div className="admin-input-row">
                                            <input type="number" step="any" name="shopLat" required placeholder="Latitude" className="admin-input" value={formData.shopLat} onChange={handleChange} />
                                            <input type="number" step="any" name="shopLng" required placeholder="Longitude" className="admin-input" value={formData.shopLng} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={isSubmitting} className="admin-submit-btn">
                                    {isSubmitting ? 'Creating...' : 'Create Vendor & Shop'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* == SHOPS TAB == */}
                {activeTab === 'shops' && (
                    <div className="admin-panel" key="shops">
                        <div className="admin-panel-header">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span className="admin-panel-title">All Shops</span>
                                <span className="admin-panel-count">{shops.length}</span>
                            </div>
                        </div>
                        <div className="admin-panel-body">
                            {loadingShops ? (
                                <p className="admin-loading">Loading shops...</p>
                            ) : shops.length === 0 ? (
                                <p className="admin-empty">No shops on the platform yet.</p>
                            ) : (
                                <div className="admin-shops-list">
                                    {shops.map(shop => (
                                        <div key={shop._id} className="admin-shop-card">
                                            <div className="admin-shop-card-top">
                                                <div className="admin-shop-name">
                                                    {shop.name}
                                                    {!shop.isActive && (
                                                        <span className="admin-badge admin-badge--inactive">Inactive</span>
                                                    )}
                                                </div>
                                                <span className={`admin-badge ${shop.isOpen ? 'admin-badge--open' : 'admin-badge--closed'}`}>
                                                    {shop.isOpen ? 'OPEN' : 'CLOSED'}
                                                </span>
                                            </div>
                                            <p className="admin-shop-address">{shop.address}</p>

                                            <div className="admin-shop-meta">
                                                <div className="admin-shop-meta-row">
                                                    <span className="admin-shop-meta-label">Vendor</span>
                                                    <span className="admin-shop-meta-value">{shop.vendorId?.name || 'Unknown'}</span>
                                                </div>
                                                {shop.udyamNumber && (
                                                    <div className="admin-shop-meta-row">
                                                        <span className="admin-shop-meta-label">Udyam</span>
                                                        <span className="admin-shop-meta-highlight">{shop.udyamNumber}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="admin-shop-actions">
                                                <button onClick={() => handleEditClick(shop)} className="admin-btn admin-btn--edit">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleToggleActive(shop)} className={`admin-btn ${shop.isActive ? 'admin-btn--deactivate' : 'admin-btn--activate'}`}>
                                                    {shop.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* == GODOWN TAB == */}
                {activeTab === 'godown' && (
                    <div className="admin-panel" key="godown">
                        <div className="admin-panel-header">
                            <span className="admin-panel-title">Global Godown</span>
                            <div className="admin-godown-toolbar">
                                <div className="admin-search-box">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        value={godownSearchQuery}
                                        onChange={(e) => setGodownSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingGodownItem(null);
                                        setGodownFormData({ name: '', category: '', image: null, imagePreview: '' });
                                        document.getElementById('godownModal').showModal();
                                    }}
                                    className="admin-btn-add"
                                >
                                    + Add Item
                                </button>
                            </div>
                        </div>
                        <div className="admin-panel-body">
                            {loadingGodownItems ? (
                                <p className="admin-loading">Loading inventory...</p>
                            ) : godownItems.length === 0 ? (
                                <p className="admin-empty">Godown is empty.</p>
                            ) : (
                                <div className="admin-godown-grid">
                                    {godownItems.filter(item => (item.name || '').toLowerCase().includes((godownSearchQuery || '').toLowerCase())).map(item => (
                                        <div key={item._id} className="admin-godown-card">
                                            <div className="admin-godown-card-actions">
                                                <button onClick={() => { handleGodownEditClick(item); document.getElementById('godownModal').showModal(); }} className="admin-godown-icon-btn admin-godown-icon-btn--edit">✎</button>
                                                <button onClick={() => handleDeleteGodownItem(item._id)} className="admin-godown-icon-btn admin-godown-icon-btn--delete">✕</button>
                                            </div>

                                            <div className="admin-godown-thumb">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} />
                                                ) : (
                                                    <span className="admin-godown-thumb-placeholder">□</span>
                                                )}
                                            </div>
                                            <div className="admin-godown-name">{item.name}</div>
                                            {item.category && <div className="admin-godown-cat">{item.category}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ---- Godown Modal (Add/Edit) ---- */}
            <dialog id="godownModal" className="admin-dialog">
                <div className="admin-modal">
                    <div className="admin-modal-header">
                        <span className="admin-modal-title">{editingGodownItem ? 'Edit Item' : 'Add Item'}</span>
                        <button onClick={() => {
                            document.getElementById('godownModal').close();
                            setEditingGodownItem(null);
                        }} className="admin-modal-close">
                            ✕
                        </button>
                    </div>
                    <form onSubmit={(e) => { handleGodownSubmit(e); document.getElementById('godownModal').close(); }} className="admin-modal-body">
                        <div className="admin-img-upload">
                            <label style={{ cursor: 'pointer' }}>
                                <div className="admin-img-upload-area">
                                    {godownFormData.imagePreview ? (
                                        <img src={godownFormData.imagePreview} alt="Preview" />
                                    ) : (
                                        <span className="admin-img-upload-text">Add photo</span>
                                    )}
                                </div>
                                <input id="godownImageInput" type="file" name="image" accept="image/*" onChange={handleGodownFormChange} style={{ display: 'none' }} />
                            </label>
                        </div>
                        <div className="admin-modal-field">
                            <label className="admin-modal-label">Item Name</label>
                            <input type="text" name="name" required className="admin-input" value={godownFormData.name} onChange={handleGodownFormChange} placeholder="e.g. Aashirvaad Atta 5kg" />
                        </div>
                        <div className="admin-modal-field">
                            <label className="admin-modal-label">Category</label>
                            <input type="text" name="category" className="admin-input" value={godownFormData.category} onChange={handleGodownFormChange} placeholder="e.g. Grocery" />
                        </div>
                        <button type="submit" className="admin-submit-btn">
                            {editingGodownItem ? 'Update Item' : 'Add to Godown'}
                        </button>
                    </form>
                </div>
            </dialog>

            {/* ---- Edit Shop Modal ---- */}
            {editingShop && (
                <div className="admin-modal-backdrop">
                    <div className="admin-modal">
                        <div className="admin-modal-header">
                            <span className="admin-modal-title">Edit Shop</span>
                            <button onClick={() => setEditingShop(null)} className="admin-modal-close">✕</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="admin-modal-body">
                            <div className="admin-modal-field">
                                <label className="admin-modal-label">Shop Name</label>
                                <input type="text" name="name" required className="admin-input" value={editFormData.name} onChange={handleEditChange} />
                            </div>
                            <div className="admin-modal-field">
                                <label className="admin-modal-label">Address</label>
                                <input type="text" name="address" required className="admin-input" value={editFormData.address} onChange={handleEditChange} />
                            </div>
                            <div className="admin-modal-field">
                                <label className="admin-modal-label">Category</label>
                                <input type="text" name="category" className="admin-input" value={editFormData.category} onChange={handleEditChange} />
                            </div>
                            <div className="admin-modal-field">
                                <label className="admin-modal-label">Udyam Number</label>
                                <input type="text" name="udyamNumber" className="admin-input admin-input--mono" value={editFormData.udyamNumber} onChange={handleEditChange} />
                            </div>
                            <div className="admin-input-row">
                                <div className="admin-modal-field" style={{ flex: 1 }}>
                                    <label className="admin-modal-label">Latitude</label>
                                    <input type="number" step="any" name="lat" required className="admin-input" value={editFormData.lat} onChange={handleEditChange} />
                                </div>
                                <div className="admin-modal-field" style={{ flex: 1 }}>
                                    <label className="admin-modal-label">Longitude</label>
                                    <input type="number" step="any" name="lng" required className="admin-input" value={editFormData.lng} onChange={handleEditChange} />
                                </div>
                            </div>
                            <button type="submit" className="admin-submit-btn">
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
