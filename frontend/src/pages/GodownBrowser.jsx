import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

/* ─── Premium Crisp Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;

const GodownBrowser = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [importingId, setImportingId] = useState(null); // Tracks which item is currently being imported

    // 1. React Query: Fetch Shop Details
    const { data: shop, isLoading: isShopLoading } = useQuery({
        queryKey: ['my-shop', user?._id],
        queryFn: async () => {
            if (!user) throw new Error("No token");
            const res = await fetch('/api/shops/my-shop', { credentials: 'include',   });
            if (!res.ok) throw new Error("Shop not found");
            const data = await res.json();
            if (!data._id) throw new Error("Create a shop first");
            return data;
        },
        onError: () => {
            toast.error("Please create a shop first");
            navigate('/');
        },
        enabled:  !!user
    });

    // 2. React Query: Fetch Godown Master Items
    const { data: masterItems = [], isLoading: isItemsLoading } = useQuery({
        queryKey: ['master-products'],
        queryFn: async () => {
            const res = await fetch('/api/master-products', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        }
    });

    // 3. React Query Mutation: Import Product to Vendor's Catalog
    const importMutation = useMutation({
        mutationFn: async (item) => {
            setImportingId(item._id);

            // Step A: Ensure the category exists in the shop's Category collection
            const catRes = await fetch('/api/categories', { credentials: 'include', 
                method: 'POST',
                headers: { 'Content-Type': 'application/json',  },
                body: JSON.stringify({ name: item.category || 'General' })
            });

            let catId = '';
            if (catRes.ok) {
                const cat = await catRes.json();
                catId = cat._id;
            } else if (catRes.status === 400) {
                // Category probably already exists, fetch it
                const allCatsRes = await fetch(`/api/categories/${shop._id}`, { credentials: 'include' });
                const allCats = await allCatsRes.json();
                const existing = allCats.find(c => c.name === (item.category || 'General'));
                if (existing) catId = existing._id;
            }

            // Step B: Create the product
            const prodRes = await fetch('/api/products', { credentials: 'include', 
                method: 'POST',
                headers: { 'Content-Type': 'application/json',  },
                body: JSON.stringify({
                    name: item.name,
                    price: 0, // Default to 0, vendor will edit later
                    categoryId: catId,
                    category: item.category || 'General',
                    image: item.image,
                    stock: 0
                })
            });

            if (!prodRes.ok) throw new Error('Failed to import item');
            return item;
        },
        onSuccess: (item) => {
            toast.success(`✅ ${item.name} imported! Set its price in your catalog.`);
            queryClient.invalidateQueries(['vendor-products', shop?._id]); // Refresh vendor catalog
        },
        onError: () => {
            toast.error('❌ Error importing item');
        },
        onSettled: () => {
            setImportingId(null);
        }
    });

    // Derived states
    const categories = useMemo(() => {
        return ['All', ...new Set(masterItems.map(item => item.category || 'General'))];
    }, [masterItems]);

    const filteredItems = useMemo(() => {
        return masterItems.filter(item => {
            const matchCat = activeCategory === 'All' || item.category === activeCategory;
            const matchQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCat && matchQuery;
        });
    }, [masterItems, activeCategory, searchQuery]);


    /* ─── Render Loading State ─── */
    if (isShopLoading || isItemsLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="relative flex items-center justify-center mb-4">
                    <div className="absolute w-16 h-16 rounded-full bg-amber-400 opacity-30 animate-ping"></div>
                    <div className="absolute w-12 h-12 rounded-full bg-amber-500 opacity-40 animate-pulse"></div>
                    <div className="z-10 text-4xl animate-bounce">📦</div>
                </div>
                <div className="text-amber-600 font-black tracking-[0.2em] text-xs animate-pulse">LOADING GODOWN</div>
            </div>
        );
    }

    /* ─── Render Main UI ─── */
    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col font-sans">
            
            {/* ─── NATIVE HEADER ─── */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
                <button
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(40); navigate('/vendor'); }}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                >
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Master Godown</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-7xl mx-auto w-full">
                
                <p className="text-[13px] font-medium text-slate-500 mb-6 px-1">Import pre-approved items to your catalog instantly.</p>

                {/* Category Chips */}
                <div className="flex gap-2.5 overflow-x-auto py-2 mb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {categories.map(cat => {
                        const isActive = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold border transition-all whitespace-nowrap ${isActive
                                        ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-gray-900 border-transparent shadow-md shadow-amber-500/20'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search Godown items..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                    />
                </div>

                {/* Grid / Empty State */}
                {filteredItems.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm mt-8">
                        <div className="text-6xl mb-4 opacity-50">📦</div>
                        <h3 className="text-lg font-extrabold text-gray-900 mb-2">No items found</h3>
                        <p className="text-sm font-medium text-gray-500">We couldn't find anything matching "{searchQuery}"</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                        {filteredItems.map(item => {
                            const isImporting = importingId === item._id;
                            return (
                                <div key={item._id} className="bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">

                                    {/* Product Image */}
                                    <div className="relative w-full aspect-square bg-gray-50 flex items-center justify-center p-2 border-b border-gray-50 overflow-hidden">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span className="text-4xl opacity-50">📷</span>
                                        )}
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-md text-[9px] font-extrabold text-gray-500 uppercase tracking-wide shadow-sm">
                                            {item.category}
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-3.5 flex flex-col flex-1">
                                        <h3 className="text-[13px] md:text-sm font-extrabold text-gray-900 leading-tight mb-3 line-clamp-2">
                                            {item.name}
                                        </h3>

                                        <button
                                            onClick={() => importMutation.mutate(item)}
                                            disabled={importingId !== null}
                                            className={`mt-auto w-full py-2.5 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wide transition-all ${isImporting
                                                    ? 'bg-amber-100 text-amber-600 cursor-not-allowed'
                                                    : importingId !== null
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-400 hover:text-amber-950 hover:border-amber-400 shadow-sm'
                                                }`}
                                        >
                                            {isImporting ? 'Importing...' : 'Import'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
};

export default GodownBrowser;