import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

const VendorMenu = () => {
    const { shop, token } = useOutletContext();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCat, setSelectedCat] = useState(null);
    const [search, setSearch] = useState('');

    // Category modals
    const [catModal, setCatModal] = useState(null);
    const [catName, setCatName] = useState('');
    const [catImage, setCatImage] = useState(null);
    const [catSaving, setCatSaving] = useState(false);

    // Product modals
    const [prodModal, setProdModal] = useState(null);
    const [prodName, setProdName] = useState('');
    const [prodPrice, setProdPrice] = useState('');
    const [prodCatId, setProdCatId] = useState('');
    const [prodImage, setProdImage] = useState(null);
    const [prodImagePreview, setProdImagePreview] = useState('');
    const [prodSaving, setProdSaving] = useState(false);

    const fetchCategories = useCallback(() => {
        if (!shop?._id) return;
        fetch(`/api/categories/${shop._id}`).then(r => r.json()).then(data => {
            if (Array.isArray(data)) setCategories(data);
        });
    }, [shop]);

    const fetchProducts = useCallback(() => {
        if (!shop?._id) return;
        fetch(`/api/products/${shop._id}`).then(r => r.json()).then(data => {
            if (Array.isArray(data)) setProducts(data);
        });
    }, [shop]);

    useEffect(() => { fetchCategories(); fetchProducts(); }, [fetchCategories, fetchProducts]);

    // ── Category handlers ──
    const openAddCat = () => { if (navigator.vibrate) navigator.vibrate(30); setCatModal('add'); setCatName(''); setCatImage(null); };
    const openEditCat = (cat) => { if (navigator.vibrate) navigator.vibrate(30); setCatModal(cat); setCatName(cat.name); setCatImage(null); };

    const saveCat = async () => {
        setCatSaving(true);
        const isEdit = catModal && catModal._id;
        const fd = new FormData();
        fd.append('name', catName);
        if (catImage) fd.append('image', catImage);

        try {
            const res = await fetch(isEdit ? `/api/categories/${catModal._id}` : '/api/categories', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (res.ok) {
                fetchCategories();
                setCatModal(null);
            } else {
                const d = await res.json();
                alert(d.message || 'Failed');
            }
        } catch { alert('Error saving category'); }
        setCatSaving(false);
    };

    const deleteCat = async (cat) => {
        if (!window.confirm(`Delete category "${cat.name}"?`)) return;
        if (navigator.vibrate) navigator.vibrate(50);
        const res = await fetch(`/api/categories/${cat._id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) { fetchCategories(); if (selectedCat === cat._id) setSelectedCat(null); }
        else { const d = await res.json(); alert(d.message || 'Failed'); }
    };

    // ── Product handlers ──
    const openAddProd = () => {
        if (navigator.vibrate) navigator.vibrate(30);
        setProdModal('add'); setProdName(''); setProdPrice(''); setProdImage(null); setProdImagePreview('');
        setProdCatId(categories.length > 0 ? categories[0]._id : '');
    };
    const openEditProd = (p) => {
        if (navigator.vibrate) navigator.vibrate(30);
        setProdModal(p); setProdName(p.name); setProdPrice(p.price);
        setProdCatId(typeof p.category === 'object' ? p.category._id || p.category : p.category);
        setProdImage(null); setProdImagePreview('');
    };

    const handleProdImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setProdImage(file);
        setProdImagePreview(URL.createObjectURL(file));
    };

    const saveProd = async (e) => {
        e.preventDefault();
        setProdSaving(true);
        const isEdit = prodModal && prodModal._id;
        const fd = new FormData();
        fd.append('name', prodName);
        fd.append('price', Number(prodPrice));
        fd.append('categoryId', prodCatId);
        if (prodImage) fd.append('image', prodImage);

        try {
            const res = await fetch(isEdit ? `/api/products/${prodModal._id}` : '/api/products', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (res.ok) {
                fetchProducts();
                setProdModal(null);
            } else {
                const d = await res.json();
                alert(d.message || 'Failed');
            }
        } catch { alert('Error saving product'); }
        setProdSaving(false);
    };

    const deleteProd = async (p) => {
        if (!window.confirm(`Delete "${p.name}"?`)) return;
        if (navigator.vibrate) navigator.vibrate(50);
        await fetch(`/api/products/${p._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        fetchProducts();
    };

    const getCatName = (catId) => {
        if (!catId) return 'Uncategorized';
        if (typeof catId === 'string') {
            const cat = categories.find(c => c._id === catId);
            return cat ? cat.name : catId;
        }
        return catId.name || 'Uncategorized';
    };

    const getProductCatId = (p) => typeof p.category === 'object' ? (p.category?._id || p.category) : p.category;

    const filteredProducts = products
        .filter(p => {
            if (selectedCat && getProductCatId(p) !== selectedCat) return false;
            if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (a.inStock === b.inStock) return 0;
            return a.inStock ? 1 : -1;
        });

    const getCatCount = (catId) => products.filter(p => getProductCatId(p) === catId).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Catalog</h1>
                    <p className="text-[13px] font-semibold text-slate-500 mt-1">Manage inventory & menu.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex-1 sm:flex-none px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[13px] font-black text-slate-700 active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-sm" onClick={() => navigate('/vendor/godown')}>
                        <span>📦</span> Import
                    </button>
                    <button className="flex-1 sm:flex-none px-5 py-3 bg-amber-400 text-amber-950 rounded-2xl text-[13px] font-black shadow-[0_4px_14px_rgba(251,191,36,0.3)] active:scale-95 transition-transform" onClick={openAddProd}>
                        + Add Item
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">

                {/* ── CATEGORY SIDEBAR (Desktop) ── */}
                <div className="hidden md:block w-64 shrink-0 space-y-1">
                    <button className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-[14px] font-black transition-all ${!selectedCat ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`} onClick={() => setSelectedCat(null)}>
                        📦 All Items <span className="ml-auto text-[10px] font-bold opacity-60 bg-white/20 px-2 py-0.5 rounded-md">{products.length}</span>
                    </button>
                    <div className="my-2 border-t border-slate-100"></div>
                    <div className="flex items-center justify-between px-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categories</span>
                        <button onClick={openAddCat} className="text-amber-500 text-[10px] font-black uppercase tracking-wider hover:text-amber-600">+ Add</button>
                    </div>
                    {categories.map(cat => (
                        <div key={cat._id} className="group relative">
                            <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-[13px] font-bold transition-all pr-10 ${selectedCat === cat._id ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-50 text-slate-700'}`} onClick={() => setSelectedCat(cat._id)}>
                                {cat.image ? <img src={cat.image} className="w-6 h-6 rounded-lg object-cover" /> : '🏷'}
                                <span className="truncate">{cat.name}</span>
                                <span className="ml-auto text-[10px] font-black opacity-50">{getCatCount(cat._id)}</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); openEditCat(cat); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl bg-white shadow-sm border border-slate-100 hidden group-hover:flex items-center justify-center text-[10px]">✏️</button>
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
                        <button className={`shrink-0 px-5 py-2.5 rounded-xl text-[12px] font-black whitespace-nowrap transition-all border ${!selectedCat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100 text-slate-600 shadow-sm'}`} onClick={() => setSelectedCat(null)}>All Items</button>
                        {categories.map(cat => (
                            <button onDoubleClick={() => openEditCat(cat)} key={cat._id} className={`shrink-0 px-5 py-2.5 rounded-xl text-[12px] font-black whitespace-nowrap transition-all border ${selectedCat === cat._id ? 'bg-amber-400 text-amber-950 border-amber-400' : 'bg-white border-slate-100 text-slate-600 shadow-sm'}`} onClick={() => setSelectedCat(cat._id)}>{cat.name}</button>
                        ))}
                    </div>

                    {/* Search */}
                    <input className="w-full mb-6 py-4 px-5 bg-white border border-slate-100 rounded-[16px] text-sm font-bold text-slate-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all shadow-sm placeholder:text-slate-400" placeholder="Search catalog..." value={search} onChange={e => setSearch(e.target.value)} />

                    {/* Product Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {filteredProducts.map(p => (
                            <div key={p._id} className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col group">
                                <div className="h-32 bg-slate-50 relative p-2 flex items-center justify-center">
                                    {p.image ? <img src={p.image} className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" /> : <span className="text-3xl opacity-20">📷</span>}
                                    {!p.inStock && <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center"><span className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-lg">Out of Stock</span></div>}
                                </div>
                                <div className="p-3.5 flex flex-col flex-1 border-t border-slate-50">
                                    <h4 className="text-[13px] font-black text-slate-900 line-clamp-2 leading-snug mb-1">{p.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 mb-3">{getCatName(getProductCatId(p))}</p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-[15px] font-black text-slate-900">₹{p.price}</span>
                                        <div className="flex gap-1.5">
                                            <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-amber-100 hover:text-amber-700 transition-colors" onClick={() => openEditProd(p)}>✏️</button>
                                            <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-rose-500 hover:bg-rose-100 transition-colors" onClick={() => deleteProd(p)}>🗑</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ FLOATING BOTTOM SHEET: CATEGORY MODAL ═══ */}
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
                                    <img src={catModal.image} className="w-14 h-14 rounded-2xl mt-3 object-cover shadow-sm border border-slate-200" />
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                {catModal._id && (
                                    <button className="px-5 py-3.5 bg-rose-50 text-rose-600 rounded-2xl text-[13px] font-black active:scale-95 transition-transform mr-auto" onClick={() => { deleteCat(catModal); setCatModal(null); }}>Delete</button>
                                )}
                                <button className="flex-1 px-5 py-3.5 bg-amber-400 text-amber-950 rounded-2xl text-[14px] font-black shadow-[0_4px_14px_rgba(251,191,36,0.3)] active:scale-95 transition-transform disabled:opacity-50" disabled={!catName.trim() || catSaving} onClick={saveCat}>
                                    {catSaving ? 'Saving...' : 'Save Category'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ FLOATING BOTTOM SHEET: PRODUCT MODAL ═══ */}
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

                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Photo (Optional)</label>
                                <input type="file" accept="image/*" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-black file:uppercase file:tracking-wider file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 transition-colors" onChange={handleProdImage} />
                                {prodImagePreview && <img src={prodImagePreview} className="h-20 rounded-2xl mt-3 object-cover shadow-sm border border-slate-200" />}
                                {!prodImagePreview && prodModal?.image && <img src={prodModal.image} className="h-20 rounded-2xl mt-3 object-cover shadow-sm border border-slate-200 opacity-80" />}
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
        </div>
    );
};

export default VendorMenu;