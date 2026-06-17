import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './vendor/VendorLayout.css'; // Use the new unified CSS

const GodownBrowser = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [masterItems, setMasterItems] = useState([]);
    const [shop, setShop] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [loadingMap, setLoadingMap] = useState({});

    // Fetch master products
    useEffect(() => {
        fetch('/api/master-products')
            .then(r => r.json())
            .then(data => setMasterItems(data))
            .catch(() => toast.error('Failed to load Godown items'));
    }, []);

    // Fetch shop details to verify vendor
    useEffect(() => {
        if (!token || !user) { navigate('/login'); return; }
        fetch('/api/shops/my-shop', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { if (data._id) setShop(data); else { toast.error("Create a shop first"); navigate('/'); } })
            .catch(() => toast.error('Failed to load shop details'));
    }, [token, user, navigate]);

    // Derived unique categories from master items
    const categories = ['All', ...new Set(masterItems.map(item => item.category || 'General'))];

    const filteredItems = masterItems.filter(item => {
        const matchCat = activeCategory === 'All' || item.category === activeCategory;
        const matchQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchQuery;
    });

    const handleImport = async (item) => {
        if (!shop) return;
        setLoadingMap(prev => ({ ...prev, [item._id]: true }));

        try {
            // First, ensure the category exists in the shop's Category collection
            const catRes = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: item.category || 'General' })
            });
            let catId = '';
            if (catRes.ok) {
                const cat = await catRes.json();
                catId = cat._id;
            } else if (catRes.status === 400) {
                // Category probably already exists, fetch it
                const allCatsRes = await fetch(`/api/categories/${shop._id}`);
                const allCats = await allCatsRes.json();
                const existing = allCats.find(c => c.name === (item.category || 'General'));
                if (existing) catId = existing._id;
            }

            // Now create the product with the proper categoryId
            const prodRes = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: item.name,
                    price: 0, // Default to 0, vendor will edit later
                    categoryId: catId,
                    category: item.category || 'General', // Fallback string
                    image: item.image,
                    stock: 0
                })
            });

            if (prodRes.ok) {
                toast.success(`${item.name} imported! Don't forget to set its price in your catalog.`);
            } else {
                toast.error('Failed to import item');
            }
        } catch (error) {
            toast.error('Error importing item');
        }

        setLoadingMap(prev => ({ ...prev, [item._id]: false }));
    };

    if (!shop) return <div className="v-loading"><div className="v-loading-spinner" /><div className="v-loading-text">Loading...</div></div>;

    return (
        <div style={{ padding: '0 0 20px 0', maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Master Godown</h1>
                    <p style={{ fontSize: '13px', color: 'var(--v-text-muted)' }}>Import pre-approved items to your catalog instantly.</p>
                </div>
                <button className="v-btn v-btn-ghost" onClick={() => navigate('/vendor/menu')}>← Back to Catalog</button>
            </div>

            {/* Category Chips */}
            <div className="v-chipbar" style={{ marginBottom: '16px' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`v-chip ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="v-searchbar" style={{ marginBottom: '24px' }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input placeholder="Search Godown items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            {filteredItems.length === 0 ? (
                <div className="v-empty">
                    <div className="v-empty-icon">📦</div>
                    <div className="v-empty-title">No items found</div>
                    <div className="v-empty-text">We couldn't find anything matching your search.</div>
                </div>
            ) : (
                <div className="v-product-grid">
                    {filteredItems.map(item => (
                        <div key={item._id} className="v-product-card">
                            <div className="v-product-card-img">
                                {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}
                            </div>
                            <div className="v-product-card-body">
                                <div className="v-product-card-name">{item.name}</div>
                                <div className="v-product-card-cat">{item.category}</div>
                                <div className="v-product-card-footer" style={{ marginTop: '12px' }}>
                                    <button 
                                        className="v-btn v-btn-primary v-btn-full" 
                                        onClick={() => handleImport(item)}
                                        disabled={loadingMap[item._id]}
                                    >
                                        {loadingMap[item._id] ? 'Importing...' : 'Import to Catalog'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GodownBrowser;
