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

const AdminCategories = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Shop Categories
    const [shopCatForm, setShopCatForm] = useState({ name: '', image: null, imagePreview: '' });
    const [editingShopCat, setEditingShopCat] = useState(null);
    const [savingShopCat, setSavingShopCat] = useState(false);

    // Global Item Categories
    const [itemCatForm, setItemCatForm] = useState({ name: '', image: null, imagePreview: '' });
    const [editingItemCat, setEditingItemCat] = useState(null);
    const [savingItemCat, setSavingItemCat] = useState(false);

    useEffect(() => {
        if (user?.role !== 'super_admin') navigate('/');
    }, [token, user, navigate]);

    const { data: shopCategories = [] } = useQuery({
        queryKey: ['shop-categories'],
        queryFn: async () => {
            const res = await fetch('/api/shop-categories', { credentials: 'include' });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    });

    const { data: globalItemCats = [] } = useQuery({
        queryKey: ['global-item-categories'],
        queryFn: async () => {
            const res = await fetch('/api/categories/global', { credentials: 'include' });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    });

    const handleShopCatSubmit = async (e) => {
        e.preventDefault();
        setSavingShopCat(true);
        const fd = new FormData();
        fd.append('name', shopCatForm.name);
        if (shopCatForm.image) fd.append('image', shopCatForm.image);
        try {
            const url = editingShopCat ? `/api/shop-categories/${editingShopCat._id}` : '/api/shop-categories';
            const res = await fetch(url, { credentials: 'include',  method: editingShopCat ? 'PUT' : 'POST', body: fd });
            if (res.ok) {
                setShopCatForm({ name: '', image: null, imagePreview: '' }); setEditingShopCat(null);
                queryClient.invalidateQueries({ queryKey: ['shop-categories'] });
                toast.success(editingShopCat ? "Category updated!" : "Category added!");
            } else { const d = await res.json(); toast.error(d.message || 'Failed'); }
        } catch (err) { toast.error("Error saving category."); }
        setSavingShopCat(false);
    };

    const handleDeleteShopCat = async (id) => {
        if (!window.confirm('Delete this shop category?')) return;
        try {
            const res = await fetch(`/api/shop-categories/${id}`, { method: 'DELETE' });
            if (res.ok) queryClient.invalidateQueries({ queryKey: ['shop-categories'] });
            else { const d = await res.json(); toast.error(d.message || 'Failed'); }
        } catch (err) { toast.error("Error deleting category."); }
    };

    const handleItemCatSubmit = async (e) => {
        e.preventDefault();
        setSavingItemCat(true);
        const fd = new FormData();
        fd.append('name', itemCatForm.name);
        if (itemCatForm.image) fd.append('image', itemCatForm.image);
        try {
            const url = editingItemCat ? `/api/categories/${editingItemCat._id}` : '/api/categories/global';
            const res = await fetch(url, { credentials: 'include',  method: editingItemCat ? 'PUT' : 'POST', body: fd });
            if (res.ok) {
                setItemCatForm({ name: '', image: null, imagePreview: '' }); setEditingItemCat(null);
                queryClient.invalidateQueries({ queryKey: ['global-item-categories'] });
                toast.success(editingItemCat ? "Category updated!" : "Category added!");
            } else { const d = await res.json(); toast.error(d.message || 'Failed'); }
        } catch (err) { toast.error("Error saving category."); }
        setSavingItemCat(false);
    };

    const handleDeleteItemCat = async (id) => {
        if (!window.confirm('Delete this global item category?')) return;
        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            if (res.ok) queryClient.invalidateQueries({ queryKey: ['global-item-categories'] });
            else { const d = await res.json(); toast.error(d.message || 'Failed'); }
        } catch (err) { toast.error("Error deleting category."); }
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
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Categories</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-7xl mx-auto w-full space-y-8">

                {/* ─── Shop Categories ─── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-base font-black text-gray-900 tracking-tight">Shop Categories (Strict)</h2>
                    </div>
                    <div className="p-6 border-b border-gray-100 bg-white" id="shop-cat-form">
                        <form onSubmit={handleShopCatSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className={labelClasses}>Category Name</label>
                                <input type="text" required placeholder="e.g. Kirana" className={inputClasses} value={shopCatForm.name} onChange={(e) => setShopCatForm({ ...shopCatForm, name: e.target.value })} />
                            </div>
                            <div className="w-full sm:w-auto">
                                <label className={labelClasses}>Icon Image</label>
                                <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" onChange={(e) => setShopCatForm({ ...shopCatForm, image: e.target.files[0] })} />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button type="submit" disabled={savingShopCat} className={btnPrimaryClasses}>{editingShopCat ? 'Update' : 'Add New'}</button>
                                {editingShopCat && <button type="button" onClick={() => { setEditingShopCat(null); setShopCatForm({ name: '', image: null, imagePreview: '' }); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold">Cancel</button>}
                            </div>
                        </form>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {shopCategories.map(sc => (
                            <div key={sc._id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    {sc.image ? <img src={sc.image} alt="" className="w-8 h-8 rounded-md object-cover border border-gray-200" /> : <div className="w-8 h-8 rounded-md bg-gray-100" />}
                                    <span className="text-sm font-bold text-gray-900">{sc.name}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => { setEditingShopCat(sc); setShopCatForm({ name: sc.name, image: null, imagePreview: sc.image || '' }); document.getElementById('shop-cat-form')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-bold text-blue-600 hover:text-blue-800">Edit</button>
                                    <button onClick={() => handleDeleteShopCat(sc._id)} className="text-sm font-bold text-red-600 hover:text-red-800">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── Global Item Categories ─── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-base font-black text-gray-900 tracking-tight">Global Item Categories 🌐</h2>
                    </div>
                    <div className="p-6 border-b border-gray-100 bg-white" id="item-cat-form">
                        <form onSubmit={handleItemCatSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className={labelClasses}>Category Name</label>
                                <input type="text" required placeholder="e.g. Beverages" className={inputClasses} value={itemCatForm.name} onChange={(e) => setItemCatForm({ ...itemCatForm, name: e.target.value })} />
                            </div>
                            <div className="w-full sm:w-auto">
                                <label className={labelClasses}>Cover Image</label>
                                <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={(e) => setItemCatForm({ ...itemCatForm, image: e.target.files[0] })} />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button type="submit" disabled={savingItemCat} className={btnPrimaryClasses}>{editingItemCat ? 'Update' : 'Add New'}</button>
                                {editingItemCat && <button type="button" onClick={() => { setEditingItemCat(null); setItemCatForm({ name: '', image: null, imagePreview: '' }); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold">Cancel</button>}
                            </div>
                        </form>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {globalItemCats.map(ic => (
                            <div key={ic._id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    {ic.image ? <img src={ic.image} alt="" className="w-8 h-8 rounded-md object-cover border border-gray-200" /> : <div className="w-8 h-8 rounded-md bg-gray-100" />}
                                    <span className="text-sm font-bold text-gray-900">{ic.name} <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded">Global</span></span>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => { setEditingItemCat(ic); setItemCatForm({ name: ic.name, image: null, imagePreview: ic.image || '' }); document.getElementById('item-cat-form')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-bold text-blue-600 hover:text-blue-800">Edit</button>
                                    <button onClick={() => handleDeleteItemCat(ic._id)} className="text-sm font-bold text-red-600 hover:text-red-800">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCategories;
