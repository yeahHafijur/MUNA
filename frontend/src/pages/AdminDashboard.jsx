import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [shops, setShops] = useState([]);
    const [loadingShops, setLoadingShops] = useState(true);

    const [formData, setFormData] = useState({
        vendorName: '',
        vendorEmail: '',
        vendorPassword: '',
        shopName: '',
        shopAddress: '',
        shopCategory: '',
        shopLat: '',
        shopLng: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Protect Route
        if (!token || user?.role !== 'super_admin') {
            navigate('/');
            return;
        }

        fetchShops();
    }, [token, user, navigate]);

    const fetchShops = async () => {
        try {
            const res = await fetch('/api/shops');
            const data = await res.json();
            setShops(data);
            setLoadingShops(false);
        } catch (error) {
            console.error('Error fetching shops:', error);
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
                vendorPassword: '',
                shopName: '',
                shopAddress: '',
                shopCategory: '',
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Onboarding Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                        <span>🚀</span> Onboard New Vendor
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">1. Vendor Details</h3>
                            <input type="text" name="vendorName" required placeholder="Vendor Full Name" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.vendorName} onChange={handleChange} />
                            <input type="email" name="vendorEmail" required placeholder="Vendor Email" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.vendorEmail} onChange={handleChange} />
                            <input type="password" name="vendorPassword" required placeholder="Temporary Password" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.vendorPassword} onChange={handleChange} />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">2. Shop Details</h3>
                            <input type="text" name="shopName" required placeholder="Shop Name" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.shopName} onChange={handleChange} />
                            <input type="text" name="shopAddress" required placeholder="Shop Address" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.shopAddress} onChange={handleChange} />
                            <input type="text" name="shopCategory" placeholder="Category (e.g. Kirana, Pharmacy)" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.shopCategory} onChange={handleChange} />
                            
                            <div className="flex gap-2">
                                <input type="number" step="any" name="shopLat" placeholder="Latitude (Optional)" className="flex-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.shopLat} onChange={handleChange} />
                                <input type="number" step="any" name="shopLng" placeholder="Longitude (Optional)" className="flex-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" value={formData.shopLng} onChange={handleChange} />
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-xl transition-colors shadow-sm">
                            {isSubmitting ? 'ONBOARDING...' : 'CREATE VENDOR & SHOP'}
                        </button>
                    </form>
                </div>

                {/* Active Shops List */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                        <span>🏪</span> Active Shops ({shops.length})
                    </h2>
                    
                    {loadingShops ? (
                        <p className="text-gray-500 animate-pulse font-bold text-sm">Loading shops...</p>
                    ) : shops.length === 0 ? (
                        <p className="text-gray-500 text-sm">No shops on the platform yet.</p>
                    ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {shops.map(shop => (
                                <div key={shop._id} className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-800">{shop.name}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${shop.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {shop.isOpen ? 'OPEN' : 'CLOSED'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">{shop.address}</p>
                                    
                                    <div className="bg-gray-50 p-2 rounded flex justify-between items-center text-xs">
                                        <span className="font-bold text-gray-600">Vendor:</span>
                                        <span className="text-purple-600 font-bold">{shop.vendorId?.name || 'Unknown'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
