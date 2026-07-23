import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const IconBack = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

const inputClasses = "w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all";
const labelClasses = "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1";

const AdminVendorRequests = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    // Modal state for Approval
    const [showModal, setShowModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [formData, setFormData] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        if (user?.role !== 'super_admin') {
            navigate('/');
            return;
        }
        fetchRequests();
    }, [token, user, navigate]);

    // Fetch shop categories for the form dropdown
    const { data: shopCategories = [] } = useQuery({
        queryKey: ['shop-categories'],
        queryFn: async () => {
            const res = await fetch('/api/shop-categories', { credentials: 'include' });
            return await res.json();
        }
    });

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/vendor-requests', { credentials: 'include' });
            const data = await res.json();
            if (res.ok) setRequests(data);
            else toast.error(data.message || 'Failed to fetch requests');
        } catch (error) {
            toast.error('Error fetching requests');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        setUpdating(id);
        try {
            const res = await fetch(`/api/vendor-requests/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                toast.success(`Request marked as ${status}`);
                fetchRequests();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to update status');
            }
        } catch (error) {
            toast.error('Error updating status');
        } finally {
            setUpdating(null);
        }
    };

    const openReviewModal = (req) => {
        setSelectedRequest(req);
        setFormData({
            requestId: req._id,
            vendorName: req.name || '',
            vendorEmail: req.vendorEmail || '',
            vendorPhone: req.phone || '',
            shopName: req.shopName || '',
            shopAddress: req.address || '',
            shopCategoryId: req.shopCategoryId || '',
            shopCategory: req.shopCategory || 'General',
            udyamNumber: req.udyamNumber || '',
            shopLat: req.shopLat || '',
            shopLng: req.shopLng || '',
            openTime: req.openTime || '09:00',
            closeTime: req.closeTime || '21:00',
            existingImage: req.shopImage || ''
        });
        setSelectedImage(null);
        setShowModal(true);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const submitApproval = async (e) => {
        e.preventDefault();
        setUpdating('approval');
        const loadingToast = toast.loading("Creating vendor and shop...");
        
        try {
            const fd = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined) {
                    fd.append(key, formData[key]);
                }
            });
            if (selectedImage) {
                fd.append('image', selectedImage);
            }

            const res = await fetch('/api/admin/onboard', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, // Browser automatically sets Content-Type for FormData
                body: fd
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error onboarding vendor');
            
            toast.success("Vendor & Shop Created and Request Approved!");
            setShowModal(false);
            fetchRequests();
        } catch (error) {
            toast.error(error.message);
        } finally {
            toast.dismiss(loadingToast);
            setUpdating(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col font-sans">
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
                <button
                    onClick={() => navigate('/admin')}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                >
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Vendor Requests</span>
                <span className="ml-auto bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">{requests.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-7xl mx-auto w-full">
                {loading ? (
                    <div className="p-12 text-center text-sm font-bold text-gray-400">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div className="p-12 text-center text-sm font-bold text-gray-400">No vendor requests found.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {requests.map(req => (
                            <div key={req._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 relative overflow-hidden">
                                {req.status === 'pending' && <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>}
                                {req.status === 'contacted' && <div className="absolute top-0 right-0 w-2 h-full bg-blue-400"></div>}
                                {req.status === 'approved' && <div className="absolute top-0 right-0 w-2 h-full bg-emerald-400"></div>}
                                {req.status === 'rejected' && <div className="absolute top-0 right-0 w-2 h-full bg-red-400"></div>}

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">{req.name}</h3>
                                        <p className="text-sm font-semibold text-amber-600">Shop: {req.shopName}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
                                        req.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        req.status === 'contacted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                        {req.status}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-start gap-3">
                                        <span className="text-slate-400 mt-0.5">📞</span>
                                        <div className="text-sm font-medium text-slate-700">{req.phone}</div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-slate-400 mt-0.5">📧</span>
                                        <div className="text-sm font-medium text-slate-700">{req.vendorEmail || 'Not Provided'}</div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-slate-400 mt-0.5">📍</span>
                                        <div className="text-sm font-medium text-slate-700">{req.address}</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                                    {req.status === 'pending' && (
                                        <button 
                                            onClick={() => handleUpdateStatus(req._id, 'contacted')}
                                            disabled={updating === req._id}
                                            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors flex-1 text-center"
                                        >
                                            Mark Contacted
                                        </button>
                                    )}
                                    {req.status !== 'approved' && req.status !== 'rejected' && (
                                        <>
                                            <button 
                                                onClick={() => openReviewModal(req)}
                                                className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex-1 text-center"
                                            >
                                                Review & Approve
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(req._id, 'rejected')}
                                                disabled={updating === req._id}
                                                className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors flex-1 text-center"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {(req.status === 'approved' || req.status === 'rejected') && (
                                        <button 
                                            onClick={() => handleUpdateStatus(req._id, 'pending')}
                                            disabled={updating === req._id}
                                            className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors w-full text-center"
                                        >
                                            Move back to Pending
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Approval Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">Review & Create Shop</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="approveForm" onSubmit={submitApproval} className="space-y-6">
                                
                                {/* Vendor Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Vendor Owner</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>Full Name</label>
                                            <input type="text" name="vendorName" required className={inputClasses} value={formData.vendorName} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Email Address</label>
                                            <input type="email" name="vendorEmail" required className={inputClasses} value={formData.vendorEmail} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Phone</label>
                                            <input type="tel" name="vendorPhone" required className={inputClasses} value={formData.vendorPhone} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>

                                {/* Shop Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Shop Details</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>Shop Name</label>
                                            <input type="text" name="shopName" required className={inputClasses} value={formData.shopName} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Category</label>
                                            <select name="shopCategoryId" required className={inputClasses} value={formData.shopCategoryId} onChange={(e) => {
                                                const selected = shopCategories.find(c => c._id === e.target.value);
                                                setFormData({ ...formData, shopCategoryId: e.target.value, shopCategory: selected?.name || 'General' });
                                            }}>
                                                <option value="">Select Category</option>
                                                {shopCategories.map(sc => <option key={sc._id} value={sc._id}>{sc.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className={labelClasses}>Full Address</label>
                                            <input type="text" name="shopAddress" required className={inputClasses} value={formData.shopAddress} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Udyam Number (Optional)</label>
                                            <input type="text" name="udyamNumber" className={inputClasses} value={formData.udyamNumber} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>

                                {/* Location Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Location & Timings</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className={labelClasses}>Latitude *</label>
                                            <input type="number" step="any" name="shopLat" required className={inputClasses} value={formData.shopLat} onChange={handleChange} />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className={labelClasses}>Longitude *</label>
                                            <input type="number" step="any" name="shopLng" required className={inputClasses} value={formData.shopLng} onChange={handleChange} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className={labelClasses}>Open Time</label>
                                            <input type="time" name="openTime" required className={inputClasses} value={formData.openTime} onChange={handleChange} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className={labelClasses}>Close Time</label>
                                            <input type="time" name="closeTime" required className={inputClasses} value={formData.closeTime} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Image Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Shop Photo</h3>
                                    <div className="flex items-start gap-4">
                                        <div className="w-24 h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                                            {selectedImage ? (
                                                <img src={URL.createObjectURL(selectedImage)} className="w-full h-full object-cover" alt="Preview" />
                                            ) : formData.existingImage ? (
                                                <img src={formData.existingImage} className="w-full h-full object-cover" alt="Vendor Uploaded" />
                                            ) : (
                                                <span className="text-2xl text-gray-300">📷</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className={labelClasses}>Replace / Upload Photo</label>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setSelectedImage(e.target.files[0]);
                                                    }
                                                }}
                                                className="block w-full text-sm text-slate-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-full file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-amber-50 file:text-amber-700
                                                    hover:file:bg-amber-100"
                                            />
                                            {formData.existingImage && !selectedImage && (
                                                <p className="text-xs text-emerald-600 font-bold mt-2">✓ Vendor provided a photo.</p>
                                            )}
                                            {!formData.existingImage && !selectedImage && (
                                                <p className="text-xs text-amber-600 font-bold mt-2">No photo provided by vendor. You can upload one.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {!formData.shopLat && (
                                    <p className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-lg">
                                        ⚠️ The vendor did not provide GPS coordinates. You must manually find and enter their Latitude & Longitude before approving.
                                    </p>
                                )}
                            </form>
                        </div>
                        
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" form="approveForm" disabled={updating === 'approval'} className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center shadow-sm">
                                {updating === 'approval' ? 'Approving...' : 'Confirm & Create Shop'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVendorRequests;
