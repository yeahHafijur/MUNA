import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

const VendorMenu = () => {
    const { shop, token } = useOutletContext();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCat, setSelectedCat] = useState(null); // null = "All"
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
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Catalog</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="v-btn v-btn-ghost v-btn-sm" onClick={() => navigate('/vendor/godown')}>📦 Import from Godown</button>
                    <button className="v-btn v-btn-primary" onClick={openAddProd}>+ Add Item</button>
                </div>
            </div>

            <div className="v-menu-layout">
                {/* ═══ CATEGORY SIDEBAR (Desktop) ═══ */}
                <div className="v-cat-sidebar">
                    <button className={`v-cat-item ${!selectedCat ? 'active' : ''}`} onClick={() => setSelectedCat(null)}>
                        <span style={{ fontSize: '16px' }}>📦</span>
                        All Items
                        <span className="v-cat-item-count">{products.length}</span>
                    </button>
                    {categories.map(cat => (
                        <button key={cat._id} className={`v-cat-item ${selectedCat === cat._id ? 'active' : ''}`} onClick={() => setSelectedCat(cat._id)}>
                            {cat.image ? <img src={cat.image} alt="" className="v-cat-item-img" /> : <span style={{ fontSize: '16px' }}>🏷</span>}
                            <span style={{ flex: 1, textAlign: 'left' }}>
                                {cat.name}
                                {cat.isGlobal && <span style={{ fontSize: '9px', marginLeft: '4px', color: '#22c55e' }}>🌐</span>}
                            </span>
                            <span className="v-cat-item-count">{getCatCount(cat._id)}</span>
                            {!cat.isGlobal && <button className="v-cat-item-edit" onClick={(e) => { e.stopPropagation(); openEditCat(cat); }} title="Edit">✏️</button>}
                        </button>
                    ))}
                    <button className="v-cat-item" style={{ color: 'var(--v-primary)', fontWeight: 600 }} onClick={openAddCat}>
                        <span>+</span> New Category
                    </button>
                </div>

                {/* ═══ PRODUCT AREA ═══ */}
                <div>
                    {/* Mobile category chips */}
                    <div className="v-chipbar" style={{ display: 'none', marginBottom: '16px' }} id="v-mobile-chips">
                        <button className={`v-chip ${!selectedCat ? 'active' : ''}`} onClick={() => setSelectedCat(null)}>All ({products.length})</button>
                        {categories.map(cat => (
                            <button key={cat._id} className={`v-chip ${selectedCat === cat._id ? 'active' : ''}`} onClick={() => setSelectedCat(cat._id)}>
                                {cat.image && <img src={cat.image} alt="" />}
                                {cat.name} ({getCatCount(cat._id)})
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="v-searchbar" style={{ marginBottom: '16px' }}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>

                    {/* Product Grid */}
                    {filteredProducts.length === 0 ? (
                        <div className="v-empty">
                            <div className="v-empty-icon">📦</div>
                            <div className="v-empty-title">No items found</div>
                            <div className="v-empty-text">{search ? 'Try a different search term.' : 'Add items to your catalog.'}</div>
                        </div>
                    ) : (
                        <div className="v-product-grid">
                            {filteredProducts.map(p => (
                                <div key={p._id} className="v-product-card" style={{ opacity: p.inStock ? 1 : 0.6 }}>
                                    <div className="v-product-card-img">
                                        {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}
                                    </div>
                                    <div className="v-product-card-body">
                                        <div className="v-product-card-name">{p.name}</div>
                                        <div className="v-product-card-cat">{getCatName(getProductCatId(p))}</div>
                                        <div className="v-product-card-footer">
                                            <span className="v-product-card-price">₹{p.price}</span>
                                            <div className="v-product-card-actions">
                                                <button className={`v-stock-badge ${p.inStock ? 'v-stock-in' : 'v-stock-out'}`} onClick={() => toggleStock(p)}>
                                                    {p.inStock ? 'In Stock' : 'Out'}
                                                </button>
                                                <button className="v-btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => openEditProd(p)} title="Edit">✏️</button>
                                                <button className="v-btn-icon" style={{ width: '28px', height: '28px', color: 'var(--v-danger)' }} onClick={() => deleteProd(p)} title="Delete">🗑</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ CATEGORY MODAL ═══ */}
            {catModal && (
                <div className="v-modal-overlay" onClick={() => setCatModal(null)}>
                    <div className="v-modal" onClick={e => e.stopPropagation()}>
                        <div className="v-modal-header">
                            <div className="v-modal-title">{catModal === 'add' ? 'New Category' : 'Edit Category'}</div>
                            <button className="v-modal-close" onClick={() => setCatModal(null)}>✕</button>
                        </div>
                        <div className="v-modal-body">
                            <div className="v-field" style={{ marginBottom: '14px' }}>
                                <label className="v-label">Category Name</label>
                                <input className="v-input" placeholder="e.g. Electronics, Groceries..." value={catName} onChange={e => setCatName(e.target.value)} />
                            </div>
                            <div className="v-field" style={{ marginBottom: '14px' }}>
                                <label className="v-label">Logo / Icon (optional)</label>
                                <input type="file" accept="image/*" className="v-input" onChange={e => setCatImage(e.target.files[0])} />
                                {catModal._id && catModal.image && !catImage && (
                                    <img src={catModal.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', marginTop: '8px', objectFit: 'cover' }} />
                                )}
                            </div>
                        </div>
                        <div className="v-modal-footer">
                            {catModal._id && (
                                <button className="v-btn v-btn-danger v-btn-sm" style={{ marginRight: 'auto' }} onClick={() => { deleteCat(catModal); setCatModal(null); }}>Delete</button>
                            )}
                            <button className="v-btn v-btn-ghost" onClick={() => setCatModal(null)}>Cancel</button>
                            <button className="v-btn v-btn-primary" disabled={!catName.trim() || catSaving} onClick={saveCat}>
                                {catSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ PRODUCT MODAL ═══ */}
            {prodModal && (
                <div className="v-modal-overlay" onClick={() => setProdModal(null)}>
                    <div className="v-modal" onClick={e => e.stopPropagation()}>
                        <div className="v-modal-header">
                            <div className="v-modal-title">{prodModal === 'add' ? 'Add New Item' : 'Edit Item'}</div>
                            <button className="v-modal-close" onClick={() => setProdModal(null)}>✕</button>
                        </div>
                        <form onSubmit={saveProd}>
                            <div className="v-modal-body">
                                <div className="v-grid-2" style={{ marginBottom: '14px' }}>
                                    <div className="v-field">
                                        <label className="v-label">Item Name</label>
                                        <input className="v-input" required placeholder="e.g. Product name" value={prodName} onChange={e => setProdName(e.target.value)} />
                                    </div>
                                    <div className="v-field">
                                        <label className="v-label">Price (₹)</label>
                                        <input type="number" className="v-input" required placeholder="0" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                                    </div>
                                </div>
                                <div className="v-field" style={{ marginBottom: '14px' }}>
                                    <label className="v-label">Category</label>
                                    <select className="v-select" value={prodCatId} onChange={e => setProdCatId(e.target.value)}>
                                        {categories.length === 0 && <option value="">No categories</option>}
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="v-field">
                                    <label className="v-label">Photo {prodModal !== 'add' && '(optional — replaces existing)'}</label>
                                    <input type="file" accept="image/*" className="v-input" onChange={handleProdImage} />
                                    {prodImagePreview && <img src={prodImagePreview} alt="preview" style={{ height: '60px', borderRadius: '8px', marginTop: '8px' }} />}
                                    {!prodImagePreview && prodModal?.image && <img src={prodModal.image} alt="" style={{ height: '60px', borderRadius: '8px', marginTop: '8px', opacity: 0.6 }} />}
                                </div>
                            </div>
                            <div className="v-modal-footer">
                                <button type="button" className="v-btn v-btn-ghost" onClick={() => setProdModal(null)}>Cancel</button>
                                <button type="submit" className="v-btn v-btn-primary" disabled={prodSaving}>
                                    {prodSaving ? 'Saving...' : prodModal === 'add' ? 'Create Item' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorMenu;
