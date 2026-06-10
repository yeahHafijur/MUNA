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

    useEffect(() => {
        // Protect Route
        if (!token || user?.role !== 'super_admin') {
            navigate('/');
            return;
        }

        fetchShops();
        fetchGodownItems();
    }, [token, user, navigate]);

    // --- GODOWN INVENTORY STATE & FUNCTIONS ---
    const [godownItems, setGodownItems] = useState([]);
    const [loadingGodownItems, setLoadingGodownItems] = useState(true);
    const [editingGodownItem, setEditingGodownItem] = useState(null);
    const [godownSearchQuery, setGodownSearchQuery] = useState('');

    // For Add and Edit Godown Items
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
    // ------------------------------------------

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
            // Reset form
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

            // Refresh shop list
            fetchShops();

        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="admin-container">
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-header-title">Super Admin Panel</h1>
                    <p className="admin-header-subtitle">Manage the entire platform</p>
                </div>
                <div className="admin-header-actions">
                    <span className="admin-god-mode-badge">God Mode</span>
                    <button onClick={() => { logout(); navigate('/'); }} className="admin-logout-btn">Logout</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="admin-tabs-container">
                <button 
                    onClick={() => setActiveTab('onboard')} 
                    className={`admin-tab-btn ${activeTab === 'onboard' ? 'admin-tab-btn-purple-active' : 'admin-tab-btn-inactive'}`}
                >
                    🚀 Onboard Vendor
                </button>
                <button 
                    onClick={() => setActiveTab('shops')} 
                    className={`admin-tab-btn ${activeTab === 'shops' ? 'admin-tab-btn-purple-active' : 'admin-tab-btn-inactive'}`}
                >
                    🏪 Active Shops
                </button>
                <button 
                    onClick={() => setActiveTab('godown')} 
                    className={`admin-tab-btn ${activeTab === 'godown' ? 'admin-tab-btn-indigo-active' : 'admin-tab-btn-inactive'}`}
                >
                    📦 Godown Inventory
                </button>
            </div>

            <div className="space-y-6">
                {/* Onboarding Form */}
                {activeTab === 'onboard' && (
                <div className="admin-card admin-card-onboard">
                    <h2 className="admin-section-title">
                        <span>🚀</span> Onboard New Vendor
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="admin-form-group">
                            <h3 className="admin-form-group-title">1. Vendor Details</h3>
                            <input type="text" name="vendorName" required placeholder="Vendor Full Name" className="admin-form-input admin-form-input-purple" value={formData.vendorName} onChange={handleChange} />
                            <input type="email" name="vendorEmail" required placeholder="Vendor Google Email" className="admin-form-input admin-form-input-purple" value={formData.vendorEmail} onChange={handleChange} />
                            <input type="tel" name="vendorPhone" required placeholder="Vendor Phone Number (10 digits)" className="admin-form-input admin-form-input-purple" value={formData.vendorPhone} onChange={handleChange} minLength="10" maxLength="10" />
                        </div>

                        <div className="admin-form-group">
                            <h3 className="admin-form-group-title">2. Shop Details</h3>
                            <input type="text" name="shopName" required placeholder="Shop Name" className="admin-form-input admin-form-input-purple" value={formData.shopName} onChange={handleChange} />
                            <input type="text" name="shopAddress" required placeholder="Shop Address" className="admin-form-input admin-form-input-purple" value={formData.shopAddress} onChange={handleChange} />
                            <input type="text" name="shopCategory" placeholder="Category (e.g. Kirana, Pharmacy)" className="admin-form-input admin-form-input-purple" value={formData.shopCategory} onChange={handleChange} />
                            <input type="text" name="udyamNumber" placeholder="Udyam Number (Optional)" className="admin-form-input admin-form-input-purple admin-form-input-semibold" value={formData.udyamNumber} onChange={handleChange} />
                            
                            <div className="admin-form-row">
                                <input type="number" step="any" name="shopLat" required placeholder="Latitude (Required)" className="admin-form-input-flex" value={formData.shopLat} onChange={handleChange} />
                                <input type="number" step="any" name="shopLng" required placeholder="Longitude (Required)" className="admin-form-input-flex" value={formData.shopLng} onChange={handleChange} />
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="admin-submit-btn-purple">
                            {isSubmitting ? 'ONBOARDING...' : 'CREATE VENDOR & SHOP'}
                        </button>
                    </form>
                </div>
                )}

                {/* Active Shops List */}
                {activeTab === 'shops' && (
                <div className="admin-card">
                    <h2 className="admin-section-title">
                        <span>🏪</span> Active Shops ({shops.length})
                    </h2>
                    
                    {loadingShops ? (
                        <p className="admin-loading-text">Loading shops...</p>
                    ) : shops.length === 0 ? (
                        <p className="admin-empty-text">No shops on the platform yet.</p>
                    ) : (
                        <div className="admin-shops-grid">
                            {shops.map(shop => (
                                <div key={shop._id} className="admin-shop-item">
                                    <div className="admin-shop-header">
                                        <div className="admin-shop-title-wrapper">
                                            <h3 className="admin-shop-title">{shop.name}</h3>
                                            {!shop.isActive && (
                                                <span className="admin-badge-inactive">Inactive</span>
                                            )}
                                        </div>
                                        <span className={`admin-badge-status ${shop.isOpen ? 'admin-badge-status-open' : 'admin-badge-status-closed'}`}>
                                            {shop.isOpen ? 'OPEN' : 'CLOSED'}
                                        </span>
                                    </div>
                                    <p className="admin-shop-address">{shop.address}</p>
                                    
                                    <div className="admin-shop-details">
                                        <div className="admin-shop-detail-row">
                                            <span className="admin-shop-detail-label">Vendor:</span>
                                            <span className="admin-shop-detail-value">{shop.vendorId?.name || 'Unknown'}</span>
                                        </div>
                                        {shop.udyamNumber && (
                                            <div className="admin-shop-detail-row">
                                                <span className="admin-shop-detail-label">Udyam No:</span>
                                                <span className="admin-shop-detail-highlight">{shop.udyamNumber}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="admin-shop-actions">
                                        <button onClick={() => handleEditClick(shop)} className="admin-btn-edit">
                                            ✏️ Edit
                                        </button>
                                        <button onClick={() => handleToggleActive(shop)} className={`admin-btn-toggle ${shop.isActive ? 'admin-btn-toggle-deactivate' : 'admin-btn-toggle-activate'}`}>
                                            {shop.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                )}

            {/* --- GODOWN INVENTORY MANAGEMENT --- */}
            {activeTab === 'godown' && (
            <div className="admin-card">
                <div className="admin-godown-header">
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <span>📦</span> Global Godown Inventory
                    </h2>
                    <div className="admin-godown-actions">
                        <div className="admin-search-wrapper">
                            <input 
                                type="text" 
                                placeholder="Search items..." 
                                className="admin-search-input"
                                value={godownSearchQuery}
                                onChange={(e) => setGodownSearchQuery(e.target.value)}
                            />
                            <span className="admin-search-icon">🔍</span>
                        </div>
                        <button 
                            onClick={() => {
                                setEditingGodownItem(null);
                                setGodownFormData({ name: '', category: '', image: null, imagePreview: '' });
                                document.getElementById('godownModal').showModal();
                            }} 
                            className="admin-btn-add-godown"
                        >
                            + Add New Item
                        </button>
                    </div>
                </div>

                {loadingGodownItems ? (
                    <p className="admin-loading-text">Loading inventory...</p>
                ) : godownItems.length === 0 ? (
                    <p className="admin-empty-text">Godown is empty.</p>
                ) : (
                    <div className="admin-godown-grid">
                        {godownItems.filter(item => (item.name || '').toLowerCase().includes((godownSearchQuery || '').toLowerCase())).map(item => (
                            <div key={item._id} className="admin-godown-item group">
                                <button onClick={() => handleDeleteGodownItem(item._id)} className="admin-godown-btn-delete">✕</button>
                                <button onClick={() => { handleGodownEditClick(item); document.getElementById('godownModal').showModal(); }} className="admin-godown-btn-edit">✏️</button>

                                <div className="admin-godown-img-wrapper">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="admin-godown-img" />
                                    ) : (
                                        <div className="admin-godown-img-placeholder">?</div>
                                    )}
                                </div>
                                <h3 className="admin-godown-title">{item.name}</h3>
                                {item.category && <p className="admin-godown-category">{item.category}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            )}
            </div>

            {/* Godown Item Modal (Add/Edit) */}
            <dialog id="godownModal" className="admin-modal-dialog">
                <div className="admin-modal-content">
                    <div className="admin-modal-header-indigo">
                        <h2 className="admin-modal-title">{editingGodownItem ? 'Edit Godown Item' : 'Add Godown Item'}</h2>
                        <button onClick={() => {
                            document.getElementById('godownModal').close();
                            setEditingGodownItem(null);
                        }} className="admin-modal-close-btn">
                            ✕
                        </button>
                    </div>
                    <form onSubmit={(e) => { handleGodownSubmit(e); document.getElementById('godownModal').close(); }} className="admin-modal-body">
                        <div className="admin-modal-form-group">
                            <div className="admin-img-upload-wrapper">
                                <label className="admin-img-upload-label group">
                                    <div className="admin-img-upload-preview group">
                                        {godownFormData.imagePreview ? (
                                            <img src={godownFormData.imagePreview} alt="Preview" className="admin-img-preview-img" />
                                        ) : (
                                            <span className="admin-img-upload-text">Click to add photo</span>
                                        )}
                                    </div>
                                    <input id="godownImageInput" type="file" name="image" accept="image/*" onChange={handleGodownFormChange} className="hidden" />
                                </label>
                            </div>
                            <div>
                                <label className="admin-form-label">Item Name</label>
                                <input type="text" name="name" required className="admin-form-input admin-form-input-indigo" value={godownFormData.name} onChange={handleGodownFormChange} placeholder="e.g. Aashirvaad Atta 5kg" />
                            </div>
                            <div>
                                <label className="admin-form-label">Category (Optional)</label>
                                <input type="text" name="category" className="admin-form-input admin-form-input-indigo" value={godownFormData.category} onChange={handleGodownFormChange} placeholder="e.g. Grocery" />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button type="submit" className="admin-submit-btn-indigo">
                                {editingGodownItem ? 'UPDATE ITEM' : 'ADD TO GODOWN'}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>

            {/* Edit Shop Modal */}
            {editingShop && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content">
                        <div className="admin-modal-header-purple">
                            <h2 className="admin-modal-title">Edit Shop Details</h2>
                            <button onClick={() => setEditingShop(null)} className="admin-modal-close-btn">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="admin-modal-body">
                            <div className="admin-modal-form-group">
                                <div>
                                    <label className="admin-form-label">Shop Name</label>
                                    <input type="text" name="name" required className="admin-form-input admin-form-input-purple" value={editFormData.name} onChange={handleEditChange} />
                                </div>
                                <div>
                                    <label className="admin-form-label">Address</label>
                                    <input type="text" name="address" required className="admin-form-input admin-form-input-purple" value={editFormData.address} onChange={handleEditChange} />
                                </div>
                                <div>
                                    <label className="admin-form-label">Category</label>
                                    <input type="text" name="category" className="admin-form-input admin-form-input-purple" value={editFormData.category} onChange={handleEditChange} />
                                </div>
                                <div>
                                    <label className="admin-form-label">Udyam Number</label>
                                    <input type="text" name="udyamNumber" className="admin-form-input admin-form-input-purple" value={editFormData.udyamNumber} onChange={handleEditChange} />
                                </div>
                                <div className="admin-form-row">
                                    <div className="flex-1">
                                        <label className="admin-form-label">Latitude</label>
                                        <input type="number" step="any" name="lat" required className="admin-form-input admin-form-input-purple" value={editFormData.lat} onChange={handleEditChange} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="admin-form-label">Longitude</label>
                                        <input type="number" step="any" name="lng" required className="admin-form-input admin-form-input-purple" value={editFormData.lng} onChange={handleEditChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="admin-modal-footer">
                                <button type="submit" className="admin-submit-btn-purple">
                                    SAVE CHANGES
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;

