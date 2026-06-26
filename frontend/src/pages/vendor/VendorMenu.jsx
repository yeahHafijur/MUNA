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
    const [catModal, setCatModal] = useState(null); // null | 'add' | category obj (edit)
    const [catName, setCatName] = useState('');
    const [catImage, setCatImage] = useState(null);
    const [catSaving, setCatSaving] = useState(false);

    // Product modals
    const [prodModal, setProdModal] = useState(null); // null | 'add' | product obj (edit)
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
    const openAddCat = () => { setCatModal('add'); setCatName(''); setCatImage(null); };
    const openEditCat = (cat) => { setCatModal(cat); setCatName(cat.name); setCatImage(null); };

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
        const res = await fetch(`/api/categories/${cat._id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) { fetchCategories(); if (selectedCat === cat._id) setSelectedCat(null); }
        else { const d = await res.json(); alert(d.message || 'Failed'); }
    };

    // ── Product handlers ──
    const openAddProd = () => {
        setProdModal('add'); setProdName(''); setProdPrice(''); setProdImage(null); setProdImagePreview('');
        setProdCatId(categories.length > 0 ? categories[0]._id : '');
    };
    const openEditProd = (p) => {
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

    const toggleStock = async (p) => {
        await fetch(`/api/products/${p._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ inStock: !p.inStock }),
        });
        fetchProducts();
    };

    const deleteProd = async (p) => {
        if (!window.confirm(`Delete "${p.name}"?`)) return;
        await fetch(`/api/products/${p._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        fetchProducts();
    };

    // ── Helpers ──
    const getCatName = (catId) => {
        if (!catId) return 'Uncategorized';
        if (typeof catId === 'string') {
            const cat = categories.find(c => c._id === catId);
            return cat ? cat.name : catId; // Fallback to string for legacy
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
            return a.inStock ? 1 : -1; // OOS first
        });

    const getCatCount = (catId) => products.filter(p => getProductCatId(p) === catId).length;
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Catalog</h1>
                    <p className="text-xs font-medium text-slate-500">Manage your shop inventory and items</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all" onClick={() => navigate('/vendor/godown')}>📦 Import</button>
                    <button className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-400 text-amber-950 rounded-xl text-xs font-bold shadow-sm hover:bg-amber-500 transition-all" onClick={openAddProd}>+ Add Item</button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Desktop Category Sidebar */}
                <div className="hidden md:block w-64 shrink-0 space-y-1">
                    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${!selectedCat ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`} onClick={() => setSelectedCat(null)}>
                        📦 All Items <span className="ml-auto text-[10px] opacity-60">{products.length}</span>
                    </button>
                    {categories.map(cat => (
                        <button key={cat._id} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedCat === cat._id ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-100'}`} onClick={() => setSelectedCat(cat._id)}>
                            {cat.image ? <img src={cat.image} className="w-6 h-6 rounded-lg object-cover" /> : '🏷'}
                            {cat.name}
                            <span className="ml-auto text-[10px] opacity-60">{getCatCount(cat._id)}</span>
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {/* Mobile Category Chips */}
                    <div className="md:hidden flex gap-2 overflow-x-auto pb-4 -mb-2 no-scrollbar">
                        <button className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${!selectedCat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200'}`} onClick={() => setSelectedCat(null)}>All</button>
                        {categories.map(cat => (
                            <button key={cat._id} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${selectedCat === cat._id ? 'bg-amber-400 text-amber-950 border-amber-400' : 'bg-white border-slate-200'}`} onClick={() => setSelectedCat(cat._id)}>{cat.name}</button>
                        ))}
                    </div>

                    {/* Search */}
                    <input className="w-full mb-6 py-3 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-amber-400 outline-none transition-all" placeholder="Search catalog..." value={search} onChange={e => setSearch(e.target.value)} />

                    {/* Product Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredProducts.map(p => (
                            <div key={p._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                                <div className="h-32 bg-slate-50 relative">
                                    {p.image && <img src={p.image} className="w-full h-full object-cover" />}
                                    {!p.inStock && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center text-[10px] font-black uppercase text-slate-900">Out of Stock</div>}
                                </div>
                                <div className="p-3 flex flex-col flex-1">
                                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mb-0.5">{p.name}</h4>
                                    <p className="text-[10px] font-medium text-slate-400 mb-3">{getCatName(getProductCatId(p))}</p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-sm font-black text-slate-900">₹{p.price}</span>
                                        <div className="flex gap-1">
                                            <button className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700 transition-colors" onClick={() => openEditProd(p)}>✏️</button>
                                            <button className="p-1.5 rounded-lg bg-slate-100 text-red-500 hover:bg-red-50 transition-colors" onClick={() => deleteProd(p)}>🗑</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* ═══ CATEGORY MODAL ═══ */}
            {catModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setCatModal(null)}>
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-lg font-black text-slate-900">{catModal === 'add' ? 'New Category' : 'Edit Category'}</h2>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors" onClick={() => setCatModal(null)}>✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Category Name</label>
                                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-amber-400 focus:outline-none transition-colors" placeholder="e.g. Electronics, Groceries..." value={catName} onChange={e => setCatName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Logo / Icon (optional)</label>
                                <input type="file" accept="image/*" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 transition-colors" onChange={e => setCatImage(e.target.files[0])} />
                                {catModal._id && catModal.image && !catImage && (
                                    <img src={catModal.image} className="w-12 h-12 rounded-xl mt-3 object-cover shadow-sm border border-slate-200" />
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                            {catModal._id && (
                                <button className="px-4 py-3 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors mr-auto" onClick={() => { deleteCat(catModal); setCatModal(null); }}>Delete</button>
                            )}
                            <button className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors" onClick={() => setCatModal(null)}>Cancel</button>
                            <button className="px-6 py-3 bg-amber-400 text-amber-950 rounded-xl text-sm font-bold shadow-sm hover:bg-amber-500 transition-colors disabled:opacity-50" disabled={!catName.trim() || catSaving} onClick={saveCat}>
                                {catSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ PRODUCT MODAL ═══ */}
            {prodModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setProdModal(null)}>
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <h2 className="text-lg font-black text-slate-900">{prodModal === 'add' ? 'Add New Item' : 'Edit Item'}</h2>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors" onClick={() => setProdModal(null)}>✕</button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Item Name</label>
                                    <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-amber-400 focus:outline-none transition-colors" required placeholder="e.g. Product name" value={prodName} onChange={e => setProdName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Price (₹)</label>
                                    <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-amber-400 focus:outline-none transition-colors" required placeholder="0" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Category</label>
                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-400 focus:outline-none transition-colors appearance-none" value={prodCatId} onChange={e => setProdCatId(e.target.value)}>
                                    {categories.length === 0 && <option value="">No categories</option>}
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Photo {prodModal !== 'add' && <span className="text-slate-400 normal-case tracking-normal font-medium">(optional)</span>}</label>
                                <input type="file" accept="image/*" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 transition-colors" onChange={handleProdImage} />
                                {prodImagePreview && <img src={prodImagePreview} className="h-16 rounded-xl mt-3 object-cover shadow-sm border border-slate-200" />}
                                {!prodImagePreview && prodModal?.image && <img src={prodModal.image} className="h-16 rounded-xl mt-3 object-cover shadow-sm border border-slate-200 opacity-60" />}
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
                            <button type="button" className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors" onClick={() => setProdModal(null)}>Cancel</button>
                            <button type="button" className="flex-1 py-3 bg-amber-400 text-amber-950 rounded-xl text-sm font-bold shadow-sm hover:bg-amber-500 transition-colors disabled:opacity-50" disabled={prodSaving} onClick={saveProd}>
                                {prodSaving ? 'Saving...' : prodModal === 'add' ? 'Create Item' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorMenu;