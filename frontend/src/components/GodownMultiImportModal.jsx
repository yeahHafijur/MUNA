import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function GodownMultiImportModal({ isOpen, onClose, onSuccess, shopId = null }) {
    const { token } = useAuth();
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [search, setSearch] = useState('');

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
        if (!godownItems?.products) return;
        const newSet = new Set(godownItems.products.map(p => p._id));
        setSelectedIds(newSet);
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

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

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                            Loading godown items...
                        </div>
                    ) : godownItems?.products?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            No items found matching "{search}"
                        </div>
                    ) : (
                        godownItems?.products?.map(item => (
                            <div 
                                key={item._id} 
                                onClick={() => toggleSelection(item._id)}
                                className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all border ${selectedIds.has(item._id) ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'}`}
                            >
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border-2 transition-colors ${selectedIds.has(item._id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                                    {selectedIds.has(item._id) && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                                    <p className="text-xs text-gray-500">{item.category}</p>
                                </div>
                            </div>
                        ))
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
