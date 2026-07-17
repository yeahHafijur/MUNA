import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

/* ─── Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;

const AdminApprovals = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (user?.role !== 'super_admin') navigate('/');
    }, [token, user, navigate]);

    const { data: pendingProducts = [], isLoading } = useQuery({
        queryKey: ['pending-products'],
        queryFn: async () => {
            const res = await fetch('/api/admin/catalog/products/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    });

    const handleApproveGodownItem = async (id) => {
        if (!window.confirm("Approve this product? It will go live and be added to the Godown.")) return;
        try {
            const res = await fetch(`/api/admin/catalog/products/${id}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                queryClient.invalidateQueries({ queryKey: ['pending-products'] });
                toast.success("Product approved!");
            }
            else { const d = await res.json(); toast.error(d.message || 'Failed'); }
        } catch (err) { toast.error("Error approving item."); }
    };

    const handleRejectGodownItem = async (id) => {
        if (!window.confirm("Reject this product?")) return;
        try {
            const res = await fetch(`/api/admin/catalog/products/${id}/reject`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                queryClient.invalidateQueries({ queryKey: ['pending-products'] });
                toast.success("Product rejected.");
            }
            else { const d = await res.json(); toast.error(d.message || 'Failed'); }
        } catch (err) { toast.error("Error rejecting item."); }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col font-sans">

            {/* ─── NATIVE HEADER ─── */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
                <button
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(40); navigate('/admin'); }}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                >
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Approvals</span>
                {pendingProducts.length > 0 && (
                    <span className="ml-auto px-2.5 py-1 rounded-md bg-rose-500 text-white text-[10px] font-black leading-none">{pendingProducts.length}</span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-7xl mx-auto w-full">
                {isLoading ? (
                    <div className="p-12 text-center text-sm font-bold text-gray-400">Loading approvals...</div>
                ) : pendingProducts.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">✅</div>
                        <div className="text-sm font-bold text-gray-400">No pending items to approve.</div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingProducts.map(item => (
                            <div key={item._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                                    {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-black text-gray-900 truncate">{item.name} <span className="text-xs text-gray-500 font-bold ml-1">₹{item.price}</span></div>
                                    <div className="text-xs font-medium text-gray-500 mt-0.5">Shop: <span className="font-bold text-amber-600">{item.shopId?.name || 'Unknown'}</span></div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => handleApproveGodownItem(item._id)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 active:scale-95 transition-all">Accept</button>
                                    <button onClick={() => handleRejectGodownItem(item._id)} className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 active:scale-95 transition-all">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminApprovals;
