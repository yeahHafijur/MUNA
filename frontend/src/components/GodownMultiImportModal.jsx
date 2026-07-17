import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function GodownMultiImportModal({ isOpen, onClose, onSuccess, shopId = null }) {
    const { token } = useAuth();
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    const { data: godownItems, isLoading } = useQuery({
        queryKey: ['godown-items-multi', search],
        queryFn: async () => {
            const url = search 
                ? `/api/master-products?search=${encodeURIComponent(search)}&limit=100` 
                : `/api/master-products?limit=100`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch godown items');
            return res.json();
        },
        enabled: isOpen
    });

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const selectAll = () => {
        if (!displayedItems) return;
        const newSet = new Set(selectedIds);
        displayedItems.forEach(p => newSet.add(p._id));
        setSelectedIds(newSet);
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    const categories = Array.isArray(godownItems) 
        ? [...new Set(godownItems.map(p => p.category).filter(Boolean))] 
        : [];

    const displayedItems = Array.isArray(godownItems) ? godownItems.filter(p => {
        if (selectedCategory && p.category !== selectedCategory) return false;
        return true;
    }) : [];

    const handleImport = async () => {
        if (selectedIds.size === 0) return toast.info('Please select at least one item');
        setIsImporting(true);
        try {
            const url = shopId 
                ? `/api/admin/catalog/${shopId}/products/import-multiple`
                : `/api/products/import-multiple`;
            
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ masterProductIds: Array.from(selectedIds) })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Import failed');

            toast.success(data.message || 'Items imported successfully');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Import from Godown</h2>
                        <p className="text-sm text-gray-500 mt-1">Select multiple items to add to your shop instantly</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        ✕
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-white">
                    <input 
                        type="text" 
                        placeholder="Search Godown..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-64 px-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl text-sm transition-all outline-none"
                    />
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button onClick={selectAll} className="text-sm text-blue-600 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors">Select All</button>
                        <button onClick={deselectAll} className="text-sm text-gray-600 font-medium px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors">Clear</button>
                    </div>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white border-b border-gray-100 [scrollbar-width:none]">
                        <button 
                            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${!selectedCategory ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}
                            onClick={() => setSelectedCategory(null)}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategory === cat ? 'bg-amber-400 text-amber-950 border-amber-400' : 'bg-white border-slate-200 text-slate-600'}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid */}
                <div className="flex-1 overflow-y-auto bg-gray-100 p-[1px] [scrollbar-width:none]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-white m-4 rounded-2xl">
                            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                            Loading godown items...
                        </div>
                    ) : displayedItems?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-white m-4 rounded-2xl">
                            No items found.
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-[1px]">
                            {displayedItems?.map(item => (
                                <div 
                                    key={item._id} 
                                    onClick={() => toggleSelection(item._id)}
                                    className={`bg-white p-3 pb-4 flex flex-col items-center text-center cursor-pointer transition-all relative group ${selectedIds.has(item._id) ? 'bg-green-50/40' : 'hover:bg-gray-50'}`}
                                >
                                    {/* Selection Checkmark Overlay */}
                                    <div className={`absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center border-2 z-10 transition-colors ${selectedIds.has(item._id) ? 'bg-green-500 border-green-500 text-white shadow-sm' : 'border-gray-200 bg-white/80 group-hover:border-gray-300'}`}>
                                        {selectedIds.has(item._id) && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                    </div>

                                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1 mb-2">
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" /> : <span className="text-gray-300 font-black text-2xl">M</span>}
                                    </div>
                                    <div className="text-[11px] font-bold text-gray-900 line-clamp-2 leading-tight mb-0.5 px-1">{item.name}</div>
                                    <div className="text-[10px] font-extrabold text-green-600 mb-0.5">₹{item.price || 0} {item.quantity ? <span className="text-gray-400 font-normal">/ {item.quantity}</span> : null}</div>
                                    {item.category && <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider line-clamp-1">{item.category}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-600">
                        <span className="text-green-600 font-bold">{selectedIds.size}</span> items selected
                    </div>
                    <button 
                        onClick={handleImport}
                        disabled={selectedIds.size === 0 || isImporting}
                        className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${selectedIds.size === 0 ? 'bg-gray-100 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/30 active:scale-95'}`}
                    >
                        {isImporting ? 'Importing...' : `Import ${selectedIds.size} Items`}
                    </button>
                </div>

            </div>
        </div>
    );
}
