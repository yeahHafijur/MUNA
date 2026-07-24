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
        name: '', address: '', category: '', udyamNumber: '', lat: '', lng: '', image: null, imagePreview: '',
        vendorName: '', vendorEmail: '', vendorPhone: '', openTime: '', closeTime: ''
    });

    const [newCatForm, setNewCatForm] = useState({ name: '', image: null, imagePreview: '' });
    const [savingCat, setSavingCat] = useState(false);

    useEffect(() => {
        if (user?.role !== 'super_admin') navigate('/');
    }, [token, user, navigate]);

    const { data: shops = [], isLoading } = useQuery({
        queryKey: ['admin-shops'],
        queryFn: async () => {
            const res = await fetch('/api/shops/admin/all', { credentials: 'include',   });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
        enabled:  user?.role === 'super_admin'
    });

    const { data: shopCategories = [], refetch: refetchCategories } = useQuery({
        queryKey: ['admin-shop-categories', editingShop?._id],
        queryFn: async () => {
            if (!editingShop) return [];
            const res = await fetch(`/api/categories/${editingShop._id}`, { credentials: 'include' });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
        enabled: !!editingShop
    });

    const handleEditClick = (shop) => {
        setEditingShop(shop);
        setEditFormData({
            name: shop.name || '', address: shop.address || '', category: shop.category || '',
            udyamNumber: shop.udyamNumber || '',
            lat: shop.location?.coordinates[1] || '', lng: shop.location?.coordinates[0] || '',
            image: null, imagePreview: shop.image || '',
            vendorName: shop.vendorId?.name || '', vendorEmail: shop.vendorId?.email || '', vendorPhone: shop.vendorId?.phone || '',
            openTime: shop.autoSchedule?.openTime || '09:00', closeTime: shop.autoSchedule?.closeTime || '21:00'
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
                    udyamNumber: editFormData.udyamNumber, lat: editFormData.lat, lng: editFormData.lng,
                    vendorName: editFormData.vendorName, vendorEmail: editFormData.vendorEmail, vendorPhone: editFormData.vendorPhone,
                    autoSchedule: { openTime: editFormData.openTime, closeTime: editFormData.closeTime }
                })
            });
            if (res.ok) {
                if (editFormData.image) {
                    const fd = new FormData();
                    fd.append('image', editFormData.image);
                    const imgRes = await fetch(`/api/shops/${editingShop._id}/image`, {
                        method: 'PUT', body: fd
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

    const handleDeleteShop = async (shopId) => {
        if (!window.confirm("Are you SURE you want to completely DELETE this shop? This will erase all its products and categories permanently!")) return;
        try {
            const loadingToast = toast.loading("Deleting shop...");
            const res = await fetch(`/api/shops/${shopId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.dismiss(loadingToast);
            if (res.ok) {
                toast.success("Shop deleted successfully!");
                if (editingShop?._id === shopId) setEditingShop(null);
                queryClient.invalidateQueries({ queryKey: ['admin-shops'] });
            } else {
                const d = await res.json();
                toast.error(d.message || "Failed to delete");
            }
        } catch (error) {
            toast.error("Error deleting shop.");
        }
    };

    const handleCatChange = (e) => {
        if (e.target.name === 'image') {
            const file = e.target.files[0];
            setNewCatForm({ ...newCatForm, image: file, imagePreview: file ? URL.createObjectURL(file) : '' });
        } else {
            setNewCatForm({ ...newCatForm, [e.target.name]: e.target.value });
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatForm.name.trim()) return toast.error("Category name required");
        setSavingCat(true);
        const fd = new FormData();
        fd.append('name', newCatForm.name);
        fd.append('shopId', editingShop._id);
        if (newCatForm.image) fd.append('image', newCatForm.image);

        try {
            const res = await fetch('/api/categories', { credentials: 'include', 
                method: 'POST',
                body: fd
            });
            if (res.ok) {
                setNewCatForm({ name: '', image: null, imagePreview: '' });
                refetchCategories();
                toast.success("Category added!");
            } else {
                const d = await res.json();
                toast.error(d.message || "Failed to add category");
            }
        } catch(err) {
            toast.error("Error adding category");
        } finally {
            setSavingCat(false);
        }
    };

    const handleDeleteCategory = async (catId) => {
        if (!window.confirm("Delete this category?")) return;
        try {
            const res = await fetch(`/api/categories/${catId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                refetchCategories();
                toast.success("Category deleted");
            } else {
                const d = await res.json();
                toast.error(d.message || "Failed to delete");
            }
        } catch(err) {
            toast.error("Error deleting");
        }
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
                                        <button onClick={() => navigate(`/admin/catalog/${shop._id}`)} className="px-3 py-1.5 bg-amber-400 border border-amber-400 rounded-lg text-xs font-bold text-amber-950 hover:bg-amber-500 active:scale-95 transition-all shadow-sm">Catalogue</button>
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
                            
                            {/* Vendor Details */}
                            <div className="pt-2">
                                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">Vendor / Owner Details</h4>
                                <div className="space-y-3">
                                    <div><label className={labelClasses}>Owner Name</label><input type="text" name="vendorName" className={inputClasses} value={editFormData.vendorName} onChange={handleEditChange} /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelClasses}>Email</label><input type="email" name="vendorEmail" className={inputClasses} value={editFormData.vendorEmail} onChange={handleEditChange} /></div>
                                        <div><label className={labelClasses}>Phone</label><input type="tel" name="vendorPhone" className={inputClasses} value={editFormData.vendorPhone} onChange={handleEditChange} /></div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">Shop Metadata</h4>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div><label className={labelClasses}>Category</label><input type="text" name="category" className={inputClasses} value={editFormData.category} onChange={handleEditChange} /></div>
                                    <div><label className={labelClasses}>Udyam Number</label><input type="text" name="udyamNumber" className={`${inputClasses} font-mono`} value={editFormData.udyamNumber} onChange={handleEditChange} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>Open Time (HH:MM)</label><input type="time" name="openTime" className={inputClasses} value={editFormData.openTime} onChange={handleEditChange} /></div>
                                    <div><label className={labelClasses}>Close Time (HH:MM)</label><input type="time" name="closeTime" className={inputClasses} value={editFormData.closeTime} onChange={handleEditChange} /></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelClasses}>Latitude</label><input type="number" step="any" name="lat" required className={inputClasses} value={editFormData.lat} onChange={handleEditChange} /></div>
                                <div><label className={labelClasses}>Longitude</label><input type="number" step="any" name="lng" required className={inputClasses} value={editFormData.lng} onChange={handleEditChange} /></div>
                            </div>

                            <div className="pt-4 flex flex-col gap-3 border-t border-gray-100">
                                <button type="submit" className={`${btnPrimaryClasses} w-full py-3`}>Save Changes</button>
                                <button type="button" onClick={() => handleDeleteShop(editingShop._id)} className="w-full py-3 px-6 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 active:scale-95 transition-all">Delete Shop</button>
                            </div>
                        </form>

                        {/* ─── CATEGORY MANAGEMENT SECTION ─── */}
                        <div className="mt-8 pt-8 border-t border-slate-200">
                            <h4 className="text-lg font-black text-slate-900 tracking-tight mb-4">Item Categories</h4>
                            
                            {/* List Existing Categories */}
                            <div className="space-y-3 mb-6">
                                {shopCategories.length === 0 ? (
                                    <div className="text-sm font-medium text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">No categories found for this shop.</div>
                                ) : (
                                    shopCategories.map(cat => (
                                        <div key={cat._id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                            {cat.image ? (
                                                <img src={cat.image} alt={cat.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">No Img</div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-slate-900 truncate">{cat.name}</div>
                                            </div>
                                            <button type="button" onClick={() => handleDeleteCategory(cat._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add New Category */}
                            <form onSubmit={handleAddCategory} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                                <h5 className="text-sm font-bold text-slate-900">Add New Category</h5>
                                <label className="cursor-pointer block group">
                                    <div className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden group-hover:border-amber-400 transition-colors">
                                        {newCatForm.imagePreview ? <img src={newCatForm.imagePreview} alt="Category" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-400 group-hover:text-amber-500">Upload Banner Photo (Optional)</span>}
                                    </div>
                                    <input type="file" name="image" accept="image/*" onChange={handleCatChange} className="hidden" />
                                </label>
                                <div className="flex gap-2">
                                    <input type="text" name="name" required placeholder="Category Name" className={`${inputClasses} flex-1`} value={newCatForm.name} onChange={handleCatChange} />
                                    <button type="submit" disabled={savingCat} className={`${btnPrimaryClasses} shrink-0`}>
                                        {savingCat ? 'Adding...' : 'Add'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminShops;
