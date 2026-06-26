import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

/* ─── Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;

/* ─── Shared Styles ─── */
const inputClasses = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all";
const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";
const btnPrimaryClasses = "px-6 py-2.5 bg-amber-400 text-gray-900 rounded-lg text-sm font-bold active:scale-95 transition-transform shadow-sm hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed";

const AdminShops = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [editingShop, setEditingShop] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '', address: '', category: '', udyamNumber: '', lat: '', lng: '', image: null, imagePreview: ''
    });

    useEffect(() => {
        if (!token || user?.role !== 'super_admin') navigate('/');
    }, [token, user, navigate]);

    const { data: shops = [], isLoading } = useQuery({
        queryKey: ['admin-shops'],
        queryFn: async () => {
            const res = await fetch('/api/shops?admin=true', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
        enabled: !!token && user?.role === 'super_admin'
    });

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
        const loadingToast = toast.loading("Saving changes...");
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
                        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: fd
                    });
                    if (!imgRes.ok) toast.warning("Text updated but image upload failed.");
                }
                setEditingShop(null);
                queryClient.invalidateQueries({ queryKey: ['admin-shops'] });
                toast.success("Shop updated!");
            } else { const d = await res.json(); toast.error(d.message || 'Failed'); }
        } catch (err) { toast.error("Error updating shop."); }
        finally { toast.dismiss(loadingToast); }
    };

    const handleToggleActive = async (shop) => {
        if (!window.confirm(`${shop.isActive ? 'Deactivate' : 'Activate'} ${shop.name}?`)) return;
        try {
            const res = await fetch(`/api/shops/${shop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ isActive: !shop.isActive })
            });
            if (res.ok) queryClient.invalidateQueries({ queryKey: ['admin-shops'] });
            else { const d = await res.json(); toast.error(d.message || 'Failed'); }
        } catch (err) { toast.error("Error toggling status."); }
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
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Manage Shops</span>
                <span className="ml-auto bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">{shops.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-7xl mx-auto w-full">
                {isLoading ? (
                    <div className="p-12 text-center text-sm font-bold text-gray-400">Loading shops...</div>
                ) : shops.length === 0 ? (
                    <div className="p-12 text-center text-sm font-bold text-gray-400">No shops registered yet.</div>
                ) : (
                    <div className="space-y-3">
                        {shops.map(shop => (
                            <div key={shop._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-black text-slate-900 truncate">{shop.name}</div>
                                        <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">{shop.address}</div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {!shop.isActive ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800">Inactive</span>
                                            ) : (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold ${shop.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                    {shop.isOpen ? 'Open' : 'Closed'}
                                                </span>
                                            )}
                                            {shop.udyamNumber && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-mono rounded font-bold">{shop.udyamNumber}</span>}
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-400 mt-1.5">Vendor: {shop.vendorId?.name || '—'}</div>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button onClick={() => handleEditClick(shop)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">Edit</button>
                                        <button onClick={() => handleToggleActive(shop)} className={`px-3 py-1.5 border rounded-lg text-xs font-bold active:scale-95 transition-all ${shop.isActive ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                                            {shop.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── EDIT SHOP MODAL ─── */}
            {editingShop && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300 ease-out" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0"></div>
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Edit Shop Profile</h3>
                            <button onClick={() => setEditingShop(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:scale-95 transition-transform">✕</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
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

export default AdminShops;
