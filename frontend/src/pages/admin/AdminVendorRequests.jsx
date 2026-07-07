import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const IconBack = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

const AdminVendorRequests = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        if (!token || user?.role !== 'super_admin') {
            navigate('/');
            return;
        }
        fetchRequests();
    }, [token, user, navigate]);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/vendor-requests', { credentials: 'include', 
                
            });
            const data = await res.json();
            if (res.ok) {
                setRequests(data);
            } else {
                toast.error(data.message || 'Failed to fetch requests');
            }
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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
                                        <span className="text-slate-400 mt-0.5">📍</span>
                                        <div className="text-sm font-medium text-slate-700">{req.address}</div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-slate-400 mt-0.5">👤</span>
                                        <div className="text-sm font-medium text-slate-700">Account: {req.userId?.email || 'N/A'}</div>
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
                                                onClick={() => handleUpdateStatus(req._id, 'approved')}
                                                disabled={updating === req._id}
                                                className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex-1 text-center"
                                            >
                                                Approve
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
        </div>
    );
};

export default AdminVendorRequests;
