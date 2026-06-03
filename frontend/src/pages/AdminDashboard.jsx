import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
        <div className="max-w-4xl mx-auto mt-6 pb-20">
            {/* Header */}
            <div className="bg-purple-900 text-white p-6 rounded-xl mb-6 flex justify-between items-center shadow-lg">
                <div>
                    <h1 className="text-2xl font-black">Super Admin Panel</h1>
                    <p className="text-purple-200 text-sm">Manage the entire platform</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="hidden sm:inline-block bg-white text-purple-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">God Mode</span>
                    <button onClick={() => { logout(); navigate('/'); }} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold text-sm transition-colors">Logout</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-1 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab('onboard')} 
                    className={`flex-1 py-3 px-4 font-bold text-sm rounded-lg transition-colors whitespace-nowrap ${activeTab === 'onboard' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    🚀 Onboard Vendor
                </button>
                <button 
                    onClick={() => setActiveTab('shops')} 
                    className={`flex-1 py-3 px-4 font-bold text-sm rounded-lg transition-colors whitespace-nowrap ${activeTab === 'shops' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    🏪 Active Shops
                </button>
                <button 
                    onClick={() => setActiveTab('godown')} 
                    className={`flex-1 py-3 px-4 font-bold text-sm rounded-lg transition-colors whitespace-nowrap ${activeTab === 'godown' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    📦 Godown Inventory
                </button>
            </div>

            <div className="space-y-6">
                {/* Onboarding Form */}
                {activeTab === 'onboard' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
                    <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                        <span>🚀</span> Onboard New Vendor
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">1. Vendor Details</h3>
                            <input type="text" name="vendorName" required placeholder="Vendor Full Name" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.vendorName} onChange={handleChange} />
                            <input type="email" name="vendorEmail" required placeholder="Vendor Google Email" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.vendorEmail} onChange={handleChange} />
                            <input type="tel" name="vendorPhone" required placeholder="Vendor Phone Number (10 digits)" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.vendorPhone} onChange={handleChange} minLength="10" maxLength="10" />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">2. Shop Details</h3>
                            <input type="text" name="shopName" required placeholder="Shop Name" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.shopName} onChange={handleChange} />
                            <input type="text" name="shopAddress" required placeholder="Shop Address" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.shopAddress} onChange={handleChange} />
                            <input type="text" name="shopCategory" placeholder="Category (e.g. Kirana, Pharmacy)" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.shopCategory} onChange={handleChange} />
                            <input type="text" name="udyamNumber" placeholder="Udyam Number (Optional)" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm font-semibold tracking-wide" value={formData.udyamNumber} onChange={handleChange} />
                            
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input type="number" step="any" name="shopLat" required placeholder="Latitude (Required)" className="flex-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.shopLat} onChange={handleChange} />
                                <input type="number" step="any" name="shopLng" required placeholder="Longitude (Required)" className="flex-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.shopLng} onChange={handleChange} />
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-xl transition-colors shadow-sm">
                            {isSubmitting ? 'ONBOARDING...' : 'CREATE VENDOR & SHOP'}
                        </button>
                    </form>
                </div>
                )}

                {/* Active Shops List */}
                {activeTab === 'shops' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                        <span>🏪</span> Active Shops ({shops.length})
                    </h2>
                    
                    {loadingShops ? (
                        <p className="text-gray-500 animate-pulse font-bold text-sm">Loading shops...</p>
                    ) : shops.length === 0 ? (
                        <p className="text-gray-500 text-sm">No shops on the platform yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto pr-2">
                            {shops.map(shop => (
                                <div key={shop._id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-800 text-lg">{shop.name}</h3>
                                            {!shop.isActive && (
                                                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Inactive</span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${shop.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {shop.isOpen ? 'OPEN' : 'CLOSED'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">{shop.address}</p>
                                    
                                    <div className="bg-gray-50 p-3 rounded-lg flex flex-col gap-2 text-sm mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Vendor:</span>
                                            <span className="font-semibold text-gray-800">{shop.vendorId?.name || 'Unknown'}</span>
                                        </div>
                                        {shop.udyamNumber && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Udyam No:</span>
                                                <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">{shop.udyamNumber}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                        <button onClick={() => handleEditClick(shop)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm transition-colors">
                                            ✏️ Edit
                                        </button>
                                        <button onClick={() => handleToggleActive(shop)} className={`flex-1 font-bold py-2 rounded-lg text-sm transition-colors ${shop.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <span>📦</span> Global Godown Inventory
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <input 
                                type="text" 
                                placeholder="Search items..." 
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                value={godownSearchQuery}
                                onChange={(e) => setGodownSearchQuery(e.target.value)}
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        </div>
                        <button 
                            onClick={() => {
                                setEditingGodownItem(null);
                                setGodownFormData({ name: '', category: '', image: null, imagePreview: '' });
                                document.getElementById('godownModal').showModal();
                            }} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
                        >
                            + Add New Item
                        </button>
                    </div>
                </div>

                {loadingGodownItems ? (
                    <p className="text-gray-500 animate-pulse font-bold text-sm">Loading inventory...</p>
                ) : godownItems.length === 0 ? (
                    <p className="text-gray-500 text-sm">Godown is empty.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {godownItems.filter(item => (item.name || '').toLowerCase().includes((godownSearchQuery || '').toLowerCase())).map(item => (
                            <div key={item._id} className="border border-gray-100 rounded-xl p-3 flex flex-col items-center hover:shadow-md transition-shadow bg-gray-50 relative group">
                                <button onClick={() => handleDeleteGodownItem(item._id)} className="absolute top-2 right-2 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-full w-6 h-6 flex items-center justify-center transition-all z-10 text-xs shadow-sm">✕</button>
                                <button onClick={() => { handleGodownEditClick(item); document.getElementById('godownModal').showModal(); }} className="absolute top-2 left-2 bg-blue-100 hover:bg-blue-500 text-blue-600 hover:text-white rounded-full w-6 h-6 flex items-center justify-center transition-all z-10 text-xs shadow-sm">✏️</button>

                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full p-2 shadow-sm mb-3">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-contain rounded-full" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400">?</div>
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-800 text-sm text-center leading-tight">{item.name}</h3>
                                {item.category && <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{item.category}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            )}
            </div>

            {/* Godown Item Modal (Add/Edit) */}
            <dialog id="godownModal" className="bg-transparent p-0 w-full max-w-md backdrop:bg-black/60 backdrop:backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full overflow-hidden m-auto">
                    <div className="bg-indigo-600 p-4 flex justify-between items-center">
                        <h2 className="text-white font-black text-lg">{editingGodownItem ? 'Edit Godown Item' : 'Add Godown Item'}</h2>
                        <button onClick={() => {
                            document.getElementById('godownModal').close();
                            setEditingGodownItem(null);
                        }} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                            ✕
                        </button>
                    </div>
                    <form onSubmit={(e) => { handleGodownSubmit(e); document.getElementById('godownModal').close(); }} className="p-6 space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-center mb-4">
                                <label className="cursor-pointer group relative">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-indigo-500 overflow-hidden">
                                        {godownFormData.imagePreview ? (
                                            <img src={godownFormData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-400 text-xs text-center px-2">Click to add photo</span>
                                        )}
                                    </div>
                                    <input id="godownImageInput" type="file" name="image" accept="image/*" onChange={handleGodownFormChange} className="hidden" />
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Item Name</label>
                                <input type="text" name="name" required className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 text-sm" value={godownFormData.name} onChange={handleGodownFormChange} placeholder="e.g. Aashirvaad Atta 5kg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Category (Optional)</label>
                                <input type="text" name="category" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 text-sm" value={godownFormData.category} onChange={handleGodownFormChange} placeholder="e.g. Grocery" />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl transition-colors shadow-sm">
                                {editingGodownItem ? 'UPDATE ITEM' : 'ADD TO GODOWN'}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>

            {/* Edit Shop Modal */}
            {editingShop && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="bg-purple-600 p-4 flex justify-between items-center">
                            <h2 className="text-white font-black text-lg">Edit Shop Details</h2>
                            <button onClick={() => setEditingShop(null)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Shop Name</label>
                                    <input type="text" name="name" required className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={editFormData.name} onChange={handleEditChange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Address</label>
                                    <input type="text" name="address" required className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={editFormData.address} onChange={handleEditChange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                                    <input type="text" name="category" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={editFormData.category} onChange={handleEditChange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Udyam Number</label>
                                    <input type="text" name="udyamNumber" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={editFormData.udyamNumber} onChange={handleEditChange} />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Latitude</label>
                                        <input type="number" step="any" name="lat" required className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={editFormData.lat} onChange={handleEditChange} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Longitude</label>
                                        <input type="number" step="any" name="lng" required className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={editFormData.lng} onChange={handleEditChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-xl transition-colors shadow-sm">
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
