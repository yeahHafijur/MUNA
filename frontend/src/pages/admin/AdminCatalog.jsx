import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';
import GodownMultiImportModal from '../../components/GodownMultiImportModal';

/* ─── Premium Crisp Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IconStock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const IconEye = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconEyeOff = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>;
const IconChevronUp = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>;
const IconChevronDown = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;

/* ─── Action Label Map ─── */
const ACTION_LABELS = {
    product_added: { label: 'Product Added', color: 'bg-emerald-100 text-emerald-800', icon: '➕' },
    product_edited: { label: 'Product Edited', color: 'bg-blue-100 text-blue-800', icon: '✏️' },
    product_deleted: { label: 'Product Deleted', color: 'bg-rose-100 text-rose-800', icon: '🗑️' },
    category_added: { label: 'Category Added', color: 'bg-emerald-100 text-emerald-800', icon: '📂' },
    category_edited: { label: 'Category Edited', color: 'bg-blue-100 text-blue-800', icon: '📝' },
    category_deleted: { label: 'Category Deleted', color: 'bg-rose-100 text-rose-800', icon: '🗑️' },
    image_changed: { label: 'Image Changed', color: 'bg-amber-100 text-amber-800', icon: '🖼️' },
};

const AdminCatalog = () => {
    const { shopId } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // ── State ──
    const [selectedCat, setSelectedCat] = useState(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showAuditLog, setShowAuditLog] = useState(false);
    const [showMultiImportModal, setShowMultiImportModal] = useState(false);

    // Category modal
    const [catModal, setCatModal] = useState(null); // null | 'add' | category object
    const [catName, setCatName] = useState('');
    const [catImage, setCatImage] = useState(null);
    const [catSaving, setCatSaving] = useState(false);

    // Product modal
    const [prodModal, setProdModal] = useState(null); // null | 'add' | product object
    const [prodName, setProdName] = useState('');
    const [prodQuantity, setProdQuantity] = useState('');
    const [prodPrice, setProdPrice] = useState('');
    const [prodDesc, setProdDesc] = useState('');
    const [prodCatId, setProdCatId] = useState('');
    const [prodImage, setProdImage] = useState(null);
    const [prodImagePreview, setProdImagePreview] = useState('');
    const [prodGallery, setProdGallery] = useState([]);
    const [prodGalleryPreviews, setProdGalleryPreviews] = useState([]);
    const [prodInStock, setProdInStock] = useState(true);
    const [prodIsHidden, setProdIsHidden] = useState(false);
    const [prodSaving, setProdSaving] = useState(false);

    // Cropper
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    // ── Auth guard ──
    useEffect(() => {
        if (user?.role !== 'super_admin') navigate('/');
    }, [token, user, navigate]);

    // ── Debounce search ──
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // ── Fetch products ──
    const { data: prodData, isLoading: prodsLoading } = useQuery({
        queryKey: ['admin-catalog-products', shopId, page, debouncedSearch, selectedCat],
        queryFn: async () => {
            const params = new URLSearchParams({ page, limit: 50 });
            if (debouncedSearch) params.set('search', debouncedSearch);
            if (selectedCat) params.set('categoryId', selectedCat);
            const res = await fetch(`/api/admin/catalog/${shopId}/products?${params}`, {
                
            });
            if (!res.ok) throw new Error('Failed to fetch products');
            return res.json();
        },
        enabled:  !!shopId && user?.role === 'super_admin',
        keepPreviousData: true
    });

    const products = prodData?.products || [];
    const totalPages = prodData?.totalPages || 1;
    const totalProducts = prodData?.total || 0;
    const shopName = prodData?.shop?.name || 'Shop';

    // ── Fetch categories ──
    const { data: categories = [] } = useQuery({
        queryKey: ['admin-catalog-categories', shopId],
        queryFn: async () => {
            const res = await fetch(`/api/admin/catalog/${shopId}/categories`, {
                
            });
            if (!res.ok) throw new Error('Failed to fetch categories');
            return res.json();
        },
        enabled:  !!shopId && user?.role === 'super_admin'
    });

    // ── Fetch audit logs ──
    const { data: auditData } = useQuery({
        queryKey: ['admin-catalog-audit', shopId],
        queryFn: async () => {
            const res = await fetch(`/api/admin/catalog/${shopId}/audit-logs?limit=20`, {
                
            });
            if (!res.ok) throw new Error('Failed to fetch audit logs');
            return res.json();
        },
        enabled:  !!shopId && showAuditLog && user?.role === 'super_admin'
    });

    const auditLogs = auditData?.logs || [];

    // ── Helpers ──
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-catalog-products', shopId] });
        queryClient.invalidateQueries({ queryKey: ['admin-catalog-categories', shopId] });
        queryClient.invalidateQueries({ queryKey: ['admin-catalog-audit', shopId] });
    };

    const getCatName = (catId) => {
        if (!catId) return 'Uncategorized';
        if (typeof catId === 'object') return catId.name || 'Uncategorized';
        const cat = categories.find(c => c._id === catId);
        return cat ? cat.name : 'Uncategorized';
    };

    const getProductCatId = (p) => typeof p.category === 'object' ? (p.category?._id || p.category) : p.category;
    const getCatCount = (catId) => products.filter(p => getProductCatId(p) === catId).length;

    // ══════════════════════════════════════
    //  CATEGORY HANDLERS
    // ══════════════════════════════════════

    const openAddCat = () => { if (navigator.vibrate) navigator.vibrate(30); setCatModal('add'); setCatName(''); setCatImage(null); };
    const openEditCat = (cat) => { if (navigator.vibrate) navigator.vibrate(30); setCatModal(cat); setCatName(cat.name); setCatImage(null); };

    const saveCat = async () => {
        setCatSaving(true);
        const isEdit = catModal && catModal._id;
        const fd = new FormData();
        fd.append('name', catName);
        if (catImage) fd.append('image', catImage);

        try {
            const url = isEdit
                ? `/api/admin/catalog/categories/${catModal._id}`
                : `/api/admin/catalog/${shopId}/categories`;
            const res = await fetch(url, { credentials: 'include', 
                method: isEdit ? 'PUT' : 'POST',
                body: fd,
            });
            if (res.ok) {
                invalidate();
                setCatModal(null);
                toast.success(isEdit ? 'Category updated' : 'Category added');
            } else {
                const d = await res.json();
                toast.error(d.message || 'Failed');
            }
        } catch { toast.error('Error saving category'); }
        setCatSaving(false);
    };

    const deleteCat = async (cat, force = false) => {
        if (navigator.vibrate) navigator.vibrate(50);
        try {
            const res = await fetch(`/api/admin/catalog/categories/${cat._id}${force ? '?force=true' : ''}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                invalidate();
                if (selectedCat === cat._id) setSelectedCat(null);
                setCatModal(null);
                toast.success("Category deleted");
            } else if (data.requiresConfirmation) {
                if (window.confirm(`${data.message}\n\nProducts will NOT be deleted, only the category.`)) {
                    deleteCat(cat, true);
                }
            } else {
                toast.error(data.message || 'Failed');
            }
        } catch { toast.error('Error deleting category'); }
    };

    const moveCat = async (catId, direction) => {
        const idx = categories.findIndex(c => c._id === catId);
        if (idx < 0) return;
        const newOrder = [...categories.map(c => c._id)];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= newOrder.length) return;
        [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];

        try {
            await fetch(`/api/admin/catalog/${shopId}/categories/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json',  },
                body: JSON.stringify({ orderedIds: newOrder })
            });
            invalidate();
        } catch { toast.error('Failed to reorder'); }
    };

    // ══════════════════════════════════════
    //  PRODUCT HANDLERS
    // ══════════════════════════════════════

    const openAddProd = () => {
        if (navigator.vibrate) navigator.vibrate(30);
        setProdModal('add'); setProdName(''); setProdQuantity(''); setProdPrice(''); setProdDesc('');
        setProdImage(null); setProdImagePreview('');
        setProdGallery([]); setProdGalleryPreviews([]);
        setProdInStock(true); setProdIsHidden(false);
        setProdCatId(categories.length > 0 ? categories[0]._id : '');
    };

    const openEditProd = (p) => {
        if (navigator.vibrate) navigator.vibrate(30);
        setProdModal(p); setProdName(p.name); setProdQuantity(p.quantity || ''); setProdPrice(p.price);
        setProdDesc(p.description || '');
        setProdCatId(getProductCatId(p));
        setProdImage(null); setProdImagePreview('');
        setProdGallery([]); setProdGalleryPreviews([]);
        setProdInStock(p.inStock !== false);
        setProdIsHidden(p.isHidden === true);
    };

    const handleProdImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCropImageSrc(URL.createObjectURL(file));
        setIsCropping(true);
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropSave = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels, 0);
            const croppedFile = new File([croppedImageBlob], 'cropped.jpg', { type: 'image/jpeg' });
            setProdImage(croppedFile);
            setProdImagePreview(URL.createObjectURL(croppedImageBlob));
            setIsCropping(false);
            setCropImageSrc(null);
        } catch (e) {
            console.error(e);
            toast.error("Failed to crop image");
        }
    };

    const handleProdGallery = (e) => {
        const files = Array.from(e.target.files).slice(0, 4);
        setProdGallery(files);
        setProdGalleryPreviews(files.map(f => URL.createObjectURL(f)));
    };

    const saveProd = async (e) => {
        e.preventDefault();
        setProdSaving(true);
        const isEdit = prodModal && prodModal._id;
        const fd = new FormData();
        fd.append('name', prodName);
        fd.append('quantity', prodQuantity);
        fd.append('price', Number(prodPrice));
        fd.append('categoryId', prodCatId);
        fd.append('description', prodDesc);
        fd.append('inStock', prodInStock);
        fd.append('isHidden', prodIsHidden);
        if (prodImage) fd.append('image', prodImage);
        prodGallery.forEach(file => fd.append('gallery', file));

        try {
            const url = isEdit
                ? `/api/admin/catalog/products/${prodModal._id}`
                : `/api/admin/catalog/${shopId}/products`;
            const res = await fetch(url, { credentials: 'include', 
                method: isEdit ? 'PUT' : 'POST',
                body: fd,
            });
            if (res.ok) {
                invalidate();
                setProdModal(null);
                toast.success(isEdit ? 'Product updated' : 'Product added');
            } else {
                const d = await res.json();
                toast.error(d.message || 'Failed');
            }
        } catch { toast.error('Error saving product'); }
        setProdSaving(false);
    };

    const deleteProd = async (p) => {
        if (!window.confirm(`Delete "${p.name}"?`)) return;
        if (navigator.vibrate) navigator.vibrate(50);
        try {
            await fetch(`/api/admin/catalog/products/${p._id}`, {
                method: 'DELETE'
            });
            invalidate();
            toast.success("Product deleted");
        } catch { toast.error('Error deleting product'); }
    };

    const toggleStock = async (p) => {
        try {
            const res = await fetch(`/api/admin/catalog/products/${p._id}/stock`, {
                method: 'PATCH'
            });
            if (res.ok) {
                invalidate();
                toast.success(p.inStock ? 'Marked out of stock' : 'Marked in stock');
            }
        } catch { toast.error('Error toggling stock'); }
    };

    const toggleVisibility = async (p) => {
        try {
            const res = await fetch(`/api/admin/catalog/products/${p._id}/visibility`, {
                method: 'PATCH'
            });
            if (res.ok) {
                invalidate();
                toast.success(p.isHidden ? 'Product shown' : 'Product hidden');
            }
        } catch { toast.error('Error toggling visibility'); }
    };

    // ══════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col font-sans">

            {/* ─── HEADER ─── */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { if (navigator.vibrate) navigator.vibrate(40); navigate('/admin/shops'); }}
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                    >
                        <IconBack />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">Catalog Manager</span>
                        <span className="text-[11px] font-bold text-amber-600 truncate max-w-[180px]">{shopName}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAuditLog(!showAuditLog)}
                        className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 border ${showAuditLog ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                    >
                        📋 Logs
                    </button>
                    <button className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all" onClick={() => setShowMultiImportModal(true)}>
                        ⬇️ Import Multiple
                    </button>
                    <button className="px-4 py-2 bg-amber-400 text-amber-950 rounded-xl text-[12px] font-black shadow-[0_4px_14px_rgba(251,191,36,0.3)] active:scale-95 transition-transform" onClick={openAddProd}>
                        + Add Item
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 max-w-7xl mx-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                {/* ─── AUDIT LOG PANEL ─── */}
                {showAuditLog && (
                    <div className="mb-6 bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Activity Log</h3>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{auditData?.total || 0} entries</span>
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 [scrollbar-width:none]">
                            {auditLogs.length === 0 ? (
                                <div className="p-8 text-center text-sm font-bold text-slate-400">No activity recorded yet.</div>
                            ) : auditLogs.map((log) => {
                                const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-slate-100 text-slate-600', icon: '📌' };
                                return (
                                    <div key={log._id} className="px-5 py-3 flex items-start gap-3">
                                        <span className="text-base mt-0.5">{meta.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                                            </div>
                                            <div className="text-[12px] font-bold text-slate-800 truncate">{log.targetName || '—'}</div>
                                            <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                                                {log.adminId?.name || 'Admin'} · {new Date(log.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-6">

                    {/* ── CATEGORY SIDEBAR (Desktop) ── */}
                    <div className="hidden md:block w-64 shrink-0 space-y-1">
                        <button className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-[14px] font-black transition-all ${!selectedCat ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`} onClick={() => { setSelectedCat(null); setPage(1); }}>
                            📦 All Items <span className="ml-auto text-[10px] font-bold opacity-60 bg-white/20 px-2 py-0.5 rounded-md">{totalProducts}</span>
                        </button>
                        <div className="my-2 border-t border-slate-100"></div>
                        <div className="flex items-center justify-between px-2 mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categories</span>
                            <button onClick={openAddCat} className="text-amber-500 text-[10px] font-black uppercase tracking-wider hover:text-amber-600">+ Add</button>
                        </div>
                        {categories.map((cat, idx) => (
                            <div key={cat._id} className="group relative">
                                <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-[13px] font-bold transition-all pr-24 ${selectedCat === cat._id ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-50 text-slate-700'}`} onClick={() => { setSelectedCat(cat._id); setPage(1); }}>
                                    {cat.image ? <img src={cat.image} className="w-6 h-6 rounded-lg object-cover" loading="lazy" alt="" /> : '🏷'}
                                    <span className="truncate">{cat.name}</span>
                                    <span className="ml-auto text-[10px] font-black opacity-50">{getCatCount(cat._id)}</span>
                                </button>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                                    <button onClick={() => moveCat(cat._id, 'up')} disabled={idx === 0} className="w-6 h-6 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-30"><IconChevronUp /></button>
                                    <button onClick={() => moveCat(cat._id, 'down')} disabled={idx === categories.length - 1} className="w-6 h-6 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-30"><IconChevronDown /></button>
                                    <button onClick={(e) => { e.stopPropagation(); openEditCat(cat); }} className="w-6 h-6 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[10px]">✏️</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── MAIN CONTENT ── */}
                    <div className="flex-1">

                        {/* Mobile Category Chips */}
                        <div className="md:hidden flex items-center justify-between mb-2 px-1">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Categories</span>
                            <button onClick={openAddCat} className="text-amber-500 text-[11px] font-black uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-md">+ Add</button>
                        </div>
                        <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <button className={`shrink-0 px-5 py-2.5 rounded-xl text-[12px] font-black whitespace-nowrap transition-all border ${!selectedCat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100 text-slate-600 shadow-sm'}`} onClick={() => { setSelectedCat(null); setPage(1); }}>All Items</button>
                            {categories.map(cat => (
                                <button onDoubleClick={() => openEditCat(cat)} key={cat._id} className={`shrink-0 px-5 py-2.5 rounded-xl text-[12px] font-black whitespace-nowrap transition-all border ${selectedCat === cat._id ? 'bg-amber-400 text-amber-950 border-amber-400' : 'bg-white border-slate-100 text-slate-600 shadow-sm'}`} onClick={() => { setSelectedCat(cat._id); setPage(1); }}>{cat.name}</button>
                            ))}
                        </div>

                        {/* Search */}
                        <input className="w-full mb-6 py-4 px-5 bg-white border border-slate-100 rounded-[16px] text-sm font-bold text-slate-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all shadow-sm placeholder:text-slate-400" placeholder="Search catalog..." value={search} onChange={e => setSearch(e.target.value)} />

                        {/* Loading State */}
                        {prodsLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-[24px] border border-slate-100 overflow-hidden animate-pulse">
                                        <div className="h-32 bg-slate-100"></div>
                                        <div className="p-3.5 space-y-2">
                                            <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                                            <div className="h-2 bg-slate-50 rounded w-1/2"></div>
                                            <div className="h-4 bg-slate-100 rounded w-1/3 mt-3"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <span className="text-5xl mb-4 opacity-30">📦</span>
                                <p className="text-sm font-black text-slate-400">No products found</p>
                                <p className="text-xs font-medium text-slate-300 mt-1">Try a different search or add a new item</p>
                            </div>
                        ) : (
                            <>
                                {/* Product Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                    {products.map(p => (
                                        <div key={p._id} className={`bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col group relative ${p.isHidden ? 'opacity-60' : ''}`}>
                                            {/* Badges */}
                                            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                                                {!p.inStock && <span className="bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest shadow">OOS</span>}
                                                {p.isHidden && <span className="bg-violet-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest shadow">Hidden</span>}
                                            </div>

                                            <div className="h-32 bg-slate-50 relative p-2 flex items-center justify-center">
                                                {p.image ? <img src={p.image} className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" loading="lazy" alt={p.name} /> : <span className="text-3xl opacity-20">📷</span>}
                                                {!p.inStock && <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center"><span className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-lg">Out of Stock</span></div>}
                                            </div>
                                            <div className="p-3.5 flex flex-col flex-1 border-t border-slate-50">
                                                <h4 className="text-[13px] font-black text-slate-900 line-clamp-2 leading-snug mb-1">
                                                    {p.name} {p.quantity && <span className="text-slate-500 font-bold">({p.quantity})</span>}
                                                </h4>
                                                <p className="text-[10px] font-bold text-slate-400 mb-2">{getCatName(getProductCatId(p))}</p>
                                                <div className="mt-auto">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[15px] font-black text-slate-900">₹{p.price}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-amber-100 hover:text-amber-700 transition-colors" title="Edit" onClick={() => openEditProd(p)}>✏️</button>
                                                        <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-rose-500 hover:bg-rose-100 transition-colors" title="Delete" onClick={() => deleteProd(p)}>🗑</button>
                                                        <button className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${p.inStock ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`} title={p.inStock ? 'Mark Out of Stock' : 'Mark In Stock'} onClick={() => toggleStock(p)}>
                                                            <IconStock />
                                                        </button>
                                                        <button className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${p.isHidden ? 'bg-violet-50 text-violet-600 hover:bg-violet-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`} title={p.isHidden ? 'Show Product' : 'Hide Product'} onClick={() => toggleVisibility(p)}>
                                                            {p.isHidden ? <IconEyeOff /> : <IconEye />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-3 mt-8">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page <= 1}
                                            className="px-4 py-2.5 rounded-xl text-[12px] font-black bg-white border border-slate-200 text-slate-600 disabled:opacity-30 active:scale-95 transition-all"
                                        >
                                            ← Prev
                                        </button>
                                        <span className="text-[12px] font-black text-slate-400">
                                            Page {page} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page >= totalPages}
                                            className="px-4 py-2.5 rounded-xl text-[12px] font-black bg-white border border-slate-200 text-slate-600 disabled:opacity-30 active:scale-95 transition-all"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ CATEGORY MODAL (Bottom Sheet) ═══ */}
            {catModal && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setCatModal(null)}>
                    <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-full duration-300 p-6 pb-8" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-slate-900">{catModal === 'add' ? 'New Category' : 'Edit Category'}</h2>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-95 transition-transform" onClick={() => setCatModal(null)}>✕</button>
                        </div>

                        <div className="space-y-5">
                            <div className="relative">
                                <input type="text" className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Name" value={catName} onChange={e => setCatName(e.target.value)} />
                                <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Category Name</label>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Logo / Icon (Optional)</label>
                                <input type="file" accept="image/*" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-black file:uppercase file:tracking-wider file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 transition-colors" onChange={e => setCatImage(e.target.files[0])} />
                                {catModal._id && catModal.image && !catImage && (
                                    <img src={catModal.image} className="w-14 h-14 rounded-2xl mt-3 object-cover shadow-sm border border-slate-200" alt="" />
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                {catModal._id && (
                                    <button className="px-5 py-3.5 bg-rose-50 text-rose-600 rounded-2xl text-[13px] font-black active:scale-95 transition-transform mr-auto" onClick={() => deleteCat(catModal)}>Delete</button>
                                )}
                                <button className="flex-1 px-5 py-3.5 bg-amber-400 text-amber-950 rounded-2xl text-[14px] font-black shadow-[0_4px_14px_rgba(251,191,36,0.3)] active:scale-95 transition-transform disabled:opacity-50" disabled={!catName.trim() || catSaving} onClick={saveCat}>
                                    {catSaving ? 'Saving...' : 'Save Category'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ PRODUCT MODAL (Bottom Sheet) ═══ */}
            {prodModal && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setProdModal(null)}>
                    <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0"></div>
                        <div className="p-6 pb-4 flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-black text-slate-900">{prodModal === 'add' ? 'Add New Item' : 'Edit Item'}</h2>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-95 transition-transform" onClick={() => setProdModal(null)}>✕</button>
                        </div>

                        <div className="px-6 pb-6 space-y-5 overflow-y-auto [scrollbar-width:none]">

                            <div className="relative">
                                <input type="text" className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" required placeholder="Item Name" value={prodName} onChange={e => setProdName(e.target.value)} />
                                <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Item Name</label>
                            </div>

                            <div className="relative">
                                <input type="text" className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Quantity (e.g. 1 Kg)" value={prodQuantity} onChange={e => setProdQuantity(e.target.value)} />
                                <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Quantity/Unit (Optional)</label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <input type="number" className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" required placeholder="Price" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                                    <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Price (₹)</label>
                                </div>
                                <div className="relative">
                                    <select className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all appearance-none" value={prodCatId} onChange={e => setProdCatId(e.target.value)}>
                                        {categories.length === 0 && <option value="">No categories</option>}
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest -translate-y-2">Category</label>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="relative">
                                <textarea className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent resize-none" rows={3} placeholder="Description" value={prodDesc} onChange={e => setProdDesc(e.target.value)} />
                                <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Description (Optional)</label>
                            </div>

                            {/* Toggles */}
                            <div className="flex gap-4">
                                <label className="flex items-center gap-3 flex-1 px-4 py-3 bg-slate-50 rounded-2xl cursor-pointer" onClick={() => setProdInStock(!prodInStock)}>
                                    <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${prodInStock ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${prodInStock ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                    <span className="text-[12px] font-black text-slate-700">In Stock</span>
                                </label>
                                <label className="flex items-center gap-3 flex-1 px-4 py-3 bg-slate-50 rounded-2xl cursor-pointer" onClick={() => setProdIsHidden(!prodIsHidden)}>
                                    <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${prodIsHidden ? 'bg-violet-500' : 'bg-slate-300'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${prodIsHidden ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                    <span className="text-[12px] font-black text-slate-700">Hidden</span>
                                </label>
                            </div>

                            {/* Main Photo */}
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Main Photo (Optional)</label>
                                <input type="file" accept="image/*" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-black file:uppercase file:tracking-wider file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 transition-colors" onChange={handleProdImage} />
                                {prodImagePreview && <img src={prodImagePreview} className="h-20 rounded-2xl mt-3 object-cover shadow-sm border border-slate-200" alt="" />}
                                {!prodImagePreview && prodModal?.image && <img src={prodModal.image} className="h-20 rounded-2xl mt-3 object-cover shadow-sm border border-slate-200 opacity-80" alt="" />}
                            </div>

                            {/* Gallery */}
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Gallery Photos (Max 4)</label>
                                <input type="file" accept="image/*" multiple className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-black file:uppercase file:tracking-wider file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 transition-colors" onChange={handleProdGallery} />
                                {prodGalleryPreviews.length > 0 ? (
                                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2 [scrollbar-width:none]">
                                        {prodGalleryPreviews.map((src, i) => <img key={i} src={src} className="h-16 w-16 rounded-xl object-cover shadow-sm border border-slate-200 shrink-0" alt="" />)}
                                    </div>
                                ) : prodModal?.gallery?.length > 0 && (
                                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2 [scrollbar-width:none]">
                                        {prodModal.gallery.map((src, i) => <img key={i} src={src} className="h-16 w-16 rounded-xl object-cover shadow-sm border border-slate-200 opacity-80 shrink-0" alt="" />)}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3 shrink-0">
                                <button type="button" className="flex-1 py-4 bg-amber-400 text-amber-950 rounded-2xl text-[14px] font-black shadow-[0_4px_14px_rgba(251,191,36,0.3)] active:scale-95 transition-transform disabled:opacity-50" disabled={prodSaving} onClick={saveProd}>
                                    {prodSaving ? 'Saving...' : prodModal === 'add' ? 'Create Item' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ CROPPER OVERLAY ═══ */}
            {isCropping && (
                <div className="fixed inset-0 z-[300] bg-black flex flex-col">
                    <header className="shrink-0 h-14 flex items-center justify-between px-4 z-10 bg-gradient-to-b from-black/50 to-transparent">
                        <button onClick={() => { setIsCropping(false); setCropImageSrc(null); }} className="p-2 -ml-2 text-white rounded-full">✕</button>
                        <h1 className="text-white font-bold tracking-tight">Crop Photo</h1>
                        <button onClick={handleCropSave} className="text-amber-400 font-bold uppercase tracking-wider text-sm active:opacity-70">Done</button>
                    </header>
                    <div className="flex-1 relative">
                        {cropImageSrc && (
                            <Cropper
                                image={cropImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                objectFit="contain"
                            />
                        )}
                    </div>
                    <div className="h-24 bg-black/90 pb-safe flex items-center justify-center px-8 z-10">
                        <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} className="w-full accent-amber-400" />
                    </div>
                </div>
            )}

            <GodownMultiImportModal 
                isOpen={showMultiImportModal} 
                onClose={() => setShowMultiImportModal(false)} 
                onSuccess={() => {
                    queryClient.invalidateQueries(['admin-catalog-products']);
                    queryClient.invalidateQueries(['admin-catalog-stats']);
                }} 
                shopId={shopId} 
            />
        </div>
    );
};

export default AdminCatalog;
